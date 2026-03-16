import { createGameNodeFromTemplate, GameNode, GameNodeTemplate } from "../gameObjects/gameNode";
import { v4 as uuidv4 } from 'uuid';

export class NodeManager {
    public nodeTemplates: Map<string, GameNodeTemplate>;
    public nodes: Map<string, GameNode>;

    constructor() {
        this.nodeTemplates = new Map();
        this.nodes = new Map();
    }

    public addNodeTemplate(template: GameNodeTemplate): void {
        this.nodeTemplates.set(template.templateName, template);
    }

    public getNodeTemplate(templateName: string): GameNodeTemplate | undefined {
        return this.nodeTemplates.get(templateName);
    }

    public judgeNodeTypeEquals(nodeA: GameNode, nodeB: GameNode): boolean {
        return nodeA.displayText === nodeB.displayText &&
               nodeA.description === nodeB.description &&
               nodeA.tags?.toString() === nodeB.tags?.toString();
    }

    public createNode(templateName: string): GameNode | null {
        const template = this.getNodeTemplate(templateName);
        if (!template) {
            console.warn(`Node template "${templateName}" not found.`);
            return null;
        }
        const nodeID = `node_${uuidv4()}`;
        const newNode = createGameNodeFromTemplate(template, nodeID);
        return newNode;
    }

    public addNode(node: GameNode): void {
        if (node.inStackable) {
            this.nodes.set(node.nodeID, node);
        } else {
            for (const existingNode of this.nodes.values()) {
                if (this.judgeNodeTypeEquals(existingNode, node)) {
                    existingNode.count = (existingNode.count || 1) + (node.count || 1);
                    return;
                }
            }
            this.nodes.set(node.nodeID, node);
        }
    }

    public removeNode(nodeID: string, count: number = 1): void {
        const node = this.nodes.get(nodeID);
        if (!node) { return; }
        if (!node.inStackable) {
            if (node.count && node.count > count) {
                node.count -= count;
            } else {
                this.nodes.delete(nodeID);
            }
        } else {
            this.nodes.delete(nodeID);
        }
    }

    public getNode(nodeID: string): GameNode | undefined {
        return this.nodes.get(nodeID);
    }

}
