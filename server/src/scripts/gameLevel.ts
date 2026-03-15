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
    }

    init() {
        accountManager.on("user_disconnected", (account : AccountRecord) => {
            if (this.onlineAccounts.has(account.accountId)) {
                this.onlineAccounts.delete(account.accountId);
                logger.info(`玩家 ${account.userName} 已从关卡 ${this.levelID} 下线`);
            }
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
        });
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
                inputSlots: node.inputSlots,
                inputStringBars: node.inputStringBars,
                interactable: node.interactable,
            };
        }

        function turnCharacterIntoInfo(character : any) : GameCharacterInfo {
            return {
                characterID: character.characterID,
                attributes: character.attributes,
                storage: character.storage,
                accountRecord: character.accountRecord,
                operationLock: character.operationLock,
                readyForEndTurn: character.readyForEndTurn,
            };
        }

        const result : GameLevelInfo = {
            levelID: this.levelID,
            levelName: this.levelName,
            currRound: this.currRound,
            onlineAccountNames: Array.from(this.onlineAccounts).map(accountId => {
                const account = dataManager.getAccount(accountId);
                return account ? account.userName : "";
            }),
            nodes: new Map(Array.from(this.nodeManager.nodes.entries()).map(([key, node]) => [key, turnNodeIntoInfo(node)])),
            characters: new Map(Array.from(this.characterManager.characters.entries()).map(([key, character]) => [key, turnCharacterIntoInfo(character)])),
        };

        const sockets = socketService.getSocketsInRoom(this.levelID);
        for (const socket of sockets) {
            const account = accountManager.findAccountBySocket(socket);
            const characterForAccount = account ? this.characterManager.characters.get(account.accountId) : null;
            if (characterForAccount) {
                // 特别地，对于正在操控角色的玩家而言，他只能看见自己的节点
                const filteredResult = cloneDeep(result);
                filteredResult.nodes = new Map(Array.from(result.nodes.entries()).filter(([_, node]) => {
                    return node.relatedCharacters.some(rc => rc.characterID === characterForAccount.characterID);
                }));
                socket.emit('evt_send_game_context', filteredResult);
            } else {
                // 没有被分配角色的玩家则可以看见所有节点
                socket.emit('evt_send_game_context', result);
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

    attributes: Map<string, Attributes>;
    storage?: Record<string, any>;

    accountRecord?: AccountRecordInfo;

    operationLock: boolean;
    readyForEndTurn: boolean;
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

    inputSlots?: Map<string, InputSlot>;
    inputStringBars?: Map<string, InputStringBar>;

    interactable?: boolean;
}

interface GameLevelInfo {
    levelID: string;
    levelName: string;
    currRound: number;
    onlineAccountNames: string[];
    nodes: Map<string, GameNodeInfo>;
    characters: Map<string, GameCharacterInfo>;
}