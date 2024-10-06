import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Tower extends Phaser.GameObjects.Container {
    private body: Phaser.GameObjects.Rectangle;
    private road: Phaser.GameObjects.Rectangle | null = null;
    public ownerId: number | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, size: number, color: string, ownerId: number | null = null) {
        super(scene, x, y);
        
        this.ownerId = ownerId;
        
        // Create the tower body
        this.body = scene.add.rectangle(0, 0, size, size);
        this.body.setStrokeStyle(2, 0x000000);
        
        if (color === GameConfig.COLORS.EMPTY_TOWER) {
            this.body.setFillStyle(0xFFFFFF); // White background for empty towers
        } else {
            this.body.setFillStyle(Number.parseInt(color.replace('#', '0x'), 16));
        }
        
        this.add(this.body);
        this.setSize(size, size);
        this.setInteractive();
        scene.add.existing(this);
    }

    startDrag(pointer: Phaser.Input.Pointer) {
        const roadWidth = this.width / 2;
        this.road = this.scene.add.rectangle(this.x, this.y, roadWidth, roadWidth, 0xFFFFFF);
        this.road.setStrokeStyle(2, 0x000000);
        this.road.setOrigin(0.5, 0.5);
        this.scene.children.bringToTop(this);
    }

    updateDrag(pointer: Phaser.Input.Pointer) {
        if (this.road) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.x, pointer.y);
            const distance = Phaser.Math.Distance.Between(this.x, this.y, pointer.x, pointer.y);
            this.road.setSize(distance, this.width / 2);
            this.road.setRotation(angle);
            this.road.setPosition(this.x + Math.cos(angle) * distance / 2, this.y + Math.sin(angle) * distance / 2);
        }
    }

    endDrag() {
        if (this.road) {
            this.road.destroy();
            this.road = null;
        }
    }

    setRoadColor(fillColor: number, strokeColor: number = 0x000000) {
        if (this.road) {
            this.road.setFillStyle(fillColor);
            this.road.setStrokeStyle(2, strokeColor);
        }
    }
}