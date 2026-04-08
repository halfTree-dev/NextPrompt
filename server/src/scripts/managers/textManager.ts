import { AccountRecord } from "../../services/dataManger";
import GameLevel from "../gameLevel";

export class TextManager {
    public contextMessages: ContextMessage[] = [];

    constructor() {
        this.contextMessages = [];
    }

    public sendNotifyToAccount(level: GameLevel, account: AccountRecord, title: string, message: string, duration?: number): void {
        const socket = level.getSocketFromAccount(account.accountId);
        if (socket) {
            socket.emit("evt_send_notify", { title, message, duration });
        }
    }

    public sendAlertToAccount(level: GameLevel, account: AccountRecord, title: string, message: string): void {
        const socket = level.getSocketFromAccount(account.accountId);
        if (socket) {
            socket.emit("evt_send_alert", { title, message });
        }
    }

    public sendTitleLeadInToAccount(level: GameLevel, account: AccountRecord, title: string, subtitle: string, textDuration?: number, transitionDuration?: number): void {
        const socket = level.getSocketFromAccount(account.accountId);
        if (socket) {
            socket.emit("evt_send_title_lead_in", { title, subtitle, textDuration, transitionDuration });
        }
    }
}

export interface ContextMessage {
    sender: string;
    content: string;
    timestamp: number;
    relatedNodeIDs?: string[];
    sendType?: 'system' | 'character' | 'chat';
}