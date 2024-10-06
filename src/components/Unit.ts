import Phaser from 'phaser';
import { Tower } from './Tower';
import { GameConfig } from '../config/GameConfig';

export class Unit extends Phaser.GameObjects.Container {
    private body: Phaser.GameObjects.Arc;
    private speed: number = GameConfig.UNIT_SPEED; // pixels per second
    private targetTower: Tower | null = null;
    private path: Phaser.Curves.Line | null = null;
    private progress: number = 0;
    public ownerId: number;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene, x: number, y: number, size: number, color: number, ownerId: number) {
        super(scene, x, y);
        this.scene = scene;

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
                this.checkCollision();
            }
        }
    }

    private checkCollision() {
        const units = this.scene.children.getChildren().filter(child => child instanceof Unit) as Unit[];
        for (const otherUnit of units) {
            if (otherUnit !== this && otherUnit.ownerId !== this.ownerId) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, otherUnit.x, otherUnit.y);
                if (distance < this.body.radius + otherUnit.body.radius) {
                    this.collide(otherUnit);
                    break;
                }
            }
        }
    }

    private collide(otherUnit: Unit) {
        // Destroy both units
        this.destroy();
        otherUnit.destroy();

        // Create an explosion effect
        this.createExplosion();
    }

    private createExplosion() {
        const particles = this.scene.add.particles('pixel');
        const emitter = particles.createEmitter({
            speed: { min: -800, max: 800 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'SCREEN',
            lifespan: 300,
            gravityY: 800
        });

        emitter.setPosition(this.x, this.y);
        emitter.setTint(0xffff00, 0xff0000);
        emitter.explode(50);

        this.scene.time.delayedCall(300, () => {
            particles.destroy();
        });
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