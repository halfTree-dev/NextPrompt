<template>
    <transition name="effect-layer" @after-leave="onLayerAfterLeave">
        <div v-if="layerVisible" class="effect-leadin-layer">
            <div
                class="effect-leadin-bar"
                :class="`is-${phase}`"
                :style="barStyle"
            ></div>

            <div class="effect-leadin-text" :class="{ 'is-visible': textVisible }">
                <label class="effect-leadin-title">{{ title }}</label>
                <label class="effect-leadin-subtitle">{{ subtitle }}</label>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
    title: string
    subtitle: string
    textDuration?: number
    transitionDuration?: number
    remove: () => void
}>()

const layerVisible = ref(false)
const textVisible = ref(false)
const phase = ref<'idle' | 'enter' | 'hold' | 'leave'>('idle')

const transitionMs = computed(() => Math.max(props.transitionDuration ?? 1000, 0))
const textMs = computed(() => Math.max(props.textDuration ?? 3000, 0))

const barStyle = computed(() => {
    const fromX = '-140vw'
    const toX = '140vw'
    return {
        '--effect-angle': `0deg`,
        '--effect-move-duration': `${transitionMs.value}ms`,
        '--effect-from-x': fromX,
        '--effect-to-x': toX,
    }
})

const timerIds: number[] = []

function registerTimer(callback: () => void, delay: number) {
    const id = window.setTimeout(callback, delay)
    timerIds.push(id)
}

function clearAllTimers() {
    timerIds.forEach((id) => window.clearTimeout(id))
    timerIds.length = 0
}

function onLayerAfterLeave() {
    props.remove()
}

onMounted(() => {
    layerVisible.value = true
    requestAnimationFrame(() => {
        phase.value = 'enter'
    })

    registerTimer(() => {
        phase.value = 'hold'
        textVisible.value = true
    }, transitionMs.value)

    registerTimer(() => {
        textVisible.value = false
        phase.value = 'leave'
    }, transitionMs.value + textMs.value)

    registerTimer(() => {
        layerVisible.value = false
    }, transitionMs.value * 2 + textMs.value)
})

onBeforeUnmount(() => {
    clearAllTimers()
})
</script>

<style scoped>
.effect-layer-enter-active,
.effect-layer-leave-active {
    transition: opacity 260ms ease;
}

.effect-layer-enter-from,
.effect-layer-leave-to {
    opacity: 0;
}

.effect-leadin-layer {
    position: fixed;
    inset: 0;
    z-index: 9999;
    overflow: hidden;
    backdrop-filter: blur(7px);
    background: rgba(0, 0, 0, 0.42);
}

.effect-leadin-bar {
    --slide-x: var(--effect-from-x);
    position: absolute;
    top: 50%;
    left: 50%;
    width: 160vw;
    height: 24vh;
    border-top: 2px solid rgba(255, 255, 255, 0.15);
    border-bottom: 2px solid rgba(255, 255, 255, 0.15);
    border-left: 1px solid rgba(255, 255, 255, 0.18);
    border-right: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(0, 0, 0, 0.25);
    transform: translate(calc(-50% + var(--slide-x)), -50%) skewX(var(--effect-angle));
    transition: transform var(--effect-move-duration) cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
}

.effect-leadin-bar.is-enter,
.effect-leadin-bar.is-hold {
    --slide-x: 0vw;
}

.effect-leadin-bar.is-leave {
    --slide-x: var(--effect-to-x);
}

.effect-leadin-text {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 380ms ease;
    pointer-events: none;
}

.effect-leadin-text.is-visible {
    opacity: 1;
}

.effect-leadin-title,
.effect-leadin-subtitle {
    color: #fff;
    text-align: center;
    text-shadow: 0 0 14px rgba(0, 0, 0, 0.65);
}

.effect-leadin-title {
    font-size: clamp(28px, 5vw, 54px);
    font-weight: 700;
    letter-spacing: 0.08em;
}

.effect-leadin-subtitle {
    font-size: clamp(15px, 2.2vw, 24px);
    font-weight: 400;
    letter-spacing: 0.14em;
}
</style>