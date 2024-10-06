import Phaser from "phaser";
import { Tower } from "../components/Tower";
import { Unit } from "../components/Unit";
import { GameMap } from "../components/GameMap";
import { GameConfig } from "../config/GameConfig";
import { PoissonDiscSampling } from "../utils/PoissonDiscSampling";

export class TowerManager extends Phaser.Events.EventEmitter {
	private towers: Tower[] = [];
	private connections: Phaser.GameObjects.Container[] = []; // Changed from Rectangle to Container
	private units: Unit[] = [];
	private obstacles: Phaser.GameObjects.Rectangle[] = [];
	private cuttingLine: Phaser.GameObjects.Line | null = null;
	private isDrawingCuttingLine = false;
	private cuttingLineStart: Phaser.Math.Vector2 | null = null;
	private cuttingLineEnd: Phaser.Math.Vector2 | null = null;
	private tempRoad: Phaser.GameObjects.Graphics | null = null;

	constructor(
		private scene: Phaser.Scene,
		private gameMap: GameMap,
	) {
		super();
		this.scene.events.on("unitGenerated", this.onUnitGenerated, this);
		this.scene.events.on("unitArrived", this.onUnitArrived, this);
	}

	createTowers() {
		const towerSize = this.gameMap.size * GameConfig.TOWER_SIZE_RATIO;
		const minDistance = this.gameMap.size * GameConfig.MIN_DISTANCE_RATIO;
		const padding = towerSize / 2;

		// Generate obstacles first
		const numObstacles = Phaser.Math.Between(
			GameConfig.MIN_OBSTACLES,
			GameConfig.MAX_OBSTACLES,
		);
		this.generateObstacles(towerSize, minDistance, padding, numObstacles);

		// Generate towers
		const numTowers = Phaser.Math.Between(
			GameConfig.MIN_TOWERS,
			GameConfig.MAX_TOWERS,
		);
		let points = this.generateTowerPositions(towerSize, minDistance, padding);

		// Check if we have enough points and regenerate if necessary
		while (points.length < numTowers) {
			console.warn("Not enough valid positions generated. Retrying...");
			points = this.generateTowerPositions(
				towerSize,
				minDistance * 0.9,
				padding,
			);
		}

		// Create towers for the available points
		for (let i = 0; i < numTowers; i++) {
			let point = points[i];
			let towerX = this.gameMap.topLeft.x + point[0] + padding;
			let towerY = this.gameMap.topLeft.y + point[1] + padding;

			// Check for overlaps and regenerate position if necessary
			while (this.checkOverlap(towerX, towerY, towerSize)) {
				point = this.generateSinglePosition(minDistance, padding);
				towerX = this.gameMap.topLeft.x + point[0] + padding;
				towerY = this.gameMap.topLeft.y + point[1] + padding;
			}

			const towerColor = this.getTowerColor(i);
			const tower = new Tower(
				this.scene,
				towerX,
				towerY,
				towerSize,
				towerColor,
				i < GameConfig.NUM_PLAYERS ? i : null,
			);
			this.towers.push(tower);
		}

		this.setupDragEvents();
	}

	private generateObstacles(
		towerSize: number,
		minDistance: number,
		padding: number,
		numObstacles: number,
	) {
		const obstacleSize = towerSize * 0.8; // Slightly smaller than towers
		let obstaclePoints = this.generatePositions(
			minDistance,
			padding,
			numObstacles,
		);

		this.obstacles = [];
		for (let i = 0; i < numObstacles; i++) {
			let point = obstaclePoints[i];
			let obstacleX = this.gameMap.topLeft.x + point[0] + padding;
			let obstacleY = this.gameMap.topLeft.y + point[1] + padding;

			// Check for overlaps and regenerate position if necessary
			while (this.checkOverlap(obstacleX, obstacleY, obstacleSize)) {
				point = this.generateSinglePosition(minDistance, padding);
				obstacleX = this.gameMap.topLeft.x + point[0] + padding;
				obstacleY = this.gameMap.topLeft.y + point[1] + padding;
			}

			const obstacle = this.scene.add.rectangle(
				obstacleX,
				obstacleY,
				obstacleSize,
				obstacleSize,
				GameConfig.COLORS.OBSTACLE,
			);
			obstacle.setStrokeStyle(2, GameConfig.COLORS.BORDER);
			this.obstacles.push(obstacle);
		}
	}

