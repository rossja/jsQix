import { describe, expect, it } from "vitest";
import { WorldModel } from "../world/WorldModel";
import { setCell, getCell } from "../world/Grid";
import { captureTerritory } from "../systems/TerritoryCaptureSystem";

describe("TerritoryCaptureSystem", () => {
  it("captures the region that does not contain the Qix", () => {
    const world = new WorldModel({ gridWidth: 10, gridHeight: 8 });

    for (let y = 1; y < 7; y += 1) {
      setCell(world.activeLine, 4, y, true);
    }

    const result = captureTerritory(world, [{ x: 7, y: 3 }], "fast");

    expect(result.capturedCells).toBe(18);
    for (let y = 1; y < 7; y += 1) {
      for (let x = 1; x < 4; x += 1) {
        expect(getCell(world.filled, x, y)).toBe(true);
      }
    }
    for (let y = 1; y < 7; y += 1) {
      for (let x = 5; x < 9; x += 1) {
        expect(getCell(world.filled, x, y)).toBe(false);
      }
    }
  });

  it("captures nothing when there is no closed line", () => {
    const world = new WorldModel({ gridWidth: 10, gridHeight: 8 });
    const result = captureTerritory(world, [{ x: 5, y: 4 }], "fast");
    expect(result.capturedCells).toBe(0);
  });

  it("captures nothing when Qix exist in all regions", () => {
    const world = new WorldModel({ gridWidth: 10, gridHeight: 8 });

    for (let y = 1; y < 7; y += 1) {
      setCell(world.activeLine, 4, y, true);
    }

    const result = captureTerritory(world, [
      { x: 2, y: 3 },
      { x: 7, y: 3 }
    ], "fast");

    expect(result.capturedCells).toBe(0);
  });
});
