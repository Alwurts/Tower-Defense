import Phaser from "phaser";
import { PoissonDiscSampling } from "../utils/PoissonDiscSampling";

export class GameScene extends Phaser.Scene {
	private readonly NUM_TOWERS = 6;

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

		// Use Poisson Disc Sampling to generate tower positions
		const towerSize = mapSize * 0.08;
		const minDistance = mapSize / 3; // Increased minimum distance for better spread
		const padding = towerSize / 2; // Padding to keep towers inside the map

		const sampler = new PoissonDiscSampling(
			mapSize - 2 * padding, 
			mapSize - 2 * padding, 
			minDistance
		);
		const points = sampler.generate();

		// Create towers at the generated points
		points.slice(0, this.NUM_TOWERS).forEach(point => {
			const towerX = mapX + point[0] + padding;
			const towerY = mapY + point[1] + padding;

			const tower = this.add.rectangle(towerX, towerY, towerSize, towerSize, 0x000000);
			tower.setStrokeStyle(2, 0x000000);
			tower.setFillStyle(0x000000, 0); // Transparent fill
		});
	}

	update() {
		// Game loop logic here
	}
}
