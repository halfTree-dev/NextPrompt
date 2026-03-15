import { useGameStore, type ContextMessage, type GameLevelInfo } from "../stores/game";
import { popupAlert, popupNotify } from "./popup";
import { bus } from "./socket";

class GameManager {
    constructor() {}

    init() {
        bus.on("evt_send_game_context", (payload: any) => {
            const gameStore = useGameStore();
            gameStore.gameLevelInfo = payload as GameLevelInfo;
        });

        bus.on("ack_update_input", (payload: any) => {
            console.log("输入已更新", payload);
        });

        bus.on("ack_send_interact", (payload: any) => {
            console.log("交互已发送", payload);
        });

        bus.on("ack_send_end_turn_ready", (payload: any) => {
            console.log("准备结束回合状态更新", payload);
        });


        bus.on("evt_send_game_context", (payload: GameLevelInfo) => {
            const gameStore = useGameStore();
            payload.nodes = new Map(Object.entries(payload.nodes || {}))
            payload.characters = new Map(Object.entries(payload.characters || {}))
            gameStore.gameLevelInfo = payload;
        });

        bus.on("evt_send_message_context", (payload: ContextMessage[]) => {
            const gameStore = useGameStore();
            gameStore.contextMessages = payload;
        });

        bus.on("evt_update_message_context", (payload: ContextMessage) => {
            const gameStore = useGameStore();
            gameStore.contextMessages.push(payload);
        });


        bus.on("evt_send_notify", (payload: any) => {
            if (payload && payload.title && payload.message && payload.duration) {
                popupNotify({
                    title: payload.title,
                    message: payload.message,
                    duration: payload.duration
                });
            } else if (payload && payload.title && payload.message) {
                popupNotify({
                    title: payload.title,
                    message: payload.message
                });
            }
        });

        bus.on("evt_send_alert", (payload: any) => {
            if (payload && payload.title && payload.message) {
                popupAlert({
                    title: payload.title,
                    message: payload.message
                });
            }
        });

        bus.on("evt_send_effect", (payload: any) => {
            console.log("收到游戏效果:", payload);
        });
    }
}

const gameManager = new GameManager();
export default gameManager;
