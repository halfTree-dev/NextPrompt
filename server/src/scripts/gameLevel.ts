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
import { Attributes } from "./gameObjects/gameCharacter";
import GameNode, { InputSlot, InputStringBar, RelatedCharacter, Tag as NodeTag } from "./gameObjects/gameNode";
import { cloneDeep } from "lodash";
import { Socket } from "socket.io";

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

        this.onlineAccounts = new Set();
        this.onlineAccountsReadyForEndTurn = new Map();
    }

    init() {
        accountManager.on("user_disconnected", (account : AccountRecord) => {
            if (this.onlineAccounts.has(account.accountId)) {
                this.delOnlineAccount(account.accountId);
                logger.info(`玩家 ${account.userName} 已从关卡 ${this.levelID} 下线`);
            }
            this.checkAllReadyForNextTurnAndExecuteAdvance();
            this.broadcastEndTurnResult();
        });

        socketService.on("req_send_game_chat", (socket, payload) => {
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

        socketService.on("req_update_input", (socket, payload : { nodeID: string; inputSlots: Record<string, InputSlot>; inputStringBars: Record<string, InputStringBar> }) => {
            this.updateInput(socket, payload);
            accountManager.cancelSocketOpLock(socket);
        });

        socketService.on("req_send_interact", (socket, payload : {nodeID: string}) => {
            this.respondToInteract(socket, payload);
            accountManager.cancelSocketOpLock(socket);
        });

        socketService.on("req_end_turn", (socket, payload : { endTurnFlag: boolean }) => {
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

    getSocketFromAccount(accountId: string) {
        const sockets = socketService.getSocketsInRoom(this.levelID);
        return sockets.find(socket => {
            const account = accountManager.findAccountBySocket(socket);
            return account && account.accountId === accountId;
        });
    }

    updateInput(socket: Socket, payload: { nodeID: string; inputSlots: Record<string, InputSlot>; inputStringBars: Record<string, InputStringBar> }) {
        const account = accountManager.findAccountBySocket(socket);
        if (!socket.rooms.has(this.levelID)) {
            // 如果玩家不在当前关卡的房间里，则忽略
            return;
        }
        if (!account || !this.onlineAccounts.has(account.accountId)) {
            socket.emit("ack_update_input", { success: false, message: "未登录或不在当前关卡中，无法更新输入" });
            logger.warn(`收到未登录玩家的输入更新请求，已拒绝，其 Socket 为 ${socket}`);
            return;
        }
        const nodeID = payload.nodeID;
        const inputSlots = payload.inputSlots;
        const inputStringBars = payload.inputStringBars;

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
            if (node.inputStringBars && node.inputStringBars.get(slotID)) {
                const targetInputStringBar = node.inputStringBars.get(slotID);
                if (targetInputStringBar) {
                    targetInputStringBar.inputContent = slotValue.inputContent;
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
        socket.emit("ack_update_input", { success: true, message: "输入更新成功" });
    }

    respondToInteract(socket: Socket, payload: { nodeID: string }) {
        const account = accountManager.findAccountBySocket(socket);
        if (!socket.rooms.has(this.levelID)) {
            // 如果玩家不在当前关卡的房间里，则忽略
            return;
        }
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
            }
            node.onInteractCallback(context);
            socket.emit("ack_send_interact", { success: true, message: "交互执行成功" });
        } else {
            logger.warn(`节点 ${nodeID} 没有交互回调函数，无法执行交互`);
            socket.emit("ack_send_interact", { success: false, message: "节点没有交互回调函数，无法执行交互，这很可能是该故事脚本的问题，请与开发者联系！" });
        }
    }

    respondToEndTurn(socket: Socket, payload: { endTurnFlag: boolean }) {
        const account = accountManager.findAccountBySocket(socket);
        if (!socket.rooms.has(this.levelID)) {
            // 如果玩家不在当前关卡的房间里，则忽略
            return;
        }
        if (!account || !this.onlineAccounts.has(account.accountId)) {
            socket.emit("ack_end_turn", { success: false, message: "未登录或不在当前关卡中，无法结束回合" });
            logger.warn(`收到未登录玩家的结束回合请求，已拒绝`);
            return;
        }
        if (payload.endTurnFlag) {
            this.onlineAccountsReadyForEndTurn.set(account.accountId, true);
            logger.info(`玩家 ${account.userName} 已准备好结束回合`);
            this.checkAllReadyForNextTurnAndExecuteAdvance();
            this.broadcastEndTurnResult();
        } else {
            this.onlineAccountsReadyForEndTurn.set(account.accountId, false);
            logger.info(`玩家 ${account.userName} 取消了结束回合的准备`);
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
                interactable: node.interactable,
            };
        }

        function turnCharacterIntoInfo(character : any) : GameCharacterInfo {
            return {
                characterID: character.characterID,
                characterName: character.characterName,
                characterDescription: character.characterDescription,
                attributes: character.attributes,
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
            const characterForAccount = account ? this.characterManager.characters.get(account.accountId) : null;
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

    goNextRound() {
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
        this.hookManager.storyAdvanceEvent?.({ level: this, logger: logger });
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

    checkAllReadyForNextTurnAndExecuteAdvance() : boolean {
        for (const accountId of this.onlineAccounts) {
            if (!this.onlineAccountsReadyForEndTurn.get(accountId)) {
                return false;
            }
        }
        this.goNextRound();
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