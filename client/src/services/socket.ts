import mitt from "mitt";
import { io, Socket } from "socket.io-client";

import { type AccountRecord } from "../stores/account";

type SocketEvents = {
    "ack_login_result": { success: boolean, message: string };
    "evt_account_info": { accountInfo: AccountRecord };
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

        this.socket.on("ack_login_result", (payload) => {
            bus.emit("ack_login_result", payload);

        });

        this.socket.on("evt_account_info", (payload) => {
            bus.emit("evt_account_info", payload);

        });
    }
}

const socketClient = new SocketClient();
export { socketClient, bus };
export default socketClient;