import Phaser from 'phaser';
import { Tower } from '../components/Tower';
import { Unit } from '../components/Unit';
import { GameMap } from '../components/GameMap';
import { GameConfig } from '../config/GameConfig';
import { PoissonDiscSampling } from '../utils/PoissonDiscSampling';

export class TowerManager {
    private towers: Tower[] = [];
    private connections: Phaser.GameObjects.Rectangle[] = [];
    private units: Unit[] = [];

    constructor(private scene: Phaser.Scene, private gameMap: GameMap) {
        this.scene.events.on('unitGenerated', this.onUnitGenerated, this);
        this.scene.events.on('unitArrived', this.onUnitArrived, this);
    }

    createTowers() {
        const towerSize = this.gameMap.size * GameConfig.TOWER_SIZE_RATIO;
        const minDistance = this.gameMap.size * GameConfig.MIN_DISTANCE_RATIO;
        const padding = towerSize / 2;

        const points = this.generateTowerPositions(towerSize, minDistance, padding);

        for (let i = 0; i < GameConfig.NUM_TOWERS; i++) {
            const point = points[i];
            const towerX = this.gameMap.topLeft.x + point[0] + padding;
            const towerY = this.gameMap.topLeft.y + point[1] + padding;

            const towerColor = this.getTowerColor(i);
            const tower = new Tower(this.scene, towerX, towerY, towerSize, towerColor, i < GameConfig.NUM_PLAYERS ? i : null);
            this.towers.push(tower);
        }

        this.setupDragEvents();
    }

    private generateTowerPositions(towerSize: number, minDistance: number, padding: number): number[][] {
        const sampler = new PoissonDiscSampling(
            this.gameMap.size - 2 * padding,
            this.gameMap.size - 2 * padding,
            minDistance
        );
        return sampler.generate();
    }

    private getTowerColor(index: number): string {
        if (index < GameConfig.NUM_PLAYERS) {
            return GameConfig.COLORS[`PLAYER_${index + 1}` as keyof typeof GameConfig.COLORS];
        }
        return GameConfig.COLORS.EMPTY_TOWER;
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
            this.updateRoadColor(tower, pointer);
        }
    }

    private updateRoadColor(tower: Tower, pointer: Phaser.Input.Pointer) {
        const hoveredTower = this.getTowerAtPosition(pointer.x, pointer.y);
        if (hoveredTower && hoveredTower !== tower && this.canCreateConnection(tower, hoveredTower)) {
            const playerColor = GameConfig.COLORS[`PLAYER_${tower.ownerId! + 1}` as keyof typeof GameConfig.COLORS];
            const colorNumber = Number.parseInt(playerColor.replace('#', '0x'), 16);
            tower.setRoadColor(colorNumber);
        } else {
            tower.setRoadColor(0xFFFFFF);
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
        if (!fromTower.canCreateConnection()) return false;

        const line = new Phaser.Geom.Line(fromTower.x, fromTower.y, toTower.x, toTower.y);
        
        return !this.towers.some(tower => 
            tower !== fromTower && tower !== toTower &&
            Phaser.Geom.Intersects.LineToCircle(line, new Phaser.Geom.Circle(tower.x, tower.y, tower.width / 2))
        );
    }

    createConnection(fromTower: Tower, toTower: Tower) {
        if (!this.canCreateConnection(fromTower, toTower)) return;

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
            colorNumber
        );
        road.setRotation(angle);
        road.setStrokeStyle(2, 0x000000);
        road.setData('fromTower', fromTower);
        road.setData('toTower', toTower);
        road.setDepth(0); // Set depth to be below units and towers

        this.connections.push(road);
        fromTower.endDrag();
        fromTower.addConnection();

        this.bringTowersToTop();
    }

    private bringTowersToTop() {
        for (const tower of this.towers) {
            tower.setDepth(2); // Set towers to be above units and roads
        }
    }

    getTowerAtPosition(x: number, y: number): Tower | null {
        return this.towers.find(tower => tower.getBounds().contains(x, y)) || null;
    }

    getTowersByPlayer(playerIndex: number): Tower[] {
        return this.towers.filter(tower => tower.ownerId === playerIndex);
    }

    private onUnitGenerated(unit: Unit, sourceTower: Tower) {
        const connectedTowers = this.getConnectedTowers(sourceTower);
        if (connectedTowers.length > 0) {
            const targetTower = Phaser.Utils.Array.GetRandom(connectedTowers);
            unit.setTarget(targetTower, sourceTower);
            this.units.push(unit);
        } else {
            sourceTower.updateLife(sourceTower.life + 1);
            unit.destroy();
        }
    }

    private onUnitArrived(unit: Unit, targetTower: Tower) {
        const index = this.units.indexOf(unit);
        if (index > -1) {
            this.units.splice(index, 1);
        }
        
        if (targetTower instanceof Tower) {
            targetTower.updateLife(targetTower.life + 1);
        }
    }

    private getConnectedTowers(tower: Tower): Tower[] {
        return this.towers.filter(t => 
            t !== tower && this.connections.some(conn => 
                (conn.getData('fromTower') === tower && conn.getData('toTower') === t) ||
                (conn.getData('fromTower') === t && conn.getData('toTower') === tower)
            )
        );
    }

    update(time: number, delta: number) {
        for (const unit of this.units) {
            unit.update(time, delta);
        }
    }
}