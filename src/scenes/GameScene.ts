import Phaser from "phaser";
import { GameMap } from "../components/GameMap";
import { TowerManager } from "../managers/TowerManager";
import { NavBar } from "../components/NavBar";
import { GameConfig } from "../config/GameConfig";

export class GameScene extends Phaser.Scene {
	private gameMap!: GameMap;
	private towerManager!: TowerManager;
	private navBar!: NavBar;

	constructor() {
		super("GameScene");
	}

	preload() {
		this.load.image('pixel', 'assets/pixel.png');
	}

	create() {
		const { width, height } = this.cameras.main;
		this.navBar = new NavBar(this, width);
		this.gameMap = new GameMap(this);
		this.towerManager = new TowerManager(this, this.gameMap);

		this.initializeGame();
	}

	private initializeGame() {
		this.towerManager.createTowers();

		const currentPlayer = 0;
		this.data.set('currentPlayer', currentPlayer);
		
		const playerColor = GameConfig.COLORS.PLAYER_1;
		const playerName = "Player 1";

		this.navBar.updatePlayerInfo(playerName, playerColor);

		this.input.setDraggable(this.towerManager.getTowersByPlayer(currentPlayer));

		// Initialize tower life
		for (const tower of this.towerManager.getTowersByPlayer(currentPlayer)) {
			tower.updateLife(5);
		}
	}

	update(time: number, delta: number) {
		this.towerManager.update(time, delta);
	}
}
