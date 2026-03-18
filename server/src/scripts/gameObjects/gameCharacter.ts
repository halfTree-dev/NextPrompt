import { AccountRecord } from "../../services/dataManger";

export interface Attributes {
    name: string;
    value: number;
    [key: string]: any;
}

export class GameCharacter {
    characterID: string = '';

    characterName: string = '';
    characterDescription: string = '';

    attributes: Map<string, Attributes>;
    storage?: Record<string, any>;

    accountRecord?: AccountRecord;

    constructor() {
        this.attributes = new Map();
    }

    setAttribute(attrName: string, attrValue: any): void {
        this.attributes.set(attrName, attrValue);
    }

    getAttribute(attrName: string): any {
        return this.attributes.get(attrName);
    }
}

export default GameCharacter;