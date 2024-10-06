import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class GameMap extends Phaser.GameObjects.Rectangle {
    constructor(scene: Phaser.Scene) {
        const mapSize = Math.min(scene.cameras.main.width, scene.cameras.main.height) * GameConfig.MAP_SIZE_RATIO;
        const mapX = (scene.cameras.main.width - mapSize) / 2;
        const mapY = (scene.cameras.main.height - mapSize) / 2;

        super(scene, mapX, mapY, mapSize, mapSize, GameConfig.COLORS.MAP_FILL);

        this.setOrigin(0, 0);
        this.setStrokeStyle(4, GameConfig.COLORS.MAP_STROKE);

        scene.add.existing(this);
    }

    get size(): number {
        return this.width;
    }

    get topLeft(): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(this.x, this.y);
    }
}