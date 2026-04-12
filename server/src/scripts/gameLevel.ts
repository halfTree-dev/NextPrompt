import { CharacterManager } from "./managers/characterManager";
import { HookManager } from "./managers/hookManager";
import { NarratorManager } from "./managers/narratorManager";
import { NodeManager } from "./managers/nodeManager";
import { ToolManager } from "./managers/toolManager";
import { ContextMessage, TextManager } from "./managers/textManager";

import socketService from "../services/socketManager";
import accountManager from "../services/accountManager";
import dataManager, { AccountRecord } from "../services/dataManger";
import logger from "../utils/logger";
import GameCharacter, { Attributes } from "./gameObjects/gameCharacter";
import GameNode, { InputCheckbox, InputSlot, InputStringBar, RelatedCharacter, Tag as NodeTag } from "./gameObjects/gameNode";
import { cloneDeep } from "lodash";
import { Socket } from "socket.io";
import { GuideManager } from "./managers/guideManager";

interface UpdateInputPayload {
    nodeID: string;
    inputSlots: Record<string, InputSlot>;
    inputStringBars: Record<string, InputStringBar>;
    inputCheckboxes: Record<string, InputCheckbox>;
}

export class GameLevel {
    levelID: string = "";
    levelName: string = "";
    currRound: number = 0;

    nodeManager: NodeManager;
    characterManager: CharacterManager;
    narratorManager: NarratorManager;
    hookManager: HookManager;
    toolManager: ToolManager;
    textManager: TextManager;
    guideManager: GuideManager;

    onlineAccounts: Set<string>;
    onlineAccountsReadyForEndTurn: Map<string, boolean>;

    constructor(levelID: string, levelName: string = "") {
        this.levelID = levelID;
        this.levelName = levelName;

        this.nodeManager = new NodeManager();
        this.characterManager = new CharacterManager();
        this.narratorManager = new NarratorManager();
        this.hookManager = new HookManager();
        this.toolManager = new ToolManager();
        this.textManager = new TextManager();
        this.guideManager = new GuideManager();

        this.onlineAccounts = new Set();
        this.onlineAccountsReadyForEndTurn = new Map();
    }

    init() {
        accountManager.on("user_disconnected", (account : AccountRecord) => {
            // 除了 leave_room 事件之外，玩家断线时不直接经过离开房间的流程，因此需要在这里额外处理一下玩家断线的情况
            if (this.onlineAccounts.has(account.accountId)) {
                this.delOnlineAccount(account.accountId);
                logger.info(`玩家 ${account.userName} 已从关卡 ${this.levelID} 下线`);
            }
            this.checkAllReadyForNextTurnAndExecuteAdvance();
            this.broadcastEndTurnResult();
        });

        socketService.on("req_send_game_chat", (socket, payload) => {
            if (!socket.rooms.has(this.levelID)) {
                // 如果玩家不在当前关卡的房间里，则忽略
                return;
            }
            const account = accountManager.findAccountBySocket(socket);
            if (account && this.onlineAccounts.has(account.accountId)) {
                this.updateNewContextMessage({
                    sender: account.userName,
                    content: payload.content,
                    timestamp: Date.now(),
                    sendType: 'chat'
                });
            }
            accountManager.cancelSocketOpLock(socket);
        });

        socketService.on("req_update_input", (socket, payload : UpdateInputPayload) => {
            if (!socket.rooms.has(this.levelID)) {
                // 如果玩家不在当前关卡的房间里，则忽略
                return;
            }
            this.updateInput(socket, payload);
            accountManager.cancelSocketOpLock(socket);
        });

        socketService.on("req_send_interact", async (socket, payload : {nodeID: string}) => {
            try {
                if (!socket.rooms.has(this.levelID)) {
                    // 如果玩家不在当前关卡的房间里，则忽略
                    return;
                }
                await this.respondToInteract(socket, payload);
                accountManager.cancelSocketOpLock(socket);
            } catch (error) {
                logger.error(`处理玩家交互请求时发生错误： ${error}`);
                socket.emit("ack_send_interact", { success: false, message: "处理交互请求时发生错误，请与开发者联系。" });
                accountManager.cancelSocketOpLock(socket);
            }
        });

        socketService.on("req_end_turn", (socket, payload : { endTurnFlag: boolean }) => {
            if (!socket.rooms.has(this.levelID)) {
                // 如果玩家不在当前关卡的房间里，则忽略
                return;
            }
            this.respondToEndTurn(socket, payload);
            accountManager.cancelSocketOpLock(socket);
        });
    }

