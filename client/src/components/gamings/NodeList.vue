<template>
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
                <li class="node-item" v-for="node in myNodesList.filter(node => selectedCategory === CATEGORY_ALL || node.category === selectedCategory)" :key="node.nodeID" @click="$emit('node-click', node)">
                    <div class="node-item-controls" @click.stop>
                        <button class="arrow-btn arrow-up" type="button" aria-label="上移" @click="nodeMoveUp(node.nodeID, selectedCategory)"></button>
                        <span class="menu-mark" aria-hidden="true">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                        <button class="arrow-btn arrow-down" type="button" aria-label="下移" @click="nodeMoveDown(node.nodeID, selectedCategory)"></button>
                    </div>
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore, type GameNodeInfo } from '../../stores/game';

const gameStore = useGameStore();

defineEmits(['node-click']);

// 管理节点和类型列表
const myNodesList = computed(() => {
    if (!gameStore.gameLevelInfo) {
        return [];
    }
    const nodeOrderedIDs = gameStore.gameNodeOrderedIDs || [];
    const resultNodes: GameNodeInfo[] = [];
    for (const nodeId of nodeOrderedIDs) {
        const nodeInfo = gameStore.gameLevelInfo.nodes ? gameStore.gameLevelInfo.nodes[nodeId] : null;
        if (nodeInfo) {
            resultNodes.push(nodeInfo);
        }
    }
    return resultNodes;
})
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

// 管理节点位置移动
const nodeMoveUp = (nodeId: string, category: string) => {
    if (category === CATEGORY_ALL) {
        const index = gameStore.gameNodeOrderedIDs.findIndex((id) => id === nodeId);
        if (index > 0) {
            const tempNode = gameStore.gameNodeOrderedIDs[index - 1];
            if (!tempNode || !gameStore.gameNodeOrderedIDs[index]) { return; }
            gameStore.gameNodeOrderedIDs[index - 1] = gameStore.gameNodeOrderedIDs[index];
            gameStore.gameNodeOrderedIDs[index] = tempNode;
        }
    } else {
        const categoriedNodes = myNodesListCategories.value[category] || [];
        const index = categoriedNodes.findIndex((node) => node.nodeID === nodeId);
        if (index > 0) {
            const tempNode = categoriedNodes[index - 1];
            if (!tempNode || !categoriedNodes[index]) { return; }
            // 在 gameStore.gameNodeOrderedIDs 中调整顺序
            const tempNodeIndex = gameStore.gameNodeOrderedIDs.findIndex((id) => id === tempNode.nodeID);
            const currentNodeIndex = gameStore.gameNodeOrderedIDs.findIndex((id) => id === nodeId);
            if (tempNodeIndex < 0 || currentNodeIndex < 0) { return; }
            gameStore.gameNodeOrderedIDs[tempNodeIndex] = nodeId;
            gameStore.gameNodeOrderedIDs[currentNodeIndex] = tempNode.nodeID;
        }
    }
}
const nodeMoveDown = (nodeId: string, category: string) => {
    if (category === CATEGORY_ALL) {
        const index = gameStore.gameNodeOrderedIDs.findIndex((id) => id === nodeId);
        if (index >= 0 && index < gameStore.gameNodeOrderedIDs.length - 1) {
            const tempNode = gameStore.gameNodeOrderedIDs[index + 1];
            if (!tempNode || !gameStore.gameNodeOrderedIDs[index]) { return; }
            gameStore.gameNodeOrderedIDs[index + 1] = gameStore.gameNodeOrderedIDs[index];
            gameStore.gameNodeOrderedIDs[index] = tempNode;
        }
    } else {
        const categoriedNodes = myNodesListCategories.value[category] || [];
        const index = categoriedNodes.findIndex((node) => node.nodeID === nodeId);
        if (index >= 0 && index < categoriedNodes.length - 1) {
            const tempNode = categoriedNodes[index + 1];
            if (!tempNode || !categoriedNodes[index]) { return; }
            // 在 gameStore.gameNodeOrderedIDs 中调整顺序
            const tempNodeIndex = gameStore.gameNodeOrderedIDs.findIndex((id) => id === tempNode.nodeID);
            const currentNodeIndex = gameStore.gameNodeOrderedIDs.findIndex((id) => id === nodeId);
            if (tempNodeIndex < 0 || currentNodeIndex < 0) { return; }
            gameStore.gameNodeOrderedIDs[tempNodeIndex] = nodeId;
            gameStore.gameNodeOrderedIDs[currentNodeIndex] = tempNode.nodeID;
        }
    }
}

</script>

<style lang="css" scoped>
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
    padding: 14px 16px 36px 64px;
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

.node-item-controls {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 44px;
    border-right: 1px solid var(--color-border, #3c3c3c);
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
}

.arrow-btn {
    width: 22px;
    height: 22px;
    background: transparent;
    border: none;
    cursor: pointer;
    position: relative;
    padding: 0;
}

.arrow-btn::before {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    border-right: 2px solid var(--color-text, #ddd);
    border-bottom: 2px solid var(--color-text, #ddd);
    left: 6px;
}

.arrow-up::before {
    top: 8px;
    transform: rotate(-135deg);
}

.arrow-down::before {
    top: 4px;
    transform: rotate(45deg);
}

.arrow-btn:hover::before {
    border-color: var(--color-primary, #4caf50);
}

.menu-mark {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
}

.menu-mark span {
    display: block;
    width: 14px;
    height: 2px;
    background: var(--color-text, #bbb);
    opacity: 0.9;
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
</style>