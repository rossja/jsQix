import * as PIXI from "pixi.js";
import { config } from "./config";
import { InputManager } from "./engine/InputManager";
import { WorldModel } from "./world/WorldModel";
import { captureTerritory } from "./systems/TerritoryCaptureSystem";
import { updateQix } from "./systems/QixSystem";
import { getSparxPosition, updateSparx } from "./systems/SparxSystem";
import { Hud } from "./ui/Hud";
import { getCell, inBounds, setCell } from "./world/Grid";

export class Game {
  private readonly app: PIXI.Application;
  private readonly input: InputManager;
  private readonly world: WorldModel;
  private readonly backgroundGfx = new PIXI.Graphics();
  private readonly filledSlowGfx = new PIXI.Graphics();
  private readonly filledFastGfx = new PIXI.Graphics();
  private readonly boundaryGfx = new PIXI.Graphics();
  private readonly activeLineGfx = new PIXI.Graphics();
  private readonly markerGfx = new PIXI.Graphics();
  private readonly qixGfx = new PIXI.Graphics();
  private readonly sparxGfx = new PIXI.Graphics();
  private readonly hud: Hud;
  private readonly viewport = new PIXI.Container();
  private playfieldWidth = 640;
  private playfieldHeight = 480;
  private playfieldX = 0;
  private playfieldY = 0;
  private elapsed = 0;
  private levelCompleteTimer = 0;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.input = new InputManager(window);
    this.world = new WorldModel();
    this.hud = new Hud(app.stage);

