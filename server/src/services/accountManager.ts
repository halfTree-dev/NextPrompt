import { Socket } from "socket.io";
import crypto from "crypto";

import { AccountRecord } from "./dataManger";

import socketService from "./socketManager";
import dataManager from "./dataManger";
import logger from "../utils/logger";

class AccountManager {
    onlineAccounts: Map<string, AccountRecord>;

    constructor() {
        this.onlineAccounts = new Map();
    }

    public init() {
        socketService.on("req_user_signup", (socket: Socket, userName: string, password: string) => {
            this.handleUserSignup(socket, userName, password);
        });

        socketService.on("req_user_login", (socket: Socket, userId: string, password: string) => {
            this.handleUserLogin(socket, userId, password);
        });

        socketService.on("req_user_disconnect", (socket: Socket) => {
            this.handleUserDisconnect(socket);
        });
    }

    findAccountBySocket(socket: Socket): AccountRecord | undefined {
        return this.onlineAccounts.get(socket.id);
    }

    handleUserSignup(socket: Socket, userName: string, password: string) : boolean {
        const account = dataManager.registerAccount(userName, password);
        if (!account) {
            logger.warn(`用户 ${userName} 注册失败，socket=${socket.id}`);
            socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: false, message: "注册失败，用户名可能已存在" });
            return false;
        }

        this.onlineAccounts.set(socket.id, account);
        logger.info(`用户 ${userName} 已上线，socket=${socket.id}, accountId=${account.accountId}`);
        socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: true, message: "登陆成功" });
        socketService.emitMessageToSocket(socket.id, "evt_account_info", { accountInfo: account });
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

        this.onlineAccounts.set(socket.id, account);
        logger.info(`用户登录成功，socket=${socket.id}, accountId=${account.accountId}`);
        socketService.emitMessageToSocket(socket.id, "ack_login_result", { success: true, message: "登陆成功" });
        socketService.emitMessageToSocket(socket.id, "evt_account_info", { accountInfo: account });

        return true;

    }

    handleUserDisconnect(socket: Socket) {
        const account = this.findAccountBySocket(socket);
        if (!account) {
            logger.warn(`收到断连事件但未找到在线账号，socket=${socket.id}`);
            return;
        }

        this.onlineAccounts.delete(socket.id);
        logger.info(`用户已下线，socket=${socket.id}, accountId=${account.accountId}`);

    }
}

const accountManager = new AccountManager();
export default accountManager;