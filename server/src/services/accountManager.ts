import { Socket } from "socket.io";
import crypto from "crypto";

import { AccountRecord } from "./dataManger";
import { EventEmitter } from "events";

import socketService from "./socketManager";
import dataManager from "./dataManger";
import logger from "../utils/logger";

export interface AccountRecordInfo {
    // 记录账号基本信息
    accountId: string;
    userName: string;
    // 记录玩家数据
    createdAt: number;
    spawnedWordsCnt: number; // 玩家阅读过的文本词汇数量
    usedTokens: number; // 玩家参与游戏中的 Token 消耗总数
}

class AccountManager extends EventEmitter {
    onlineAccounts: Map<string, AccountRecord>;
    socketsOperationLocks: Map<string, boolean>;

    constructor() {
        super();
        this.onlineAccounts = new Map();
        this.socketsOperationLocks = new Map();
    }

    public init() {
        socketService.on("req_user_signup", (socket: Socket, userName: string, password: string) => {
            this.handleUserSignup(socket, userName, password);
            this.cancelSocketOpLock(socket);
        });

        socketService.on("req_user_login", (socket: Socket, userId: string, password: string) => {
            this.handleUserLogin(socket, userId, password);
            this.cancelSocketOpLock(socket);
        });

        socketService.on("req_user_disconnect", (socket: Socket) => {
            this.handleUserDisconnect(socket);
            this.cancelSocketOpLock(socket);
        });
    }

    findAccountBySocket(socket: Socket): AccountRecord | undefined {
        return this.onlineAccounts.get(socket.id);
    }

    getAccountInfoForClient(account: AccountRecord): AccountRecordInfo {
        const result: AccountRecordInfo = {
            accountId: account.accountId,
            userName: account.userName,
            createdAt: account.createdAt,
            spawnedWordsCnt: account.spawnedWordsCnt,
            usedTokens: account.usedTokens
        }
        return result;
    }

    checkValidUserName(userName: string): boolean {
        if (!userName || userName.length < 2 || userName.length > 20) {
            return false;
        }
        const validNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9\u3040-\u30ff\uac00-\ud7af\uff01-\uff5e]+$/;
        return validNameRegex.test(userName);
    }

    handleUserSignup(socket: Socket, userName: string, password: string) : boolean {
        if (!this.checkValidUserName(userName)) {
            logger.warn(`用户 ${userName} 注册失败，用户名不合法，socket=${socket.id}`);
            socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: false, message: "注册失败，用户名不合法，用户名不应当包含特殊字符，且长度在 2 - 20 个字符之间" });
            return false;
        }
        const account = dataManager.registerAccount(userName, password);
        if (!account) {
            logger.warn(`用户 ${userName} 注册失败，socket=${socket.id}`);
            socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: false, message: "出于未知原因，注册失败，请务必告诉开发者这个问题！" });
            return false;
        }

        this.onlineAccounts.set(socket.id, account);
        this.socketsOperationLocks.set(socket.id, false);
        logger.info(`用户 ${userName} 已上线，socket=${socket.id}, accountId=${account.accountId}`);
        socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: true, message: "注册并登陆成功！" });
        socketService.emitMessageToSocket(socket.id, "evt_account_info", { accountInfo: this.getAccountInfoForClient(account) });
        return true;

    }

    handleUserLogin(socket: Socket, userId: string, password: string) : boolean {
        const account = dataManager.getAccount(userId);
        if (!account) {
            logger.warn(`用户登录失败，未找到账号 ID=${userId}, socket=${socket.id}`);
            socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: false, message: "用户不存在" });
            return false;
        }

        const passwordHash = crypto.pbkdf2Sync(password, account.salt, 1000, 64, 'sha512').toString('hex');
        if (passwordHash !== account.passwordHash) {
            logger.warn(`用户登录失败，密码错误，accountId=${userId}, socket=${socket.id}`);
            socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: false, message: "密码错误" });
            return false;
        }

        if (Array.from(this.onlineAccounts.values()).some(acc => acc.accountId === account.accountId)) {
            logger.warn(`用户 ${account.accountId} 已经在线了，socket=${socket.id}`);
            socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: false, message: "出于某些原因，你的账号已经在一个其它终端登陆，所以我们无法为你当前的终端绑定身份。" });
            return false;
        }

        this.onlineAccounts.set(socket.id, account);
        this.socketsOperationLocks.set(socket.id, false);
        logger.info(`用户登录成功，socket=${socket.id}, accountId=${account.accountId}`);
        socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: true, message: "登陆成功" });
        socketService.emitMessageToSocket(socket.id, "evt_account_info", { accountInfo: this.getAccountInfoForClient(account) });

        return true;
    }

    handleUserDisconnect(socket: Socket) {
        const account = this.findAccountBySocket(socket);
        if (!account) {
            logger.warn(`收到断连事件但未找到在线账号，socket=${socket.id}`);
            return;
        }

        this.onlineAccounts.delete(socket.id);
        this.socketsOperationLocks.delete(socket.id);
        logger.info(`用户已下线，socket=${socket.id}, accountId=${account.accountId}`);
        this.emit("user_disconnected", account);
    }

    getSocketOpLock(socket: Socket): boolean {
        return this.socketsOperationLocks.get(socket.id) || false;
    }

    setSocketOpLock(socket: Socket) {
        this.socketsOperationLocks.set(socket.id, true);
    }

    cancelSocketOpLock(socket: Socket) {
        this.socketsOperationLocks.set(socket.id, false);
        socket.emit("evt_cancel_op_lock", {});
    }
}

const accountManager = new AccountManager();
export default accountManager;