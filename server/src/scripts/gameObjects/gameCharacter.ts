import { AccountRecord } from "../../services/dataManger";

export interface Attributes {
    name: string;
    value: number;
    [key: string]: any;
}

export class GameCharacter {
    characterID: string = '';

    attributes: Map<string, Attributes>;
    storage?: Record<string, any>;

    accountRecord?: AccountRecord;

    operationLock: boolean;
    readyForEndTurn: boolean;

    constructor() {
        this.attributes = new Map();
        this.operationLock = false;
        this.readyForEndTurn = false;
    }

    setAttribute(attrName: string, attrValue: any): void {
        this.attributes.set(attrName, attrValue);
    }

    getAttribute(attrName: string): any {
        return this.attributes.get(attrName);
    }
}