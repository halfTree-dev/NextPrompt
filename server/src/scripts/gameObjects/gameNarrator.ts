import logger from '../../utils/logger';

export interface StorageItem {
    source: string;
    content: string;
}

export interface ToolSchema {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: any;
        [key: string]: any;
    };
}

export interface ChatGLMToolCall {
    function: {
        name: string;
        arguments: string;
    };
    id: string;
}

export interface ChatGLMResponse {
    id: string;
    request_id: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content?: string | null;
            reasoning_content?: string;
            audio?: {
                id: string;
                data: string;
                expires_at: string;
            };
            tool_calls?: Array<ChatGLMToolCall>;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        prompt_tokens_details?: {
            cached_tokens: number;
        };
        total_tokens: number;
    };
    content_filter?: Array<{
        role: string;
        level: number;
    }>;
}

export class GameNarrator {
    storyStorage: StorageItem[] = [];

    narratorProfile: string = "";

    apiKey: string = "";

    constructor() {}

    loadLLMAPIKey(): void {
        this.apiKey = process.env.BIGMODEL_API_KEY || "";
        logger.info('Narrator API Key 已加载');
    }

    setNarratorProfile(profile: string): void {
        this.narratorProfile = profile;
    }

    addStorageMessage(source: string, content: string): void {
        const prompt: StorageItem = { source, content };
        this.storyStorage.push(prompt);
    }

    async sendTriggerMessage(
        commandPrompt: string,
        context: Record<string, any>,
        LLMtools: ToolSchema[] = [],
    ): Promise<ChatGLMResponse | null> {
        let systemContent = this.narratorProfile || '';
        if (commandPrompt) {
            systemContent += `\n\n[Instruction]\n${commandPrompt}`;
        }

        const storageList = Array.isArray(this.storyStorage) ? this.storyStorage : [];
        const userPayload = {
            context: context,
            storage: storageList
        };
        const userContent = JSON.stringify(userPayload, null, 2);

        return await this.sendChatGLMMessageTest(systemContent, userContent, LLMtools);
    }

    async sendChatGLMMessageTest(
        background: string,
        message: string,
        LLMtools: ToolSchema[] = []
    ): Promise<ChatGLMResponse | null> {
        const content = {
                model: 'glm-4.7',
                messages: [
                    {
                        role: 'system',
                        content: background
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                stream: false,
                thinking: { type: 'enabled' },
                do_sample: true,
                temperature: 0.8,
                top_p: 0.95,
                max_tokens: 1024,
                tool_stream: false,
                tools: LLMtools,
                tool_choice: 'auto',
                stop: ['<string>'],
                response_format: { type: 'text' },
                request_id: '<string>',
                user_id: '<string>'
            };
        const options = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content)
        };

        try {
            const result = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', options);
            const data = await result.json();
            if (data && data.error) {
                logger.error('Narrator GLM 返回错误：', data.error);
                return null;
            } else {
                const result = data as ChatGLMResponse;
                logger.debug('Narrator GLM 返回以下回复：', result);
                return result;
            }
        } catch (error) {
            logger.error('Narrator GLM 的请求失败：', error);
            return null;
        }
    }
}
