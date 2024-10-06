import type { Tower } from "../components/Tower";
import type { TowerManager } from "../managers/TowerManager";

export class AIPlayer {
	private towerManager: TowerManager;
	private playerId: number;

	constructor(towerManager: TowerManager, playerId: number) {
		this.towerManager = towerManager;
		this.playerId = playerId;
	}

	update() {
		const aiTowers = this.towerManager.getTowersByPlayer(this.playerId);
    
		for (const tower of aiTowers) {
			if (tower.canCreateOutgoingConnection()) {
				this.makeMove(tower);
			}
		}
	}

	private makeMove(tower: Tower) {
		// Simple strategy: Connect to the nearest enemy tower or neutral tower
		let nearestTower: Tower | null = null;
		let minDistance = Number.POSITIVE_INFINITY;

		const allTowers = this.towerManager.getAllTowers();
		for (const targetTower of allTowers) {
			if (targetTower !== tower && targetTower.ownerId !== this.playerId) {
				const distance = Phaser.Math.Distance.Between(
					tower.x,
					tower.y,
					targetTower.x,
					targetTower.y,
				);
				if (
					distance < minDistance &&
					this.towerManager.canCreateConnection(tower, targetTower)
				) {
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
