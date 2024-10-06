import Phaser from 'phaser';
import { Tower } from '../components/Tower';
import { GameMap } from '../components/GameMap';
import { GameConfig } from '../config/GameConfig';
import { PoissonDiscSampling } from '../utils/PoissonDiscSampling';

export class TowerManager {
    private towers: Tower[] = [];

    constructor(private scene: Phaser.Scene, private gameMap: GameMap) {}

    createTowers() {
        const towerSize = this.gameMap.size * GameConfig.TOWER_SIZE_RATIO;
        const minDistance = this.gameMap.size * GameConfig.MIN_DISTANCE_RATIO;
        const padding = towerSize / 2;

        const sampler = new PoissonDiscSampling(
            this.gameMap.size - 2 * padding,
            this.gameMap.size - 2 * padding,
            minDistance
        );
        const points = sampler.generate();

        for (const point of points.slice(0, GameConfig.NUM_TOWERS)) {
            const towerX = this.gameMap.topLeft.x + point[0] + padding;
            const towerY = this.gameMap.topLeft.y + point[1] + padding;

            const tower = new Tower(this.scene, towerX, towerY, towerSize);
            this.towers.push(tower);
        }
    }
}