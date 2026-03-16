import fs from 'fs';
import vm from 'vm';
import type { GameLevel } from '../gameLevel';
import logger from '../../utils/logger';

export class StoryLoader {
    private levelContexts: Map<string, vm.Context> = new Map();

    public initializeSharedContext(gameLevel: GameLevel): void {
        this.getOrCreateLevelContext(gameLevel);
    }

    private getOrCreateLevelContext(gameLevel: GameLevel): vm.Context {
        const existingContext = this.levelContexts.get(gameLevel.levelID);
        if (existingContext) {
            return existingContext;
        }

        const sharedData: Record<string, any> = {};
        const levelContext = vm.createContext({
            level: gameLevel,
            logger: logger,
            data: sharedData,
            console: console,
            Math: Math,
            Date: Date,
            JSON: JSON,
            Object: Object,
            Array: Array,
            String: String,
            Number: Number,
            Boolean: Boolean,
        });

        this.levelContexts.set(gameLevel.levelID, levelContext);
        logger.info(`${gameLevel.levelID} 的游戏房间创建了共享上下文`);
        return levelContext;
    }

    public clearLevelContext(levelID: string): void {
        this.levelContexts.delete(levelID);
    }

    public clearAllContexts(): void {
        this.levelContexts.clear();
    }

    public async loadStoryScript(scriptPath: string, gameLevel: GameLevel): Promise<boolean> {
        try {
            if (!fs.existsSync(scriptPath)) {
                logger.error(`加载 ${gameLevel.levelID} 的故事脚本未找到： ${scriptPath}`);
                return false;
            }

            const scriptContent = fs.readFileSync(scriptPath, 'utf8');

            const levelContext = this.getOrCreateLevelContext(gameLevel);
            vm.runInContext(scriptContent, levelContext, { filename: scriptPath });

            logger.info(`加载 ${gameLevel.levelID} 的故事脚本成功：${scriptPath}`);
            return true;
        } catch (err) {
            logger.error(`加载 ${gameLevel.levelID} 的故事脚本失败 ${scriptPath}: ${err}`);
            return false;
        }
    }
}

const storyLoader = new StoryLoader();
export default storyLoader;