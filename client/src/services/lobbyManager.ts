import { router } from "../router";
import { useLobbyStore, type LobbyLevelInfo, type ChatMessage } from "../stores/lobby";
import { popupNotify } from "./popup";
import { bus } from "./socket";

class LobbyManager {
    constructor() {}

    init() {
        bus.on("ack_room_list", (payload: any) => {
            const lobbyStore = useLobbyStore();
            const levels = payload.levels as LobbyLevelInfo[];
            lobbyStore.lobbyInfo = { levels };
        });

        bus.on("ack_join_room", (payload: any) => {
            if (payload && payload.success) {
                popupNotify({
                    title: "加入游戏成功",
                    message: `已成功加入 ${payload.levelID} 房间`,
                    duration: 1000,
                });
                router.push(`/game/${payload.levelID}`);
            }
        });

        bus.on("ack_leave_room", (payload: any) => {
            if (payload && payload.success) {
                ({
                    title: "退出游戏成功",
                    message: `你可以继续浏览其他房间`,
                    duration: 1000,
                });
                router.push("/lobby");
            }
        });

        bus.on("ack_chat_history", (payload: any) => {
            const lobbyStore = useLobbyStore();
            const chatMessages = payload as ChatMessage[];
            lobbyStore.chatMessages = chatMessages;
        });

        bus.on("evt_update_lobby_chat", (payload: any) => {
            const lobbyStore = useLobbyStore();
            const newChatMessage = payload as ChatMessage;
            lobbyStore.chatMessages.push(newChatMessage);
        });
    }
}

const lobbyManager = new LobbyManager();
export default lobbyManager;
