data["status"] = {
    stageStatus: "prepare",
};
level.hookManager.storyInitEvent = (context) => {
    const level = context.level;
    const logger = context.logger;
    data["status"]["stageStatus"] = "prepare";
};
level.hookManager.storyAdvanceEvent = (context) => {
    const level = context.level;
    const logger = context.logger;
};
level.hookManager.playerConnectEvent = (context, account) => {
    const level = context.level;
    const logger = context.logger;
    if (data["status"]["stageStatus"] === "prepare") {
        level.textManager.sendTitleLeadInToAccount(level, account, data["texts"]["prepareStageTitle"], data["texts"]["prepareStageSubtitle"]);
        level.textManager.sendAlertToAccount(level, account, data["texts"]["preludeTitle"], data["texts"]["prelude"]);
        level.textManager.sendAlertToAccount(level, account, data["texts"]["preludeTitle"], data["texts"]["prepareStageDescription"]);
    }
};
level.hookManager.playerDisconnectEvent = (context, account) => {
    const level = context.level;
    const logger = context.logger;
};
level.hookManager.playerSetReadyEvent = (context, account) => {
    const level = context.level;
    const logger = context.logger;
};
level.hookManager.playerSetUnreadyEvent = (context, account) => {
    const level = context.level;
    const logger = context.logger;
};
