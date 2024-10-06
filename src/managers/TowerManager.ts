import Phaser from 'phaser';
import { Tower } from '../components/Tower';
import { GameMap } from '../components/GameMap';
import { GameConfig } from '../config/GameConfig';
import { PoissonDiscSampling } from '../utils/PoissonDiscSampling';

export class TowerManager {
    private towers: Tower[] = [];
    private connections: Phaser.GameObjects.Rectangle[] = [];

    constructor(private scene: Phaser.Scene, private gameMap: GameMap) {}

    createTowers() {
        const towerSize = this.gameMap.size * GameConfig.TOWER_SIZE_RATIO;
        const minDistance = this.gameMap.size * GameConfig.MIN_DISTANCE_RATIO;
        const padding = towerSize / 2;

        const sampler = new PoissonDiscSampling(
            this.gameMap.size - 2 * padding,
            this.gameMap.size - 2 * padding,
            minDistance
        );
        const points = sampler.generate();

        for (let i = 0; i < GameConfig.NUM_TOWERS; i++) {
            const point = points[i];
            const towerX = this.gameMap.topLeft.x + point[0] + padding;
            const towerY = this.gameMap.topLeft.y + point[1] + padding;

            let towerColor: string;
            if (i < GameConfig.NUM_PLAYERS) {
                towerColor = GameConfig.COLORS[`PLAYER_${i + 1}` as keyof typeof GameConfig.COLORS];
            } else {
                towerColor = GameConfig.COLORS.EMPTY_TOWER;
            }

            const tower = new Tower(this.scene, towerX, towerY, towerSize, towerColor, i < GameConfig.NUM_PLAYERS ? i : null);
            this.towers.push(tower);
        }

        this.setupDragEvents();
    }

    setupDragEvents() {
        this.scene.input.on('dragstart', this.onDragStart, this);
        this.scene.input.on('drag', this.onDrag, this);
        this.scene.input.on('dragend', this.onDragEnd, this);
    }

    onDragStart(pointer: Phaser.Input.Pointer, tower: Tower) {
        if (tower.ownerId === this.scene.data.get('currentPlayer')) {
            tower.startDrag(pointer);
        }
    }

    onDrag(pointer: Phaser.Input.Pointer, tower: Tower) {
        if (tower.ownerId === this.scene.data.get('currentPlayer')) {
            tower.updateDrag(pointer);
            const hoveredTower = this.getTowerAtPosition(pointer.x, pointer.y);
            if (hoveredTower && hoveredTower !== tower && this.canCreateConnection(tower, hoveredTower)) {
                const playerColor = GameConfig.COLORS[`PLAYER_${tower.ownerId! + 1}` as keyof typeof GameConfig.COLORS];
                const colorNumber = Number.parseInt(playerColor.replace('#', '0x'), 16);
                tower.setRoadColor(colorNumber); // Fill with player color, default black border
            } else {
                tower.setRoadColor(0xFFFFFF); // White fill when not hovering over a valid tower, default black border
            }
        }
    }

    onDragEnd(pointer: Phaser.Input.Pointer, tower: Tower) {
        if (tower.ownerId === this.scene.data.get('currentPlayer')) {
            const targetTower = this.getTowerAtPosition(pointer.x, pointer.y);
            if (targetTower && targetTower !== tower && this.canCreateConnection(tower, targetTower)) {
                this.createConnection(tower, targetTower);
            } else {
                tower.endDrag();
            }
        }
    }

    canCreateConnection(fromTower: Tower, toTower: Tower): boolean {
        const line = new Phaser.Geom.Line(fromTower.x, fromTower.y, toTower.x, toTower.y);
        
        for (const tower of this.towers) {
            if (tower !== fromTower && tower !== toTower) {
                const circle = new Phaser.Geom.Circle(tower.x, tower.y, tower.width / 2);
                if (Phaser.Geom.Intersects.LineToCircle(line, circle)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    createConnection(fromTower: Tower, toTower: Tower) {
        const playerColor = GameConfig.COLORS[`PLAYER_${fromTower.ownerId! + 1}` as keyof typeof GameConfig.COLORS];
        const colorNumber = Number.parseInt(playerColor.replace('#', '0x'), 16);

        const angle = Phaser.Math.Angle.Between(fromTower.x, fromTower.y, toTower.x, toTower.y);
        const distance = Phaser.Math.Distance.Between(fromTower.x, fromTower.y, toTower.x, toTower.y);
        const roadWidth = fromTower.width / 2;

        const road = this.scene.add.rectangle(
            fromTower.x + Math.cos(angle) * distance / 2,
            fromTower.y + Math.sin(angle) * distance / 2,
            distance,
            roadWidth,
            colorNumber  // Set the fill color to the player's color
        );
        road.setRotation(angle);
        road.setStrokeStyle(2, 0x000000);  // Set the border color to black

        this.connections.push(road);
        fromTower.endDrag();

        // Bring all towers to the top
        for (const tower of this.towers) {
            this.scene.children.bringToTop(tower);
        }
    }

    getTowerAtPosition(x: number, y: number): Tower | null {
        return this.towers.find(tower => tower.getBounds().contains(x, y)) || null;
    }

    getTowersByPlayer(playerIndex: number): Tower[] {
        return this.towers.filter(tower => tower.ownerId === playerIndex);
    }
}