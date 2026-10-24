import {
  areCoordsEqual,
  createDefaultMap,
  getManhattanDistance,
  gridToScreen,
  hasLineOfSight,
  screenToGrid,
} from './grid';
import { getReachableTiles, findPath } from './pathfinding';
import {
  calculateAttackDamage,
  calculateSkillDamage,
  canAttackTarget,
  canUseSkill,
  getSkillAffectedCoords,
  CLASS_SKILLS,
} from './combat';
import { buildRoundQueue, getNextActiveUnitId } from './initiative';
import {
  applyHeroRewards,
  createNewSaveData,
  validateSaveData,
} from './storage';
import { computeEnemyTurn } from './ai';
import { Unit } from '../types/game';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

console.log('--- ASHEN CROWN LOGIC VERIFICATION SUITE ---');

// 1. Grid Conversion Test
const originX = 400;
const originY = 200;
const testCoords = [
  { x: 0, y: 0 },
  { x: 5, y: 5 },
  { x: 2, y: 7 },
  { x: 9, y: 9 },
];

for (const c of testCoords) {
  const screen = gridToScreen(c.x, c.y, originX, originY);
  // The center of the tile diamond is at y + 18
  const resolved = screenToGrid(screen.x, screen.y + 18, originX, originY);
  assert(
    resolved !== null && resolved.x === c.x && resolved.y === c.y,
    `Grid roundtrip conversion for (${c.x}, ${c.y}) resolved to (${resolved?.x}, ${resolved?.y})`
  );
}

// 2. Map and Obstacles Test
const map = createDefaultMap();
assert(map.length === 10 && map[0].length === 10, 'Battlefield map has 10x10 dimensions');
assert(!map[2][4].walkable, 'Rock at (2,4) is impassable');
assert(!map[1][6].walkable, 'Tree at (1,6) is impassable');
assert(!map[4][4].walkable, 'Ruin at (4,4) is impassable');
assert(map[1][2].walkable, 'Hero spawn tile (1,2) is walkable');

// 3. Line of sight Test
// Rock at (2,4) blocks ray from (2,3) to (2,5)
const losBlocked = hasLineOfSight({ x: 2, y: 2 }, { x: 2, y: 6 }, (c) => !map[c.x]?.[c.y]?.walkable);
assert(!losBlocked, 'Line of sight is blocked across rock obstacle');
const losClear = hasLineOfSight({ x: 0, y: 0 }, { x: 0, y: 3 }, (c) => !map[c.x]?.[c.y]?.walkable);
assert(losClear, 'Line of sight is clear when no obstacle intervenes');

// 4. Movement Range & Pathfinding BFS Test
const mockKnight: Unit = {
  id: 'hero_knight',
  name: 'Sir Gareth',
  faction: 'hero',
  archetype: 'knight',
  level: 1,
  currentHp: 36,
  maxHp: 36,
  attack: 14,
  defense: 4,
  speed: 10,
  movementRange: 3,
  attackRange: 1,
  skills: [CLASS_SKILLS.power_strike],
  coord: { x: 1, y: 2 },
  isAlive: true,
  tieBreaker: 0.05,
  hasMoved: false,
  hasActed: false,
  exp: 0,
  expToNextLevel: 100,
};

const reachable = getReachableTiles(mockKnight, map, [mockKnight]);
assert(reachable.size > 1, `Reachable tiles found for move range 3: ${reachable.size} tiles`);
assert(reachable.has('1,2'), 'Reachable includes starting position (cost 0)');
assert(!reachable.has('2,4'), 'Impassable rock (2,4) is not reachable');
assert(!reachable.has('9,9'), 'Far tile (9,9) is out of movement range 3');

// Path test
const path = findPath({ x: 1, y: 2 }, { x: 1, y: 4 }, map, [mockKnight], mockKnight.id);
assert(path !== null && path.length === 3, `Path correctly calculated: length ${path?.length}`);

// 5. Combat Damage Formulas Test
const mockGoblin: Unit = {
  id: 'enemy_goblin_1',
  name: 'Goblin Skirmisher',
  faction: 'enemy',
  archetype: 'goblin',
  level: 1,
  currentHp: 18,
  maxHp: 18,
  attack: 9,
  defense: 1,
  speed: 13,
  movementRange: 4,
  attackRange: 1,
  skills: [],
  coord: { x: 1, y: 3 },
  isAlive: true,
  tieBreaker: 0.02,
  hasMoved: false,
  hasActed: false,
  exp: 0,
  expToNextLevel: 100,
};

// Knight ATK 14 vs Goblin DEF 1: Basic attack = 14 - 1 = 13
const basicDmg = calculateAttackDamage(mockKnight, mockGoblin);
assert(basicDmg === 13, `Basic attack damage calculated as 13 (got ${basicDmg})`);

// Power Strike: ATK 14 + 6 bonus - DEF 1 = 19
const powerStrikeDmg = calculateSkillDamage(mockKnight, CLASS_SKILLS.power_strike, mockGoblin);
assert(powerStrikeDmg === 19, `Power Strike damage calculated as 19 (got ${powerStrikeDmg})`);

