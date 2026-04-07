<template>
    <transition name="guide-slide">
        <div class="guide-window">
            <h3 class="guide-title"> {{ guideTitle }} </h3>
            <p class="guide-message"> {{ guideMessage }} </p>
            <span class="guide-selections">
                <button class="guide-selection" @click="selectPreviousGuide">⬅ 上一条</button>
                <label class="guide-hint"> {{ guideStore.currentGuideIndex + 1 }} / {{ guideStore.guideInfos.length }} </label>
                <button class="guide-selection" @click="selectNextGuide">下一条 ➡</button>
                <button class="guide-selection" @click="selectNextGuideAndHide">下一条并不再显示 ➡</button>
            </span>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGuideStore } from '../stores/guide';
import guideManager from '../services/guide';

const guideStore = useGuideStore();

const guideTitle = computed(() => guideStore.guideInfos[guideStore.currentGuideIndex]?.title || '');
const guideMessage = computed(() => guideStore.guideInfos[guideStore.currentGuideIndex]?.content || '');

const selectPreviousGuide = () => {
    if (guideStore.currentGuideIndex > 0) {
        guideStore.currentGuideIndex--;
    }
};

const selectNextGuide = () => {
    if (guideStore.currentGuideIndex < guideStore.guideInfos.length - 1) {
        guideStore.currentGuideIndex++;
    }
};

const selectNextGuideAndHide = () => {
    guideStore.guideInfos.splice(guideStore.currentGuideIndex, 1);
    guideStore.currentGuideIndex = Math.max(0, Math.min(guideStore.currentGuideIndex, guideStore.guideInfos.length - 1));
    guideManager.updateGuideInfos();
};

</script>

<style lang="css" scoped>
.guide-window {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100vw;
    height: 16vh;
    min-height: 150px;
    max-height: 260px;
    z-index: 998;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
    padding: 14px 18px;
    color: var(--color-text, #eee);
    background: linear-gradient(180deg, rgba(24, 24, 24, 0.92) 0%, rgba(20, 20, 20, 0.96) 100%);
    border-top: 1px solid var(--color-border, #3c3c3c);
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
}

.guide-title {
    margin: 0;
    font-size: 1.08rem;
    font-weight: 700;
    color: var(--color-primary, #4caf50);
}

.guide-message {
    margin: 0;
    flex: 1;
    overflow-y: auto;
    line-height: 1.5;
    color: var(--color-text, #e8e8e8);
    white-space: pre-wrap;
    word-break: break-word;
}

.guide-selections {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
}

.guide-selection {
    background: transparent;
    color: var(--color-text, #fff);
    border: 1px solid var(--color-border, #555);
    padding: 6px 12px;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;
}

.guide-selection:hover {
    background: var(--color-border, #555);
    border-color: var(--color-primary, #4caf50);
}

.guide-hint {
    color: #9a9a9a;
    min-width: 56px;
    text-align: center;
}

.guide-slide-enter-active,
.guide-slide-leave-active {
    transition: transform 0.28s ease, opacity 0.28s ease;
}

.guide-slide-enter-from,
.guide-slide-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

/* GuideWindow 存在时，压缩主游戏区域，避免底部 20% 遮挡操作区 */
:global(body:has(#guide-container) .game-page) {
    height: 84vh;
}

@media (max-width: 768px) {
    .guide-window {
        height: 24vh;
        min-height: 170px;
        padding: 12px;
        gap: 8px;
    }

    .guide-title {
        font-size: 1rem;
    }

    .guide-message {
        font-size: 0.94rem;
    }

    .guide-selection {
        padding: 5px 10px;
        font-size: 0.88rem;
    }
}
</style>