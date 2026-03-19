import { useGameStore, type ContextMessage, type GameLevelInfo } from "../stores/game";
import { popupAlert, popupNotify } from "./popup";
import { bus } from "./socket";

class GameManager {
    constructor() {}

    init() {
        bus.on("evt_send_game_context", (payload: any) => {
            const gameStore = useGameStore();
            gameStore.gameLevelInfo = payload as GameLevelInfo;
            console.log("游戏上下文已更新", gameStore.gameLevelInfo);
        });

        bus.on("ack_update_input", (payload: any) => {
            console.log("输入更新结果", payload);
            if (payload.success && payload.message) {
                popupNotify({
                    title: "输入已更新",
                    message: payload.message
                });
            } else if (payload.message) {
                popupAlert({
                    title: "输入更新失败",
                    message: payload.message
                });
            }
        });

        bus.on("ack_send_interact", (payload: any) => {
            if (payload.success && payload.message) {
                popupNotify({
                    title: "交互已发送",
                    message: payload.message
                });
            } else if (payload.message) {
                popupAlert({
                    title: "交互发送失败",
                    message: payload.message
                });
            }
        });

        bus.on("evt_send_game_context", (payload: GameLevelInfo) => {
            const gameStore = useGameStore();
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

        bus.on("ack_end_turn", (payload: any) => {
            const gameStore = useGameStore();
            if (payload.message) {
                popupNotify({
                    title: payload.flag ? "已设定准备回合结束" : "已取消设定准备回合结束",
                    message: payload.message
                });
            }
            gameStore.readyForEndTurn = payload.flag;
        });

        bus.on("evt_next_round", (_ : any) => {
            const gameStore = useGameStore();
            gameStore.readyForEndTurn = false;
        });

        bus.on("evt_end_turn_result", (payload: any) => {
            const gameStore = useGameStore();
            gameStore.onlineAccountsReadyForEndTurn = payload.onlineAccountsReadyForEndTurn;
        });

    }
}

const gameManager = new GameManager();
export default gameManager;
