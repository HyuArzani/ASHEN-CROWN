import { GridCoord, TileData, TerrainType } from '../types/game';

export const GRID_COLS = 10;
export const GRID_ROWS = 10;
export const TILE_WIDTH = 72;
export const TILE_HEIGHT = 36;

/**
 * Converts logical grid coordinates to 2D isometric screen coordinates.
 * Represents the top-center apex of the tile diamond.
 */
export function gridToScreen(
  gridX: number,
  gridY: number,
  originX: number,
  originY: number,
  tileWidth: number = TILE_WIDTH,
  tileHeight: number = TILE_HEIGHT
): { x: number; y: number } {
  const x = originX + (gridX - gridY) * (tileWidth / 2);
  const y = originY + (gridX + gridY) * (tileHeight / 2);
  return { x, y };
}

/**
 * Converts screen coordinates back to logical grid coordinates.
 * Uses exact diamond boundary testing to guarantee pixel-perfect selection.
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  originX: number,
  originY: number,
  tileWidth: number = TILE_WIDTH,
  tileHeight: number = TILE_HEIGHT
): GridCoord | null {
  const dx = screenX - originX;
  const dy = screenY - originY;

  // Approximate logical coordinates
  const rawX = dx / tileWidth + dy / tileHeight;
  const rawY = dy / tileHeight - dx / tileWidth;

  const baseCellX = Math.floor(rawX);
  const baseCellY = Math.floor(rawY);

  // Check candidates in a 3x3 local cluster around baseCell to find exact diamond
  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;

  let bestCoord: GridCoord | null = null;
  let minNormDist = Infinity;

  for (let gx = baseCellX - 1; gx <= baseCellX + 1; gx++) {
    for (let gy = baseCellY - 1; gy <= baseCellY + 1; gy++) {
      if (isValidCoord({ x: gx, y: gy })) {
        // Tile center in screen coordinates is at y + halfH
        const tileScreen = gridToScreen(gx, gy, originX, originY, tileWidth, tileHeight);
        const centerX = tileScreen.x;
        const centerY = tileScreen.y + halfH;

        const distX = Math.abs(screenX - centerX);
        const distY = Math.abs(screenY - centerY);

        const diamondNorm = distX / halfW + distY / halfH;
        if (diamondNorm <= 1.0 && diamondNorm < minNormDist) {
          minNormDist = diamondNorm;
          bestCoord = { x: gx, y: gy };
        }
      }
    }
  }

  return bestCoord;
}

/**
 * Checks if a coordinate is within the 10x10 battlefield.
 */
export function isValidCoord(coord: GridCoord): boolean {
  return coord.x >= 0 && coord.x < GRID_COLS && coord.y >= 0 && coord.y < GRID_ROWS;
}

/**
 * Checks equality of two grid coordinates.
 */
export function areCoordsEqual(a: GridCoord | null | undefined, b: GridCoord | null | undefined): boolean {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
}

/**
 * Calculates Manhattan distance between two grid coordinates.
 */
export function getManhattanDistance(a: GridCoord, b: GridCoord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Line-of-sight calculation using Bresenham's line algorithm.
 * Checks if any intermediate tile between source and target blocks line of sight.
 * The source and target tiles themselves are not checked for blocking.
 */
export function hasLineOfSight(
  source: GridCoord,
  target: GridCoord,
  isTileBlockingLos: (coord: GridCoord) => boolean
): boolean {
  let x0 = source.x;
  let y0 = source.y;
  const x1 = target.x;
  const y1 = target.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (x0 === x1 && y0 === y1) {
      break;
    }

    // Do not check the source or target tile
    const isSource = x0 === source.x && y0 === source.y;
    const isTarget = x0 === target.x && y0 === target.y;

    if (!isSource && !isTarget) {
      if (isTileBlockingLos({ x: x0, y: y0 })) {
        return false;
      }
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return true;
}

/**
 * Predefined 10x10 deterministic battlefield layout.
 * Heroes start at the southwest/west corner, enemies at the northeast/east corner.
 * Tactical choke points formed by ancient ruins, boulders, and trees.
 */
export function createDefaultMap(): TileData[][] {
  const map: TileData[][] = [];

  // Deterministic obstacle locations:
  // Rocks: (2, 4), (5, 2), (7, 5)
  // Trees: (1, 6), (4, 7), (8, 2), (3, 2)
  // Ruins: (4, 4), (5, 4), (5, 5), (6, 7)
  // Stone paths running across the center connecting hero & enemy zones
  const rocks = new Set(['2,4', '5,2', '7,5', '3,5']);
  const trees = new Set(['1,6', '4,7', '8,2', '3,2', '7,7']);
  const ruins = new Set(['4,4', '5,4', '6,3']);

  // Stone path connects (1,1) -> (3,3) -> (5,5) -> (8,8)
  const stoneTiles = new Set([
    '0,1', '1,1', '2,1', '2,2', '2,3',
    '3,3', '3,4', '4,5', '5,5', '6,5',
    '7,6', '8,6', '8,7', '8,8', '7,8'
  ]);

  for (let x = 0; x < GRID_COLS; x++) {
    map[x] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      const key = `${x},${y}`;
      let terrain: TerrainType = 'grass';
      let walkable = true;
      let blocksLos = false;

      if (rocks.has(key)) {
        terrain = 'rocks';
        walkable = false;
        blocksLos = true;
      } else if (trees.has(key)) {
        terrain = 'trees';
        walkable = false;
        blocksLos = true;
      } else if (ruins.has(key)) {
        terrain = 'ruins';
        walkable = false;
        blocksLos = true;
      } else if (stoneTiles.has(key)) {
        terrain = 'stone';
        walkable = true;
        blocksLos = false;
      }

      map[x][y] = {
        coord: { x, y },
        terrain,
        walkable,
        blocksLos,
      };
    }
  }

  return map;
}