    this.viewport.addChild(
      this.backgroundGfx,
      this.filledSlowGfx,
      this.filledFastGfx,
      this.boundaryGfx,
      this.activeLineGfx,
      this.markerGfx,
      this.qixGfx,
      this.sparxGfx
    );
    this.app.stage.addChild(this.viewport);

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
  }

  start(): void {
    this.app.ticker.add(this.tick);
  }

  private handleResize(): void {
    const { innerWidth, innerHeight } = window;
    const hudHeight = 48;
    const margin = 12;
    const availableWidth = innerWidth - margin * 2;
    const availableHeight = innerHeight - hudHeight - margin * 2;
    const rawScale = Math.min(
      availableWidth / this.world.gridWidth,
      availableHeight / this.world.gridHeight
    );
    const scale = Number.isFinite(rawScale) && rawScale > 0 ? Math.max(1, Math.floor(rawScale)) : 1;

    this.playfieldWidth = Math.max(1, this.world.gridWidth * scale);
    this.playfieldHeight = Math.max(1, this.world.gridHeight * scale);
    this.playfieldX = Math.floor((innerWidth - this.playfieldWidth) / 2);
    this.playfieldY = hudHeight + margin;

    this.app.renderer.resize(innerWidth, innerHeight);
    this.viewport.position.set(this.playfieldX, this.playfieldY);
    this.hud.setPosition(margin, margin);
  }

  private update = (dt: number): void => {
    this.elapsed += dt;
    const move = this.input.getMoveVector();
    const drawMode = this.input.getDrawMode();

    if (!this.world.levelComplete) {
      this.updatePlayer(dt, move.x, move.y, drawMode);
      updateQix(this.world, dt);
      updateSparx(this.world, dt);
      this.handleCollisions();
      this.checkLevelComplete();
    } else {
      this.levelCompleteTimer += dt;
      if (this.levelCompleteTimer >= 2) {
        this.advanceLevel();
      }
    }
    this.input.endFrame();

    this.hud.update({
      score: this.world.score,
      lives: this.world.lives,
      level: this.world.level,
      percent: this.world.claimedPercentage(),
      playerX: this.world.player.gridX,
      playerY: this.world.player.gridY,
      levelComplete: this.world.levelComplete
    });
  };

  private tick = (ticker: PIXI.Ticker): void => {
    const dt = ticker.deltaMS / 1000;
    this.update(dt);
    this.render();
  };

  private updatePlayer(dt: number, dirX: number, dirY: number, drawMode: "fast" | "slow" | "none"): void {
    if (dirX === 0 && dirY === 0) {
      return;
    }

    const player = this.world.player;
    const isDrawing = player.state === "Drawing";
    const speed =
      isDrawing && player.mode === "slow"
        ? config.speeds.drawSlowCellsPerSec
        : isDrawing
          ? config.speeds.drawFastCellsPerSec
          : config.speeds.boundaryCellsPerSec;

    if (player.state !== "Drawing") {
      player.mode = drawMode;
    } else if (drawMode !== "none") {
      player.mode = drawMode;
    }
    player.moveAccumulator += speed * dt;

    while (player.moveAccumulator >= 1) {
      const nextX = player.gridX + dirX;
      const nextY = player.gridY + dirY;

      if (!inBounds(this.world.claimed, nextX, nextY)) {
        player.moveAccumulator = 0;
        break;
      }

      const nextIsClaimed = getCell(this.world.claimed, nextX, nextY);
      const nextIsBoundary = this.isBoundaryCell(nextX, nextY);
      const nextIsActive = getCell(this.world.activeLine, nextX, nextY);

      if (!isDrawing) {
        if (nextIsClaimed) {
          if (!nextIsBoundary) {
            player.moveAccumulator = 0;
            break;
          }
        } else {
          if (drawMode === "none") {
            player.moveAccumulator = 0;
            break;
          }
          player.state = "Drawing";
          player.mode = drawMode;
          player.drawOrigin = { x: player.gridX, y: player.gridY };
          setCell(this.world.activeLine, player.gridX, player.gridY, true);
        }
      }

      if (player.state === "Drawing") {
        if (nextIsActive) {
          player.moveAccumulator = 0;
          break;
        }
      }

      player.gridX = nextX;
      player.gridY = nextY;

      if (player.state === "Drawing") {
        if (nextIsClaimed) {
          if (!nextIsBoundary) {
            player.moveAccumulator = 0;
            break;
          }
          const result = captureTerritory(this.world, this.world.qixPositions, player.mode);
          const pointsPerPercent =
            player.mode === "slow" ? config.scoring.slowPerPercent : config.scoring.fastPerPercent;
          this.world.score += Math.floor(result.capturedPercent * pointsPerPercent);
          player.state = "OnBoundary";
          player.mode = "none";
          break;
        } else {
          setCell(this.world.activeLine, nextX, nextY, true);
        }
      }

      player.moveAccumulator -= 1;
    }
  }

  private render = (): void => {
    const cellWidth = this.playfieldWidth / this.world.gridWidth;
    const cellHeight = this.playfieldHeight / this.world.gridHeight;

    this.backgroundGfx.clear();
    this.backgroundGfx.rect(0, 0, this.playfieldWidth, this.playfieldHeight);
    this.backgroundGfx.fill(config.colors.background);

    this.filledSlowGfx.clear();
    this.drawFilledRuns(this.filledSlowGfx, 2, config.colors.claimedSlow, cellWidth, cellHeight);
    this.filledFastGfx.clear();
    this.drawFilledRuns(this.filledFastGfx, 1, config.colors.claimedFast, cellWidth, cellHeight);

    this.boundaryGfx.clear();
    this.boundaryGfx.rect(0, 0, this.playfieldWidth, this.playfieldHeight);
    this.boundaryGfx.stroke({ width: 2, color: config.colors.boundary });

    this.activeLineGfx.clear();
    this.drawActiveRuns(this.activeLineGfx, cellWidth, cellHeight);

    this.markerGfx.clear();
    const markerSize = Math.max(cellWidth, cellHeight) * 4;
    const markerCenterX = this.world.player.gridX * cellWidth + cellWidth / 2;
    const markerCenterY = this.world.player.gridY * cellHeight + cellHeight / 2;
    this.markerGfx.moveTo(markerCenterX, markerCenterY - markerSize / 2);
    this.markerGfx.lineTo(markerCenterX + markerSize / 2, markerCenterY);
    this.markerGfx.lineTo(markerCenterX, markerCenterY + markerSize / 2);
    this.markerGfx.lineTo(markerCenterX - markerSize / 2, markerCenterY);
    this.markerGfx.closePath();
    this.markerGfx.fill(config.colors.marker);

    this.qixGfx.clear();
    const qixX = this.world.qix.x * cellWidth;
    const qixY = this.world.qix.y * cellHeight;
    const palette = [0x7affff, 0x4da6ff, 0x66ffcc, 0xa64dff, 0xff4dff];
    const baseSpan = Math.max(cellWidth, cellHeight) * 3;
    const lines = this.world.qix.lines;
    const centerIndex = (lines.length - 1) / 2;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const offset = (i - centerIndex) * baseSpan;
      const perpX = Math.cos(line.angle + Math.PI / 2);
      const perpY = Math.sin(line.angle + Math.PI / 2);
      const ox = perpX * offset;
      const oy = perpY * offset;
      const length = line.length * Math.max(cellWidth, cellHeight) * 10;
      const dx = Math.cos(line.angle) * length;
      const dy = Math.sin(line.angle) * length;
      this.qixGfx.moveTo(qixX + ox - dx, qixY + oy - dy);
      this.qixGfx.lineTo(qixX + ox + dx, qixY + oy + dy);
      const color = palette[(i + Math.floor(this.elapsed * 2)) % palette.length];
      const width = 1 + (i % 2);
      this.qixGfx.stroke({ width, color });
    }

    const sparx = getSparxPosition(this.world);
    this.sparxGfx.clear();
    this.sparxGfx.circle(
      sparx.x * cellWidth,
      sparx.y * cellHeight,
      Math.max(cellWidth, cellHeight) * 1.2
    );
    this.sparxGfx.fill(config.colors.sparx);
  };

  private drawFilledRuns(
    target: PIXI.Graphics,
    modeValue: number,
    color: number,
    cellWidth: number,
    cellHeight: number
  ): void {
    let hasRect = false;
    for (let y = 0; y < this.world.filled.height; y += 1) {
      let runStart = -1;
      for (let x = 0; x < this.world.filled.width; x += 1) {
        const filled = getCell(this.world.filled, x, y);
        const matches = filled && this.world.filledMode[y * this.world.gridWidth + x] === modeValue;
        if (matches && runStart === -1) {
          runStart = x;
        }
        if ((!matches || x === this.world.filled.width - 1) && runStart !== -1) {
          const runEnd = matches ? x : x - 1;
          const runWidth = runEnd - runStart + 1;
          target.rect(
            runStart * cellWidth,
            y * cellHeight,
            runWidth * cellWidth,
            cellHeight
          );
          hasRect = true;
          runStart = -1;
        }
      }
    }
    if (hasRect) {
      target.fill(color);
    }
  }

  private drawActiveRuns(target: PIXI.Graphics, cellWidth: number, cellHeight: number): void {
    let hasRect = false;
    for (let y = 0; y < this.world.activeLine.height; y += 1) {
      let runStart = -1;
      for (let x = 0; x < this.world.activeLine.width; x += 1) {
        const active = getCell(this.world.activeLine, x, y);
        if (active && runStart === -1) {
          runStart = x;
        }
        if ((!active || x === this.world.activeLine.width - 1) && runStart !== -1) {
          const runEnd = active ? x : x - 1;
          const runWidth = runEnd - runStart + 1;
          target.rect(
            runStart * cellWidth,
            y * cellHeight,
            runWidth * cellWidth,
            cellHeight
          );
          hasRect = true;
          runStart = -1;
        }
      }
    }
    if (hasRect) {
      target.fill(config.colors.activeLine);
    }
  }

  private isBoundaryCell(x: number, y: number): boolean {
    if (!inBounds(this.world.claimed, x, y)) {
      return false;
    }
    if (!getCell(this.world.claimed, x, y)) {
      return false;
    }
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (!inBounds(this.world.claimed, nx, ny)) {
        return true;
      }
      if (!getCell(this.world.claimed, nx, ny)) {
        return true;
      }
    }
    return false;
  }

  private checkLevelComplete(): void {
    if (this.world.levelComplete) {
      return;
    }
    const claimed = this.world.claimedPercentage();
    if (claimed >= config.captureThreshold) {
      const bonusPercent = Math.max(0, Math.floor((claimed - config.captureThreshold) * 100));
      this.world.score += bonusPercent * config.scoring.completionBonusPerPercent;
      this.world.levelComplete = true;
      this.levelCompleteTimer = 0;
    }
  }

  private advanceLevel(): void {
    const nextLevel = this.world.level + 1;
    this.world.resetForLevel(nextLevel);
    this.levelCompleteTimer = 0;
  }

  private handleCollisions(): void {
    const player = this.world.player;
    const sparx = getSparxPosition(this.world);
    const playerX = player.gridX;
    const playerY = player.gridY;

    if (player.state === "OnBoundary" && playerX === sparx.x && playerY === sparx.y) {
      this.loseLife();
      return;
    }

    const qixX = Math.floor(this.world.qix.x);
    const qixY = Math.floor(this.world.qix.y);
    if (player.state === "Drawing") {
      if (qixX === playerX && qixY === playerY) {
        this.loseLife();
        return;
      }
      if (getCell(this.world.activeLine, qixX, qixY)) {
        this.loseLife();
      }
    }
  }

  private loseLife(): void {
    this.world.lives = Math.max(0, this.world.lives - 1);
    this.world.resetActiveLine();
    this.world.spawnPlayer();
  }
}
