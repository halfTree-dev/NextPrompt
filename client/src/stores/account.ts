import { defineStore } from 'pinia';

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

export const useAccountStore = defineStore('account', {
    state: () => ({
        isLoginSuccess: false,
        accountInfo: null as AccountRecord | null
    })
});