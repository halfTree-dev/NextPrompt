import logger from '../../utils/logger';
import { GameLevel } from '../gameLevel';
import { ChatGLMToolCall, ToolSchema } from '../gameObjects/gameNarrator';

export interface ToolContext {
    story: GameLevel;
    logger: typeof logger;
    [key: string]: any;
}

export interface LLMTool {
    schema: ToolSchema;
    callback: (args: any, context: ToolContext) => void | Promise<void>;
}

export class ToolManager {
    private tools: Record<string, LLMTool> = {};

    registerLLMTool(
        name: string,
        description: string,
        parameter: any,
        callback: (args: any, context: ToolContext) => void | Promise<void>
    ): void {
        this.tools[name] = {
            schema: {
                type: 'function',
                function: {
                    name: name,
                    description: description,
                    parameters: parameter,
                },
            },
            callback: callback,
        };
    }

    getTool(name: string): LLMTool | undefined {
        return this.tools[name];
    }

    getAllTools(): Record<string, LLMTool> {
        return this.tools;
    }

    getToolSchemaByName(name: string): ToolSchema | undefined {
        return this.tools[name]?.schema;
    }

    getToolSchemas(allowTools: string[]): ToolSchema[] {
        return allowTools
            .map(name => this.tools[name]?.schema)
            .filter(Boolean) as ToolSchema[];
    }

    async executeToolCalls(toolCalls: ChatGLMToolCall[], context: ToolContext): Promise<void> {
        logger.debug(`[ToolManager] Executing ${toolCalls.length} tool calls`);
        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const tool = this.tools[functionName];
            if (tool && tool.callback) {
                let args: any = {};
                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch (e) {
                    logger.error(`[ToolManager] Failed to parse arguments for tool ${functionName}:`, e);
                    continue;
                }
                await tool.callback(args, context);
            }
        }
    }
}
