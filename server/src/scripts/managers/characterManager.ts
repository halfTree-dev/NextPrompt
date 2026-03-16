import { AccountRecord } from "../../services/dataManger";
import GameCharacter from "../gameObjects/gameCharacter";

export class CharacterManager {
    public characters: Map<string, GameCharacter> = new Map();

    constructor() {
        this.characters = new Map();
    }

    addCharacter(character: GameCharacter): void {
        this.characters.set(character.characterID, character);
    }

    removeCharacter(characterID: string): void {
        this.characters.delete(characterID);
    }

    getCharacter(characterID: string): GameCharacter | undefined {
        return this.characters.get(characterID);
    }

    attachAccountToCharacter(characterID: string, accountRecord: AccountRecord): void {
        const character = this.characters.get(characterID);
        if (character) {
            character.accountRecord = accountRecord;
        }
    }

    detachAccountFromCharacter(characterID: string): void {
        const character = this.characters.get(characterID);
        if (character) {
            character.accountRecord = undefined;
        }
    }

    getCharacterType(characterID: string): "player" | "npc" | undefined {
        const character = this.characters.get(characterID);
        if (character) {
            return character.accountRecord ? "player" : "npc";
        }
        return undefined;
    }

}