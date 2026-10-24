/**
 * Core type definitions for Ashen Crown Tactical RPG
 */

export type Faction = 'hero' | 'enemy';

export type HeroClass = 'knight' | 'archer' | 'mage';
export type EnemyType = 'goblin' | 'slime';
export type UnitArchetype = HeroClass | EnemyType;

export interface GridCoord {
  x: number; // 0 to 9
  y: number; // 0 to 9
}

export type TerrainType = 'grass' | 'stone' | 'rocks' | 'trees' | 'ruins';

export interface TileData {
  coord: GridCoord;
  terrain: TerrainType;
  walkable: boolean;
  blocksLos: boolean; // Blocks line of sight
  elevation?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  range: number;
  aoeRadius: number; // 0 = single target, 1 = target + cardinal neighbors
  damageMultiplier: number;
  bonusDamage: number;
  penetration: number; // Def ignored
  apCost?: number;
  icon: string;
}

export interface Unit {
  id: string;
  name: string;
  faction: Faction;
  archetype: UnitArchetype;
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  movementRange: number;
  attackRange: number;
  skills: SkillDefinition[];
  coord: GridCoord;
  isAlive: boolean;
  tieBreaker: number; // Deterministic tie breaker for initiative

  // Turn status
  hasMoved: boolean;
  hasActed: boolean;

  // Progression (heroes only)
  exp: number;
  expToNextLevel: number;
}

export interface HeroProgressionData {
  id: string;
  name: string;
  archetype: HeroClass;
  level: number;
  exp: number;
  expToNextLevel: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface SaveGameData {
  version: number;
  timestamp: number;
  gold: number;
  completedEncounters: string[];
  battlesWon: number;
  heroes: HeroProgressionData[];
}

export type ActionMode = 'idle' | 'moving' | 'target_attack' | 'target_skill';

export interface FloatingText {
  id: string;
  text: string;
  worldCoord: GridCoord;
  color: string;
  startTime: number;
  duration: number;
  offsetY: number;
  isCrit?: boolean;
}

export interface ProjectileAnimation {
  id: string;
  type: 'arrow' | 'fireball' | 'slash';
  startCoord: GridCoord;
  targetCoord: GridCoord;
  startTime: number;
  duration: number;
  onComplete: () => void;
}

export interface LogMessage {
  id: string;
  round: number;
  text: string;
  type: 'info' | 'attack' | 'skill' | 'death' | 'level' | 'turn';
  timestamp: number;
}

export interface CombatResult {
  damage: number;
  isFatal: boolean;
  targetId: string;
  attackerId: string;
  actionName: string;
  affectedTargets: Array<{ unitId: string; damage: number; isFatal: boolean }>;
}
