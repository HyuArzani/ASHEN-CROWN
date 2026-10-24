import { GridCoord, TileData, Unit } from '../types/game';
import { areCoordsEqual, isValidCoord, GRID_COLS, GRID_ROWS } from './grid';

export interface ReachableTileInfo {
  coord: GridCoord;
  cost: number;
  path: GridCoord[];
}

const CARDINAL_DIRECTIONS: GridCoord[] = [
  { x: 0, y: -1 }, // North / Up
  { x: 0, y: 1 },  // South / Down
  { x: -1, y: 0 }, // West / Left
  { x: 1, y: 0 },  // East / Right
];

/**
 * Calculates all reachable tiles for a unit within its movement range using BFS.
 * Units cannot pass through obstacles or occupied tiles.
 */
export function getReachableTiles(
  unit: Unit,
  map: TileData[][],
  allUnits: Unit[]
): Map<string, ReachableTileInfo> {
  const reachable = new Map<string, ReachableTileInfo>();
  const startKey = `${unit.coord.x},${unit.coord.y}`;

  // Build a lookup for occupied tiles (excluding current unit)
  const occupiedSet = new Set<string>();
  for (const other of allUnits) {
    if (other.isAlive && other.id !== unit.id) {
      occupiedSet.add(`${other.coord.x},${other.coord.y}`);
    }
  }

  // BFS Queue: [coord, currentCost, pathSoFar]
  const queue: Array<{ coord: GridCoord; cost: number; path: GridCoord[] }> = [
    { coord: unit.coord, cost: 0, path: [unit.coord] }
  ];

  reachable.set(startKey, {
    coord: unit.coord,
    cost: 0,
    path: [unit.coord]
  });

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.cost >= unit.movementRange) {
      continue;
    }

    for (const dir of CARDINAL_DIRECTIONS) {
      const nextCoord: GridCoord = {
        x: current.coord.x + dir.x,
        y: current.coord.y + dir.y,
      };

      if (!isValidCoord(nextCoord)) continue;

      const nextKey = `${nextCoord.x},${nextCoord.y}`;

      // Check terrain walkability
      const tile = map[nextCoord.x]?.[nextCoord.y];
      if (!tile || !tile.walkable) continue;

      // Check occupancy
      if (occupiedSet.has(nextKey)) continue;

      const nextCost = current.cost + 1;
      const existing = reachable.get(nextKey);

      if (!existing || nextCost < existing.cost) {
        const nextPath = [...current.path, nextCoord];
        const info: ReachableTileInfo = {
          coord: nextCoord,
          cost: nextCost,
          path: nextPath,
        };
        reachable.set(nextKey, info);
        queue.push({ coord: nextCoord, cost: nextCost, path: nextPath });
      }
    }
  }

  return reachable;
}

/**
 * Finds shortest path from start to destination using BFS.
 * Returns null if no valid path exists.
 */
export function findPath(
  start: GridCoord,
  target: GridCoord,
  map: TileData[][],
  allUnits: Unit[],
  movingUnitId: string,
  maxSteps: number = 20
): GridCoord[] | null {
  if (areCoordsEqual(start, target)) {
    return [start];
  }

  const occupiedSet = new Set<string>();
  for (const other of allUnits) {
    if (other.isAlive && other.id !== movingUnitId) {
      occupiedSet.add(`${other.coord.x},${other.coord.y}`);
    }
  }

  // If destination is occupied or unwalkable, cannot move directly onto it
  const destTile = map[target.x]?.[target.y];
  if (!destTile || !destTile.walkable || occupiedSet.has(`${target.x},${target.y}`)) {
    return null;
  }

  const queue: Array<{ coord: GridCoord; path: GridCoord[] }> = [
    { coord: start, path: [start] }
  ];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.path.length - 1 >= maxSteps) continue;

    for (const dir of CARDINAL_DIRECTIONS) {
      const nextCoord: GridCoord = {
        x: current.coord.x + dir.x,
        y: current.coord.y + dir.y,
      };

      if (!isValidCoord(nextCoord)) continue;

      const key = `${nextCoord.x},${nextCoord.y}`;
      if (visited.has(key)) continue;

      const tile = map[nextCoord.x]?.[nextCoord.y];
      if (!tile || !tile.walkable) continue;

      // Occupied tiles cannot be traversed
      if (occupiedSet.has(key)) continue;

      visited.add(key);
      const nextPath = [...current.path, nextCoord];

      if (areCoordsEqual(nextCoord, target)) {
        return nextPath;
      }

      queue.push({ coord: nextCoord, path: nextPath });
    }
  }

  return null;
}
