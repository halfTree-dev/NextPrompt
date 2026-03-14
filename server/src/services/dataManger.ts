import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Database from 'better-sqlite3';

import logger from '../utils/logger';

const DB_DIR = path.join(__dirname, '../db');
const SQLITE_ACCOUNT_DB_FILE = path.join(DB_DIR, 'accounts.sqlite3');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

export interface AccountRecord {
    // 记录账号鉴权信息
    accountId: string;
    userName: string;
    passwordHash: string;
    salt: string;
    // 记录玩家数据
    createdAt: number;
    spawnedWordsCnt: number; // 玩家阅读过的文本词汇数量
    usedTokens: number; // 玩家参与游戏中的 Token 消耗总数
}

class DataManager {
    db: Database.Database;

    constructor() {
        this.db = new Database(SQLITE_ACCOUNT_DB_FILE);
        this.initSchema();
    }

    private initSchema(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                accountId TEXT PRIMARY KEY,
                userName TEXT UNIQUE NOT NULL,
                passwordHash TEXT NOT NULL,
                salt TEXT NOT NULL,
                createdAt INTEGER NOT NULL,
                spawnedWordsCnt INTEGER NOT NULL DEFAULT 0,
                usedTokens INTEGER NOT NULL DEFAULT 0
            )
        `);
    }

    public getAccount(accountId: string): AccountRecord | undefined {
        const account = this.db
            .prepare(`
                SELECT * FROM accounts WHERE accountId = ?
            `)
            .get(accountId) as AccountRecord | undefined;
        if (!account) {
            logger.warn(`未找到 ID 为 ${accountId} 的账号信息`);
        }
        return account;
    }

    public registerAccount(userName: string, password: string): AccountRecord | undefined {
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        const newAccount: AccountRecord = {
            accountId: crypto.randomBytes(16).toString('hex'),
            userName,
            passwordHash,
            salt,
            createdAt: Date.now(),
            spawnedWordsCnt: 0,
            usedTokens: 0
        };

        try {
            this.db
                .prepare(
                    `
                    INSERT INTO accounts (
                        accountId,
                        userName,
                        passwordHash,
                        salt,
                        createdAt,
                        spawnedWordsCnt,
                        usedTokens
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `
                )
                .run(
                    newAccount.accountId,
                    newAccount.userName,
                    newAccount.passwordHash,
                    newAccount.salt,
                    newAccount.createdAt,
                    newAccount.spawnedWordsCnt,
                    newAccount.usedTokens
                );
            logger.info(`用户 ${userName} 注册成功，分配 ID 为 ${newAccount.accountId}`);
            return newAccount;
        } catch (err) {
            logger.error(`注册用户 ${userName} 时发生错误： ${err}`);
            return undefined;
        }
    }

    public saveAccount(account: AccountRecord): void {
        if (!account) {
            logger.warn('尝试保存一个无效的账号信息');
            return;
        }
        try {
            const result = this.db
                .prepare(
                    `
                    UPDATE accounts
                    SET
                        userName = ?,
                        passwordHash = ?,
                        salt = ?,
                        createdAt = ?,
                        spawnedWordsCnt = ?,
                        usedTokens = ?
                    WHERE accountId = ?
                    `
                )
                .run(
                    account.userName,
                    account.passwordHash,
                    account.salt,
                    account.createdAt,
                    account.spawnedWordsCnt,
                    account.usedTokens,
                    account.accountId
                );
            if (result.changes > 0) {
                logger.info(`账号信息保存成功，ID: ${account.accountId}`);
            } else {
                logger.warn(`未找到 ID 为 ${account.accountId} 的账号信息，无法保存`);
            }
        } catch (err) {
            logger.error(`保存账号 ID ${account.accountId} 时发生错误： ${err}`);
        }
    }

    public deleteAccount(accountId: string): boolean {
        const result = this.db
            .prepare(`
                DELETE FROM accounts WHERE accountId = ?
            `)
            .run(accountId);
        if (result.changes > 0) {
            logger.info(`账号 ID ${accountId} 已被删除`);
            return true;
        }
        logger.warn(`未找到 ID 为 ${accountId} 的账号信息，无法删除`);
        return false;
    }

    close(): void {
        this.db.close();
    }
}

const dataManager = new DataManager();
export default dataManager;