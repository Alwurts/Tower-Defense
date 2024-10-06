import Phaser from "phaser";
import { GameMap } from "../components/GameMap";
import { TowerManager } from "../managers/TowerManager";

export class GameScene extends Phaser.Scene {
	private gameMap!: GameMap;
	private towerManager!: TowerManager;

	constructor() {
		super("GameScene");
	}

	preload() {
		// Load assets here
	}

	create() {
		this.gameMap = new GameMap(this);
		this.towerManager = new TowerManager(this, this.gameMap);
		this.towerManager.createTowers();
	}

	update() {
		// Game loop logic here
	}
}
