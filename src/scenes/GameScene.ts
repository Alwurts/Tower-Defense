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
		// Load assets here
		this.load.image('pixel', 'assets/pixel.png');
	}

	create() {
		this.navBar = new NavBar(this, this.cameras.main.width);
		this.gameMap = new GameMap(this);
		this.towerManager = new TowerManager(this, this.gameMap);
		this.towerManager.createTowers();

		// Assign towers to players and update navbar
		const currentPlayer = 0; // For now, we'll assume we're always player 1
		this.data.set('currentPlayer', currentPlayer);
		const playerColor = GameConfig.COLORS.PLAYER_1;
		const playerName = "Player 1";

		this.navBar.updatePlayerInfo(playerName, playerColor);

		// Enable dragging for all towers
		this.input.setDraggable(this.towerManager.getTowersByPlayer(currentPlayer));
	}

	update() {
		// Game loop logic here
	}
}
