<template>
    <div class="game-page">
        <!-- 标题占用屏幕最上方一小部分 -->
        <header class="game-header">
            <h2 class="game-title">故事：{{ level ? level.levelName : "???" }}</h2>
            <div class="header-right">
                <button class="settings-btn">设置</button>
                <button class="menu-btn">菜单</button>
            </div>
        </header>

        <main class="game-main">
            <!-- 玩家的属性显示区域，占用下方左边部分 -->
            <section class="game-attributes" :style="{ width: leftNavWidth + 'px' }">
                <div class="panel-header">你的属性</div>
                <ul class="attr-list">
                    <li class="attr-item" v-for="attribute in myAttributesList">
                        <span class="attr-name">{{ attribute.name }}</span>
                        <span class="attr-value">{{ attribute.value }}</span>
                    </li>
                </ul>
            </section>

            <div class="resizer" @mousedown="startLeftResize"></div>

            <NodeList class="game-nodes" @node-click="openNodeDetails" />

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
                    <button class="send-btn" @click="sendGameMessage">发送给其它玩家</button>
                </div>
            </section>
        </main>

        <transition name="modal-fade">
            <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
                <div class="modal-content">
                    <NodeInteract v-if="activeNode" :node="activeNode" />
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
import NodeList from '../components/NodeList.vue';
import socketClient from '../services/socket';

const gameStore = useGameStore()
const level = computed(() => gameStore.gameLevelInfo);
const messages = computed(() => gameStore.contextMessages || [])

const accountStore = useAccountStore()

if (!accountStore.isLoginSuccess) {
    popupNotify({
        title: "抱歉，我不认识你",
        message: "这位朋友，可以先登陆再进入大厅吗？我不能允许没有身份的访客进入，这是我的职责，还请谅解。",
        duration: 3000,
    })
    router.push("/")
}

const myAccount = computed(() => accountStore.accountInfo)

const myCharacter = computed(() => {
    if (!level.value || !myAccount.value || !level.value.characters) return null
    return level.value.characters[myAccount.value.accountId] || null
})
const myAttributesList = computed(() => {
    if (!myCharacter.value) return []
    return Array.from(myCharacter.value.attributes.entries()).map(([name, value]) => ({ name, value }))
})


const sendGameMessage = () => {
    if (chatInput.value && chatInput.value.value.trim() !== "") {
        socketClient.emit("req_send_game_chat", { content: chatInput.value.value.trim() });
        chatInput.value.value = "";
    } else {
        popupNotify({
            title: "我好像没听清",
            message: "我似乎没听见你在输入栏输入的文本，好像你什么也没输入啊。",
            duration: 2000,
        })
    }
    autoResize();
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

import NodeInteract from '../components/NodeInteract.vue';
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

/* Modal Popup Styles */
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
.close-btn {
    background: #d32f2f;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 0;
    cursor: pointer;
    font-weight: bold;
    float: right;
    align-self: flex-end;
    margin-top: auto;
}
.modal-fade-enter-active, .modal-fade-leave-active {
    transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
    opacity: 0;
}
</style>