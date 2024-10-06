import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	scene: [GameScene],
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 0, x: 0 },
			debug: false,
		},
	},
	backgroundColor: '#FFFFFF', // Set main background to white
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH
	}
};

new Phaser.Game(config);
