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
                    message: `你已成功加入 ${payload.levelID} 房间，接下来的游戏进程就不归我管了，玩的开心，朋友！`,
                    duration: 3000,
                });
                router.push(`/game/${payload.levelID}`);
            }
        });

        bus.on("ack_leave_room", (payload: any) => {
            if (payload && payload.success) {
                popupNotify({
                    title: "退出游戏成功",
                    message: `欢迎回来，朋友。想看点别的故事吗？也可以！`,
                    duration: 3000,
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
