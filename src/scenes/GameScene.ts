import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
	private readonly NUM_TOWERS = 5; // Define the number of towers

	constructor() {
		super("GameScene");
	}

	preload() {
		// Load assets here
	}

	create() {
		// Create a centered square map with a border
		const mapSize = Math.min(this.cameras.main.width, this.cameras.main.height) * 0.95;
		const mapX = (this.cameras.main.width - mapSize) / 2;
		const mapY = (this.cameras.main.height - mapSize) / 2;

		// Create the map with white fill and black border
		const map = this.add.rectangle(mapX, mapY, mapSize, mapSize, 0xFFFFFF);
		map.setOrigin(0, 0);
		map.setStrokeStyle(4, 0x000000);

		// Create towers (outlined squares) inside the map
		const towerSize = mapSize * 0.08; // Slightly smaller towers
		const padding = mapSize * 0.1; // Padding from the edges

		for (let i = 0; i < this.NUM_TOWERS; i++) {
			const towerX = Phaser.Math.Between(mapX + padding, mapX + mapSize - padding - towerSize);
			const towerY = Phaser.Math.Between(mapY + padding, mapY + mapSize - padding - towerSize);

			const tower = this.add.rectangle(towerX, towerY, towerSize, towerSize, 0x000000);
			tower.setStrokeStyle(2, 0x000000);
			tower.setFillStyle(0x000000, 0); // Transparent fill
		}
	}

	update() {
		// Game loop logic here
	}
}
