import { config } from "../config";
import { WorldModel } from "../world/WorldModel";
import { getCell } from "../world/Grid";

function randomAngle(): number {
  return Math.random() * Math.PI * 2;
}

function initLines(qix: { lines: { angle: number; length: number }[] }, count: number): void {
  if (qix.lines.length > 0) {
    return;
  }
  for (let i = 0; i < count; i += 1) {
    qix.lines.push({ angle: 0, length: 0.5 });
  }
}

export function updateQix(world: WorldModel, dt: number): void {
  const qix = world.qix;
  const speed = config.speeds.qixCellsPerSec;
  initLines(qix, 8);
  if (!Number.isFinite(qix.heading)) {
    qix.heading = 0;
  }
  if (!Number.isFinite(qix.targetHeading)) {
    qix.targetHeading = qix.heading;
  }

  qix.turnTimer += dt;
  if (qix.turnTimer >= 0.4) {
    qix.turnTimer = 0;
    const turnJitter = (Math.random() - 0.5) * Math.PI;
    qix.targetHeading = qix.heading + turnJitter;
  }

  const turnSpeed = Math.PI * 1.2;
  const delta = ((qix.targetHeading - qix.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  const maxStep = turnSpeed * dt;
  if (Math.abs(delta) <= maxStep) {
    qix.heading = qix.targetHeading;
  } else {
    qix.heading += Math.sign(delta) * maxStep;
  }

  qix.vx = Math.cos(qix.heading);
  qix.vy = Math.sin(qix.heading);
  const nextX = qix.x + qix.vx * speed * dt;
  const nextY = qix.y + qix.vy * speed * dt;
  const gridX = Math.floor(nextX);
  const gridY = Math.floor(nextY);

  if (gridX <= 1 || gridY <= 1 || gridX >= world.gridWidth - 2 || gridY >= world.gridHeight - 2) {
    qix.targetHeading = randomAngle();
    world.qixPositions = [{ x: Math.floor(qix.x), y: Math.floor(qix.y) }];
    return;
  }

  if (getCell(world.claimed, gridX, gridY)) {
    qix.targetHeading = randomAngle();
    world.qixPositions = [{ x: Math.floor(qix.x), y: Math.floor(qix.y) }];
    return;
  }

  qix.x = nextX;
  qix.y = nextY;
  world.qixPositions = [{ x: Math.floor(qix.x), y: Math.floor(qix.y) }];

  qix.lineTimer += dt;
  const lineInterval = 0.08;
  if (qix.lineTimer >= lineInterval) {
    qix.lineTimer -= lineInterval;
    const baseAngle = qix.heading;
    const jitter = (Math.random() - 0.5) * 0.4;
    const length = 0.6 + Math.random() * 1.6;
    qix.lines.shift();
    qix.lines.push({ angle: baseAngle + jitter, length });
  }
}
