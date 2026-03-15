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
            this.levels.set(config.levelID, newLevel);
        }

        socketService.on('req_room_list', (socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                socket.emit('evt_send_alert', { title: "啊，不对", message: "这位朋友，你貌似没有登陆啊，因此我们无法为您提供大厅当前的信息，也许是登陆状况出了点问题？再登陆一遍试试怎么样？" });
                return;
            }
            this.sendRoomList(socket);
        });

        socketService.on('req_chat_history', (socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                return;
            }
            this.sendChatHistory(socket);
        });

        socketService.on('req_send_lobby_chat', (socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                socket.emit('evt_send_alert', { title: "谁在说话？", message: "抱歉啊这位朋友，你貌似没有登陆，按照我的工作原则，我没法向服务器传达你的话语呢，尝试重新登陆试试？麻烦啦。" });
                return;
            }
            this.updateNewChatMessage(account.userName, payload.content);
        });

        socketService.on('req_join_room', (socket : Socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                socket.emit('evt_send_alert', { title: "加入游戏出错", message: "这位朋友，刚才负责这个房间的服务进程告诉我：她不知道你是谁，貌似我们这边丢掉了你的登录信息，可能是我们的失误，可以尝试重新登陆一遍吗？" });
                return;
            }
            const gameLevel = this.levels.get(payload.levelID);
            if (!gameLevel) {
                socket.emit('evt_send_alert', { title: "加入游戏出错", message: "这位朋友，我们的转接服务表示你要去的那个游戏房间不存在了，我知道这听起来有些奇怪，但是为了避免你在这里迷路，请不要去那里了，选一些别的游戏房间试试吧，麻烦了！" });
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
                socket.emit('evt_send_alert', { title: "加入游戏出错", message: "这位朋友，你貌似已经在另一个房间里了，或者您可能在其它设备/标签页上登录了。按照我的工作原则，你无法同时加入多场游戏，请先退出先前进入的房间再试！" });
                return;
            }

            socket.join(payload.levelID);
            logger.info(`用户 ${account.accountId} 加入了房间 ${payload.levelID}`);
            gameLevel.onlineAccounts.add(account.accountId);
            if (gameLevel.hookManager.socketConnectEvent) {
                const context = {
                    level: gameLevel,
                    logger: logger,
                }
                gameLevel.hookManager.socketConnectEvent(context, socket);
            }
            gameLevel.broadcastGameContext();
            gameLevel.broadcastMessageContext();
            socket.emit('ack_join_room', { success: true, levelID: payload.levelID });
        });

        socketService.on('req_leave_room', (socket : Socket, payload) => {
            const account = accountManager.findAccountBySocket(socket);
            if (!account) {
                return;
            }
            const gameLevel = this.levels.get(payload.levelID);
            if (!gameLevel) {
                return;
            }
            socket.leave(payload.levelID);
            logger.info(`用户 ${account.accountId} 退出了房间 ${payload.levelID}`);
            gameLevel.onlineAccounts.delete(account.accountId);
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
        logger.info(`向 socket ${socket.id} 发送房间列表信息: ${JSON.stringify(result)}`);
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