	private checkOverlap(x: number, y: number, size: number): boolean {
		const checkObject = new Phaser.Geom.Rectangle(
			x - size / 2,
			y - size / 2,
			size,
			size,
		);

		// Check overlap with towers
		for (const tower of this.towers) {
			if (
				Phaser.Geom.Intersects.RectangleToRectangle(
					checkObject,
					tower.getBounds(),
				)
			) {
				return true;
			}
		}

		// Check overlap with obstacles
		for (const obstacle of this.obstacles) {
			if (
				Phaser.Geom.Intersects.RectangleToRectangle(
					checkObject,
					obstacle.getBounds(),
				)
			) {
				return true;
			}
		}

		return false;
	}

	private generateSinglePosition(
		minDistance: number,
		padding: number,
	): number[] {
		const sampler = new PoissonDiscSampling(
			this.gameMap.size - 2 * padding,
			this.gameMap.size - 2 * padding,
			minDistance,
		);
		const points = sampler.generate();
		return points[0] || [0, 0]; // Fallback to [0, 0] if no point is generated
	}

	private generatePositions(
		minDistance: number,
		padding: number,
		count: number,
	): number[][] {
		const sampler = new PoissonDiscSampling(
			this.gameMap.size - 2 * padding,
			this.gameMap.size - 2 * padding,
			minDistance,
		);
		let points = sampler.generate();

		// If we don't have enough points, reduce the minimum distance and try again
		while (points.length < count) {
			minDistance *= 0.9; // Reduce minimum distance by 10%
			sampler.setMinDistance(minDistance);
			points = sampler.generate();
			console.warn(`Retrying with reduced minimum distance: ${minDistance}`);
		}

		return points.slice(0, count);
	}

	private generateTowerPositions(
		minDistance: number,
		padding: number,
		numTowers: number,
	): number[][] {
		return this.generatePositions(minDistance, padding, numTowers);
	}

	private getTowerColor(index: number): string {
		if (index < GameConfig.NUM_PLAYERS) {
			return GameConfig.COLORS[
				`PLAYER_${index + 1}` as keyof typeof GameConfig.COLORS
			] as string;
		}
		return GameConfig.COLORS.EMPTY_TOWER;
	}

	setupDragEvents() {
		this.scene.input.on("dragstart", this.onDragStart, this);
		this.scene.input.on("drag", this.onDrag, this);
		this.scene.input.on("dragend", this.onDragEnd, this);
		this.scene.input.on("pointerdown", this.onPointerDown, this);
		this.scene.input.on("pointermove", this.onPointerMove, this);
		this.scene.input.on("pointerup", this.onPointerUp, this);
	}

	onDragStart(_pointer: Phaser.Input.Pointer, tower: Tower) {
		if (tower.ownerId === this.scene.data.get("currentPlayer")) {
			tower.startDrag();
			this.tempRoad = this.scene.add.graphics();
		}
	}

	onDrag(pointer: Phaser.Input.Pointer, tower: Tower) {
		if (tower.ownerId === this.scene.data.get("currentPlayer")) {
			if (tower.canCreateOutgoingConnection()) {
				tower.updateDrag(pointer);
				this.updateTempRoad(tower, pointer);
			} else {
				tower.endDrag();
				this.clearTempRoad();
			}
		}
	}

	onDragEnd(pointer: Phaser.Input.Pointer, tower: Tower) {
		if (tower.ownerId === this.scene.data.get("currentPlayer")) {
			const targetTower = this.getTowerAtPosition(pointer.x, pointer.y);
			if (
				targetTower &&
				targetTower !== tower &&
				this.canCreateConnection(tower, targetTower)
			) {
				this.createConnection(tower, targetTower);
			} else {
				tower.endDrag();
			}
			this.clearTempRoad();
		}
	}

	private updateTempRoad(fromTower: Tower, pointer: Phaser.Input.Pointer) {
		if (!this.tempRoad) return;

		this.tempRoad.clear();

		const toTower = this.getTowerAtPosition(pointer.x, pointer.y);
		const roadWidth = fromTower.width * GameConfig.ROAD_WIDTH_RATIO;

		if (
			toTower &&
			toTower !== fromTower &&
			this.canCreateConnection(fromTower, toTower)
		) {
			const fromColor =
				GameConfig.COLORS[
					`PLAYER_${fromTower.ownerId! + 1}` as keyof typeof GameConfig.COLORS
				];
			const fromColorNumber =
				typeof fromColor === "string"
					? Number.parseInt(fromColor.replace("#", "0x"), 16)
					: fromColor;

			this.tempRoad.lineStyle(roadWidth, fromColorNumber);
		} else {
			this.tempRoad.lineStyle(roadWidth, 0xffffff);
		}

		this.tempRoad.beginPath();
		this.tempRoad.moveTo(fromTower.x, fromTower.y);
		this.tempRoad.lineTo(pointer.x, pointer.y);
		this.tempRoad.strokePath();
	}

