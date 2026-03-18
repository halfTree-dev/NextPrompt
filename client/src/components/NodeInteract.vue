<template>
	<div class="node-interact">
		<!-- 基本信息框 -->
		<div class="node-section">
			<div class="section-label">基本信息</div>
			<div class="node-header">
				<span class="node-title">{{ node.displayText }}</span>
				<span class="node-category">{{ node.category || '未分类' }}</span>
			</div>
			<div class="node-desc">{{ node.description }}</div>
		</div>

		<!-- 标签框 -->
		<div class="node-section" v-if="node.tags && node.tags.length">
			<div class="section-label">标签</div>
			<div class="node-tags">
				<span class="node-tag" v-for="tag in node.tags" :key="tag.name">{{ tag.name }}</span>
			</div>
		</div>

		<!-- 联动对象框 -->
		<div class="node-section" v-if="nodeInputSlots && Object.keys(nodeInputSlots).length">
			<div class="section-label">联动对象</div>
			<ul class="node-list">
				<li class="node-list-item" v-for="inputSlot in nodeInputSlots" :key="inputSlot.slotID">
					<span class="item-title">{{ inputSlot.inputHint }}</span>
					<span class="target-title">{{ gameStore.gameLevelInfo?.nodes[inputSlot.inputID]?.displayText || "未选择" }}</span>
					<button class="btn-secondary" @click="() => { processInputSlotID = inputSlot.slotID; showNodeSelectList = true; }">选择</button>
					<button class="btn-secondary" @click="() => { processInputSlotID = inputSlot.slotID; clearNodeSelect(); }">解除</button>
				</li>
			</ul>
		</div>

		<!-- 互动描述框 -->
		<div class="node-section" v-if="nodeInputStringBars && Object.keys(nodeInputStringBars).length">
			<div class="section-label">互动描述</div>
			<ul class="node-list">
				<li class="node-list-item" v-for="inputBar in nodeInputStringBars" :key="inputBar.barID">
					<span class="item-title">{{ inputBar.inputHint }}</span>
					<input type="text" v-model="inputBar.content" class="input-string-bar" placeholder="输入内容..." readonly />
					<button class="btn-secondary" @click="() => { currentEditingStringBarID = inputBar.barID; currentEditingStringBarContent = inputBar.content; showInputStringBarEdit = true; }">编辑</button>
				</li>
			</ul>
		</div>

		<div class="node-actions">
			<button class="btn-primary" v-if="node.interactable" @click="sendReqInteract">以当前设置执行交互</button>
		</div>

		<transition name="modal-fade">
			<div class="modal-overlay" v-if="showNodeSelectList" @click.self="closeNodeSelectList">
				<div class="modal-content">
					<h4> 选择互动对象 </h4>
					<NodeList class="game-nodes" @node-click="handleNodeSelect" />
				</div>
			</div>
		</transition>

		<transition name="modal-fade">
			<div class="modal-overlay" v-if="showInputStringBarEdit" @click.self="closeInputStringBarEdit">
				<div class="modal-content">
					<h4> 编辑输入条 </h4>
					<div class="edit-bar-row">
						<textarea v-model="currentEditingStringBarContent" placeholder="输入新的内容" class="input-string-bar-edit" rows="4"></textarea>
						<button class="btn-primary" @click="handleEditInputStringBar(currentEditingStringBarContent)">保存</button>
					</div>
				</div>
			</div>
		</transition>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore, type GameNodeInfo } from '../stores/game';
import NodeList from './NodeList.vue';
import socketClient from '../services/socket';

const gameStore = useGameStore();

const props = defineProps<{ node: GameNodeInfo }>();
const node = props.node;

const nodeInStore = computed(() => {
	if (!gameStore.gameLevelInfo || !gameStore.gameLevelInfo.nodes) { return null; }
	return gameStore.gameLevelInfo.nodes[node.nodeID] || null;
});
const nodeInputSlots = computed(() => nodeInStore.value ? nodeInStore.value.inputSlots || {} : {});
const nodeInputStringBars = computed(() => nodeInStore.value ? nodeInStore.value.inputStringBars || {} : {});

const showNodeSelectList = ref(false);
const processInputSlotID = ref<string>("");
const handleNodeSelect = (selectedNode: GameNodeInfo) => {
	if (nodeInStore.value && nodeInStore.value.inputSlots) {
		const targetSlot = nodeInStore.value.inputSlots[processInputSlotID.value];
		if (targetSlot) {
			targetSlot.inputID = selectedNode.nodeID;
		}
		sendReqUpdateInput();
	}
	showNodeSelectList.value = false;
};
const clearNodeSelect = () => {
	if (nodeInStore.value && nodeInStore.value.inputSlots) {
		const targetSlot = nodeInStore.value.inputSlots[processInputSlotID.value];
		if (targetSlot) {
			targetSlot.inputID = "";
		}
		sendReqUpdateInput();
	}
	showNodeSelectList.value = false;
	processInputSlotID.value = "";
};
const closeNodeSelectList = () => {
	showNodeSelectList.value = false;
	processInputSlotID.value = "";
};


const showInputStringBarEdit = ref(false);
const currentEditingStringBarID = ref<string>("");
const currentEditingStringBarContent = ref<string>("");
const handleEditInputStringBar = (inputContent: string) => {
	if (nodeInStore.value && nodeInStore.value.inputStringBars) {
		const targetBar = nodeInStore.value.inputStringBars[currentEditingStringBarID.value];
		if (targetBar) {
			targetBar.inputContent = inputContent;
		}
		sendReqUpdateInput();
	}
	showInputStringBarEdit.value = false;
	currentEditingStringBarID.value = "";
};
const closeInputStringBarEdit = () => {
	showInputStringBarEdit.value = false;
	currentEditingStringBarID.value = "";
};


