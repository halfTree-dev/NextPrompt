<template>
    <div class="setting-window">
        <header class="setting-header">
            <h2 class="setting-title">设置</h2>
            <div class="header-right">
                <button class="close-btn" @click="$emit('close')">关闭</button>
            </div>
        </header>

        <main class="setting-main">
            <section class="setting-sidebar">
                <ul class="setting-menu">
                    <li class="menu-item" :class="{ active: sidebarSelected === '账户' }" @click="sidebarSelected = '账户'">账户</li>
                    <li class="menu-item" :class="{ active: sidebarSelected === '主题' }" @click="sidebarSelected = '主题'">主题</li>
                    <li class="menu-item" :class="{ active: sidebarSelected === '关于' }" @click="sidebarSelected = '关于'">关于</li>
                </ul>
                <button class="menu-save-config" @click="saveSettingConfig">保存配置</button>
            </section>

            <section class="setting-content">
                <div v-if="sidebarSelected === '账户'">
                    <h3>账户信息</h3>
                    <div class="setting-item">
                        <label class="setting-label">玩家账户 ID</label>
                        <label class="setting-value">{{ accountStore.accountInfo?.accountId }}</label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">玩家笔名</label>
                        <label class="setting-value">{{ accountStore.accountInfo?.userName }}</label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">玩家账户创建时间</label>
                        <label class="setting-value">{{ accountStore.accountInfo?.createdAt.toLocaleString() }}</label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">游戏中阅读过的文本词汇数量</label>
                        <label class="setting-value">{{ accountStore.accountInfo?.spawnedWordsCnt }}</label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">游戏中参与消耗的 Token 数量</label>
                        <label class="setting-value">{{ accountStore.accountInfo?.usedTokens }}</label>
                    </div>
                </div>
                <div v-else-if="sidebarSelected === '主题'">
                    <h3>主题设置</h3>
                    <div class="setting-item">
                        <label class="setting-label">选择主题</label>
                        <select class="setting-option" v-model="localSettingConfig.theme">
                            <option value="light">浅色</option>
                            <option value="dark">深色</option>
                        </select>
                    </div>
                </div>
                <div v-else-if="sidebarSelected === '关于'">
                    <h3>关于</h3>
                    <div class="setting-item">
                        <p>Next Prompt | half_tree | 2026</p>
                        <p>原型测试阶段</p>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAccountStore } from '../../stores/account';
import { useStyleStore } from '../../stores/style'

const accountStore = useAccountStore();
const styleStore = useStyleStore();

const sidebarSelected = ref<'账户' | '主题' | '关于'>('账户');

let localSettingConfig = {
    theme: 'light',
}
try {
    localSettingConfig = JSON.parse(localStorage.getItem('settingConfig') || JSON.stringify(localSettingConfig))
} catch (e) {
    console.error('读取设置配置失败，使用默认配置', e)
}

const applySettingConfig = () => {
    // 主题
    styleStore.setTheme(localSettingConfig.theme);
}
const saveSettingConfig = () => {
    localStorage.setItem('settingConfig', JSON.stringify(localSettingConfig))
    applySettingConfig()
}
</script>

<style lang="css" scoped>
.setting-window {
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

.setting-header {
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

.setting-title {
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

.setting-main {
    display: flex;
    flex: 1;
    overflow: hidden;
    backdrop-filter: blur(5px);
}

.setting-sidebar {
    width: 200px;
    background-color: rgba(30, 30, 30, 0.85);
    border-right: 1px solid var(--color-border, #3c3c3c);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.setting-menu {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    overflow-y: auto;
}

.menu-item {
    padding: 15px 20px;
    border-bottom: 1px solid var(--color-border, #3c3c3c);
    color: var(--color-text, #ccc);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
}

.menu-item:hover {
    background-color: rgba(76, 175, 80, 0.1);
    color: var(--color-primary, #4caf50);
}

.menu-item.active {
    background-color: rgba(76, 175, 80, 0.15);
    color: var(--color-primary, #4caf50);
    border-left: 3px solid var(--color-primary, #4caf50);
    padding-left: 17px;
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

.setting-content {
    flex: 1;
    background-color: rgba(20, 20, 20, 0.8);
    padding: 30px;
    overflow-y: auto;
}

.setting-content h3 {
    color: var(--color-primary, #4caf50);
    font-size: 1.2rem;
    margin-top: 0;
    margin-bottom: 20px;
    font-weight: bold;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid var(--color-border, #3c3c3c);
    gap: 20px;
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-label {
    color: var(--color-text, #ccc);
    font-size: 0.95rem;
    flex: 1;
    font-weight: 500;
}

.setting-value {
    color: var(--color-primary, #4caf50);
    font-size: 0.95rem;
    font-weight: bold;
    flex: 1;
    text-align: right;
}

.setting-option {
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

.setting-option:focus {
    outline: none;
    border-color: var(--color-primary, #4caf50);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}

.setting-option option {
    background-color: var(--color-panel, #2d2d2d);
    color: var(--color-text, #fff);
    padding: 8px;
}

/* 滚动条美化 */
.setting-menu::-webkit-scrollbar,
.setting-content::-webkit-scrollbar {
    width: 8px;
}

.setting-menu::-webkit-scrollbar-track,
.setting-content::-webkit-scrollbar-track {
    background: transparent;
}

.setting-menu::-webkit-scrollbar-thumb,
.setting-content::-webkit-scrollbar-thumb {
    background: var(--color-border, #555);
    border-radius: 4px;
}

.setting-menu::-webkit-scrollbar-thumb:hover,
.setting-content::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary, #4caf50);
}
</style>