	private clearTempRoad() {
		if (this.tempRoad) {
			this.tempRoad.clear();
			this.tempRoad.destroy();
			this.tempRoad = null;
		}
	}

	public canCreateConnection(fromTower: Tower, toTower: Tower): boolean {
		if (!fromTower.canCreateOutgoingConnection()) return false;

		const line = new Phaser.Geom.Line(
			fromTower.x,
			fromTower.y,
			toTower.x,
			toTower.y,
		);

		// Check for intersections with other towers
		const towerIntersection = this.towers.some(
			(tower) =>
				tower !== fromTower &&
				tower !== toTower &&
				Phaser.Geom.Intersects.LineToCircle(
					line,
					new Phaser.Geom.Circle(tower.x, tower.y, tower.width / 2),
				),
		);

		if (towerIntersection) return false;

		// Check for intersections with obstacles
		const obstacleIntersection = this.obstacles.some((obstacle) =>
			Phaser.Geom.Intersects.LineToRectangle(line, obstacle.getBounds()),
		);

		return !obstacleIntersection;
	}

	public createConnection(fromTower: Tower, toTower: Tower) {
		if (!this.canCreateConnection(fromTower, toTower)) return;

		// Check for existing connection in the opposite direction
		const existingConnection = this.connections.find(
			(conn) =>
				conn.getData("fromTower") === toTower &&
				conn.getData("toTower") === fromTower,
		);

		if (existingConnection) {
			// Update both the existing and new connection to be two-colored
			this.updateTwoColorRoad(existingConnection, toTower, fromTower);
			this.createNewRoad(fromTower, toTower);
		} else {
			// Create new connection
			this.createNewRoad(fromTower, toTower);
		}

		fromTower.endDrag();
		fromTower.addOutgoingConnection();

		this.bringTowersToTop();
	}

	private createNewRoad(fromTower: Tower, toTower: Tower) {
		const angle = Phaser.Math.Angle.Between(
			fromTower.x,
			fromTower.y,
			toTower.x,
			toTower.y,
		);
		const distance = Phaser.Math.Distance.Between(
			fromTower.x,
			fromTower.y,
			toTower.x,
			toTower.y,
		);
		const roadWidth = fromTower.width * GameConfig.ROAD_WIDTH_RATIO;

		const road = new Phaser.GameObjects.Container(
			this.scene,
			fromTower.x + (Math.cos(angle) * distance) / 2,
			fromTower.y + (Math.sin(angle) * distance) / 2,
		);

		const graphics = this.scene.add.graphics();
		road.add(graphics);

		road.setRotation(angle);
		road.setSize(distance, roadWidth);
		road.setData("fromTower", fromTower);
		road.setData("toTower", toTower);
		road.setData("graphics", graphics);
		road.setDepth(0);

		this.scene.add.existing(road);

		this.updateRoadColor(road, fromTower, toTower);

		this.connections.push(road);
	}

	private updateTwoColorRoad(
		road: Phaser.GameObjects.Container,
		fromTower: Tower,
		toTower: Tower,
	) {
		this.updateRoadColor(road, fromTower, toTower);
	}

