import { Socket } from 'socket.io';
import logger from '../../utils/logger';
import { ToolContext } from './toolManager';

export class HookManager {
    private storyInitEvent: ((context: ToolContext) => void | Promise<void>) | null = null;
    private storyAdvanceEvent: ((context: ToolContext) => void | Promise<void>) | null = null
    private socketConnectEvent: ((context: ToolContext, socket: Socket) => void | Promise<void>) | null = null;
    private socketReconnectEvent: ((context: ToolContext, socket: Socket) => void | Promise<void>) | null = null
    private socketDisconnectEvent: ((context: ToolContext, socket: Socket) => void | Promise<void>) | null = null;
}
