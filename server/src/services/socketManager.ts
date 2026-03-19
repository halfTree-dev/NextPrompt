import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { EventEmitter } from "events";
import logger from "../utils/logger";
import { InputSlot, InputStringBar } from "../scripts/gameObjects/gameNode";

class SocketService extends EventEmitter {
    private io: Server | null = null;

    constructor() {
        super();
    }

    public init(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on("connection", (socket: Socket) => {
            logger.info(`Socket connected: ${socket.id}`);
            this.emit("user_connected", socket);

            socket.on("req_user_signup", (payload: { userName: string; password: string }) => {
                this.emit("req_user_signup", socket, payload.userName, payload.password);
            });

            socket.on("req_user_login", (payload: { userName: string; password: string }) => {
                this.emit("req_user_login", socket, payload.userName, payload.password);
            });

            socket.on("req_room_list", (payload: {}) => {
                this.emit("req_room_list", socket, payload);
            });

            socket.on("req_join_room", (payload: { levelID: string }) => {
                this.emit("req_join_room", socket, payload);
            });

            socket.on("req_leave_room", (payload: { levelID: string }) => {
                this.emit("req_leave_room", socket, payload);
            });

            socket.on("req_send_lobby_chat", (payload: { content: string }) => {
                this.emit("req_send_lobby_chat", socket, payload);
            });

            socket.on("req_chat_history", (payload: {}) => {
                this.emit("req_chat_history", socket, payload);
            });

            socket.on("req_update_input", (payload: { nodeID: string; inputSlots: Record<string, InputSlot>; inputStringBars: Record<string, InputStringBar> }) => {
                this.emit("req_update_input", socket, payload);
            });

            socket.on("req_send_interact", (payload: { nodeID: string }) => {
                this.emit("req_send_interact", socket, payload);
            });

            socket.on("req_send_end_turn_ready", (payload: any) => {
                this.emit("req_send_end_turn_ready", socket, payload);
            });

            socket.on("req_send_game_chat", (payload: { content: string }) => {
                this.emit("req_send_game_chat", socket, payload);
            });

            socket.on("req_end_turn", (payload: { endTurnFlag: boolean }) => {
                this.emit("req_end_turn", socket, payload);
            });

            socket.on("disconnect", () => {
                logger.info(`Socket disconnected: ${socket.id}`);
                this.emit("req_user_disconnect", socket);
            });

        });
    }

    public getSocketsInRoom(roomName: string): Socket[] {
        if (!this.io) { return []; }
        const room = this.io.sockets.adapter.rooms.get(roomName);
        if (!room) { return []; }
        const sockets: Socket[] = [];
        room.forEach(socketId => {
            const socket = this.io!.sockets.sockets.get(socketId);
            if (socket) { sockets.push(socket); }
        });
        return sockets;
    }


    public emitMessageToSocket(socketId: string, topicName: string, payload: object) {
        if (this.io) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket && socket.connected) {
                try {
                    socket.emit(topicName, payload);
                } catch (err) {
                    logger.error(`向 socket ${socketId} 发送消息时发生错误： ${err}`);
                }
            }
        }
    }

    public emitMessageToRoom(roomName: string, topicName: string, payload: object) {
        if (this.io) {
            try {
                this.io.to(roomName).emit(topicName, payload);
            } catch (err) {
                logger.error(`向房间 ${roomName} 发送消息时发生错误： ${err}`);
            }
        }
    }

    public emitMessageToAll(topicName: string, payload: object) {
        if (this.io) {
            try {
                this.io.emit(topicName, payload);
            } catch (err) {
                logger.error(`向所有连接的客户端发送消息时发生错误： ${err}`);
            }
        }
    }
}

const socketService = new SocketService();
export default socketService;