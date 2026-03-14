import { useGameStore, type GameLevelInfo, type ContextMessage } from "../stores/game";
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

        bus.on("evt_send_notify", (payload: any) => {
            console.log("收到游戏通知:", payload);
        });

        bus.on("evt_send_alert", (payload: any) => {
            console.warn("收到游戏警告:", payload);
        });

        bus.on("evt_send_effect", (payload: any) => {
            console.log("收到游戏效果:", payload);
        });

        bus.on("evt_update_chat", (payload: any) => {
            const gameStore = useGameStore();
            if (payload && payload.sendType) {
                gameStore.contextMessages.push(payload as ContextMessage);
            }
        });
    }
}

const gameManager = new GameManager();
export default gameManager;
