import Phaser from 'phaser';
import { Tower } from './Tower';
import { GameConfig } from '../config/GameConfig';

export class Unit extends Phaser.GameObjects.Container {
    private body: Phaser.GameObjects.Arc;
    private speed: number = 50; // pixels per second
    private targetTower: Tower | null = null;
    private path: Phaser.Curves.Line | null = null;
    private progress: number = 0;
    public ownerId: number;

    constructor(scene: Phaser.Scene, x: number, y: number, size: number, color: number, ownerId: number) {
        super(scene, x, y);

        this.ownerId = ownerId;

        // Create a circle instead of a triangle
        this.body = scene.add.circle(0, 0, size / 2, color);
        this.body.setStrokeStyle(2, GameConfig.COLORS.BORDER);
        this.add(this.body);

        scene.add.existing(this);
        this.setDepth(1); // Set depth to be above roads but below towers
    }

    setTarget(tower: Tower, startTower: Tower) {
        this.targetTower = tower;
        const startPoint = new Phaser.Math.Vector2(startTower.x, startTower.y);
        const endPoint = new Phaser.Math.Vector2(tower.x, tower.y);
        this.path = new Phaser.Curves.Line(startPoint, endPoint);
        this.progress = 0;

        // Set initial position
        this.updatePosition(0);
    }

    update(time: number, delta: number) {
        if (this.path && this.targetTower) {
            this.progress += (this.speed * delta) / (1000 * this.path.getLength());
            
            if (this.progress >= 1) {
                this.arrive();
            } else {
                this.updatePosition(this.progress);
            }
        }
    }

    private updatePosition(t: number) {
        if (this.path) {
            const position = this.path.getPoint(t);
            this.setPosition(position.x, position.y);
        }
    }

    arrive() {
        if (this.targetTower) {
            this.scene.events.emit('unitArrived', this, this.targetTower);
        }
        this.destroy();
    }
}