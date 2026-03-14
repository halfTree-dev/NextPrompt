import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { EventEmitter } from "events";
import logger from "../utils/logger";

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

            socket.on("req_user_signup", (userName: string, password: string) => {
                this.emit("req_user_signup", socket, userName, password);
            });

            socket.on("req_user_login", (userId: string, password: string) => {
                this.emit("req_user_login", socket, userId, password);
            });

            socket.on("disconnect", () => {
                logger.info(`Socket disconnected: ${socket.id}`);
                this.emit("req_user_disconnect", socket);
            });

        });
    }

    public emitMessageToSocket(socketId: string, topicName: string, ...messages: unknown[]) {
        if (this.io) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket && socket.connected) {
                try {
                    socket.emit(topicName, messages);
                } catch (err) {
                    logger.error(`向 socket ${socketId} 发送消息时发生错误： ${err}`);
                }
            }
        }
    }

    public emitMessageToRoom(roomName: string, topicName: string, ...messages: unknown[]) {
        if (this.io) {
            try {
                this.io.to(roomName).emit(topicName, messages);
            } catch (err) {
                logger.error(`向房间 ${roomName} 发送消息时发生错误： ${err}`);
            }
        }
    }

    public emitMessageToAll(topicName: string, ...messages: unknown[]) {
        if (this.io) {
            try {
                this.io.emit(topicName, messages);
            } catch (err) {
                logger.error(`向所有连接的客户端发送消息时发生错误： ${err}`);
            }
        }
    }
}

const socketService = new SocketService();
export default socketService;