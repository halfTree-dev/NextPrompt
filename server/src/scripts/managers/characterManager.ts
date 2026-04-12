import { AccountRecord } from "../../services/dataManger";
import GameCharacter from "../gameObjects/gameCharacter";

export class CharacterManager {
    public characters: Map<string, GameCharacter> = new Map();

    constructor() {
        this.characters = new Map();
    }

    registerCharacterInstance(characterName: string, characterDescription: string): GameCharacter {
        const newCharacter = new GameCharacter();
        newCharacter.characterID = `char_${Date.now()}`;
        newCharacter.characterName = characterName;
        newCharacter.characterDescription = characterDescription;
        return newCharacter;
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

    getCharacterByAccount(accountId: string): GameCharacter | undefined {
        for (const character of this.characters.values()) {
            if (character.accountRecord?.accountId === accountId) {
                return character;
            }
        }
        return undefined;
    }

    getCharactersMap() : Map<string, GameCharacter> {
        return this.characters;
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