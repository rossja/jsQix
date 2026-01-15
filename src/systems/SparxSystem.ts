import { config } from "../config";
import { WorldModel } from "../world/WorldModel";

export type SparxPosition = {
  x: number;
  y: number;
};

function perimeterLength(world: WorldModel): number {
  return 2 * (world.gridWidth + world.gridHeight - 2);
}

export function getSparxPosition(world: WorldModel): SparxPosition {
  const length = perimeterLength(world);
  let t = world.sparx.t % length;
  const maxX = world.gridWidth - 1;
  const maxY = world.gridHeight - 1;

  if (t < world.gridWidth) {
    return { x: t, y: 0 };
  }
  t -= world.gridWidth;
  if (t < world.gridHeight - 1) {
    return { x: maxX, y: t + 1 };
  }
  t -= world.gridHeight - 1;
  if (t < world.gridWidth - 1) {
    return { x: maxX - (t + 1), y: maxY };
  }
  t -= world.gridWidth - 1;
  return { x: 0, y: maxY - (t + 1) };
}

export function updateSparx(world: WorldModel, dt: number): void {
  const length = perimeterLength(world);
  const speed = config.speeds.sparxCellsPerSec;
  world.sparx.t = (world.sparx.t + speed * dt) % length;
}
