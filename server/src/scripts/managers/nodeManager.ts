import GameNode from "../gameObjects/gameNode";

export class NodeManager {
    private nodeTemplates: Record<string, GameNode> = {};
    private nodes: Record<string, GameNode> = {};
}
