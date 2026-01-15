export type BoolGrid = {
  width: number;
  height: number;
  data: Uint8Array;
};

export function createBoolGrid(width: number, height: number, fill = false): BoolGrid {
  const data = new Uint8Array(width * height);
  if (fill) {
    data.fill(1);
  }
  return { width, height, data };
}

export function inBounds(grid: BoolGrid, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < grid.width && y < grid.height;
}

export function index(grid: BoolGrid, x: number, y: number): number {
  return y * grid.width + x;
}

export function getCell(grid: BoolGrid, x: number, y: number): boolean {
  return grid.data[index(grid, x, y)] === 1;
}

export function setCell(grid: BoolGrid, x: number, y: number, value: boolean): void {
  grid.data[index(grid, x, y)] = value ? 1 : 0;
}

export function clearGrid(grid: BoolGrid): void {
  grid.data.fill(0);
}

export function countGrid(grid: BoolGrid): number {
  let count = 0;
  for (let i = 0; i < grid.data.length; i += 1) {
    count += grid.data[i];
  }
  return count;
}

export function floodFill(
  blocked: BoolGrid,
  startX: number,
  startY: number,
  visited: BoolGrid
): void {
  if (!inBounds(blocked, startX, startY)) {
    return;
  }
  if (getCell(blocked, startX, startY) || getCell(visited, startX, startY)) {
    return;
  }

  const stackX: number[] = [startX];
  const stackY: number[] = [startY];

  while (stackX.length > 0) {
    const x = stackX.pop() as number;
    const y = stackY.pop() as number;

    if (!inBounds(blocked, x, y)) {
      continue;
    }
    if (getCell(blocked, x, y) || getCell(visited, x, y)) {
      continue;
    }

    setCell(visited, x, y, true);

    stackX.push(x + 1, x - 1, x, x);
    stackY.push(y, y, y + 1, y - 1);
  }
}
