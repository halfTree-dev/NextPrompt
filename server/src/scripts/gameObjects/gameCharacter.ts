import { AccountRecord } from "../../services/dataManger";

export interface Attributes {
    [key: string]: any;
}

export class GameCharacter {
    characterID: string = '';

    attributes: Attributes;

    accountRecord?: AccountRecord;

    operationLock: boolean;
    readyForEndTurn: boolean;

    constructor() {
        this.attributes = {};
        this.operationLock = false;
        this.readyForEndTurn = false;
    }

    setAttribute(attrName: string, attrValue: any): void {
        this.attributes[attrName] = attrValue;
    }

    getAttribute(attrName: string): any {
        return this.attributes[attrName];
    }
}