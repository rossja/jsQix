import { config } from "../config";
import { WorldModel } from "../world/WorldModel";
import { getCell, inBounds } from "../world/Grid";

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
    const length = 0.75 + Math.random() * 2.25;
    qix.lines.shift();
    qix.lines.push({ angle: baseAngle, length });
  }

  qix.spacingPhase += dt * 0.8;

  if (linesHitBoundary(world)) {
    const reflect = getReflectHeading(world, qix.heading);
    qix.heading = reflect;
    qix.targetHeading = reflect;
    qix.turnTimer = 0;
  }
}

function linesHitBoundary(world: WorldModel): boolean {
  const qix = world.qix;
  const lines = qix.lines;
  if (lines.length === 0) {
    return false;
  }
  const baseSpan = 4;
  const centerIndex = (lines.length - 1) / 2;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const offset = (i - centerIndex) * baseSpan;
    const perpX = Math.cos(line.angle + Math.PI / 2);
    const perpY = Math.sin(line.angle + Math.PI / 2);
    const ox = perpX * offset;
    const oy = perpY * offset;
    const lengthCells = line.length * 12;
    const dx = Math.cos(line.angle) * lengthCells;
    const dy = Math.sin(line.angle) * lengthCells;
    const x1 = qix.x + ox - dx;
    const y1 = qix.y + oy - dy;
    const x2 = qix.x + ox + dx;
    const y2 = qix.y + oy + dy;
    if (endpointHits(world, x1, y1) || endpointHits(world, x2, y2)) {
      return true;
    }
  }
  return false;
}

function endpointHits(world: WorldModel, x: number, y: number): boolean {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (!inBounds(world.claimed, gx, gy)) {
    return true;
  }
  if (gx <= 0 || gy <= 0 || gx >= world.gridWidth - 1 || gy >= world.gridHeight - 1) {
    return true;
  }
  if (getCell(world.claimed, gx, gy)) {
    return true;
  }
  if (getCell(world.activeLine, gx, gy)) {
    return true;
  }
  return false;
}

function getReflectHeading(world: WorldModel, heading: number): number {
  const qix = world.qix;
  const nextX = qix.x + Math.cos(heading) * 1.5;
  const nextY = qix.y + Math.sin(heading) * 1.5;
  const gx = Math.floor(nextX);
  const gy = Math.floor(nextY);
  let newHeading = heading;

  if (gx <= 1 || gx >= world.gridWidth - 2) {
    newHeading = Math.PI - newHeading;
  }
  if (gy <= 1 || gy >= world.gridHeight - 2) {
    newHeading = -newHeading;
  }

  if (getCell(world.claimed, gx, gy) || getCell(world.activeLine, gx, gy)) {
    newHeading = heading + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
  }

  return newHeading;
}
