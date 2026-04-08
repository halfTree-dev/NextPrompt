import { Socket } from 'socket.io';
import logger from '../../utils/logger';
import { ToolContext } from './toolManager';
import { AccountRecord } from '../../services/dataManger';

export class HookManager {
    public storyInitEvent: ((context: ToolContext) => void | Promise<void>) | null = null;
    public storyAdvanceEvent: ((context: ToolContext) => void | Promise<void>) | null = null;
    public playerConnectEvent: ((context: ToolContext, account: AccountRecord) => void | Promise<void>) | null = null;
    public playerDisconnectEvent: ((context: ToolContext, account: AccountRecord) => void | Promise<void>) | null = null;
    public playerSetReadyEvent: ((context: ToolContext, account: AccountRecord) => void | Promise<void>) | null = null;
    public playerSetUnreadyEvent: ((context: ToolContext, account: AccountRecord) => void | Promise<void>) | null = null;

    public playerSetReadyStatus(context: ToolContext, account: AccountRecord, isReady: boolean) {
        const accountId = account.accountId;
        const onlineAccountsReadyForEndTurn = context.level.onlineAccountsReadyForEndTurn;
        if (onlineAccountsReadyForEndTurn.has(accountId)) {
            onlineAccountsReadyForEndTurn.set(accountId, isReady);
        }
    }
    public playerGetReadyStatus(context: ToolContext, account: AccountRecord): boolean {
        const accountId = account.accountId;
        const onlineAccountsReadyForEndTurn = context.level.onlineAccountsReadyForEndTurn;
        return onlineAccountsReadyForEndTurn.get(accountId) || false;
    }
}
