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
            if (payload.success && payload.message) {
                popupNotify({
                    title: "已更新节点状态",
                    message: payload.message,
                    duration: 1000
                });
            } else if (payload.message) {
                popupAlert({
                    title: "更新节点状态失败",
                    message: payload.message
                });
            }
        });

        bus.on("ack_send_interact", (payload: any) => {
            if (payload.success && payload.message) {
                popupNotify({
                    title: "已提交交互执行",
                    message: payload.message,
                    duration: 1000
                });
            } else if (payload.message) {
                popupAlert({
                    title: "失败的交互请求！",
                    message: payload.message
                });
            }
        });


        bus.on("evt_send_game_context", (payload: GameLevelInfo) => {
            const gameStore = useGameStore();
            gameStore.gameLevelInfo = payload;
            if (gameStore.gameNodeOrderedIDs.length === 0) {
                gameStore.gameNodeOrderedIDs = Object.keys(payload.nodes);
            } else {
                for (const nodeID of Object.keys(payload.nodes)) {
                    if (!gameStore.gameNodeOrderedIDs.includes(nodeID)) {
                        gameStore.gameNodeOrderedIDs.push(nodeID);
                    }
                }
                for (const listedNodeID of gameStore.gameNodeOrderedIDs) {
                    if (!payload.nodes[listedNodeID]) {
                        gameStore.gameNodeOrderedIDs = gameStore.gameNodeOrderedIDs.filter(id => id !== listedNodeID);
                    }
                }
            }
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
            // TODO: 根据效果类型和内容，更新游戏状态或界面
        });

        bus.on("ack_end_turn", (payload: any) => {
            const gameStore = useGameStore();
            if (payload.message) {
                popupNotify({
                    title: payload.flag ? "已设定准备回合结束" : "已取消设定准备回合结束",
                    message: payload.message,
                    duration: 1000
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
