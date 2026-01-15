import { BoolGrid, createBoolGrid, floodFill, getCell, setCell } from "../world/Grid";
import { WorldModel, GridPoint, DrawMode } from "../world/WorldModel";

export type CaptureResult = {
  capturedCells: number;
};

function buildBlockedGrid(claimed: BoolGrid, activeLine: BoolGrid): BoolGrid {
  const blocked = createBoolGrid(claimed.width, claimed.height, false);
  for (let i = 0; i < claimed.data.length; i += 1) {
    if (claimed.data[i] === 1 || activeLine.data[i] === 1) {
      blocked.data[i] = 1;
    }
  }
  return blocked;
}

export function captureTerritory(
  world: WorldModel,
  qixPositions: GridPoint[],
  drawMode: DrawMode
): CaptureResult {
  const blocked = buildBlockedGrid(world.claimed, world.activeLine);
  const visited = createBoolGrid(blocked.width, blocked.height, false);

  for (const pos of qixPositions) {
    floodFill(blocked, pos.x, pos.y, visited);
  }

  let capturedCells = 0;
  for (let y = 0; y < blocked.height; y += 1) {
    for (let x = 0; x < blocked.width; x += 1) {
      const isBlocked = getCell(blocked, x, y);
      const isVisited = getCell(visited, x, y);
      if (!isBlocked && !isVisited) {
        setCell(world.claimed, x, y, true);
        setCell(world.filled, x, y, true);
        world.filledMode[y * world.gridWidth + x] = drawMode === "slow" ? 2 : 1;
        capturedCells += 1;
      }
    }
  }

  for (let i = 0; i < world.activeLine.data.length; i += 1) {
    if (world.activeLine.data[i] === 1) {
      world.claimed.data[i] = 1;
      world.activeLine.data[i] = 0;
    }
  }

  return { capturedCells };
}
