import Phaser from "phaser";
import type { Tower } from "./Tower";
import { GameConfig } from "../config/GameConfig";

export class Unit extends Phaser.GameObjects.Container {
	public scene: Phaser.Scene;
	private unitBody: Phaser.GameObjects.Arc;
	private speed = GameConfig.UNIT_SPEED; // pixels per second
	private targetTower: Tower | null = null;
	private path: Phaser.Curves.Line | null = null;
	private progress = 0;
	public ownerId: number;

	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		size: number,
		color: number,
		ownerId: number,
	) {
		super(scene, x, y);
		this.scene = scene;
		this.ownerId = ownerId;

		// Create a circle instead of a triangle
		this.unitBody = scene.add.circle(0, 0, size / 2, color);
		this.unitBody.setStrokeStyle(2, GameConfig.COLORS.BORDER);
		this.add(this.unitBody);

		scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
		this.setDepth(1); // Set depth to be above roads but below towers
	}

	setTarget(tower: Tower | undefined, startTower: Tower | undefined) {
		if (!tower || !startTower) {
			console.warn(
				"Invalid target or start tower. Unable to set target for unit.",
			);
			return;
		}

		this.targetTower = tower;
		const startPoint = new Phaser.Math.Vector2(startTower.x, startTower.y);
		const endPoint = new Phaser.Math.Vector2(tower.x, tower.y);
		this.path = new Phaser.Curves.Line(startPoint, endPoint);
		this.progress = 0;

		// Set initial position
		this.updatePosition(0);
	}

	update(delta: number) {
		if (this.path && this.targetTower) {
			this.progress += (this.speed * delta) / (1000 * this.path.getLength());

			if (this.progress >= 1) {
				this.arrive();
			} else {
				this.updatePosition(this.progress);
				this.checkCollision();
			}
		} else {
			console.warn("Unit has no path or target. Destroying unit.");
			this.destroy();
		}
	}

	private checkCollision() {
		if (!this.scene) return;

		const units = this.scene.children
			.getChildren()
			.filter((child) => child instanceof Unit) as unknown as Unit[];
		for (const otherUnit of units) {
			if (otherUnit !== this && otherUnit.ownerId !== this.ownerId) {
				const distance = Phaser.Math.Distance.Between(
					this.x,
					this.y,
					otherUnit.x,
					otherUnit.y,
				);
				if (distance < this.unitBody.radius + otherUnit.unitBody.radius) {
					this.collide(otherUnit);
					break;
				}
			}
		}
	}

	private collide(otherUnit: Unit) {
		// Create an explosion effect before destroying the units
		this.createExplosion();
		otherUnit.createExplosion();

		// Destroy both units
		this.destroy();
		otherUnit.destroy();
	}

	private createExplosion() {
		if (!this.scene) return;

		const particles = this.scene.add.particles(0, 0, "pixel", {
			speed: { min: -800, max: 800 },
			angle: { min: 0, max: 360 },
			scale: { start: 0.5, end: 0 },
			blendMode: "SCREEN",
			lifespan: 300,
			gravityY: 800,
			quantity: 50,
			emitting: false,
			tint: [0xffff00, 0xff0000], // Set particle colors here
		});

		particles.setPosition(this.x, this.y);
		particles.explode(50);

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
		if (this.targetTower && this.scene) {
			// Add this check
			this.scene.events.emit("unitArrived", this, this.targetTower);
		} else {
			console.warn("Unable to arrive: missing target tower or scene.");
		}
		this.destroy();
	}
}
