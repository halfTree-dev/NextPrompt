import { defineStore } from 'pinia';

export interface AccountRecordInfo {
    // 记录账号基本信息
    accountId: string;
    userName: string;
    // 记录玩家数据
    createdAt: number;
    spawnedWordsCnt: number; // 玩家阅读过的文本词汇数量
    usedTokens: number; // 玩家参与游戏中的 Token 消耗总数
}

export const useAccountStore = defineStore('account', {
    state: () => ({
        isLoginSuccess: false,
        accountInfo: null as AccountRecordInfo | null
    })
});