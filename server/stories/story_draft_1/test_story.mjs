/* @ts-check */

level.hookManager.storyInitEvent = (context) => {
    const level = context.level;
    const logger = context.logger;
    level.nodeManager.addNodeTemplate({
        templateName: "revolver",
        displayText: "Revolver",
        description: "A revolver with 6 bullets.",
        category: "Weapon",
        lifeTimeRounds: 3,
        coolDownRounds: 2,
        inStackable: true,

        inputSlots: new Map(Object.entries({
            "bullet": {
                slotID: "bullet",
                inputHint: "The Bullet for firing the revolver",
                inputID: ""
            },
        })),
        inputStringBars: new Map(Object.entries({
            "strategy": {
                barID: "strategy",
                inputHint: "The strategy for firing.",
                inputContent: ""
            }
        })),

        interactable: true,
        onInteractCallback: (context) => {
            const level = context.level;
            const logger = context.logger;
            const node = context.node;
            const account = context.account;

            // 测试用回调函数
            const socket = level.getSocketFromAccount(account.accountId);
            if (socket) {
                socket.emit("evt_send_alert", { title: "你正在使用左轮", message: `你的子弹是 ${node.inputSlots.get("bullet").inputID}；射击技巧是 ${node.inputStringBars.get("strategy").inputContent}` });
            }
            logger.info(`玩家 ${account.userName} 触发了 ${node.displayText} 的交互回调`);
        }
    })

    level.nodeManager.addNodeTemplate({
        templateName: "bullet",
        displayText: "Bullet",
        description: "A bullet for the revolver.",
        category: "Ammo",
        inStackable: false,
        count: 1,
        interactable: false
    })
    const revolver = level.nodeManager.createNode("revolver");
    level.nodeManager.addNode(revolver);

    const bullet = level.nodeManager.createNode("bullet");
    level.nodeManager.addNode(bullet);

    const otherBullets = level.nodeManager.createNode("bullet");
    otherBullets.count = 3;
    level.nodeManager.addNode(otherBullets);

    logger.info('Guns on the table!');
}

level.hookManager.storyAdvanceEvent = (context) => {

}

level.hookManager.socketConnectEvent = (context, socket) => {
    const level = context.level;
    const logger = context.logger;
    level.guideManager.sendGuideMessageToSocket(socket, "测试用引导消息", "这是一条测试用的引导消息，用于展示引导系统的功能。");
    level.guideManager.sendGuideMessageToSocket(socket, "测试用引导消息2", "还有一条");
}

level.hookManager.socketDisconnectEvent = (context, socket) => {

}