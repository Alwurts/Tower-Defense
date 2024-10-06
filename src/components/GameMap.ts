import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class GameMap extends Phaser.GameObjects.Rectangle {
    constructor(scene: Phaser.Scene) {
        const availableHeight = scene.cameras.main.height - GameConfig.NAVBAR_HEIGHT;
        const mapSize = Math.min(scene.cameras.main.width, availableHeight) * GameConfig.MAP_SIZE_RATIO;
        const mapX = (scene.cameras.main.width - mapSize) / 2;
        const mapY = GameConfig.NAVBAR_HEIGHT + (availableHeight - mapSize) / 2;

        super(scene, mapX, mapY, mapSize, mapSize, GameConfig.COLORS.BACKGROUND);

        this.setOrigin(0, 0);
        this.setStrokeStyle(GameConfig.BORDER_THICKNESS, GameConfig.COLORS.BORDER);

        scene.add.existing(this);
    }

    get size(): number {
        return this.width;
    }

    get topLeft(): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(this.x, this.y);
    }
}