const sendReqUpdateInput = () => {
	const payload = {
		nodeID: node.nodeID,
		inputSlots: nodeInputSlots.value,
		inputStringBars: nodeInputStringBars.value,
	}
	socketClient.emit("req_update_input", payload);
}

const sendReqInteract = () => {
	const payload = {
		nodeID: node.nodeID
	}
	socketClient.emit("req_send_interact", payload);
	showInputStringBarEdit.value = false;
	showNodeSelectList.value = false;
	processInputSlotID.value = "";
	currentEditingStringBarID.value = "";
	currentEditingStringBarContent.value = "";
}

</script>

<style lang="css" scoped>
.node-interact {
	padding: 24px 18px;
	background: var(--color-panel, #232323);
	color: var(--color-text, #fff);
	display: flex;
	flex-direction: column;
	height: 100%;
}

/* 分组通用样式 */
.node-section {
	position: relative;
	border: 1px solid var(--color-border, #3c3c3c);
	background: var(--color-background, #232323);
	margin-bottom: 18px;
	padding: 18px 16px 12px 16px;
	box-sizing: border-box;
}
.section-label {
	position: absolute;
	top: 0;
	right: 0;
	font-size: 0.92rem;
	color: var(--color-text, #bbb);
	background: rgba(80,80,80,0.18);
	padding: 2px 12px;
	opacity: 0.7;
	pointer-events: none;
	user-select: none;
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
}
.node-desc {
	font-size: 0.98rem;
	color: var(--color-text, #e0e0e0);
}

.node-tags {
	font-size: 0.92rem;
	color: var(--color-text, #bbb);
	margin-top: 0;
}
.node-tag {
	display: inline-block;
	background: var(--color-background, #2e2e2e);
	color: var(--color-primary, #ffd36f);
	padding: 2px 8px;
	margin-right: 6px;
	font-size: 0.92rem;
}

/* 列表通用样式 */
.node-list {
	list-style: none;
	padding: 0;
	margin: 0;
}
.node-list-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 0;
	border-bottom: 1px solid var(--color-divider, #5a5a5a);
	font-size: 0.98rem;
}
.node-list-item:last-child {
	border-bottom: none;
}
.item-title {
	color: var(--color-text, #fff);
	flex: 1;
	text-align: left;
}

/* 输入条样式 */
.input-string-bar {
	background: transparent;
	border: none;
	border-bottom: 2px solid var(--color-border, #555);
	color: var(--color-text, #fff);
	border-radius: 0;
	padding: 4px 6px;
	font-size: 1rem;
	outline: none;
	min-width: 120px;
	max-width: 220px;
	margin: 0 10px;
	font-family: inherit;
	line-height: 1.5;
	pointer-events: none;
}
.input-string-bar-edit {
	background: transparent;
	border: none;
	border-bottom: 2px solid var(--color-border, #555);
	color: var(--color-text, #fff);
	border-radius: 0;
	padding: 8px 6px;
	font-size: 1rem;
	outline: none;
	width: 100%;
	margin-bottom: 18px;
	font-family: inherit;
	line-height: 1.5;
}
.input-string-bar-edit:focus {
	border-bottom-color: var(--color-primary, #4caf50);
}

.node-actions {
	display: flex;
	justify-content: center;
	align-items: center;
    margin-top: auto;
    margin-bottom: 0;
    padding-top: 24px;
}
.btn-primary {
	background: var(--color-primary, #4caf50);
	color: white;
	font-weight: bold;
	border: none;
	padding: 0 8px;
	border-radius: 0px;
	cursor: pointer;
	height: 36px;
	min-width: 30vw;
	flex: auto;
	flex-direction: column;
}

.btn-secondary {
	background: transparent;
	color: var(--color-text, #fff);
	border: 1px solid var(--color-border, #555);
	padding: 6px 16px;
	border-radius: 0;
	cursor: pointer;
	transition: all 0.2s;
	min-width: 60px;
	margin-left: 10px;
}
.btn-secondary:hover {
	background: var(--color-border, #555);
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
	width: 55vw;
	height: 55vh;
	color: var(--color-text, #fff);
	box-shadow: 0 10px 40px rgba(0,0,0,0.5);
	display: flex;
	flex-direction: column;
}
.modal-content code {
	display: flex;
	flex-direction: column;
}
.edit-bar-row {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	gap: 18px;
	flex: 1;
}
.input-string-bar-edit {
	background: transparent;
	border: none;
	border-bottom: 2px solid var(--color-border, #555);
	color: var(--color-text, #fff);
	border-radius: 0;
	padding: 8px 6px;
	font-size: 1rem;
	outline: none;
    height: 100%;
    width: 100%;
	margin-bottom: 0;
    resize: vertical;
	font-family: inherit;
	line-height: 1.5;
	resize: vertical;
	flex: 1 1 0;
}
.edit-bar-row .btn-primary {
	height: 36px;
	min-width: 80px;
	flex: none;
	align-self: flex-start;
	margin-bottom: 0;
}

.modal-fade-enter-active, .modal-fade-leave-active {
	transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
	opacity: 0;
}
</style>