    addOnlineAccount(accountId: string) {
        this.onlineAccounts.add(accountId);
        this.onlineAccountsReadyForEndTurn.set(accountId, false);
    }

    delOnlineAccount(accountId: string) {
        this.onlineAccounts.delete(accountId);
        this.onlineAccountsReadyForEndTurn.delete(accountId);
    }

    getAccountFromId(accountId: string): AccountRecord | undefined {
        return dataManager.getAccount(accountId);
    }

    getSocketFromAccount(accountId: string) {
        const sockets = socketService.getSocketsInRoom(this.levelID);
        return sockets.find(socket => {
            const account = accountManager.findAccountBySocket(socket);
            return account && account.accountId === accountId;
        });
    }

    updateInput(socket: Socket, payload: UpdateInputPayload) {
        const account = accountManager.findAccountBySocket(socket);
        if (!account || !this.onlineAccounts.has(account.accountId)) {
            socket.emit("ack_update_input", { success: false, message: "未登录或不在当前关卡中，无法更新输入" });
            logger.warn(`收到未登录玩家的输入更新请求，已拒绝，其 Socket 为 ${socket}`);
            return;
        }
        const nodeID = payload.nodeID;
        const inputSlots = payload.inputSlots || {};
        const inputStringBars = payload.inputStringBars || {};
        const inputCheckboxes = payload.inputCheckboxes || {};

        const node = this.nodeManager.nodes.get(nodeID);
        if (!node) {
            logger.warn(`玩家 ${account.userName} 试图更新不存在的节点 ${nodeID} 的输入，已拒绝`);
            socket.emit("ack_update_input", { success: false, message: "试图更新不存在的节点" });
            return;
        }
        if (node.relatedCharacters.length > 0 && !node.relatedCharacters.some(rc => {
            const character = this.characterManager.characters.get(rc.characterID);
            return character && character.accountRecord && character.accountRecord.accountId === account.accountId;
        })) {
            logger.warn(`玩家 ${account.userName} 试图更新不属于自己的节点 ${nodeID} 的输入，已拒绝`);
            socket.emit("ack_update_input", { success: false, message: "试图更新不属于自己的节点" });
            return;
        }

        for (const [slotID, slotValue] of Object.entries(inputSlots)) {
            if (node.inputSlots && node.inputSlots.get(slotID)) {
                const targetInputSlot = node.inputSlots.get(slotID);
                if (targetInputSlot) {
                    const pointedNode = this.nodeManager.nodes.get(slotValue.inputID);
                    if (pointedNode && (pointedNode.relatedCharacters.length === 0 || pointedNode.relatedCharacters.some(rc => {
                        const character = this.characterManager.characters.get(rc.characterID);
                        return character && character.accountRecord && character.accountRecord.accountId === account.accountId;
                    }))) {
                        targetInputSlot.inputID = slotValue.inputID;
                    } else if (slotValue.inputID === "") {
                        // 节点也可以连接到空，表示断开连接，这是允许的
                        targetInputSlot.inputID = "";
                    }
                    else {
                        logger.warn(`玩家 ${account.userName} 试图将节点 ${nodeID} 的输入槽 ${slotID} 连接到不可见或不属于自己的节点 "${slotValue.inputID}"，已拒绝`);
                        socket.emit("ack_update_input", { success: false, message: `试图将输入槽连接到不可见或不属于自己的节点 "${slotValue.inputID}"` });
                        return;
                    }
                }
            }
        }
        for (const [stringBarID, stringBarValue] of Object.entries(inputStringBars)) {
            if (node.inputStringBars && node.inputStringBars.get(stringBarID)) {
                const targetInputStringBar = node.inputStringBars.get(stringBarID);
                if (targetInputStringBar) {
                    targetInputStringBar.inputContent = stringBarValue.inputContent;
                }
            }
        }
        for (const [boxID, boxValue] of Object.entries(inputCheckboxes)) {
            if (node.inputCheckboxes && node.inputCheckboxes.get(boxID)) {
                const targetInputCheckbox = node.inputCheckboxes.get(boxID);
                if (targetInputCheckbox) {
                    if (Number.isInteger(boxValue.chooseIndex)
                        && boxValue.chooseIndex >= 0
                        && boxValue.chooseIndex < targetInputCheckbox.choices.length) {
                        targetInputCheckbox.chooseIndex = boxValue.chooseIndex;
                    } else {
                        // 当复选框是非法值时，不作任何动作，因为也可能是玩家输入为空
                        // logger.warn(`玩家 ${account.userName} 试图为节点 ${nodeID} 的复选框 ${boxID} 设置非法选项索引 ${boxValue.chooseIndex}，已拒绝`);
                        // socket.emit("ack_update_input", { success: false, message: `试图设置非法选项索引 ${boxValue.chooseIndex}` });
                    }
                }
            }
        }
        socket.emit("ack_update_input", { success: true, message: "输入更新成功" });
        this.broadcastGameContext();
    }

