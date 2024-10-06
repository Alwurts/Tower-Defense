export class PoissonDiscSampling {
    private width: number;
    private height: number;
    private radius: number;
    private k: number;
    private grid: (number | null)[][];
    private active: number[][];
    private points: number[][];

    constructor(width: number, height: number, radius: number, k = 30) {
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.k = k;
        this.grid = [];
        this.active = [];
        this.points = [];

        const cellSize = radius / Math.sqrt(2);
        const cols = Math.ceil(width / cellSize);
        const rows = Math.ceil(height / cellSize);

        for (let i = 0; i < cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j < rows; j++) {
                this.grid[i][j] = null;
            }
        }
    }

    generate(): number[][] {
        // Start with a random point
        const firstPoint = [
            Math.random() * this.width,
            Math.random() * this.height
        ];
        this.addPoint(firstPoint);

        while (this.active.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.active.length);
            const point = this.active[randomIndex];

            let found = false;
            for (let i = 0; i < this.k; i++) {
                const sample = this.generateRandomPointAround(point);
                if (this.isValid(sample)) {
                    this.addPoint(sample);
                    found = true;
                    break;
                }
            }

            if (!found) {
                this.active.splice(randomIndex, 1);
            }
        }

        return this.points;
    }

    private addPoint(point: number[]) {
        const col = Math.floor(point[0] / (this.radius / Math.sqrt(2)));
        const row = Math.floor(point[1] / (this.radius / Math.sqrt(2)));
        this.grid[col][row] = this.points.length;
        this.points.push(point);
        this.active.push(point);
    }

    private generateRandomPointAround(point: number[]): number[] {
        const r1 = Math.random();
        const r2 = Math.random();
        const radius = this.radius * (r1 + 1);
        const angle = 2 * Math.PI * r2;
        const newX = point[0] + radius * Math.cos(angle);
        const newY = point[1] + radius * Math.sin(angle);
        return [newX, newY];
    }

    private isValid(point: number[]): boolean {
        if (point[0] < 0 || point[0] >= this.width || point[1] < 0 || point[1] >= this.height) {
            return false;
        }

        const col = Math.floor(point[0] / (this.radius / Math.sqrt(2)));
        const row = Math.floor(point[1] / (this.radius / Math.sqrt(2)));

        const searchStartCol = Math.max(0, col - 2);
        const searchEndCol = Math.min(this.grid.length - 1, col + 2);
        const searchStartRow = Math.max(0, row - 2);
        const searchEndRow = Math.min(this.grid[0].length - 1, row + 2);

        for (let i = searchStartCol; i <= searchEndCol; i++) {
            for (let j = searchStartRow; j <= searchEndRow; j++) {
                const pointIndex = this.grid[i][j];
                if (pointIndex !== null) {
                    const otherPoint = this.points[pointIndex];
                    const dx = otherPoint[0] - point[0];
                    const dy = otherPoint[1] - point[1];
                    if (dx * dx + dy * dy < this.radius * this.radius) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    setMinDistance(newMinDistance: number) {
        this.radius = newMinDistance;
        const cellSize = this.radius / Math.sqrt(2);
        const cols = Math.ceil(this.width / cellSize);
        const rows = Math.ceil(this.height / cellSize);

        this.grid = [];
        for (let i = 0; i < cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j < rows; j++) {
                this.grid[i][j] = null;
            }
        }
    }
}