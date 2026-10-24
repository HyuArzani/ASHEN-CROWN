import { Unit } from '../types/game';

/**
 * Calculates deterministic initiative value for sorting.
 * Formula: unit.speed + unit.tieBreaker (e.g. 0.01 to 0.09)
 */
export function getUnitInitiative(unit: Unit): number {
  return unit.speed + unit.tieBreaker;
}

/**
 * Builds and sorts the initiative order for all living units at the start of a round.
 * Highest initiative goes first. Ties resolved deterministically by tieBreaker.
 */
export function buildRoundQueue(units: Unit[]): string[] {
  const living = units.filter((u) => u.isAlive);
  living.sort((a, b) => {
    const initA = getUnitInitiative(a);
    const initB = getUnitInitiative(b);
    if (initB !== initA) return initB - initA;
    return a.id.localeCompare(b.id);
  });
  return living.map((u) => u.id);
}

/**
 * Advances the turn queue to the next living unit.
 * If queue is exhausted, returns null to signal end of round.
 */
export function getNextActiveUnitId(
  queue: string[],
  currentIndex: number,
  units: Unit[]
): { nextIndex: number; activeUnitId: string } | null {
  const unitMap = new Map<string, Unit>();
  for (const u of units) {
    unitMap.set(u.id, u);
  }

  let index = currentIndex + 1;
  while (index < queue.length) {
    const candidateId = queue[index];
    const candidate = unitMap.get(candidateId);
    if (candidate && candidate.isAlive) {
      return { nextIndex: index, activeUnitId: candidateId };
    }
    index++;
  }

  return null; // Round completed
}

/**
 * Cleans dead units from the remaining queue while preserving current index.
 */
export function sanitizeQueue(queue: string[], units: Unit[]): string[] {
  const unitMap = new Map<string, Unit>();
  for (const u of units) {
    unitMap.set(u.id, u);
  }
  return queue.filter((id) => {
    const u = unitMap.get(id);
    return u && u.isAlive;
  });
}
