/* @ts-check */
/// <reference path="./story-env.d.ts" />

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
        interactable: true,

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
        }))
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
}

level.hookManager.socketDisconnectEvent = (context, socket) => {

}