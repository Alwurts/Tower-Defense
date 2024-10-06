import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { Unit } from './Unit';

export class Tower extends Phaser.GameObjects.Container {
    private body: Phaser.GameObjects.Rectangle;
    private road: Phaser.GameObjects.Rectangle | null = null;
    private lifeText: Phaser.GameObjects.Text;
    public ownerId: number | null = null;
    public life: number = 5;
    public outgoingConnections: number = 0;
    private unitGenerationTimer: Phaser.Time.TimerEvent | null = null;
    private lifeGrowthTimer: Phaser.Time.TimerEvent | null = null;
    private lastConnectionIndex: number = -1;

    constructor(scene: Phaser.Scene, x: number, y: number, size: number, color: string, ownerId: number | null = null) {
        super(scene, x, y);
        
        this.ownerId = ownerId;
        
        this.body = this.createTowerBody(size, color);
        this.add(this.body);
        
        this.lifeText = this.scene.add.text(0, 0, this.life.toString(), {
            fontSize: '16px',
            color: '#000000',
            align: 'center'
        });
        this.lifeText.setOrigin(0.5);
        this.add(this.lifeText);
        
        this.setSize(size, size);
        this.setInteractive();
        scene.add.existing(this);

        if (this.ownerId !== null) {
            this.startUnitGeneration();
            this.startLifeGrowth();
        }

        this.setDepth(2); // Set tower depth to be above units and roads
    }

    private startUnitGeneration() {
        if (this.unitGenerationTimer) {
            this.unitGenerationTimer.remove();
        }
        this.unitGenerationTimer = this.scene.time.addEvent({
            delay: 1500, // Generate a unit every 1.5 seconds when there are outgoing connections
            callback: this.generateUnit,
            callbackScope: this,
            loop: true
        });
    }

    private startLifeGrowth() {
        if (this.lifeGrowthTimer) {
            this.lifeGrowthTimer.remove();
        }
        this.lifeGrowthTimer = this.scene.time.addEvent({
            delay: 3000, // Increase life every 3 seconds when there are no outgoing connections
            callback: this.growLife,
            callbackScope: this,
            loop: true
        });
    }

    private generateUnit() {
        if (this.ownerId === null || this.outgoingConnections === 0) return;

        const unitColor = Number(GameConfig.COLORS[`PLAYER_${this.ownerId + 1}` as keyof typeof GameConfig.COLORS].replace('#', '0x'));
        const unit = new Unit(this.scene, this.x, this.y, this.width / 3, unitColor, this.ownerId);
        
        this.scene.events.emit('unitGenerated', unit, this);
    }

    private growLife() {
        if (this.ownerId === null || this.outgoingConnections > 0) return;
        this.updateLife(this.life + 1, this.ownerId);
    }

    private createTowerBody(size: number, color: string): Phaser.GameObjects.Rectangle {
        const body = this.scene.add.rectangle(0, 0, size, size);
        body.setStrokeStyle(2, 0x000000);
        
        const fillColor = color === GameConfig.COLORS.EMPTY_TOWER
            ? 0xFFFFFF
            : Number.parseInt(color.replace('#', '0x'), 16);
        
        body.setFillStyle(fillColor);
        return body;
    }

    startDrag(pointer: Phaser.Input.Pointer) {
        if (!this.canCreateOutgoingConnection()) return;

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
            this.road.setPosition(
                this.x + Math.cos(angle) * distance / 2,
                this.y + Math.sin(angle) * distance / 2
            );
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

    updateLife(newLife: number, unitOwnerId: number) {
        if (this.ownerId === null) {
            this.life = Phaser.Math.Clamp(this.life - 1, 0, 50);
            if (this.life === 0) {
                this.changeOwner(unitOwnerId);
            }
        } else if (this.ownerId === unitOwnerId) {
            this.life = Phaser.Math.Clamp(newLife, 0, 50);
        } else {
            this.life = Phaser.Math.Clamp(this.life - 1, 0, 50);
            if (this.life === 0) {
                this.changeOwner(unitOwnerId);
            }
        }
        this.lifeText.setText(this.life.toString());
    }

    changeOwner(newOwnerId: number) {
        this.ownerId = newOwnerId;
        this.life = 1;
        this.updateColor();
        this.startUnitGeneration();
        this.startLifeGrowth();
    }

    updateColor() {
        if (this.ownerId !== null) {
            const color = GameConfig.COLORS[`PLAYER_${this.ownerId + 1}` as keyof typeof GameConfig.COLORS];
            const fillColor = Number.parseInt(color.replace('#', '0x'), 16);
            this.body.setFillStyle(fillColor);
        } else {
            this.body.setFillStyle(0xFFFFFF); // White for neutral towers
        }
    }

    highlight() {
        if (this.canCreateOutgoingConnection() && this.ownerId !== null) {
            const color = GameConfig.COLORS[`PLAYER_${this.ownerId + 1}` as keyof typeof GameConfig.COLORS];
            const highlightColor = Phaser.Display.Color.HexStringToColor(color).lighten(50).color;
            this.body.setFillStyle(highlightColor);
        }
    }

    unhighlight() {
        this.updateColor();
    }

    canCreateOutgoingConnection(): boolean {
        if (this.life <= 10) return this.outgoingConnections < 1;
        if (this.life <= 30) return this.outgoingConnections < 2;
        return this.outgoingConnections < 3;
    }

    addOutgoingConnection() {
        this.outgoingConnections = Math.min(3, this.outgoingConnections + 1);
    }

    removeOutgoingConnection() {
        this.outgoingConnections = Math.max(0, this.outgoingConnections - 1);
    }

    getNextConnectionIndex(): number {
        this.lastConnectionIndex = (this.lastConnectionIndex + 1) % this.outgoingConnections;
        return this.lastConnectionIndex;
    }
}