import { GridCoord, TileData, Unit } from '../types/game';
import { areCoordsEqual, getManhattanDistance, hasLineOfSight } from './grid';
import { canAttackTarget } from './combat';
import { getReachableTiles } from './pathfinding';

export interface AIDecision {
  moveTo?: GridCoord;
  path?: GridCoord[];
  attackTargetId?: string;
}

/**
 * Deterministic enemy AI decision maker.
 * Chooses targets based on lowest HP, distance, and stable ID tie-breakers.
 */
export function computeEnemyTurn(
  enemy: Unit,
  allUnits: Unit[],
  map: TileData[][]
): AIDecision {
  const livingHeroes = allUnits
    .filter((u) => u.isAlive && u.faction === 'hero')
    .sort((a, b) => {
      // Primary: lowest HP
      if (a.currentHp !== b.currentHp) return a.currentHp - b.currentHp;
      // Secondary: closer distance to enemy
      const distA = getManhattanDistance(enemy.coord, a.coord);
      const distB = getManhattanDistance(enemy.coord, b.coord);
      if (distA !== distB) return distA - distB;
      // Tertiary: deterministic ID order
      return a.id.localeCompare(b.id);
    });

  if (livingHeroes.length === 0) {
    return {};
  }

  // 1. Can we attack immediately without moving?
  const targetsInRange = livingHeroes.filter(
    (h) => canAttackTarget(enemy, h, map).valid
  );

  if (targetsInRange.length > 0) {
    return {
      attackTargetId: targetsInRange[0].id,
    };
  }

  // 2. We need to move. Calculate reachable destinations.
  const reachableMap = getReachableTiles(enemy, map, allUnits);
  const priorityHero = livingHeroes[0];

  interface CandidateMove {
    coord: GridCoord;
    path: GridCoord[];
    attackTargetId?: string;
    score: number; // Higher is better
  }

  const candidates: CandidateMove[] = [];

  for (const info of reachableMap.values()) {
    const dest = info.coord;

    // Check if moving to this tile allows attacking any living hero
    // Temporarily simulate enemy at dest
    const simEnemy: Unit = { ...enemy, coord: dest, hasMoved: true, hasActed: false };

    let attackableHero: Unit | null = null;
    for (const hero of livingHeroes) {
      if (canAttackTarget(simEnemy, hero, map).valid) {
        attackableHero = hero;
        break; // already sorted by priority!
      }
    }

    let score = 0;
    if (attackableHero) {
      // Can attack from here! High priority
      score = 1000 - attackableHero.currentHp * 10 - info.cost;
    } else {
      // Cannot attack this turn, move closer to priority hero
      const distToHero = getManhattanDistance(dest, priorityHero.coord);
      score = 500 - distToHero * 10 - info.cost;
    }

    candidates.push({
      coord: dest,
      path: info.path,
      attackTargetId: attackableHero ? attackableHero.id : undefined,
      score,
    });
  }

  // Sort candidate moves deterministically
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break by coordinate
    const valA = a.coord.y * 10 + a.coord.x;
    const valB = b.coord.y * 10 + b.coord.x;
    return valA - valB;
  });

  const bestMove = candidates[0];
  if (!bestMove) {
    return {};
  }

  const moved = !areCoordsEqual(enemy.coord, bestMove.coord);

  return {
    moveTo: moved ? bestMove.coord : undefined,
    path: moved ? bestMove.path : undefined,
    attackTargetId: bestMove.attackTargetId,
  };
}
