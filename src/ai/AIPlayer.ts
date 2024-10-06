import { Tower } from '../components/Tower';
import { TowerManager } from '../managers/TowerManager';
import { GameConfig } from '../config/GameConfig';

export class AIPlayer {
    private towerManager: TowerManager;
    private playerId: number;

    constructor(towerManager: TowerManager, playerId: number) {
        this.towerManager = towerManager;
        this.playerId = playerId;
    }

    update() {
        const aiTowers = this.towerManager.getTowersByPlayer(this.playerId);
        const enemyTowers = this.towerManager.getTowersByPlayer(1 - this.playerId); // Assuming 2 players

        for (const tower of aiTowers) {
            if (tower.canCreateOutgoingConnection()) {
                this.makeMove(tower, enemyTowers);
            }
        }
    }

    private makeMove(tower: Tower, enemyTowers: Tower[]) {
        // Simple strategy: Connect to the nearest enemy tower or neutral tower
        let nearestTower: Tower | null = null;
        let minDistance = Infinity;

        const allTowers = this.towerManager.getAllTowers();
        for (const targetTower of allTowers) {
            if (targetTower !== tower && (targetTower.ownerId !== this.playerId)) {
                const distance = Phaser.Math.Distance.Between(tower.x, tower.y, targetTower.x, targetTower.y);
                if (distance < minDistance && this.towerManager.canCreateConnection(tower, targetTower)) {
                    minDistance = distance;
                    nearestTower = targetTower;
                }
            }
        }

        if (nearestTower) {
            this.towerManager.createConnection(tower, nearestTower);
        }
    }
}