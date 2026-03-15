<template>
    <div class="lobby-page">
        <!-- 标题占用屏幕最上方一小部分 -->
        <header class="lobby-header">
            <h2 class="lobby-title">故事大厅</h2>
            <div class="header-right">
                <button class="settings-btn">设置</button>
                <button class="refresh-btn">刷新</button>
            </div>
        </header>

        <main class="lobby-main">
            <!--接下来是房间列表显示，占用下方区域的左边部分-->
            <section class="lobby-room-list" :style="{ width: leftPanelWidth + 'px' }">
                <ul class="room-list">
                    <li class="room-item" v-for="value in levels" :key="value.levelID" @click="joinRoom(value.levelID)">
                        <div class="room-info">
                            <h4>{{ value.levelName }}</h4>
                            <p>{{ value.levelID }}</p>
                        </div>
                        <div class="room-status">
                            <span class="status-players">{{ value.onlineAccountNames.slice(0, 3).join(', ') }} {{ value.onlineAccountNames.length > 3 ? '...' : '' }} 正在参与 </span>
                            <span class="status-state">段落 {{ value.currRound }}</span>
                        </div>
                    </li>
                </ul>
            </section>

            <div class="resizer" @mousedown="startResize"></div>

            <!--最后是聊天窗口，占用下方区域的右边部分-->
            <section class="lobby-chat">
                <div class="panel-header">大厅交流区</div>
                <ul class="chat-messages">
                    <li class="chat-msg" v-for="message in messages">
                        <div class="msg-header">
                            <span class="sender">{{ message.sender }}</span>
                            <span class="time">{{ new Date(message.timestamp).toLocaleTimeString() }}</span>
                        </div>
                        <div class="msg-content">{{ message.content }}</div>
                    </li>
                </ul>
                <div class="chat-input-area">
                    <textarea
                        placeholder="在此输入消息"
                        rows="1"
                        @input="autoResize"
                        ref="chatInput"
                    ></textarea>
                    <button class="send-btn" @click="sendChatMessage">发送到大厅</button>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'

import { useLobbyStore } from '../stores/lobby'
import { useAccountStore } from '../stores/account'

import { router } from '../router'
import { popupNotify } from '../services/popup'

import { socketClient } from '../services/socket'
import { useGameStore } from '../stores/game'

const lobbyStore = useLobbyStore()
const levels = computed(() => lobbyStore.lobbyInfo?.levels || [])
const messages = computed(() => lobbyStore.chatMessages || [])

const gameStore = useGameStore();

const accountStore = useAccountStore()
if (!accountStore.isLoginSuccess) {
    popupNotify({
        title: "抱歉，我不认识你",
        message: "这位朋友，可以先登陆再进入大厅吗？我不能允许没有身份的访客进入，这是我的职责，还请谅解。",
        duration: 3000,
    })
    router.push("/")
} else {
    socketClient.emit('req_room_list', {})
    socketClient.emit('req_chat_history', {})
}

const sendChatMessage = () => {
    if (!chatInput.value) return;
    const content = chatInput.value.value.trim();
    if (content.length === 0) return;

    socketClient.emit('req_send_lobby_chat', { content });

    chatInput.value.value = '';
    autoResize();
}

const joinRoom = (levelID: string) => {
    socketClient.emit('req_join_room', { levelID })
    popupNotify({
        title: "正在加入游戏",
        message: `我们正在联络 ${levelID} 房间的路由，只要她确认了你的身份，就能让你加入游戏房间了！`,
        duration: 5000,
    })
}

// 如果是通过前退退出游戏界面，发送 req_leave_room
if (gameStore.gameLevelInfo) {
    const levelID = gameStore.gameLevelInfo.levelID;
    socketClient.emit('req_leave_room', { levelID: levelID })
    gameStore.gameLevelInfo = null;
    gameStore.contextMessages = [];
}


// 下方部分负责拖动调整左右面板宽度的逻辑
const screenWidth = window.innerWidth
const leftPanelWidth = ref(screenWidth / 2)
let isResizing = false

const chatInput = ref<HTMLTextAreaElement | null>(null)
const autoResize = () => {
    if (chatInput.value) {
        chatInput.value.style.height = 'auto'
        chatInput.value.style.height = Math.min(chatInput.value.scrollHeight, 150) + 'px'
    }
}

const startResize = () => {
    isResizing = true
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
}
const resize = (e: MouseEvent) => {
    if (isResizing) {
        const newWidth = Math.max(250, Math.min(e.clientX, window.innerWidth - 300))
        leftPanelWidth.value = newWidth
    }
}
const stopResize = () => {
    if (isResizing) {
        isResizing = false
        document.removeEventListener('mousemove', resize)
        document.removeEventListener('mouseup', stopResize)
        document.body.style.cursor = 'default'
    }
}

onUnmounted(() => {
    stopResize()
})
</script>

<style lang="css" scoped>
.lobby-page {
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

.lobby-header {
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

.lobby-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-primary, #4caf50);
}

.settings-btn, .refresh-btn {
    background: transparent;
    color: var(--color-text, #fff);
    border: 1px solid var(--color-border, #555);
    padding: 6px 16px;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.2s;
}

.settings-btn:hover, .refresh-btn:hover {
    background: var(--color-border, #555);
}

.lobby-main {
    display: flex;
    flex: 1;
    overflow: hidden;
    backdrop-filter: blur(5px);
}

.lobby-room-list {
    background-color: rgba(30, 30, 30, 0.8);
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.room-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.room-item {
    background: var(--color-panel, rgba(45, 45, 45, 0.8));
    border: 1px solid var(--color-border, #3c3c3c);
    padding: 15px;
    border-radius: 0;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s;
}

.room-item:hover {
    background: var(--color-divider, #4a4a4a);
    transform: translateY(-2px);
}

.room-info h4 { margin: 0 0 8px 0; font-size: 1.1rem; color: var(--color-primary, #4caf50); }
.room-info p { margin: 0; opacity: 0.8; font-size: 0.9rem; }

.room-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    font-size: 0.85rem;
}

.status-players { font-weight: bold; }
.status-state { color: #a1a1a1; }

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

.lobby-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--color-panel, rgba(37, 37, 38, 0.9));
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
.time { opacity: 0.5; }

.msg-content {
    overflow-wrap: break-word;
    white-space: pre-wrap;
    margin-top: 5px;
    color: var(--color-text, #fff);
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
    transition: filter 0.2s;
}

.send-btn:hover {
    filter: brightness(1.1);
}
</style>