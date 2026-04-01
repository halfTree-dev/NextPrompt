<template>
    <div class="menu-window">
        <header class="menu-header">
            <h2 class="menu-title">菜单</h2>
            <div class="header-right">
                <button class="close-btn" @click="$emit('close')">关闭</button>
            </div>
        </header>

        <main class="menu-main">
            <section class="menu-sidebar">
                <ul class="menu-menu">
                    <li class="menu-sidebar-item" :class="{ active: sidebarSelected === '剧本' }" @click="sidebarSelected = '剧本'">剧本</li>
                    <li class="menu-sidebar-item" :class="{ active: sidebarSelected === '玩家' }" @click="sidebarSelected = '玩家'">玩家</li>
                    <li class="menu-sidebar-item" :class="{ active: sidebarSelected === '退出' }" @click="sidebarSelected = '退出'">退出</li>
                </ul>
            </section>

            <section class="menu-content">
                <div v-if="sidebarSelected === '剧本'">
                    <h3>剧本信息</h3>
                    <div class="menu-item">
                        <label class="menu-label">剧本名称</label>
                        <label class="menu-value">{{ gameStore.gameLevelInfo?.levelName }}</label>
                    </div>
                    <div class="menu-item">
                        <label class="menu-label">剧本 ID</label>
                        <label class="menu-value">{{ gameStore.gameLevelInfo?.levelID }}</label>
                    </div>
                    <div class="menu-item">
                        <label class="menu-label">当前段落数</label>
                        <label class="menu-value">{{ gameStore.gameLevelInfo?.currRound }}</label>
                    </div>
                    <div class="menu-item">
                        <label class="menu-label">当前参与剧本的玩家数目</label>
                        <label class="menu-value">{{ Object.keys(gameStore.gameLevelInfo?.characters || {}).length || 0 }}</label>
                    </div>
                    <div class="menu-item">
                        <label class="menu-label">对你可见的故事节点数目</label>
                        <label class="menu-value">{{ Object.keys(gameStore.gameLevelInfo?.nodes || {}).length || 0 }}</label>
                    </div>
                </div>
                <div v-else-if="sidebarSelected === '玩家'">
                    <h3>玩家信息</h3>
                    <div class="menu-item">
                        <label class="menu-label">当前参与剧本的玩家数目</label>
                        <label class="menu-value">{{ Object.keys(gameStore.onlineAccountsReadyForEndTurn || {}).length || 0 }}</label>
                    </div>
                    <li class="ready-account" v-for="accountId in Object.keys(gameStore.onlineAccountsReadyForEndTurn || {})" :key="accountId">
                        <span class="account-name">{{ gameStore.onlineAccountsReadyForEndTurn[accountId]?.userName || accountId }}({{ accountId.slice(0, 6) }})</span>
                        <span class="account-status">{{ gameStore.onlineAccountsReadyForEndTurn[accountId]?.readyForEndTurn ? "准备" : "操作中" }}</span>
                    </li>

                    <div class="menu-item">
                        <label class="menu-label">当前受到玩家扮演的 PC 数目</label>
                        <label class="menu-value">{{ Object.keys(gameStore.gameLevelInfo?.characters || {}).length || 0 }}</label>
                    </div>
                    <div class="menu-item" v-for="(character, charId) in gameStore.gameLevelInfo?.characters || {}" :key="charId">
                        <span class="character-name">{{ character.characterName }}</span>
                        <span class="character-player">{{ character?.accountRecord ? "由玩家 " + character.accountRecord.userName + " 扮演" : "NPC" }}</span>
                    </div>
                </div>
                <div v-else-if="sidebarSelected === '退出'">
                    <button class="exit-btn" @click="$emit('exit')">退出剧本</button>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game';


const gameStore = useGameStore();

const sidebarSelected = ref<'剧本' | '玩家' | '退出'>('剧本');

</script>

<style lang="css" scoped>
.menu-window {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-background, #1e1e1e);
    color: var(--color-text, #eee);
    background-image: var(--bg-image, none);
    background-size: cover;
    background-position: center;
}

.menu-header {
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

.menu-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--color-primary, #4caf50);
}

.header-right {
    display: flex;
    gap: 10px;
}

.close-btn {
    background: transparent;
    color: var(--color-text, #fff);
    border: 1px solid var(--color-border, #555);
    padding: 6px 16px;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: bold;
}

.close-btn:hover {
    background: var(--color-border, #555);
}

.menu-main {
    display: flex;
    flex: 1;
    overflow: hidden;
    backdrop-filter: blur(5px);
}

.menu-sidebar {
    width: 200px;
    background-color: rgba(30, 30, 30, 0.85);
    border-right: 1px solid var(--color-border, #3c3c3c);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.menu-menu {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    overflow-y: auto;
}

.menu-sidebar-item {
    padding: 15px 20px 15px 24px;
    border-bottom: 1px solid var(--color-border, #3c3c3c);
    color: var(--color-text, #ccc);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
}

.menu-sidebar-item:hover {
    background-color: rgba(76, 175, 80, 0.1);
    color: var(--color-primary, #4caf50);
}

.menu-sidebar-item.active {
    background-color: rgba(76, 175, 80, 0.15);
    color: var(--color-primary, #4caf50);
    border-left: 3px solid var(--color-primary, #4caf50);
    padding-left: 21px;
}

.menu-save-config {
    background: var(--color-primary, #4caf50);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 0;
    cursor: pointer;
    font-weight: bold;
    margin: 15px;
    margin-top: auto;
    transition: filter 0.2s;
}

.menu-save-config:hover {
    filter: brightness(1.1);
}

.menu-save-config:disabled {
    background: #888;
    color: #ccc;
    cursor: not-allowed;
    filter: grayscale(0.5) brightness(0.9);
    opacity: 0.7;
}

.menu-content {
    flex: 1;
    background-color: rgba(20, 20, 20, 0.8);
    padding: 30px;
    overflow-y: auto;
}

.menu-content h3 {
    color: var(--color-primary, #4caf50);
    font-size: 1.2rem;
    margin-top: 0;
    margin-bottom: 20px;
    font-weight: bold;
}

.menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid var(--color-border, #3c3c3c);
    gap: 20px;
}

.menu-item:last-child {
    border-bottom: none;
}

.menu-label {
    color: var(--color-text, #ccc);
    font-size: 0.95rem;
    flex: 1;
    font-weight: 500;
}

.menu-value {
    color: var(--color-primary, #4caf50);
    font-size: 0.95rem;
    font-weight: bold;
    flex: 1;
    text-align: right;
}

.menu-option {
    background-color: transparent;
    border: 1px solid var(--color-border, #555);
    color: var(--color-text, #fff);
    padding: 8px 12px;
    border-radius: 0;
    cursor: pointer;
    font-size: 0.95rem;
    min-width: 150px;
    transition: border-color 0.2s;
}

.menu-option:focus {
    outline: none;
    border-color: var(--color-primary, #4caf50);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}

.menu-option option {
    background-color: var(--color-panel, #2d2d2d);
    color: var(--color-text, #fff);
    padding: 8px;
}

.ready-account {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 0;
	border-bottom: 1px solid var(--color-divider, #5a5a5a);
	font-size: 0.98rem;
}

.exit-btn {
    display: block;
    width: 100%;
    background: var(--color-danger, #d32f2f);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 0;
    cursor: pointer;
    transition: filter 0.15s ease;
    font-weight: bold;
    text-align: center;
}

.exit-btn:hover {
    filter: brightness(0.95);
}
</style>