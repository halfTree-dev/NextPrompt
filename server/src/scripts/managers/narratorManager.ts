import { GameNarrator } from "../gameObjects/gameNarrator";

export class NarratorManager {
    public narrator: GameNarrator;

    constructor() {
        this.narrator = new GameNarrator();
    }
}
