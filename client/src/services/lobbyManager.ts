import { useLobbyStore, type LobbyLevelInfo, type ChatMessage } from "../stores/lobby";
import { bus } from "./socket";

class LobbyManager {
    constructor() {}

    init() {
        bus.on("ack_room_list", (payload: any) => {
            const lobbyStore = useLobbyStore();
            lobbyStore.lobbyInfo = { levels: payload as LobbyLevelInfo[] };
        });

        bus.on("ack_join_room", (payload: any) => {
            if (payload && payload.success) {
                console.log(`成功加入房间: ${payload.roomId}`);
            } else if (payload && payload.message) {
                console.warn(`加入房间失败: ${payload.message}`);
            }
        });

        bus.on("ack_leave_room", (payload: any) => {
            if (payload && payload.success) {
                console.log("已离开房间");
            }
        });

        bus.on("evt_update_chat", (payload: any) => {
            const lobbyStore = useLobbyStore();
            lobbyStore.chatMessages.push(payload as ChatMessage);
        });
    }
}

const lobbyManager = new LobbyManager();
export default lobbyManager;
