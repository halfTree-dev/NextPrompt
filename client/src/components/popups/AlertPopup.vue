<template>
    <transition name="alert-fade" @after-leave="remove">
        <!-- zIndex 是弹窗的层级，越大的值越在上层，关闭时先关闭上层弹窗 -->
        <div class="alert-overlay" v-show="visible" @click.self="close" :style="{ zIndex }">
            <div class="alert-box">
                <h2 class="alert-title">{{ title }}</h2>
                <p class="alert-message">{{ message }}</p>
                <div class="alert-actions">
                    <button class="btn-primary" @click="close">确定</button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGameStore } from '../../stores/game';

const props = defineProps<{
    title: string
    message: string
    zIndex: number
    remove: () => void
}>()

const visible = ref(false)

onMounted(() => {
    visible.value = true
})

const close = () => {
    sendAlertToContextMessage();
    visible.value = false
}

const sendAlertToContextMessage = () => {
    const gameStore = useGameStore();
    gameStore.contextMessages.push({
        sender: props.title,
        content: props.message,
        timestamp: Date.now(),
        sendType: 'system'
    })
}
</script>

<style scoped>
.alert-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.alert-box {
    background-color: var(--color-background, #1e1e1e);
    color: var(--color-text, #fff);
    border: 1px solid var(--color-border, #555);
    padding: 30px;
    border-radius: 0;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    width: 55vw;
    height: 50vh;
    display: flex;
    flex-direction: column;
}

.alert-title {
    margin: 0 0 15px 0;
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--color-primary, #4caf50);
    text-align: left;
}

.alert-message {
    margin: 0 0 30px 0;
    font-size: 1.1rem;
    line-height: 1.6;
    text-align: left;
    opacity: 0.9;
    flex: 1;
    overflow-y: auto;
    white-space: pre-wrap;
}

.alert-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: auto;
}

.btn-primary {
    background: var(--color-primary, #4caf50);
    color: white;
    border: none;
    padding: 10px 25px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: bold;
    transition: filter 0.2s;
}

.btn-primary:hover {
    filter: brightness(1.2);
}

.alert-fade-enter-active,
.alert-fade-leave-active {
    transition: opacity 0.3s ease;
}

.alert-fade-enter-active .alert-box,
.alert-fade-leave-active .alert-box {
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.alert-fade-enter-from,
.alert-fade-leave-to {
    opacity: 0;
}

.alert-fade-enter-from .alert-box,
.alert-fade-leave-to .alert-box {
    transform: translateY(-60px) scale(0.95);
}
</style>