import { defineStore } from "pinia";
import type { AccountReadyInfo, AccountRecordInfo } from "./account";

export interface RelatedCharacter {
    characterID: string;
    [key: string]: any;
}

export interface Tag {
    name: string;
    [key: string]: any;
}

export interface InputSlot {
    slotID: string;
    inputHint: string;
    inputID: string;
    [key: string]: any;
}

export interface InputStringBar {
    barID: string;
    inputHint: string;
    inputContent: string;
    [key: string]: any;
}

export interface GameNodeInfo {
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

    tags?: Tag[];

    inputSlots?: { [key: string]: InputSlot };
    inputStringBars?: { [key: string]: InputStringBar };

    interactable?: boolean;
}

export interface Attributes {
    name: string;
    value: number;
    [key: string]: any;
}

export interface GameCharacterInfo {
    characterID: string;

    characterName: string;
    characterDescription: string;

    attributes: Map<string, Attributes>;
    storage?: Record<string, any>;

    accountRecord?: AccountRecordInfo;
}

export interface GameLevelInfo {
    levelID: string;
    levelName: string;
    currRound: number;
    onlineAccountNames: string[];
    nodes: { [key: string]: GameNodeInfo };
    characters: { [key: string]: GameCharacterInfo };
}

export interface ContextMessage {
    sender: string;
    content: string;
    timestamp: number;
    relatedNodeIDs?: string[];
    sendType?: 'system' | 'character' | 'chat';
}

export const useGameStore = defineStore('game', {
    state: () => ({
        gameLevelInfo: null as GameLevelInfo | null,
        contextMessages: [] as ContextMessage[],
        readyForEndTurn: false,
        onlineAccountsReadyForEndTurn: {} as Record<string, AccountReadyInfo>
    }),
});