    async respondToInteract(socket: Socket, payload: { nodeID: string }): Promise<void> {
        const account = accountManager.findAccountBySocket(socket);
        if (!account || !this.onlineAccounts.has(account.accountId)) {
            socket.emit("ack_send_interact", { success: false, message: "未登录或不在当前关卡中，无法执行交互" });
            logger.warn(`收到未登录玩家的交互请求，已拒绝，其 Socket 为 ${socket}`);
            return;
        }
        const nodeID = payload.nodeID;
        const node = this.nodeManager.nodes.get(nodeID);
        if (!node) {
            logger.warn(`玩家 ${account.userName} 试图与不存在的节点 ${nodeID} 交互，已拒绝`);
            socket.emit("ack_send_interact", { success: false, message: "试图与不存在的节点交互" });
            return;
        }
        if (node.relatedCharacters.length > 0 && !node.relatedCharacters.some(rc => {
            const character = this.characterManager.characters.get(rc.characterID);
            return character && character.accountRecord && character.accountRecord.accountId === account.accountId;
        })) {
            logger.warn(`玩家 ${account.userName} 试图与不属于自己的节点 ${nodeID} 交互，已拒绝`);
            socket.emit("ack_send_interact", { success: false, message: "试图与不属于自己的节点交互" });
            return;
        }
        if (!node.interactable) {
            logger.warn(`玩家 ${account.userName} 试图与不可交互的节点 ${nodeID} 交互，已拒绝`);
            socket.emit("ack_send_interact", { success: false, message: "试图与不可交互的节点交互" });
            return;
        }
        if (node.onInteractCallback) {
            const context = {
                level: this,
                logger: logger,
                node: node,
                account: account,
            };
            try {
                await Promise.resolve(node.onInteractCallback(context));
                socket.emit("ack_send_interact", { success: true, message: "交互执行成功" });
                this.broadcastGameContext();
            } catch (err) {
                logger.error(`节点 ${nodeID} 执行交互回调时发生异常: ${err}`);
                socket.emit("ack_send_interact", { success: false, message: "交互执行失败，故事脚本在执行交互时发生异常，请与开发者联系。" });
            }
        } else {
            logger.warn(`节点 ${nodeID} 没有交互回调函数，无法执行交互`);
            socket.emit("ack_send_interact", { success: false, message: "节点没有交互回调函数，无法执行交互，这很可能是该故事脚本的问题，请与开发者联系！" });
        }
    }

