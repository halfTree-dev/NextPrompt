import type { GameLevel } from '../src/scripts/gameLevel';

declare global {
    var level: GameLevel;
    var logger: {
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
        debug(message: string): void;
    };
    var data: Record<string, any>;
    var console: Console;
    var Math: Math;
    var Date: DateConstructor;
    var JSON: JSON;
    var Object: ObjectConstructor;
    var Array: ArrayConstructor;
    var String: StringConstructor;
    var Number: NumberConstructor;
    var Boolean: BooleanConstructor;
}

export {};
