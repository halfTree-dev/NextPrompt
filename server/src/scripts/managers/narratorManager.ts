import { GameNarrator } from "../gameObjects/gameNarrator";

export class NarratorManager {
    private narrator: GameNarrator;

    constructor() {
        this.narrator = new GameNarrator();
    }
}
