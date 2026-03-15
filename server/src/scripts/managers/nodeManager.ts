import GameNode from "../gameObjects/gameNode";
import GameNodeTemplate from "../gameObjects/gameNode";

export class NodeManager {
    public nodeTemplates: Map<string, GameNodeTemplate>;
    public nodes: Map<string, GameNode>;

    constructor() {
        this.nodeTemplates = new Map();
        this.nodes = new Map();
    }
}
