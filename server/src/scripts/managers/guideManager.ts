import { Socket } from "socket.io";
import { AccountRecord } from "../../services/dataManger";
import GameLevel from "../gameLevel";

export class GuideManager {
    public sendGuideMessageToAccount: (level: GameLevel, account: AccountRecord, title: string, message: string) => void =
    (level: GameLevel, account: AccountRecord, title: string, message: string) => {
        const socket = level.getSocketFromAccount(account.accountId);
        if (socket) {
            socket.emit("evt_send_guide_message", { title, content: message });
        }
    };

    public sendGuideMessageToSocket: (socket: Socket, title: string, message: string) => void =
    (socket: Socket, title: string, message: string) => {
        if (!socket) { return; }
        socket.emit("evt_send_guide_message", { title, content: message });
    }

    public sendGuideMessageToLevel: (level: GameLevel, title: string, message: string) => void =
    (level: GameLevel, title: string, message: string) => {
        level.onlineAccounts.forEach(accountId => {
            const socket = level.getSocketFromAccount(accountId);
            if (socket) {
                socket.emit("evt_send_guide_message", { title, content: message });
            }
        });
    }

}