	private updateRoadColor(
		road: Phaser.GameObjects.Container,
		fromTower: Tower | undefined,
		toTower: Tower | undefined,
	) {
		const fromColor =
			fromTower && fromTower.ownerId !== null
				? GameConfig.COLORS[
						`PLAYER_${fromTower.ownerId + 1}` as keyof typeof GameConfig.COLORS
					]
				: GameConfig.COLORS.EMPTY_TOWER;
		const toColor =
			toTower && toTower.ownerId !== null
				? GameConfig.COLORS[
						`PLAYER_${toTower.ownerId + 1}` as keyof typeof GameConfig.COLORS
					]
				: GameConfig.COLORS.EMPTY_TOWER;

		const fromColorNumber =
			typeof fromColor === "string"
				? Number.parseInt(fromColor.replace("#", "0x"), 16)
				: fromColor;
		const toColorNumber =
			typeof toColor === "string"
				? Number.parseInt(toColor.replace("#", "0x"), 16)
				: toColor;

		const graphics = road.getData("graphics") as Phaser.GameObjects.Graphics;
		if (!graphics) {
			console.error("Graphics object not found in road container");
			return;
		}

		graphics.clear();

		const roadWidth = fromTower
			? fromTower.width * GameConfig.ROAD_WIDTH_RATIO
			: 10; // Default width if fromTower is undefined
		const distance = road.width;

		// Check if there's a connection in both directions
		const hasBothWayConnection =
			fromTower &&
			toTower &&
			this.connections.some(
				(conn) =>
					conn.getData("fromTower") === toTower &&
					conn.getData("toTower") === fromTower,
			);

		if (
			fromTower &&
			toTower &&
			fromTower.ownerId !== null &&
			toTower.ownerId !== null &&
			fromTower.ownerId !== toTower.ownerId &&
			hasBothWayConnection
		) {
			// Two-color road only if there's a connection in both directions
			graphics.fillStyle(fromColorNumber);
			graphics.fillRect(-distance / 2, -roadWidth / 2, distance / 2, roadWidth);

			graphics.fillStyle(toColorNumber);
			graphics.fillRect(0, -roadWidth / 2, distance / 2, roadWidth);
		} else {
			// Single-color road
			graphics.fillStyle(fromColorNumber);
			graphics.fillRect(-distance / 2, -roadWidth / 2, distance, roadWidth);
		}

		graphics.lineStyle(2, 0x000000);
		graphics.strokeRect(-distance / 2, -roadWidth / 2, distance, roadWidth);
	}

	private removeConnection(fromTower: Tower, toTower: Tower) {
		const connectionIndex = this.connections.findIndex(
			(conn) =>
				conn.getData("fromTower") === fromTower &&
				conn.getData("toTower") === toTower,
		);

		if (connectionIndex !== -1) {
			const connection = this.connections[connectionIndex];
			connection.destroy();
			this.connections.splice(connectionIndex, 1);
			fromTower.removeOutgoingConnection();
		}
	}

	private bringTowersToTop() {
		for (const tower of this.towers) {
			tower.setDepth(2); // Set towers to be above units and roads
		}
	}

	getTowerAtPosition(x: number, y: number): Tower | null {
		return (
			this.towers.find((tower) => tower.getBounds().contains(x, y)) || null
		);
	}

	getTowersByPlayer(playerIndex: number): Tower[] {
		return this.towers.filter((tower) => tower.ownerId === playerIndex);
	}

	private onUnitGenerated(unit: Unit, sourceTower: Tower) {
		const connectedTowers = this.getConnectedTowers(sourceTower);
		if (connectedTowers.length > 0) {
			const connectionIndex = sourceTower.getNextConnectionIndex();
			const targetTower = connectedTowers[connectionIndex];
			if (targetTower) {
				unit.setTarget(targetTower, sourceTower);
				this.units.push(unit);
			} else {
				console.warn("No valid target tower found. Destroying unit.");
				unit.destroy();
			}
		} else {
			console.warn("No connected towers found. Destroying unit.");
			unit.destroy();
		}
	}

	private onUnitArrived(unit: Unit, targetTower: Tower) {
		const index = this.units.indexOf(unit);
		if (index > -1) {
			this.units.splice(index, 1);
		}

		if (targetTower instanceof Tower) {
			const oldOwnerId = targetTower.ownerId;
			if (targetTower.ownerId === null) {
				targetTower.updateLife(targetTower.life - 1, unit.ownerId);
			} else if (targetTower.ownerId === unit.ownerId) {
				targetTower.updateLife(targetTower.life + 1, unit.ownerId);
			} else {
				targetTower.updateLife(targetTower.life - 1, unit.ownerId);
			}

			// If the tower changed ownership, update its connections
			if (oldOwnerId !== targetTower.ownerId) {
				this.updateConnectionsForTower(targetTower);
			}

			// Check for game end condition
			this.checkGameEnd();
		}
	}