// Slime DEF 4 vs Archer ATK 11 with Piercing Shot (pierce 2):
// Effective DEF = max(0, 4 - 2) = 2. Damage = 11 + 4 - 2 = 13.
const mockSlime: Unit = {
  ...mockGoblin,
  id: 'enemy_slime_1',
  archetype: 'slime',
  speed: 7,
  tieBreaker: 0.06,
  defense: 4,
  currentHp: 28,
};
const piercingDmg = calculateSkillDamage(
  { ...mockKnight, attack: 11 },
  CLASS_SKILLS.piercing_shot,
  mockSlime
);
assert(piercingDmg === 13, `Piercing Shot ignores 2 defense: damage is 13 (got ${piercingDmg})`);

// 6. AoE Fireball Area Test
const fireballCoords = getSkillAffectedCoords({ x: 5, y: 5 }, 1);
assert(fireballCoords.length === 5, 'Fireball AoE affects center + 4 cardinal tiles (5 tiles total)');

// 7. Initiative Ordering Test
const mockUnits = [
  mockKnight, // Speed 10.05
  mockGoblin, // Speed 13.02
  mockSlime,  // Speed 7.06
];
const initQueue = buildRoundQueue(mockUnits);
assert(
  initQueue[0] === 'enemy_goblin_1' &&
  initQueue[1] === 'hero_knight' &&
  initQueue[2] === 'enemy_slime_1',
  'Initiative queue correctly sorted by Speed + tie-breaker (Goblin > Knight > Slime)'
);

// Turn advance test
const nextTurn = getNextActiveUnitId(initQueue, 0, mockUnits);
assert(nextTurn?.activeUnitId === 'hero_knight', 'Queue correctly advances to next unit');

// 8. Deterministic AI Test
const aiDecision = computeEnemyTurn(mockGoblin, [mockKnight, mockGoblin], map);
assert(
  aiDecision.attackTargetId === 'hero_knight',
  'Goblin adjacent to Knight decides to attack Knight'
);

// 9. Campaign Storage & Level-Up Test
const freshSave = createNewSaveData();
assert(validateSaveData(freshSave), 'Default save data passes schema validation');
assert(freshSave.heroes.length === 3, 'Save includes all 3 heroes');

// Level up test: give 150 EXP
const { updatedHeroes, levelUps } = applyHeroRewards(freshSave.heroes, 150);
assert(levelUps.length === 3, 'All 3 heroes leveled up with 150 EXP');
assert(updatedHeroes[0].level === 2, 'Hero knight leveled up to Level 2');
assert(updatedHeroes[0].maxHp === 36 + 8, `Knight max HP increased by +8 to ${updatedHeroes[0].maxHp}`);

// 10. Isometric Direction and Movement Animation Controller Test
import { getDirectionFromDelta } from '../graphics/spriteData';
import { AnimationController } from '../graphics/animationController';

assert(getDirectionFromDelta(1, 0) === 'SE', 'Delta (+1, 0) maps to SE facing');
assert(getDirectionFromDelta(-1, 0) === 'NW', 'Delta (-1, 0) maps to NW facing');
assert(getDirectionFromDelta(0, 1) === 'SW', 'Delta (0, +1) maps to SW facing');
assert(getDirectionFromDelta(0, -1) === 'NE', 'Delta (0, -1) maps to NE facing');

const testController = new AnimationController();
let moveCompleted = false;
let stepCount = 0;

// Multi-direction path: (1,1) -> (2,1) [SE] -> (2,2) [SW]
const testPath = [
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
];

testController.startMovement(
  'test_hero',
  testPath,
  'hero',
  () => {
    moveCompleted = true;
  },
  () => {
    stepCount++;
  }
);

let state = testController.getState('test_hero')!;
assert(state.isMoving, 'Unit is marked as moving upon startMovement');
assert(state.animation === 'walk', 'Unit animation state is set to walk');
assert(state.direction === 'SE', 'Initial movement direction is SE');

// Simulate half a second of movement (dt = 0.05 * 10 steps = 0.5s)
for (let i = 0; i < 6; i++) {
  testController.update(0.05);
}

state = testController.getState('test_hero')!;
assert(
  state.visualCoord.x > 1.0,
  `Visual position smoothly interpolated along segment: x = ${state.visualCoord.x.toFixed(2)}`
);

// Advance until first segment completes
while (state.currentSegmentIndex === 0) {
  testController.update(0.02);
}
assert(state.direction === 'SW', 'Facing direction correctly updated to SW on second segment');

// Advance until entire path completes
while (!moveCompleted) {
  testController.update(0.02);
}

assert(moveCompleted, 'onComplete callback successfully triggered on arrival');
assert(!state.isMoving, 'isMoving is false after movement finishes');
assert(state.animation === 'idle', 'Animation transitions back to idle upon arrival');
assert(state.visualCoord.x === 2 && state.visualCoord.y === 2, 'Visual coordinate snaps exactly to destination (2, 2)');

console.log('--- ALL ACCEPTANCE CRITERIA UNIT TESTS PASSED SUCCESSFULLY! ---');
