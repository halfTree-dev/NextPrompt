import configManager from "../services/configManager";

import GameLevel from "./gameLevel";
import storyLoader from "./managers/storyLoader";

import socketService from "../services/socketManager";
import accountManager from "../services/accountManager";
import logger from "../utils/logger";
import { Socket } from "socket.io";

export class GameLevelManager {
    levels: Map<string, GameLevel>;
    chatMessages: LobbyChatMessage[];

    constructor() {
        this.levels = new Map();
        this.chatMessages = [];
    }

    init() {
        const levelConfig = configManager.openingLevels;
        if (!levelConfig || levelConfig.length === 0) { return; }
        for (const config of levelConfig) {
            const newLevel = new GameLevel(config.levelID, config.levelName);
            storyLoader.initializeSharedContext(newLevel);
            for (const scriptPath of config.storyScriptLocation) {
                storyLoader.loadStoryScript(scriptPath, newLevel);
            }
            newLevel.init();
            newLevel.hookManager.storyInitEvent?.({ level: newLevel, logger: logger });
            this.levels.set(config.levelID, newLevel);
        }

        socketService.on('req_room_list', (socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                socket.emit('evt_send_alert', { title: "啊，不对", message: "这位朋友，你貌似没有登陆啊，因此我们无法为您提供大厅当前的信息，也许是登陆状况出了点问题？再登陆一遍试试怎么样？" });
                accountManager.cancelSocketOpLock(socket);
                return;
            }
            this.sendRoomList(socket);
            accountManager.cancelSocketOpLock(socket);
        });

        socketService.on('req_chat_history', (socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                accountManager.cancelSocketOpLock(socket);
                return;
            }
            this.sendChatHistory(socket);
            accountManager.cancelSocketOpLock(socket);
        });

        socketService.on('req_send_lobby_chat', (socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                socket.emit('evt_send_alert', { title: "收到未登录用户的请求", message: "在未登录情况下，无法发送大厅聊天消息" });
                accountManager.cancelSocketOpLock(socket);
                return;
            }
            this.updateNewChatMessage(account.userName, payload.content);
            accountManager.cancelSocketOpLock(socket);
        });

        socketService.on('req_join_room', (socket : Socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                socket.emit('evt_send_alert', { title: "收到未登录用户的请求", message: "在未登录情况下，无法加入游戏房间" });
                accountManager.cancelSocketOpLock(socket);
                return;
            }
            const gameLevel = this.levels.get(payload.levelID);
            if (!gameLevel) {
                socket.emit('evt_send_alert', { title: "请求的房间不存在", message: "所请求的游戏房间不存在" });
                accountManager.cancelSocketOpLock(socket);
                return;
            }

            let alreadyInRoom = false;
            for (const [levelId, level] of this.levels) {
                if (level.onlineAccounts.has(account.accountId)) {
                    alreadyInRoom = true;
                    break;
                }
            }
            if (alreadyInRoom) {
                socket.emit('evt_send_alert', { title: "已在其他房间", message: "无法使用同一个账号同时登陆多个房间" });
                accountManager.cancelSocketOpLock(socket);
                return;
            }

            socket.join(payload.levelID);
            logger.info(`用户 ${account.accountId} 加入了房间 ${payload.levelID}`);
            gameLevel.addOnlineAccount(account.accountId);
            if (gameLevel.hookManager.socketConnectEvent) {
                const context = {
                    level: gameLevel,
                    logger: logger,
                }
                gameLevel.hookManager.socketConnectEvent(context, socket);
            }
            gameLevel.broadcastGameContext();
            gameLevel.broadcastMessageContext();
            gameLevel.broadcastEndTurnResult();
            socket.emit('ack_join_room', { success: true, levelID: payload.levelID });
            accountManager.cancelSocketOpLock(socket);
        });

        socketService.on('req_leave_room', (socket : Socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                accountManager.cancelSocketOpLock(socket);
                return;
            }
            const gameLevel = this.levels.get(payload.levelID);
            if (!gameLevel) {
                accountManager.cancelSocketOpLock(socket);
                return;
            }
            socket.leave(payload.levelID);
            logger.info(`用户 ${account.accountId} 退出了房间 ${payload.levelID}`);
            gameLevel.delOnlineAccount(account.accountId);
            if (gameLevel.hookManager.socketDisconnectEvent) {
                const context = {
                    level: gameLevel,
                    logger: logger,
                }
                gameLevel.hookManager.socketDisconnectEvent(context, socket);
            }
            gameLevel.broadcastGameContext();
            gameLevel.broadcastMessageContext();
            socket.emit('ack_leave_room', { success: true, levelID: payload.levelID });
            accountManager.cancelSocketOpLock(socket);
        });

    }

    sendRoomList(socket: any) {
        interface LobbyLevelInfo {
            levelID: string;
            levelName: string;
            currRound: number;
            onlineAccountNames: string[];
        }

        interface LobbyInfo {
            levels: LobbyLevelInfo[];
        }
        const result: LobbyInfo = {
            levels: []
        };
        for (const level of this.levels.values()) {
            const levelInfo: LobbyLevelInfo = {
                levelID: level.levelID,
                levelName: level.levelName,
                currRound: level.currRound,
                onlineAccountNames: Array.from(level.onlineAccounts)
            };
            result.levels.push(levelInfo);
        }
        socket.emit('ack_room_list', result);
    }

    sendChatHistory(socket: any) {
        const CHAT_HISTORY_LIMIT = 20;
        const recentMessages = this.chatMessages.slice(-CHAT_HISTORY_LIMIT);
        socket.emit('ack_chat_history', recentMessages);
    }

    updateNewChatMessage(sender: string, content: string) {
        const timestamp = Date.now();
        const newMessage: LobbyChatMessage = { sender, content, timestamp };
        this.chatMessages.push(newMessage);
        socketService.emitMessageToAll("evt_update_lobby_chat", newMessage);
    }

}

interface LobbyChatMessage {
    sender: string;
    content: string;
    timestamp: number;
}

const gameLevelManager = new GameLevelManager();
export default gameLevelManager;