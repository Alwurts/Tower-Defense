import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class NavBar extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private playerInfo: Phaser.GameObjects.Text;
    private menuButton: Phaser.GameObjects.Rectangle;
    private menuText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, width: number) {
        super(scene, 0, 0);

        const height = GameConfig.NAVBAR_HEIGHT;

        // Create background
        this.background = scene.add.rectangle(0, 0, width, height, GameConfig.COLORS.BACKGROUND);
        this.background.setOrigin(0, 0);
        this.background.setStrokeStyle(GameConfig.BORDER_THICKNESS, GameConfig.COLORS.BORDER);

        // Create player info text
        this.playerInfo = scene.add.text(10, height / 2, 'Player: Player 1', {
            fontSize: '16px',
            color: GameConfig.COLORS.PLAYER_1,
            fontFamily: 'Arial, sans-serif'
        });
        this.playerInfo.setOrigin(0, 0.5);

        // Create menu button
        this.menuButton = scene.add.rectangle(width - 60, height / 2, 50, 30);
        this.menuButton.setStrokeStyle(GameConfig.BORDER_THICKNESS, GameConfig.COLORS.BORDER);
        this.menuButton.setInteractive({ useHandCursor: true });
        this.menuButton.on('pointerover', this.onMenuButtonOver, this);
        this.menuButton.on('pointerout', this.onMenuButtonOut, this);
        this.menuButton.on('pointerdown', this.onMenuClick, this);

        this.menuText = scene.add.text(this.menuButton.x, this.menuButton.y, 'Menu', {
            fontSize: '14px',
            color: GameConfig.COLORS.TEXT,
            fontFamily: 'Arial, sans-serif'
        });
        this.menuText.setOrigin(0.5, 0.5);

        this.add([this.background, this.playerInfo, this.menuButton, this.menuText]);

        scene.add.existing(this);
    }

    private onMenuButtonOver() {
        this.menuButton.setFillStyle(GameConfig.COLORS.BUTTON_HOVER_BG);
        this.menuText.setColor(GameConfig.COLORS.BUTTON_HOVER_TEXT);
    }

    private onMenuButtonOut() {
        this.menuButton.setFillStyle(GameConfig.COLORS.BACKGROUND);
        this.menuText.setColor(GameConfig.COLORS.TEXT);
    }

    private onMenuClick() {
        // TODO: Implement menu opening logic
        console.log('Menu clicked');
    }

    // Method to update player info
    updatePlayerInfo(playerName: string, playerColor: string) {
        this.playerInfo.setText(`Player: ${playerName}`);
        this.playerInfo.setColor(playerColor);
    }
}