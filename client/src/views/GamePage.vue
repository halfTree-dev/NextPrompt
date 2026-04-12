<template>
    <div class="game-page">
        <!-- 标题占用屏幕最上方一小部分 -->
        <header class="game-header">
            <h2 class="game-title">故事：{{ level ? level.levelName : "???" }}</h2>
            <h3 class="game-title">第 {{ level ? level.currRound : "???" }} 段落</h3>
            <div class="header-right">
                <button class="settings-btn" @click="openSettingModal">设置</button>
                <button class="menu-btn" @click="openMenuModal">菜单</button>
            </div>
        </header>

        <main class="game-main">
            <!-- 玩家的属性显示区域，占用下方左边部分 -->
            <section class="game-attributes" :style="{ width: leftNavWidth + 'px' }">
                <div class="panel-header">属性</div>
                <ul class="attr-list">
                    <li class="attr-item" v-for="attribute in myAttributesList">
                        <span class="attr-name">{{ attribute.name }}</span>
                        <span class="attr-value">{{ attribute.value }}</span>
                    </li>
                </ul>
                <div class="panel-header">你扮演的角色</div>
                <div class="character-profile">
                    <span class="character-name">{{ myCharacter ? myCharacter.characterName : "观察者" }}</span>
                    <p class="character-description">{{ myCharacter ? myCharacter.characterDescription : "你是当前故事的一名读者。" }}</p>
                </div>
                <div class="end-turn-area">
                    <button class="end-turn-btn" @click="setPrepared" :disabled="operationLock">准备结束回合 [{{ preparedAccountCnt }}/{{ totalAccountCnt }}]</button>
                </div>
            </section>

            <div class="resizer" @mousedown="startLeftResize"></div>

            <NodeList class="game-nodes" :style="{ pointerEvents: operationLock ? 'none' : 'auto', opacity: operationLock ? 0.6 : 1 }" @node-click="openNodeDetails" />

            <div class="resizer" @mousedown="startRightResize"></div>

            <!-- 最后是聊天窗口，占用下方区域的右边部分 -->
            <section class="game-chat" :style="{ width: rightChatWidth + 'px' }">
                <div class="panel-header">故事文本与聊天</div>
                <ul class="chat-messages">
                    <li class="chat-msg" v-for="message in messages">
                        <div class="msg-header">
                            <span class="sender" :class="{ system: message.sendType === 'system', character: message.sendType === 'character', chat: message.sendType === 'chat' }">
                                {{ message.sender }}
                            </span>
                            <span class="time">{{ new Date(message.timestamp).toLocaleTimeString() }}</span>
                        </div>
                        <div class="msg-content">{{ message.content }}</div>
                    </li>
                </ul>
                <div class="chat-input-area">
                    <textarea
                        placeholder="在此输入聊天信息"
                        rows="1"
                        @input="autoResize"
                        ref="chatInput"
                    ></textarea>
                    <button class="send-btn" @click="sendGameMessage" :disabled="operationLock">发送给其它玩家</button>
                </div>
            </section>
        </main>

        <transition name="modal-fade">
            <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
                <div class="modal-content">
                    <NodeInteract v-if="activeNode" :node="activeNode" @close="closeModal" />
                </div>
            </div>
        </transition>

        <transition name="modal-fade">
            <div class="modal-overlay" v-if="gameStore.readyForEndTurn">
                <div class="modal-content">
                    <span class="ready-header">
                        <h3>你已准备好结束回合</h3>
                        <p v-if="preparedAccountCnt < totalAccountCnt">等待其他玩家准备中 [{{ preparedAccountCnt }}/{{ totalAccountCnt }}]</p>
                        <p v-if="preparedAccountCnt >= totalAccountCnt">所有玩家都已准备好，等待叙事者生成下一回合文本...</p>
                    </span>
                    <li class="ready-account" v-for="accountId in Object.keys(gameStore.onlineAccountsReadyForEndTurn || {})" :key="accountId">
                        <span class="account-name">{{ gameStore.onlineAccountsReadyForEndTurn[accountId]?.userName || accountId }}({{ accountId.slice(0, 6) }})</span>
                        <span class="account-status">{{ gameStore.onlineAccountsReadyForEndTurn[accountId]?.readyForEndTurn ? "准备" : "操作中" }}</span>
                    </li>
                    <button class="close-btn" @click="setNotPrepared" :disabled="operationLock || preparedAccountCnt >= totalAccountCnt">取消准备</button>
                </div>
            </div>
        </transition>

        <transition name="modal-fade">
            <div class="modal-overlay" v-if="showSettingModal" @click.self="closeSettingModal">
                <div class="modal-content">
                    <SettingWindow @close="closeSettingModal" />
                </div>
            </div>
        </transition>

        <transition name="modal-fade">
            <div class="modal-overlay" v-if="showMenuModal" @click.self="closeMenuModal">
                <div class="modal-content">
                    <MenuWindow @close="closeMenuModal" @exit="exitToLobby" />
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { useGameStore, type GameNodeInfo } from '../stores/game'
import { useAccountStore } from '../stores/account';
import { popupNotify } from '../services/popup';
import { router } from '../router';

