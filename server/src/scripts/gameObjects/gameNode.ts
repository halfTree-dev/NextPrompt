import { cloneDeep } from 'lodash';
import { GameLevel } from '../gameLevel';
import logger from '../../utils/logger';
import { AccountRecord } from '../../services/dataManger';

export interface RelatedCharacter {
    characterID: string;
    [key: string]: any;
}

export interface Tag {
    name: string;
    [key: string]: any;
}

export interface InputSlot {
    slotID: string;
    inputHint: string;
    inputID: string;
    [key: string]: any;
}

export interface InputCheckbox {
    boxID: string;
    inputHint: string;
    choices: string[];
    chooseIndex: number;
    [key: string]: any;
}

export interface InputStringBar {
    barID: string;
    inputHint: string;
    inputContent: string;
    [key: string]: any;
}

export interface InteractCallbackContext {
    level: GameLevel;
    logger: typeof logger;
    node: GameNode;
    account: AccountRecord
}

export interface AdvanceCallbackContext {
    level: GameLevel;
    logger: typeof logger;
    node: GameNode;
}

export class GameNode {
    nodeID: string = '';

    displayText: string = '';
    description: string = '';

    category?: string = '';

    relatedCharacters: RelatedCharacter[] = [];

    storage?: Record<string, any> = {};

    invisible?: boolean = false;
    lifeTimeRounds?: number = 0;
    coolDownRounds?: number = 0;

    inStackable?: boolean = true;
    count?: number = 1;

    tags?: Tag[] = [];

    inputSlots?: Map<string, InputSlot> = new Map();
    inputStringBars?: Map<string, InputStringBar> = new Map();
    inputCheckboxes?: Map<string, InputCheckbox> = new Map();

    interactable?: boolean = false;
    onInteractCallback?: ((context: InteractCallbackContext) => void | Promise<void>) | null = null;

    hasAdvanceEvent?: boolean = false;
    onAdvanceCallback?: ((context: AdvanceCallbackContext) => void | Promise<void>) | null = null;
}

export class GameNodeTemplate {
    templateName: string = '';

    displayText: string = '';
    description: string = '';

    category?: string = '';

    invisible?: boolean = false;
    lifeTimeRounds?: number = 0;
    coolDownRounds?: number = 0;

    inStackable?: boolean = true;
    count?: number = 1;
    tags?: Tag[] = [];

    inputSlots?: Map<string, InputSlot> = new Map();
    inputStringBars?: Map<string, InputStringBar> = new Map();
    inputCheckboxes?: Map<string, InputCheckbox> = new Map();

    interactable?: boolean = false;
    onInteractCallback?: ((context: InteractCallbackContext) => void | Promise<void>) | null = null;

    hasAdvanceEvent?: boolean = false;
    onAdvanceCallback?: ((context: AdvanceCallbackContext) => void | Promise<void>) | null = null;
}

export function createGameNodeFromTemplate(template: GameNodeTemplate, nodeID: string): GameNode {
    const node = new GameNode();
    const templateData = cloneDeep(template);

    node.nodeID = nodeID;
    node.displayText = templateData.displayText;
    node.description = templateData.description;
    node.category = templateData.category;
    node.storage = {};
    node.invisible = templateData.invisible;
    node.lifeTimeRounds = templateData.lifeTimeRounds;
    node.coolDownRounds = templateData.coolDownRounds;
    node.inStackable = templateData.inStackable;
    node.count = templateData.count;
    node.tags = templateData.tags;
    node.inputSlots = templateData.inputSlots;
    node.inputStringBars = templateData.inputStringBars;
    node.inputCheckboxes = templateData.inputCheckboxes;
    node.interactable = templateData.interactable;
    node.onInteractCallback = templateData.onInteractCallback;
    node.hasAdvanceEvent = templateData.hasAdvanceEvent;
    node.onAdvanceCallback = templateData.onAdvanceCallback;

    return node;
}

export default GameNode;