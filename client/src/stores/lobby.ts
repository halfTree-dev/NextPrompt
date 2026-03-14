import { defineStore } from "pinia";

export interface LobbyLevelInfo {
    levelID: string;
    levelName: string;
    currRound: number;
    onlineAccountNames: string[];
}

export interface LobbyInfo {
    levels: LobbyLevelInfo[];
}

export interface ChatMessage {
    sender: string;
    content: string;
    timestamp: number;
}

export const useLobbyStore = defineStore('lobby', {
    state: () => ({
        lobbyInfo: null as LobbyInfo | null,
        chatMessages: [] as ChatMessage[]
    }),
});
