import GameCharacter from "../gameObjects/gameCharacter";

export class CharacterManager {
    public characters: Map<string, GameCharacter> = new Map();

    constructor() {
        this.characters = new Map();
    }
}