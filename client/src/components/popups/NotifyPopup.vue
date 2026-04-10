<template>
    <transition name="notify-slide" @after-leave="remove">
        <div class="notify-popup" v-show="visible">
            <h3 class="notify-title">{{ title }}</h3>
            <p class="notify-message">{{ message }}</p>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
    title: string
    message: string
    duration?: number
    remove: () => void
}>()

const visible = ref(false)

onMounted(() => {
    visible.value = true
    if (props.duration !== 0) {
        setTimeout(() => {
            visible.value = false
        }, props.duration || 3000)
    }
})
</script>

<style scoped>
.notify-popup {
    background-color: var(--color-background, #1e1e1e);
    color: var(--color-text, #fff);
    border: 1px solid var(--color-border, #555);
    padding: 15px 20px;
    border-radius: 0px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    width: 30vw;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
}

.notify-title {
    margin: 0 0 8px 0;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-primary, #4caf50);
    text-align: left;
}

.notify-message {
    margin: 0;
    font-size: 1rem;
    line-height: 1.4;
    opacity: 0.9;
    text-align: left;
    white-space: pre-wrap;
}

.notify-slide-enter-active,
.notify-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.notify-slide-enter-from,
.notify-slide-leave-to {
    opacity: 0;
    transform: translateY(30px);
}
</style>