import { config } from "../config";
import { BoolGrid, createBoolGrid, setCell, getCell, countGrid, clearGrid } from "./Grid";

export type PlayerState = "OnBoundary" | "Drawing" | "Dead" | "Respawn";
export type DrawMode = "fast" | "slow" | "none";

export type GridPoint = { x: number; y: number };

export class WorldModel {
  readonly claimed: BoolGrid;
  readonly filled: BoolGrid;
  readonly filledMode: Uint8Array;
  readonly activeLine: BoolGrid;
  readonly gridWidth: number;
  readonly gridHeight: number;

  player = {
    state: "OnBoundary" as PlayerState,
    mode: "none" as DrawMode,
    gridX: 0,
    gridY: 0,
    moveAccumulator: 0,
    drawOrigin: { x: 0, y: 0 } as GridPoint
  };

  lives = config.initialLives;
  level = 1;
  score = 0;
  levelComplete = false;

  qixPositions: GridPoint[] = [{ x: 10, y: 10 }];
  qix = {
    x: 0,
    y: 0,
    vx: 1,
    vy: 0,
    lineTimer: 0,
    lines: [] as { angle: number; length: number }[],
    heading: 0,
    targetHeading: 0,
    turnTimer: 0
  };
  sparx = {
    t: 0
  };

  constructor(options?: { gridWidth?: number; gridHeight?: number }) {
    this.gridWidth = options?.gridWidth ?? config.gridWidth;
    this.gridHeight = options?.gridHeight ?? config.gridHeight;

    this.claimed = createBoolGrid(this.gridWidth, this.gridHeight, false);
    this.filled = createBoolGrid(this.gridWidth, this.gridHeight, false);
    this.activeLine = createBoolGrid(this.gridWidth, this.gridHeight, false);
    this.filledMode = new Uint8Array(this.gridWidth * this.gridHeight);

    this.seedBoundary();
    this.spawnPlayer();
    this.qix.x = Math.floor(this.gridWidth / 2);
    this.qix.y = Math.floor(this.gridHeight / 2);
    this.qixPositions = [{ x: Math.floor(this.qix.x), y: Math.floor(this.qix.y) }];
  }

  resetActiveLine(): void {
    this.activeLine.data.fill(0);
    this.player.drawOrigin = { x: this.player.gridX, y: this.player.gridY };
  }

  seedBoundary(): void {
    for (let x = 0; x < this.gridWidth; x += 1) {
      setCell(this.claimed, x, 0, true);
      setCell(this.claimed, x, this.gridHeight - 1, true);
    }
    for (let y = 0; y < this.gridHeight; y += 1) {
      setCell(this.claimed, 0, y, true);
      setCell(this.claimed, this.gridWidth - 1, y, true);
    }
  }

  spawnPlayer(): void {
    this.player.gridX = Math.floor(this.gridWidth / 2);
    this.player.gridY = this.gridHeight - 1;
    this.player.state = "OnBoundary";
    this.player.mode = "none";
    this.player.moveAccumulator = 0;
    this.resetActiveLine();
  }

  resetForLevel(level: number): void {
    this.level = level;
    this.levelComplete = false;
    clearGrid(this.claimed);
    clearGrid(this.filled);
    clearGrid(this.activeLine);
    this.filledMode.fill(0);
    this.seedBoundary();
    this.spawnPlayer();
    this.qix.x = Math.floor(this.gridWidth / 2);
    this.qix.y = Math.floor(this.gridHeight / 2);
    this.qix.vx = 1;
    this.qix.vy = 0;
    this.qixPositions = [{ x: Math.floor(this.qix.x), y: Math.floor(this.qix.y) }];
    this.sparx.t = 0;
  }

  isClaimed(x: number, y: number): boolean {
    return getCell(this.claimed, x, y);
  }

  isFilled(x: number, y: number): boolean {
    return getCell(this.filled, x, y);
  }

  claimedPercentage(): number {
    const filledCount = countGrid(this.filled);
    const total = this.gridWidth * this.gridHeight;
    return filledCount / total;
  }
}