     async respondToEndTurn(socket: Socket, payload: { endTurnFlag: boolean }) {
        const account = accountManager.findAccountBySocket(socket);
        if (!account || !this.onlineAccounts.has(account.accountId)) {
            socket.emit("ack_end_turn", { success: false, message: "未登录或不在当前关卡中，无法结束回合" });
            logger.warn(`收到未登录玩家的结束回合请求，已拒绝`);
            return;
        }
        if (payload.endTurnFlag) {
            this.hookManager.playerSetReadyStatus({ level: this, logger: logger }, account, true);
            logger.info(`玩家 ${account.userName} 已准备好结束回合`);
            if (this.hookManager.playerSetReadyEvent) {
                const context = {
                    level: this,
                    logger: logger,
                }
                await Promise.resolve(this.hookManager.playerSetReadyEvent(context, account));
            }
            await this.checkAllReadyForNextTurnAndExecuteAdvance();
            this.broadcastEndTurnResult();
        } else {
            this.hookManager.playerSetReadyStatus({ level: this, logger: logger }, account, false);
            logger.info(`玩家 ${account.userName} 取消了结束回合的准备`);
            if (this.hookManager.playerSetUnreadyEvent) {
                const context = {
                    level: this,
                    logger: logger,
                }
                await Promise.resolve(this.hookManager.playerSetUnreadyEvent(context, account));
            }
            this.broadcastEndTurnResult();
        }
    }

    broadcastGameContext() {
        function turnNodeIntoInfo(node : GameNode) : GameNodeInfo {
            return {
                nodeID: node.nodeID,
                displayText: node.displayText,
                description: node.description,
                category: node.category,
                relatedCharacters: node.relatedCharacters,
                storage: node.storage,
                invisible: node.invisible,
                lifeTimeRounds: node.lifeTimeRounds,
                coolDownRounds: node.coolDownRounds,
                inStackable: node.inStackable,
                count: node.count,
                tags: node.tags,
                inputSlots: node.inputSlots ? Object.fromEntries(node.inputSlots.entries()) : undefined,
                inputStringBars: node.inputStringBars ? Object.fromEntries(node.inputStringBars.entries()) : undefined,
                inputCheckboxes: node.inputCheckboxes ? Object.fromEntries(node.inputCheckboxes.entries()) : undefined,
                interactable: node.interactable,
            };
        }

        function turnCharacterIntoInfo(character : GameCharacter) : GameCharacterInfo {
            return {
                characterID: character.characterID,
                characterName: character.characterName,
                characterDescription: character.characterDescription,
                attributes: Object.fromEntries(character.attributes.entries()),
                storage: character.storage,
                accountRecord: character.accountRecord,
            };
        }

        const nodeInfos = Object.fromEntries(
            Array.from(this.nodeManager.nodes.entries()).map(([key, node]) => [key, turnNodeIntoInfo(node)])
        );
        const characterInfos = Object.fromEntries(
            Array.from(this.characterManager.characters.entries()).map(([key, character]) => [key, turnCharacterIntoInfo(character)])
        );

        const result : GameLevelInfo = {
            levelID: this.levelID,
            levelName: this.levelName,
            currRound: this.currRound,
            onlineAccountNames: Array.from(this.onlineAccounts).map(accountId => {
                const account = dataManager.getAccount(accountId);
                return account ? account.userName : "";
            }),
            nodes: nodeInfos,
            characters: characterInfos,
        };

        const sockets = socketService.getSocketsInRoom(this.levelID);
        for (const socket of sockets) {
            const account = accountManager.findAccountBySocket(socket);
            const characterForAccount = account
                ? Array.from(this.characterManager.characters.values()).find(character => character.accountRecord?.accountId === account.accountId) || null
                : null;
            if (characterForAccount) {
                // 特别地，对于正在操控角色的玩家而言，他只能看见自己的节点
                const filteredResult = cloneDeep(result);
                filteredResult.nodes = Object.fromEntries(Object.entries(result.nodes).filter(([nodeID, nodeInfo]) => {
                    return nodeInfo.relatedCharacters.some(rc => rc.characterID === characterForAccount.characterID);
                }));
                socket.emit('evt_send_game_context', filteredResult);
                socket.emit('evt_end_turn_result', { onlineAccountsReadyForEndTurn: Object.fromEntries(this.onlineAccountsReadyForEndTurn.entries()) });
            } else {
                // 没有被分配角色的玩家则可以看见所有节点
                socket.emit('evt_send_game_context', result);
                socket.emit('evt_end_turn_result', { onlineAccountsReadyForEndTurn: Object.fromEntries(this.onlineAccountsReadyForEndTurn.entries()) });
            }
        }
    }