import SettingWindow from '../components/windows/SettingWindow.vue';
import MenuWindow from '../components/windows/MenuWindow.vue';
import NodeList from '../components/gamings/NodeList.vue';

import socketClient from '../services/socket';

const gameStore = useGameStore()
const level = computed(() => gameStore.gameLevelInfo);
const messages = computed(() => gameStore.contextMessages || [])

const accountStore = useAccountStore()
const operationLock = computed(() => accountStore.operationLock);

if (!accountStore.isLoginSuccess) {
    popupNotify({
        title: "进入大厅失败",
        message: "注意，你需要先登录",
        duration: 1000,
    })
    router.push("/")
}

const myAccount = computed(() => accountStore.accountInfo)

const myCharacter = computed(() => {
    if (!level.value || !myAccount.value || !level.value.characters) return null
    return Object.values(level.value.characters).find(character => character.accountRecord?.accountId === myAccount.value?.accountId) || null
})
const myAttributesList = computed(() => {
    if (!myCharacter || !myCharacter.value) return []
    return Object.entries(myCharacter.value.attributes).map(([name, value]) => ({ name, value }));
})


const sendGameMessage = () => {
    if (chatInput.value && chatInput.value.value.trim() !== "") {
        socketClient.emit("req_send_game_chat", { content: chatInput.value.value.trim() });
        chatInput.value.value = "";
    } else {
        popupNotify({
            title: "未输入任何内容",
            message: "发送栏的的内容为空",
            duration: 2000,
        })
    }
    autoResize();
}

const preparedAccountCnt = computed(() => {
    let result = 0;
    for (const ready of Object.values(gameStore.onlineAccountsReadyForEndTurn || {})) { if (ready.readyForEndTurn) result++; }
    return result;
})
const totalAccountCnt = computed(() => Object.keys(gameStore.onlineAccountsReadyForEndTurn || {}).length);
const setPrepared = () => {
    gameStore.readyForEndTurn = true;
    socketClient.emit("req_end_turn", { endTurnFlag: true });
}
const setNotPrepared = () => {
    gameStore.readyForEndTurn = false;
    socketClient.emit("req_end_turn", { endTurnFlag: false });
}

// 管理设置界面
const showSettingModal = ref(false);
const openSettingModal = () => {
    showSettingModal.value = true;
}
const closeSettingModal = () => {
    showSettingModal.value = false;
}

const showMenuModal = ref(false);
const openMenuModal = () => {
    showMenuModal.value = true;
}
const closeMenuModal = () => {
    showMenuModal.value = false;
}
const exitToLobby = () => {
    router.push("/lobby");
}

// 下面响应玩家拖动调整面板宽度的逻辑
const screenWidth = window.innerWidth
const leftNavWidth = ref(screenWidth / 8)
const rightChatWidth = ref(screenWidth / 2.3)

