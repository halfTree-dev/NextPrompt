import fs from 'fs';

import logger from '../utils/logger';

export interface LevelConfig {
    levelID: string;
    levelName: string;
    storyScriptLocation: string[];
}

const CONFIG_PATH = './server.properties.json';

export class ConfigManager {
    port : number;
    openingLevels: LevelConfig[];

    constructor() {
        this.port = 3000;
        this.openingLevels = [];
    }

    loadConfig() {
        try {
            const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
            const config = JSON.parse(configData);
            this.port = config.port || this.port;
            this.openingLevels = config.openingLevels || this.openingLevels;
            logger.info(`配置文件加载成功: ${CONFIG_PATH}`);
        } catch (error) {
            logger.error(`配置文件加载失败: ${CONFIG_PATH}`);
        }
    }
}

const configManager = new ConfigManager();
export default configManager;