import { GridCoord, LogMessage, SkillDefinition, TileData, Unit } from '../types/game';
import { areCoordsEqual, getManhattanDistance, hasLineOfSight } from './grid';

export interface AttackTargetInfo {
  unit: Unit;
  canTarget: boolean;
  reason?: string;
}

/**
 * Standard skills for each hero class
 */
export const CLASS_SKILLS: Record<string, SkillDefinition> = {
  power_strike: {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'Devastating heavy blow with broadsword. Deals +6 bonus physical damage.',
    range: 1,
    aoeRadius: 0,
    damageMultiplier: 1.0,
    bonusDamage: 6,
    penetration: 0,
    icon: 'Sword',
  },
  piercing_shot: {
    id: 'piercing_shot',
    name: 'Piercing Shot',
    description: 'High-velocity barbed arrow that pierces 2 armor defense. Deals +4 bonus damage.',
    range: 3,
    aoeRadius: 0,
    damageMultiplier: 1.0,
    bonusDamage: 4,
    penetration: 2,
    icon: 'Crosshair',
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Conjures an incendiary blast affecting the target and 4 adjacent tiles. +3 magic damage.',
    range: 3,
    aoeRadius: 1,
    damageMultiplier: 1.0,
    bonusDamage: 3,
    penetration: 0,
    icon: 'Flame',
  },
};

/**
 * Validates if an attacker can execute a basic attack against a target unit.
 */
export function canAttackTarget(
  attacker: Unit,
  target: Unit,
  map: TileData[][]
): { valid: boolean; reason?: string } {
  if (!attacker.isAlive) return { valid: false, reason: 'Attacker is down' };
  if (!target.isAlive) return { valid: false, reason: 'Target is already defeated' };
  if (attacker.faction === target.faction) return { valid: false, reason: 'Cannot target an ally' };
  if (attacker.hasActed) return { valid: false, reason: 'Action already used this turn' };

  const distance = getManhattanDistance(attacker.coord, target.coord);
  if (distance > attacker.attackRange) {
    return { valid: false, reason: `Target out of range (${distance} > ${attacker.attackRange})` };
  }

  // Ranged attacks require line of sight
  if (attacker.attackRange > 1) {
    const los = hasLineOfSight(attacker.coord, target.coord, (c) => {
      const tile = map[c.x]?.[c.y];
      return tile ? tile.blocksLos : false;
    });
    if (!los) {
      return { valid: false, reason: 'Line of sight is blocked by an obstacle' };
    }
  }

  return { valid: true };
}

/**
 * Calculates deterministic basic attack damage.
 * Formula: max(1, attack - defense)
 */
export function calculateAttackDamage(attacker: Unit, target: Unit): number {
  const raw = attacker.attack - target.defense;
  return Math.max(1, raw);
}

/**
 * Validates if a skill can be used on a target coordinate.
 */
export function canUseSkill(
  attacker: Unit,
  skill: SkillDefinition,
  targetCoord: GridCoord,
  map: TileData[][],
  allUnits: Unit[]
): { valid: boolean; reason?: string } {
  if (!attacker.isAlive) return { valid: false, reason: 'Attacker is down' };
  if (attacker.hasActed) return { valid: false, reason: 'Action already used this turn' };

  const dist = getManhattanDistance(attacker.coord, targetCoord);
  if (dist > skill.range) {
    return { valid: false, reason: `Target out of skill range (${dist} > ${skill.range})` };
  }

  // Line of sight check for ranged skills
  if (skill.range > 1) {
    const los = hasLineOfSight(attacker.coord, targetCoord, (c) => {
      const tile = map[c.x]?.[c.y];
      return tile ? tile.blocksLos : false;
    });
    if (!los) {
      return { valid: false, reason: 'Line of sight blocked by obstacle' };
    }
  }

  // If single-target (aoeRadius == 0), must target an opposing living unit
  if (skill.aoeRadius === 0) {
    const targetUnit = allUnits.find(
      (u) => u.isAlive && areCoordsEqual(u.coord, targetCoord)
    );
    if (!targetUnit) {
      return { valid: false, reason: 'Must target an enemy unit' };
    }
    if (targetUnit.faction === attacker.faction) {
      return { valid: false, reason: 'Cannot target an ally' };
    }
  }

  return { valid: true };
}

/**
 * Calculates skill damage for a specific target.
 * Formula: max(1, (attacker.attack + bonusDamage) - max(0, target.defense - penetration))
 */
export function calculateSkillDamage(
  attacker: Unit,
  skill: SkillDefinition,
  target: Unit
): number {
  const effectiveDef = Math.max(0, target.defense - skill.penetration);
  const rawDamage = Math.round(attacker.attack * skill.damageMultiplier) + skill.bonusDamage - effectiveDef;
  return Math.max(1, rawDamage);
}

/**
 * Returns all tiles affected by an AoE skill targeted at centerCoord.
 */
export function getSkillAffectedCoords(
  centerCoord: GridCoord,
  aoeRadius: number
): GridCoord[] {
  if (aoeRadius === 0) {
    return [centerCoord];
  }

  const coords: GridCoord[] = [centerCoord];
  // Cardinal neighbors for radius 1
  const offsets = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  for (const off of offsets) {
    const nx = centerCoord.x + off.x;
    const ny = centerCoord.y + off.y;
    if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
      coords.push({ x: nx, y: ny });
    }
  }

  return coords;
}
