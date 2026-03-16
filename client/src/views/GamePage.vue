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

            <!-- 游戏节点显示区域，占用下方中间部分 -->
            <section class="game-nodes">
                <!-- 切换不同节点显示，根据分类字段 -->
                <div class="game-nodes-select-bars">
                    <li class="tab-btn" v-for="(nodes, category) in myNodesListCategories" :key="category" :class="{ active: selectedCategory === category }" @click="selectedCategory = category">
                        {{ category }} ({{ nodes.length }}) </li>
                </div>

                <!-- 节点显示，被分配在一个列表中 -->
                <div class="game-nodes-content">
                    <ul class="node-list">
                        <!-- 节点被点击时一定会触发一个互动窗口，显示进一步的详细信息 -->
                        <li class="node-item" v-for="node in myNodesList.filter(node => selectedCategory === CATEGORY_ALL || node.category === selectedCategory)" :key="node.nodeID" @click="openNodeDetails(node.nodeID)">
                            <div class="node-card-header">
                                <h4 class="node-title" :class="{ interactable: node.interactable === true }">{{ node.displayText }}</h4>
                                <div
                                    class="node-status-top"
                                    v-if="typeof node.lifeTimeRounds === 'number' || typeof node.coolDownRounds === 'number'"
                                >
                                    <span class="node-state life" v-if="typeof node.lifeTimeRounds === 'number'">
                                        佚亡于 {{ node.lifeTimeRounds }} 回合
                                    </span>
                                    <span class="node-state cooldown" v-if="typeof node.coolDownRounds === 'number'">
                                        冷却 {{ node.coolDownRounds }} 回合
                                    </span>
                                </div>
                            </div>
                            <p class="node-description">{{ node.description }}</p>
                            <div class="node-count-badge" v-if="node.inStackable === false && typeof node.count === 'number'">
                                {{ node.count }}
                            </div>
                        </li>
                    </ul>
                </div>
            </section>

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

        <!-- 这里是示例弹窗 -->
        <transition name="modal-fade">
            <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
                <div class="modal-content">
                    <h3>Node Details {{ activeNodeId }}</h3>
                    <p>请输入文本</p>
                    <button class="close-btn" @click="closeModal">Close</button>
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

const myNodesList = computed(() => gameStore.gameLevelInfo && gameStore.gameLevelInfo.nodes ? Object.values(gameStore.gameLevelInfo.nodes) : [])

const CATEGORY_ALL = "全部";
const myNodesListCategories = computed(() => {
    const categories: Record<string, GameNodeInfo[]> = {};
    categories[CATEGORY_ALL] = [];
    myNodesList.value.forEach(node => {
        const category = node.category;
        if (!category) { return; }
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(node);
        if (categories[CATEGORY_ALL]) {
            categories[CATEGORY_ALL].push(node);
        }
    });
    return categories;
})
const selectedCategory = ref<string>(CATEGORY_ALL)


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

const showModal = ref(false);
const activeNodeId = ref<string>("");

const openNodeDetails = (id: string) => {
    activeNodeId.value = id
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
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

.game-nodes-select-bars {
    display: flex;
    background-color: var(--color-panel, rgba(45, 45, 45, 0.9));
    border-bottom: 1px solid var(--color-border, #3c3c3c);
}

.tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text, #ccc);
    padding: 12px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font-weight: bold;
    transition: all 0.2s;
}
.tab-btn:hover {
    background: rgba(255, 255, 255, 0.05);
}
.tab-btn.active {
    color: var(--color-primary, #4caf50);
    border-bottom: 2px solid var(--color-primary, #4caf50);
}

.game-nodes-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.node-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.node-item {
    background: var(--color-panel, rgba(45, 45, 45, 0.8));
    border: 1px solid var(--color-border, #3c3c3c);
    border-radius: 0;
    padding: 14px 16px 36px;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s;
    position: relative;
}
.node-item:hover {
    transform: translateY(-2px);
    background: rgba(60, 60, 60, 0.9);
}

.node-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
}

.node-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text, #eee);
    line-height: 1.25;
}

.node-title.interactable {
    background: linear-gradient(90deg, var(--color-emphasis, #f39c12) 0%, var(--color-emphasis2, #f38612) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.node-status-top {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
}

.node-state {
    display: inline-block;
    padding: 2px 8px;
    font-size: 0.72rem;
    line-height: 1.3;
    border: 1px solid transparent;
    white-space: nowrap;
}

.node-state.life {
    color: var(--color-text, #111);
    border-color: var(--color-emphasis, #f39c12);
    background: rgba(var(--color-emphasis, #f39c12), 0.12);
}

.node-state.cooldown {
    color: var(--color-text, #111);
    border-color: var(--color-emphasis2, #f38612);
    background: rgba(var(--color-emphasis2, #f38612), 0.12);
}

.node-description {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.86;
    line-height: 1.4;
    padding-right: 70px;
}

.node-count-badge {
    position: absolute;
    right: 12px;
    bottom: 10px;
    min-width: 42px;
    text-align: center;
    padding: 3px 8px;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--color-text, #111);
    background: var(--color-background, #eee);
    border: 1px solid var(--color-border, #eee);
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
    min-width: 400px;
    max-width: 80%;
    color: var(--color-text, #fff);
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
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
    margin-top: 10px;
}
.modal-fade-enter-active, .modal-fade-leave-active {
    transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
    opacity: 0;
}
</style>