export class TextManager {
    public contextMessages: ContextMessage[] = [];

    constructor() {
        this.contextMessages = [];
    }
}

export interface ContextMessage {
    sender: string;
    content: string;
    timestamp: number;
    relatedNodeIDs?: string[];
    sendType?: 'system' | 'character' | 'chat';
}