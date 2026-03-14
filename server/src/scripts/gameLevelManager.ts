import configManager from "../services/configManager";

import GameLevel from "./gameLevel";
import storyLoader from "./managers/storyLoader";

export class GameLevelManager {
    levels: Map<string, GameLevel>;

    constructor() {
        this.levels = new Map();
    }

    init() {
        const levelConfig = configManager.openingLevels;
        if (!levelConfig || levelConfig.length === 0) { return; }
        for (const config of levelConfig) {
            const newLevel = new GameLevel(config.levelID, config.levelName);
            storyLoader.initializeSharedContext(newLevel);
            for (const scriptPath of config.storyScriptLocation) {
                storyLoader.loadStoryScript(scriptPath, newLevel);
            }
        }
    }

}

const gameLevelManager = new GameLevelManager();
export default gameLevelManager;