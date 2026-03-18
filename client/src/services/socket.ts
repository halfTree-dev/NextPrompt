import mitt from "mitt";
import { io, Socket } from "socket.io-client";

import { type AccountRecordInfo } from "../stores/account";
import type { ChatMessage, LobbyLevelInfo } from "../stores/lobby";
import type { ContextMessage, GameLevelInfo } from "../stores/game";

type SocketEvents = {
    "ack_login_result": { success: boolean, message: string };
    "evt_account_info": { accountInfo: AccountRecordInfo };

    "ack_room_list": { levels: LobbyLevelInfo[] };
    "ack_join_room": { success: boolean, levelID: string };
    "ack_leave_room": { success: boolean, levelID: string };
    "evt_update_lobby_chat": ChatMessage;
    "ack_chat_history": ChatMessage[];

    "ack_update_input": { success: boolean, message: string };
    "ack_send_interact": { success: boolean, message: string };
    "ack_send_end_turn_ready": any;

    "evt_send_game_context": GameLevelInfo;
    "evt_send_message_context": ContextMessage[];
    "evt_update_message_context": ContextMessage;

    "evt_send_notify": { title: string, message: string, duration?: number };
    "evt_send_alert": { title: string, message: string };
    "evt_send_effect": any;
};
const bus = mitt<SocketEvents>();


class SocketClient {
    private socket: Socket;

    constructor() {
        console.log("正在连接到服务器");
        this.socket = io(`http://${window.location.hostname}:3000`);
    }

    init() {
        this.socket.on("connect", () => {
            console.log("已连接到服务器");
        });

        this.socket.on("disconnect", () => {
            console.log("与服务器的连接已断开");
        });

        this.socket.on("ack_login_result", (payload) => bus.emit("ack_login_result", payload));
        this.socket.on("evt_account_info", (payload) => bus.emit("evt_account_info", payload));

        this.socket.on("ack_room_list", (payload) => bus.emit("ack_room_list", payload));
        this.socket.on("ack_join_room", (payload) => bus.emit("ack_join_room", payload));
        this.socket.on("ack_leave_room", (payload) => bus.emit("ack_leave_room", payload));
        this.socket.on("evt_update_lobby_chat", (payload) => bus.emit("evt_update_lobby_chat", payload));
        this.socket.on("ack_chat_history", (payload) => bus.emit("ack_chat_history", payload));

        this.socket.on("ack_update_input", (payload) => bus.emit("ack_update_input", payload));
        this.socket.on("ack_send_interact", (payload) => bus.emit("ack_send_interact", payload));
        this.socket.on("ack_send_end_turn_ready", (payload) => bus.emit("ack_send_end_turn_ready", payload));

        this.socket.on("evt_send_game_context", (payload) => bus.emit("evt_send_game_context", payload));
        this.socket.on("evt_send_message_context", (payload) => bus.emit("evt_send_message_context", payload));
        this.socket.on("evt_update_message_context", (payload) => bus.emit("evt_update_message_context", payload));

        this.socket.on("evt_send_notify", (payload) => bus.emit("evt_send_notify", payload));
        this.socket.on("evt_send_alert", (payload) => bus.emit("evt_send_alert", payload));
        this.socket.on("evt_send_effect", (payload) => bus.emit("evt_send_effect", payload));
    }

    public emit(event: string, payload: any) {
        this.socket.emit(event, payload);
    }
}

const socketClient = new SocketClient();
export { socketClient, bus };
export default socketClient;