    broadcastMessageContext() {
        const contextMessages = this.textManager.contextMessages;
        const sockets = socketService.getSocketsInRoom(this.levelID);
        for (const socket of sockets) {
            const account = accountManager.findAccountBySocket(socket);
            if (account) {
                socket.emit('evt_send_message_context', contextMessages);
            }
        }
    }

    updateNewContextMessage(contextMessage: ContextMessage) {
        this.textManager.contextMessages.push(contextMessage);
        const sockets = socketService.getSocketsInRoom(this.levelID);
        for (const socket of sockets) {
            const account = accountManager.findAccountBySocket(socket);
            if (account) {
                socket.emit('evt_update_message_context', contextMessage);
            }
        }
    }

    async goNextRound() {
        this.currRound += 1;
        for (const node of this.nodeManager.nodes.values()) {
            if (node.lifeTimeRounds && node.lifeTimeRounds > 0) {
                node.lifeTimeRounds -= 1;
            }
            if (node.coolDownRounds && node.coolDownRounds > 0) {
                node.coolDownRounds -= 1;
            }
            if (node.onAdvanceCallback) {
                const context = {
                    level: this,
                    logger: logger,
                    node: node,
                }
                node.onAdvanceCallback(context);
            }
        }
        await Promise.resolve(this.hookManager.storyAdvanceEvent?.({ level: this, logger: logger }));
        this.broadcastGameContext();
        for (const accountId of this.onlineAccounts) {
            this.onlineAccountsReadyForEndTurn.set(accountId, false);
        }
        this.broadcastEndTurnResult();
        socketService.emitMessageToRoom(this.levelID, 'evt_next_round', {});
    }

    broadcastEndTurnResult() {
        interface AccountReadyInfo {
            accountId: string;
            userName: string;
            readyForEndTurn: boolean;
        }
        const onlineAccountsReadyForEndTurn: Record<string, AccountReadyInfo> = {};
        for (const accountId of this.onlineAccounts) {
            const account = dataManager.getAccount(accountId);
            onlineAccountsReadyForEndTurn[accountId] = {
                accountId: accountId,
                userName: account ? account.userName : "",
                readyForEndTurn: this.onlineAccountsReadyForEndTurn.get(accountId) || false,
            };
        }
        const sockets = socketService.getSocketsInRoom(this.levelID);
        for (const socket of sockets) {
            socket.emit('evt_end_turn_result', { onlineAccountsReadyForEndTurn: onlineAccountsReadyForEndTurn });
        }
    }

    async checkAllReadyForNextTurnAndExecuteAdvance() : Promise<boolean> {
        if (this.onlineAccounts.size === 0) {
            logger.info(`当前关卡 ${this.levelID} 中没有在线玩家，无法进入下一回合`);
            return false;
        }
        for (const accountId of this.onlineAccounts) {
            if (!this.onlineAccountsReadyForEndTurn.get(accountId)) {
                return false;
            }
        }
        await this.goNextRound();
        logger.info(`所有玩家都已准备好，进入下一回合 ${this.currRound}`);
        return true;
    }

}

export default GameLevel;

interface AccountRecordInfo {
    accountId: string;
    userName: string;
    createdAt: number;
    spawnedWordsCnt: number;
    usedTokens: number;
}

interface GameCharacterInfo {
    characterID: string;

    characterName: string;
    characterDescription: string;

    attributes: { [key: string]: Attributes };
    storage?: Record<string, any>;

    accountRecord?: AccountRecordInfo;
}

interface GameNodeInfo {
    nodeID: string;

    displayText: string;
    description: string;

    category?: string;

    relatedCharacters: RelatedCharacter[];

    storage?: Record<string, any>;

    invisible?: boolean;
    lifeTimeRounds?: number;
    coolDownRounds?: number;

    inStackable?: boolean;
    count?: number;

    tags?: NodeTag[];

    inputSlots?: { [key: string]: InputSlot };
    inputStringBars?: { [key: string]: InputStringBar };
    inputCheckboxes?: { [key: string]: InputCheckbox };

    interactable?: boolean;
}

interface GameLevelInfo {
    levelID: string;
    levelName: string;
    currRound: number;
    onlineAccountNames: string[];
    nodes: { [key: string]: GameNodeInfo };
    characters: { [key: string]: GameCharacterInfo };
}