let isResizingLeft = false
let isResizingRight = false

const chatInput = ref<HTMLTextAreaElement | null>(null)
const autoResize = () => {
    if (chatInput.value) {
        chatInput.value.style.height = 'auto'
        chatInput.value.style.height = Math.min(chatInput.value.scrollHeight, 150) + 'px'
    }
}

const startLeftResize = () => {
    isResizingLeft = true
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
}
const startRightResize = () => {
    isResizingRight = true
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
}
const resize = (e: MouseEvent) => {
    if (isResizingLeft) {
        leftNavWidth.value = Math.max(screenWidth / 12, Math.min(screenWidth / 5, leftNavWidth.value + e.movementX));
    } else if (isResizingRight) {
        rightChatWidth.value = Math.max(screenWidth / 4.5, Math.min(screenWidth / 2, rightChatWidth.value - e.movementX));
    }
}
const stopResize = () => {
    if (isResizingLeft || isResizingRight) {
        isResizingLeft = false
        isResizingRight = false
        document.removeEventListener('mousemove', resize)
        document.removeEventListener('mouseup', stopResize)
        document.body.style.cursor = 'default'
    }
}
onUnmounted(() => {
    stopResize()
})

import NodeInteract from '../components/gamings/NodeInteract.vue';
const showModal = ref(false);
const activeNodeId = ref<string>("");
const activeNode = ref<GameNodeInfo | null>(null);

const openNodeDetails = (node: GameNodeInfo) => {
    activeNodeId.value = node.nodeID;
    activeNode.value = node;
    showModal.value = true;
}

const closeModal = () => {
    showModal.value = false;
}
</script>

<style lang="css" scoped>
.game-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-background, #1e1e1e);
    color: var(--color-text, #eee);
    background-image: var(--bg-image, none);
    background-size: cover;
    background-position: center;
}

.game-header {
    height: 50px;
    background-color: var(--color-panel, rgba(45, 45, 45, 0.95));
    border-bottom: 1px solid var(--color-border, #3c3c3c);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    flex-shrink: 0;
    backdrop-filter: blur(5px);
}

.game-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--color-primary, #4caf50);
}