	private updateConnectionsForTower(tower: Tower) {
		// Update the color of connections for the new owner
		for (const conn of this.connections) {
			if (
				conn.getData("fromTower") === tower ||
				conn.getData("toTower") === tower
			) {
				this.updateRoadColor(
					conn,
					conn.getData("fromTower"),
					conn.getData("toTower"),
				);
			}
		}

		// Make the tower draggable if it belongs to the current player
		if (tower.ownerId === this.scene.data.get("currentPlayer")) {
			this.scene.input.setDraggable(
				tower as unknown as Phaser.GameObjects.GameObject,
			);
		}
	}

	private getConnectedTowers(tower: Tower): Tower[] {
		return this.towers.filter(
			(t) =>
				t !== tower &&
				this.connections.some(
					(conn) =>
						conn.getData("fromTower") === tower &&
						conn.getData("toTower") === t,
				),
		);
	}

	update(_time: number, delta: number) {
		for (const unit of this.units) {
			unit.update(delta);
		}
	}

	private onPointerDown = (pointer: Phaser.Input.Pointer) => {
		if (!this.getTowerAtPosition(pointer.x, pointer.y)) {
			this.startCutting(pointer.x, pointer.y);
		}
	};

	private onPointerMove = (pointer: Phaser.Input.Pointer) => {
		if (this.isDrawingCuttingLine) {
			this.updateCutting(pointer.x, pointer.y);
		}
	};

	private onPointerUp = () => {
		if (this.isDrawingCuttingLine) {
			this.endCutting();
		}
	};

	private startCutting(x: number, y: number) {
		this.isDrawingCuttingLine = true;
		this.cuttingLineStart = new Phaser.Math.Vector2(x, y);
		this.cuttingLineEnd = new Phaser.Math.Vector2(x, y);
		this.cuttingLine = this.scene.add.line(0, 0, x, y, x, y, 0x000000); // Changed to black
		this.cuttingLine.setOrigin(0, 0);
		this.cuttingLine.setLineWidth(2);
	}

	private updateCutting(x: number, y: number) {
		if (this.cuttingLine && this.cuttingLineStart) {
			this.cuttingLineEnd = new Phaser.Math.Vector2(x, y);
			this.cuttingLine.setTo(
				this.cuttingLineStart.x,
				this.cuttingLineStart.y,
				this.cuttingLineEnd.x,
				this.cuttingLineEnd.y,
			);
		}
	}

	private endCutting() {
		this.isDrawingCuttingLine = false;
		if (this.cuttingLine) {
			this.checkRoadIntersections();
			this.cuttingLine.destroy();
			this.cuttingLine = null;
			this.cuttingLineStart = null;
			this.cuttingLineEnd = null;
		}
	}

	private checkRoadIntersections() {
		if (!this.cuttingLineStart || !this.cuttingLineEnd) return;

		const cuttingLineGeom = new Phaser.Geom.Line(
			this.cuttingLineStart.x,
			this.cuttingLineStart.y,
			this.cuttingLineEnd.x,
			this.cuttingLineEnd.y,
		);

		const currentPlayer = this.scene.data.get("currentPlayer");
		const roadsToRemove: { fromTower: Tower; toTower: Tower }[] = [];

		this.connections.forEach((road) => {
			const roadLine = new Phaser.Geom.Line(
				road.x - (road.width / 2) * Math.cos(road.rotation),
				road.y - (road.width / 2) * Math.sin(road.rotation),
				road.x + (road.width / 2) * Math.cos(road.rotation),
				road.y + (road.width / 2) * Math.sin(road.rotation),
			);

			if (Phaser.Geom.Intersects.LineToLine(cuttingLineGeom, roadLine)) {
				const fromTower = road.getData("fromTower") as Tower;
				const toTower = road.getData("toTower") as Tower;
				if (fromTower.ownerId === currentPlayer) {
					roadsToRemove.push({ fromTower, toTower });
				}
			}
		});

		// Remove all intersecting roads
		roadsToRemove.forEach(({ fromTower, toTower }) => {
			this.removeConnection(fromTower, toTower);
		});
	}

	// Add this method to the TowerManager class
	getAllTowers(): Tower[] {
		return this.towers;
	}

	private checkGameEnd() {
		const player0Towers = this.getTowersByPlayer(0);
		const player1Towers = this.getTowersByPlayer(1);

		if (player0Towers.length === 0) {
			this.emit("gameEnd", 1); // AI wins
		} else if (player1Towers.length === 0) {
			this.emit("gameEnd", 0); // Player wins
		}
	}
}
