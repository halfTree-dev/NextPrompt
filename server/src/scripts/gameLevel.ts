import { CharacterManager } from "./managers/characterManager";
import { HookManager } from "./managers/hookManager";
import { NarratorManager } from "./managers/narratorManager";
import { NodeManager } from "./managers/nodeManager";
import { ToolManager } from "./managers/toolManager";

import socketService from "../services/socketManager";

export class GameLevel {
    levelID: string = "";
    levelName: string = "";
    currRound: number = 0;

    nodeManager: NodeManager;
    characterManager: CharacterManager;
    narratorManager: NarratorManager;
    hookManager: HookManager;
    toolManager: ToolManager;

    onlineAccounts: Set<string>;

    constructor(levelID: string, levelName: string = "") {
        this.levelID = levelID;
        this.levelName = levelName;

        this.nodeManager = new NodeManager();
        this.characterManager = new CharacterManager();
        this.narratorManager = new NarratorManager();
        this.hookManager = new HookManager();
        this.toolManager = new ToolManager();

        this.onlineAccounts = new Set();
    }

}

export default GameLevel;