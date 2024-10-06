import Phaser from 'phaser';

export class Tower extends Phaser.GameObjects.Rectangle {
    constructor(scene: Phaser.Scene, x: number, y: number, size: number) {
        super(scene, x, y, size, size);
        
        this.setStrokeStyle(2, 0x000000);
        this.setFillStyle(0x000000, 0); // Transparent fill
        
        scene.add.existing(this);
    }
}