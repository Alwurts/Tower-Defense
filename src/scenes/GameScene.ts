import Phaser from "phaser";
import { GameMap } from "../components/GameMap";
import { TowerManager } from "../managers/TowerManager";
import { NavBar } from "../components/NavBar";
import { GameConfig } from "../config/GameConfig";
import { AIPlayer } from "../ai/AIPlayer";

export class GameScene extends Phaser.Scene {
	private gameMap!: GameMap;
	private towerManager!: TowerManager;
	private navBar!: NavBar;
	private aiPlayer!: AIPlayer;
	private aiUpdateTimer!: Phaser.Time.TimerEvent;

	constructor() {
		super("GameScene");
	}

	preload() {
		this.load.image("pixel", "assets/pixel.png");
	}

	create() {
		const { width } = this.cameras.main;
		this.navBar = new NavBar(this, width);
		this.gameMap = new GameMap(this);
		this.towerManager = new TowerManager(this, this.gameMap);

		this.initializeGame();
		this.initializeAI();

		// Add event listener for game end
		this.towerManager.on("gameEnd", this.onGameEnd, this);
	}

	private initializeGame() {
		this.towerManager.createTowers();

		const currentPlayer = 0;
		this.data.set("currentPlayer", currentPlayer);

		const playerColor = GameConfig.COLORS.PLAYER_1;
		const playerName = "Player 1";

		this.navBar.updatePlayerInfo(playerName, playerColor);

		this.makeTowersDraggable();

		// Initialize tower life
		for (const tower of this.towerManager.getTowersByPlayer(currentPlayer)) {
			tower.updateLife(5, currentPlayer);
		}
	}

	private initializeAI() {
		this.aiPlayer = new AIPlayer(this.towerManager, 1); // AI is player 1
		this.aiUpdateTimer = this.time.addEvent({
			delay: 2000, // AI makes a move every 2 seconds
			callback: this.updateAI,
			callbackScope: this,
			loop: true,
		});
	}

	private updateAI() {
		if (this.data.get("currentPlayer") === 0) {
			// Only update AI when it's not the AI's turn
			this.aiPlayer.update();
		}
	}

	private makeTowersDraggable() {
		const currentPlayer = this.data.get("currentPlayer");
		const playerTowers = this.towerManager.getTowersByPlayer(currentPlayer);
		this.input.setDraggable(playerTowers);
	}

	update(time: number, delta: number) {
		this.towerManager.update(time, delta);
		this.makeTowersDraggable(); // Continuously update draggable towers
	}

	private onGameEnd() {
		this.aiUpdateTimer.remove();

		// Disable input for towers
		this.input.setDraggable(this.towerManager.getAllTowers(), false);
	}
}
