import { config } from "../config";
import { WorldModel } from "../world/WorldModel";
import { getCell } from "../world/Grid";

function randomDirection(): { vx: number; vy: number } {
  const dirs = [
    { vx: 1, vy: 0 },
    { vx: -1, vy: 0 },
    { vx: 0, vy: 1 },
    { vx: 0, vy: -1 },
    { vx: 1, vy: 1 },
    { vx: -1, vy: 1 },
    { vx: 1, vy: -1 },
    { vx: -1, vy: -1 }
  ];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

export function updateQix(world: WorldModel, dt: number): void {
  const qix = world.qix;
  const speed = config.speeds.qixCellsPerSec;
  const nextX = qix.x + qix.vx * speed * dt;
  const nextY = qix.y + qix.vy * speed * dt;
  const gridX = Math.floor(nextX);
  const gridY = Math.floor(nextY);

  if (gridX <= 1 || gridY <= 1 || gridX >= world.gridWidth - 2 || gridY >= world.gridHeight - 2) {
    const dir = randomDirection();
    qix.vx = dir.vx;
    qix.vy = dir.vy;
    world.qixPositions = [{ x: Math.floor(qix.x), y: Math.floor(qix.y) }];
    return;
  }

  if (getCell(world.claimed, gridX, gridY)) {
    const dir = randomDirection();
    qix.vx = dir.vx;
    qix.vy = dir.vy;
    world.qixPositions = [{ x: Math.floor(qix.x), y: Math.floor(qix.y) }];
    return;
  }

  qix.x = nextX;
  qix.y = nextY;
  world.qixPositions = [{ x: Math.floor(qix.x), y: Math.floor(qix.y) }];
}
