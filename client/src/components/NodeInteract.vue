<template>
	<div class="node-interact">
		<div class="node-header">
			<span class="node-title">{{ node.displayText }}</span>
			<span class="node-category">{{ node.category || '未分类' }}</span>
		</div>

        <div class="node-desc">{{ node.description }}</div>

        <div class="node-tags" v-if="node.tags && node.tags.length">
			<span class="tag-label">标签：</span>
			<span class="node-tag" v-for="tag in node.tags" :key="tag.name">{{ tag.name }}</span>
		</div>

        <div class="node-input-slots">
            <li v-for="(inputSlot) in nodeInputSlots">
                <h4> {{ inputSlot.inputHint }} </h4>
                <button class="btn-secondary">选择</button>
            </li>
        </div>

        <div class="node-input-string-bars">
            <h4> 互动细节 </h4>
        </div>

        <div class="node-actions">
            <button class="btn-primary" v-if="node.interactable">以当前设置执行交互</button>
        </div>
	</div>
</template>

<script setup lang="ts">
import type { GameNodeInfo } from '../stores/game';

const props = defineProps<{ node: GameNodeInfo }>();
const node = props.node;

// TODO: 完善本部分玩家自定义输入

const nodeInputSlots = node.inputSlots || {};
</script>

<style lang="css" scoped>
.node-interact {
	padding: 24px 18px;
	background: var(--color-panel, #232323);
	border-radius: 6px;
	color: var(--color-text, #fff);
    display: flex;
    flex-direction: column;
}

.node-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
}

.node-title {
	font-size: 1.15rem;
	font-weight: bold;
	color: var(--color-primary, #4caf50);
}

.node-category {
	font-size: 0.92rem;
	color: var(--color-text, #aaa);
	background: var(--color-background,rgba(80,80,80,0.18));
	padding: 2px 8px;
	border-radius: 4px;
}

.node-desc {
	margin-bottom: 12px;
	font-size: 0.98rem;
	color: var(--color-text, #e0e0e0);
}

.node-tags {
	margin-top: 6px;
	font-size: 0.92rem;
	color: var(--color-text, #bbb);
}

.tag-label {
	margin-right: 6px;
	color: var(--color-text, #888);
}

.node-tag {
	display: inline-block;
	background: var(--color-background, #2e2e2e);
	color: var(--color-primary, #ffd36f);
	border-radius: 3px;
	padding: 2px 8px;
	margin-right: 6px;
	font-size: 0.92rem;
}
</style>