.settings-btn, .menu-btn {
    background: transparent;
    color: var(--color-text, #fff);
    border: 1px solid var(--color-border, #555);
    padding: 6px 16px;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.2s;
}

.settings-btn:hover, .menu-btn:hover {
    background: var(--color-border, #555);
}

.game-main {
    display: flex;
    flex: 1;
    overflow: hidden;
    backdrop-filter: blur(5px);
}

.panel-header {
    padding: 10px 15px;
    font-size: 0.9rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    background: var(--color-panel, rgba(45, 45, 45, 0.5));
    border-bottom: 1px solid var(--color-border, #3c3c3c);
}

.character-profile {
    margin-top: auto;
    padding: 18px 15px 10px 15px;
    background: var(--color-panel, rgba(45, 45, 45, 0.4));
    border-top: 1px solid var(--color-border, #3c3c3c);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 80px;
    box-sizing: border-box;
}
.character-name {
    color: var(--color-primary, #4caf50);
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 6px;
    line-height: 1.2;
}
.character-description {
    color: var(--color-text, #eee);
    font-size: 1rem;
    word-break: break-all;
    white-space: pre-line;
    margin: 0;
    line-height: 1.5;
}

.end-turn-area {
    margin-top: auto;
    padding: 18px 15px 10px 15px;
    background: var(--color-background, rgba(45, 45, 45, 0.5));
    border-top: 1px solid var(--color-border, #3c3c3c);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 80px;
    box-sizing: border-box;
}
.end-turn-btn {
    background: var(--color-primary, #4caf50);
    color: white;
    font-weight: bold;
    border: none;
    padding: 0 18px;
    border-radius: 0;
    cursor: pointer;
    width: 100%;
    height: 36px;
    transition: filter 0.2s;
}

.game-attributes {
    background-color: rgba(30, 30, 30, 0.85);
    display: flex;
    flex-direction: column;
}

.attr-list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
}

.attr-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 15px;
    border-bottom: 1px solid var(--color-border, #333);
    font-size: 0.95rem;
}

.attr-name {
    color: #ccc;
}
.attr-value {
    font-weight: bold;
    color: var(--color-primary, #4caf50);
}

.resizer {
    width: 4px;
    background-color: var(--color-border, #2d2d2d);
    cursor: col-resize;
    z-index: 10;
    transition: background 0.2s;
}
.resizer:hover, .resizer:active {
    background-color: var(--color-primary, #4caf50);
}

.game-nodes {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: rgba(20, 20, 20, 0.8);
}

.game-chat {
    display: flex;
    flex-direction: column;
    background-color: rgba(30, 30, 30, 0.9);
}

.chat-messages {
    flex: 1;
    list-style: none;
    padding: 15px;
    margin: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.chat-msg {
    background: rgba(20, 20, 20, 0.6);
    border-radius: 0;
    padding: 10px 12px;
    border: 1px solid var(--color-border, #3c3c3c);
}

.msg-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-bottom: 6px;
}

.sender { font-weight: bold; color: #fff; }
.sender.system { color: linear-gradient(90deg, var(--color-emphasis, #f39c12) 0%, var(--color-emphasis2, #f38612) 100%); }
.sender.character { color: var(--color-text, #f4f4f4); }
.sender.chat { color: #656565; }
.time { opacity: 0.5; }

.msg-content {
    overflow-wrap: break-word;
    white-space: pre-wrap;
    margin-top: 5px;
    color: var(--color-text, #fff);
}

.chat-input-area {
    display: flex;
    padding: 15px;
    border-top: 1px solid var(--color-border, #3c3c3c);
    gap: 10px;
}
.chat-input-area textarea {
    flex: 1;
    background: transparent;
    border: none;
    border-bottom: 2px solid var(--color-border, #555);
    color: var(--color-text, #fff);
    border-radius: 0;
    padding: 10px 5px;
    font-size: 1rem;
    outline: none;
    transition: border-bottom-color 0.3s ease;
    resize: none;
    max-height: 150px;
    font-family: inherit;
    line-height: 1.5;
}
.chat-input-area textarea:focus {
    border-bottom-color: var(--color-primary, #4caf50);
}
.send-btn {
    background: var(--color-primary, #4caf50);
    color: white;
    font-weight: bold;
    border: none;
    padding: 0 18px;
    border-radius: 0;
    cursor: pointer;
}


.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}
.modal-content {
    background: var(--color-panel, #2d2d2d);
    border: 1px solid var(--color-border, #555);
    border-radius: 0;
    padding: 30px;
    min-width: 45vw;
    max-width: 70vw;
    min-height: 35vh;
    max-height: 75vh;
    color: var(--color-text, #fff);
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
}
.modal-content code {
    display: block;
    background: #111;
    padding: 10px;
    border-radius: 0;
    margin: 15px 0;
}

.ready-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: var(--color-panel, #2d2d2d);
    padding: 10px;
    border-radius: 0;
    margin: 15px 0;
}
.ready-header h3 {
    margin: 0 0 5px 0;
    color: var(--color-primary, #4caf50);
}
.ready-account {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 0;
	border-bottom: 1px solid var(--color-divider, #5a5a5a);
	font-size: 0.98rem;
}

.close-btn {
    background: #d32f2f;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 0;
    cursor: pointer;
    font-weight: bold;
    align-self: flex-end;
    margin-top: auto;
}
.close-btn:disabled,
.end-turn-btn:disabled,
.send-btn:disabled {
    background: #888 !important;
    color: #ccc !important;
    cursor: not-allowed;
    filter: grayscale(0.5) brightness(0.9);
    opacity: 0.7;
}
.modal-fade-enter-active, .modal-fade-leave-active {
    transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
    opacity: 0;
}
</style>