import { Socket } from 'socket.io';
import logger from '../../utils/logger';
import { ToolContext } from './toolManager';

export class HookManager {
    public storyInitEvent: ((context: ToolContext) => void | Promise<void>) | null = null;
    public storyAdvanceEvent: ((context: ToolContext) => void | Promise<void>) | null = null;
    public socketConnectEvent: ((context: ToolContext, socket: Socket) => void | Promise<void>) | null = null;
    public socketDisconnectEvent: ((context: ToolContext, socket: Socket) => void | Promise<void>) | null = null;
}
