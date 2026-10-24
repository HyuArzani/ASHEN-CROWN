/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActionMode,
  FloatingText,
  GridCoord,
  HeroProgressionData,
  LogMessage,
  ProjectileAnimation,
  SaveGameData,
  SkillDefinition,
  TileData,
  Unit,
} from './types/game';
import {
  areCoordsEqual,
  createDefaultMap,
  getManhattanDistance,
  GRID_COLS,
  GRID_ROWS,
  hasLineOfSight,
} from './logic/grid';
import { getReachableTiles, findPath } from './logic/pathfinding';
import {
  canAttackTarget,
  calculateAttackDamage,
  canUseSkill,
  calculateSkillDamage,
  getSkillAffectedCoords,
  CLASS_SKILLS,
} from './logic/combat';
import { computeEnemyTurn } from './logic/ai';
import { buildRoundQueue, getNextActiveUnitId, sanitizeQueue } from './logic/initiative';
import {
  applyHeroRewards,
  clearSaveData,
  createNewSaveData,
  loadGame,
  saveGame,
} from './logic/storage';
import { sounds } from './audio/sound';
import { animController } from './graphics/animationController';

import { BattlefieldCanvas } from './components/BattlefieldCanvas';
import { InitiativeQueue } from './components/InitiativeQueue';
import { UnitCard } from './components/UnitCard';
import { ActionMenu } from './components/ActionMenu';
import { CombatLog } from './components/CombatLog';
import { TitleScreen } from './components/TitleScreen';
import { VictoryModal } from './components/VictoryModal';
import { DefeatModal } from './components/DefeatModal';
import { Volume2, VolumeX, ShieldAlert, Award } from 'lucide-react';

type GameScreen = 'title' | 'battle' | 'victory' | 'defeat';

export default function App() {
  // Screen state
  const [screen, setScreen] = useState<GameScreen>('title');
  const [saveData, setSaveData] = useState<SaveGameData | null>(null);

  // Battlefield state
  const [map, setMap] = useState<TileData[][]>(createDefaultMap);
  const [units, setUnits] = useState<Unit[]>([]);
  const [round, setRound] = useState(1);
  const [queue, setQueue] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Interaction & UI state
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [hoveredCoord, setHoveredCoord] = useState<GridCoord | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>('idle');
  const [selectedSkill, setSelectedSkill] = useState<SkillDefinition | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [saveIndicator, setSaveIndicator] = useState<string | null>(null);

  // Animations
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [projectiles, setProjectiles] = useState<ProjectileAnimation[]>([]);

  // Victory rewards tracking
  const [rewardData, setRewardData] = useState<{
    exp: number;
    gold: number;
    levelUps: Array<{ name: string; newLevel: number }>;
  }>({ exp: 0, gold: 0, levelUps: [] });

  // Guard against AI execution loops
  const isExecutingAITurnRef = useRef(false);

  // 1. Initial Load of campaign from localStorage
  useEffect(() => {
    const existing = loadGame();
    if (existing) {
      setSaveData(existing);
    }
  }, []);

  const addLog = useCallback(
    (text: string, type: LogMessage['type'] = 'info') => {
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          round,
          text,
          type,
          timestamp: Date.now(),
        },
      ]);
    },
    [round]
  );

  const addFloatingText = (
    text: string,
    worldCoord: GridCoord,
    color: string = '#f87171',
    isCrit: boolean = false
  ) => {
    const id = `ft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setFloatingTexts((prev) => [
      ...prev,
      {
        id,
        text,
        worldCoord,
        color,
        startTime: performance.now(),
        duration: 1100,
        offsetY: 0,
        isCrit,
      },
    ]);
  };

  /**
   * Initializes a fresh encounter.
   * If existing progression exists, heroes use persistent stats and levels.
   */
  const startEncounter = (progression: HeroProgressionData[]) => {
    const freshMap = createDefaultMap();
    setMap(freshMap);

    const knightProg = progression.find((h) => h.archetype === 'knight')!;
    const archerProg = progression.find((h) => h.archetype === 'archer')!;
    const mageProg = progression.find((h) => h.archetype === 'mage')!;

    const initialUnits: Unit[] = [
      // 3 Heroes
      {
        id: knightProg.id,
        name: knightProg.name,
        faction: 'hero',
        archetype: 'knight',
        level: knightProg.level,
        currentHp: knightProg.maxHp,
        maxHp: knightProg.maxHp,
        attack: knightProg.attack,
        defense: knightProg.defense,
        speed: knightProg.speed,
        movementRange: 3,
        attackRange: 1,
        skills: [CLASS_SKILLS.power_strike],
        coord: { x: 1, y: 2 },
        isAlive: true,
        tieBreaker: 0.05,
        hasMoved: false,
        hasActed: false,
        exp: knightProg.exp,
        expToNextLevel: knightProg.expToNextLevel,
      },
      {
        id: archerProg.id,
        name: archerProg.name,
        faction: 'hero',
        archetype: 'archer',
        level: archerProg.level,
        currentHp: archerProg.maxHp,
        maxHp: archerProg.maxHp,
        attack: archerProg.attack,
        defense: archerProg.defense,
        speed: archerProg.speed,
        movementRange: 4,
        attackRange: 3,
        skills: [CLASS_SKILLS.piercing_shot],
        coord: { x: 1, y: 1 },
        isAlive: true,
        tieBreaker: 0.04,
        hasMoved: false,
        hasActed: false,
        exp: archerProg.exp,
        expToNextLevel: archerProg.expToNextLevel,
      },
      {
        id: mageProg.id,
        name: mageProg.name,
        faction: 'hero',
        archetype: 'mage',
        level: mageProg.level,
        currentHp: mageProg.maxHp,
        maxHp: mageProg.maxHp,
        attack: mageProg.attack,
        defense: mageProg.defense,
        speed: mageProg.speed,
        movementRange: 3,
        attackRange: 2,
        skills: [CLASS_SKILLS.fireball],
        coord: { x: 2, y: 1 },
        isAlive: true,
        tieBreaker: 0.03,
        hasMoved: false,
        hasActed: false,
        exp: mageProg.exp,
        expToNextLevel: mageProg.expToNextLevel,
      },

      // 4 Enemies
      {
        id: 'enemy_goblin_1',
        name: 'Goblin Skirmisher A',
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
        coord: { x: 7, y: 6 },
        isAlive: true,
        tieBreaker: 0.02,
        hasMoved: false,
        hasActed: false,
        exp: 0,
        expToNextLevel: 100,
      },
      {
        id: 'enemy_goblin_2',
        name: 'Goblin Skirmisher B',
        faction: 'enemy',
        archetype: 'goblin',
        level: 1,
        currentHp: 18,
        maxHp: 18,
        attack: 9,
        defense: 1,
        speed: 12,
        movementRange: 4,
        attackRange: 1,
        skills: [],
        coord: { x: 8, y: 7 },
        isAlive: true,
        tieBreaker: 0.01,
        hasMoved: false,
        hasActed: false,
        exp: 0,
        expToNextLevel: 100,
      },
      {
        id: 'enemy_slime_1',
        name: 'Iron Slime A',
        faction: 'enemy',
        archetype: 'slime',
        level: 1,
        currentHp: 28,
        maxHp: 28,
        attack: 8,
        defense: 4,
        speed: 7,
        movementRange: 2,
        attackRange: 1,
        skills: [],
        coord: { x: 6, y: 8 },
        isAlive: true,
        tieBreaker: 0.06,
        hasMoved: false,
        hasActed: false,
        exp: 0,
        expToNextLevel: 100,
      },
      {
        id: 'enemy_slime_2',
        name: 'Iron Slime B',
        faction: 'enemy',
        archetype: 'slime',
        level: 1,
        currentHp: 28,
        maxHp: 28,
        attack: 8,
        defense: 4,
        speed: 6,
        movementRange: 2,
        attackRange: 1,
        skills: [],
        coord: { x: 8, y: 6 },
        isAlive: true,
        tieBreaker: 0.07,
        hasMoved: false,
        hasActed: false,
        exp: 0,
        expToNextLevel: 100,
      },
    ];

    setUnits(initialUnits);
    setRound(1);

    // Synchronize initial unit positions with animation controller
    for (const u of initialUnits) {
      animController.syncUnitPosition(u.id, u.coord, u.faction);
    }

    const initialQueue = buildRoundQueue(initialUnits);
    setQueue(initialQueue);
    setQueueIndex(0);

    const firstActive = initialQueue[0] || null;
    setSelectedUnitId(firstActive);
    setActionMode('idle');
    setSelectedSkill(null);

    setLogs([
      {
        id: 'init-1',
        round: 1,
        text: 'Encounter initialized at the Ancient Sunken Ruins.',
        type: 'info',
        timestamp: Date.now(),
      },
    ]);

    setScreen('battle');
  };

  const handleStartNewGame = () => {
    const newSave = createNewSaveData();
    saveGame(newSave);
    setSaveData(newSave);
    showAutosaveFeedback('Campaign initialized');
    startEncounter(newSave.heroes);
  };

  const handleContinueGame = () => {
    if (saveData) {
      startEncounter(saveData.heroes);
    }
  };

  const handleResetSave = () => {
    clearSaveData();
    setSaveData(null);
    showAutosaveFeedback('Saved progression erased');
  };

  const showAutosaveFeedback = (msg: string) => {
    setSaveIndicator(msg);
    setTimeout(() => setSaveIndicator(null), 2500);
  };

  // Active unit reference
  const activeUnitId = queue[queueIndex] || null;
  const activeUnit = units.find((u) => u.id === activeUnitId && u.isAlive) || null;
  const isHeroTurn = activeUnit ? activeUnit.faction === 'hero' : false;
  const inspectedUnit = units.find((u) => u.id === selectedUnitId && u.isAlive) || activeUnit;

  // Check victory / defeat conditions after state changes
  useEffect(() => {
    if (screen !== 'battle' || units.length === 0) return;

    const livingHeroes = units.filter((u) => u.isAlive && u.faction === 'hero');
    const livingEnemies = units.filter((u) => u.isAlive && u.faction === 'enemy');

    // Victory: All 4 enemies defeated!
    if (livingEnemies.length === 0 && livingHeroes.length > 0) {
      sounds.playVictory();
      addLog('VICTORY! All enemies have been eradicated from the field.', 'turn');

      // Grant rewards exactly once
      const currentSave = saveData || createNewSaveData();
      const expReward = 100;
      const goldReward = 75;

      const { updatedHeroes, levelUps } = applyHeroRewards(currentSave.heroes, expReward);
      const updatedSave: SaveGameData = {
        ...currentSave,
        gold: currentSave.gold + goldReward,
        battlesWon: currentSave.battlesWon + 1,
        completedEncounters: Array.from(
          new Set([...currentSave.completedEncounters, 'ruins_encounter_01'])
        ),
        heroes: updatedHeroes,
      };

      saveGame(updatedSave);
      setSaveData(updatedSave);
      showAutosaveFeedback('Campaign Saved (Victory)');

      setRewardData({
        exp: expReward,
        gold: goldReward,
        levelUps,
      });

      setScreen('victory');
      return;
    }

    // Defeat: All 3 heroes down
    if (livingHeroes.length === 0) {
      sounds.playDefeat();
      addLog('DEFEAT! All vanguard heroes have fallen.', 'death');
      setScreen('defeat');
      return;
    }
  }, [units, screen, saveData, addLog]);

  // Turn management: Advance Turn
  const advanceTurn = useCallback(() => {
    setActionMode('idle');
    setSelectedSkill(null);

    // Look for next living unit in the current queue
    const nextResult = getNextActiveUnitId(queue, queueIndex, units);

    if (nextResult) {
      setQueueIndex(nextResult.nextIndex);
      setSelectedUnitId(nextResult.activeUnitId);
      const nextUnit = units.find((u) => u.id === nextResult.activeUnitId);
      if (nextUnit) {
        addLog(`${nextUnit.name} begins activation.`, 'turn');
      }
    } else {
      // Round completed! Start next round
      const nextRound = round + 1;
      setRound(nextRound);
      addLog(`Round ${nextRound} commences. Initiative order recalculated.`, 'turn');

      // Reset unit action states
      setUnits((prev) =>
        prev.map((u) => ({
          ...u,
          hasMoved: false,
          hasActed: false,
        }))
      );

      const newQueue = buildRoundQueue(units);
      setQueue(newQueue);
      setQueueIndex(0);
      const firstId = newQueue[0] || null;
      setSelectedUnitId(firstId);
      const firstUnit = units.find((u) => u.id === firstId);
      if (firstUnit) {
        addLog(`${firstUnit.name} takes the first turn in Round ${nextRound}.`, 'turn');
      }
    }
  }, [queue, queueIndex, units, round, addLog]);

  // Automated Enemy AI execution
  useEffect(() => {
    if (screen !== 'battle' || !activeUnit || activeUnit.faction !== 'enemy') return;
    if (isExecutingAITurnRef.current) return;

    isExecutingAITurnRef.current = true;

    const timer = setTimeout(() => {
      const decision = computeEnemyTurn(activeUnit, units, map);

      // Handle AI Movement
      if (decision.moveTo && decision.path && decision.path.length > 1) {
        const finalDest = decision.moveTo;

        animController.startMovement(
          activeUnit.id,
          decision.path,
          activeUnit.faction,
          () => {
            // Commit movement exactly once on completion
            setUnits((prev) =>
              prev.map((u) =>
                u.id === activeUnit.id
                  ? { ...u, coord: finalDest, hasMoved: true }
                  : u
              )
            );

            // Handle AI Attack after arrival
            if (decision.attackTargetId) {
              executeAIAttack(activeUnit, finalDest, decision.attackTargetId);
            } else {
              isExecutingAITurnRef.current = false;
              advanceTurn();
            }
          },
          () => {
            sounds.playStep();
          }
        );
      } else if (decision.attackTargetId) {
        // Attack without moving
        executeAIAttack(activeUnit, activeUnit.coord, decision.attackTargetId);
      } else {
        // AI Waits
        addLog(`${activeUnit.name} waits and assesses the vanguard.`, 'info');
        isExecutingAITurnRef.current = false;
        advanceTurn();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [activeUnit, screen, units, map, advanceTurn]);

  const executeAIAttack = (enemy: Unit, enemyPos: GridCoord, targetHeroId: string) => {
    const target = units.find((u) => u.id === targetHeroId && u.isAlive);
    if (!target) {
      isExecutingAITurnRef.current = false;
      advanceTurn();
      return;
    }

    const damage = calculateAttackDamage(enemy, target);
    const remainingHp = Math.max(0, target.currentHp - damage);
    const isFatal = remainingHp === 0;

    animController.startAttack(
      enemy.id,
      target.coord,
      enemy.faction,
      () => {
        // Impact callback
        sounds.playSlash();

        const slashAnim: ProjectileAnimation = {
          id: `ai-slash-${Date.now()}`,
          type: 'slash',
          startCoord: enemyPos,
          targetCoord: target.coord,
          startTime: performance.now(),
          duration: 250,
          onComplete: () => {},
        };
        setProjectiles((prev) => [...prev, slashAnim]);

        animController.startHit(target.id, target.coord, target.faction);
        addFloatingText(`-${damage}`, target.coord, '#f87171');
        addLog(
          `${enemy.name} strikes ${target.name} for ${damage} damage.${
            isFatal ? ` ${target.name} is incapacitated!` : ''
          }`,
          'attack'
        );

        if (isFatal) {
          sounds.playDeath();
        }

        setUnits((prev) =>
          prev.map((u) => {
            if (u.id === target.id) {
              return {
                ...u,
                currentHp: remainingHp,
                isAlive: !isFatal,
              };
            }
            if (u.id === enemy.id) {
              return { ...u, hasActed: true };
            }
            return u;
          })
        );
      },
      () => {
        // Attack animation completed
        setProjectiles([]);
        isExecutingAITurnRef.current = false;
        advanceTurn();
      }
    );
  };

  // Calculate overlay tiles based on current action mode
  const reachableCoords = new Set<string>();
  const attackableCoords = new Set<string>();
  const aoeCoords = new Set<string>();

  if (activeUnit && isHeroTurn) {
    if (actionMode === 'moving' && !activeUnit.hasMoved) {
      const reachableMap = getReachableTiles(activeUnit, map, units);
      for (const key of reachableMap.keys()) {
        reachableCoords.add(key);
      }
    } else if (actionMode === 'target_attack' && !activeUnit.hasActed) {
      // Find enemies within attack range with valid LOS
      for (const u of units) {
        if (u.isAlive && u.faction === 'enemy') {
          if (canAttackTarget(activeUnit, u, map).valid) {
            attackableCoords.add(`${u.coord.x},${u.coord.y}`);
          }
        }
      }
    } else if (actionMode === 'target_skill' && selectedSkill && !activeUnit.hasActed) {
      if (selectedSkill.aoeRadius === 0) {
        // Single target skill
        for (const u of units) {
          if (u.isAlive && u.faction === 'enemy') {
            if (canUseSkill(activeUnit, selectedSkill, u.coord, map, units).valid) {
              attackableCoords.add(`${u.coord.x},${u.coord.y}`);
            }
          }
        }
      } else {
        // AoE cast range (e.g. Fireball)
        for (let x = 0; x < GRID_COLS; x++) {
          for (let y = 0; y < GRID_ROWS; y++) {
            const dist = getManhattanDistance(activeUnit.coord, { x, y });
            if (dist <= selectedSkill.range) {
              // Line of sight check to center of cast
              const los = hasLineOfSight(activeUnit.coord, { x, y }, (c) => {
                const tile = map[c.x]?.[c.y];
                return tile ? tile.blocksLos : false;
              });
              if (los) {
                attackableCoords.add(`${x},${y}`);
              }
            }
          }
        }

        // If hovering over a valid cast tile, show affected blast radius
        if (hoveredCoord && attackableCoords.has(`${hoveredCoord.x},${hoveredCoord.y}`)) {
          const blastCoords = getSkillAffectedCoords(
            hoveredCoord,
            selectedSkill.aoeRadius
          );
          for (const c of blastCoords) {
            aoeCoords.add(`${c.x},${c.y}`);
          }
        }
      }
    }
  }

  // Active path highlight if hovering over reachable move tile
  let activePath: GridCoord[] | null = null;
  if (actionMode === 'moving' && hoveredCoord && activeUnit) {
    if (reachableCoords.has(`${hoveredCoord.x},${hoveredCoord.y}`)) {
      activePath = findPath(
        activeUnit.coord,
        hoveredCoord,
        map,
        units,
        activeUnit.id,
        activeUnit.movementRange
      );
    }
  }

  // Tile click handler for Player commands
  const handleTileClick = (coord: GridCoord) => {
    // If animations are running, ignore clicks
    if (animController.isAnyUnitMoving() || (activeUnit && animController.isUnitAnimating(activeUnit.id))) {
      return;
    }

    // If not player's turn, clicking inspects units
    const unitOnTile = units.find(
      (u) => u.isAlive && areCoordsEqual(u.coord, coord)
    );

    if (!isHeroTurn || !activeUnit) {
      if (unitOnTile) {
        sounds.playSelect();
        setSelectedUnitId(unitOnTile.id);
      }
      return;
    }

    // 1. Move Mode
    if (actionMode === 'moving' && !activeUnit.hasMoved && !animController.isUnitAnimating(activeUnit.id)) {
      if (reachableCoords.has(`${coord.x},${coord.y}`)) {
        const path = findPath(
          activeUnit.coord,
          coord,
          map,
          units,
          activeUnit.id,
          activeUnit.movementRange
        );
        if (path && path.length > 1) {
          setActionMode('idle');

          animController.startMovement(
            activeUnit.id,
            path,
            activeUnit.faction,
            () => {
              // Commit movement exactly once on arrival
              setUnits((prev) =>
                prev.map((u) =>
                  u.id === activeUnit.id
                    ? { ...u, coord, hasMoved: true }
                    : u
                )
              );
              addLog(`${activeUnit.name} advanced to (${coord.x}, ${coord.y}).`, 'info');

              // If action already used, automatically end turn
              if (activeUnit.hasActed) {
                advanceTurn();
              }
            },
            () => {
              sounds.playStep();
            }
          );
          return;
        }
      }
    }

    // 2. Basic Attack Mode
    if (actionMode === 'target_attack' && !activeUnit.hasActed && !animController.isUnitAnimating(activeUnit.id)) {
      if (attackableCoords.has(`${coord.x},${coord.y}`)) {
        const target = units.find(
          (u) => u.isAlive && areCoordsEqual(u.coord, coord)
        );
        if (target && target.faction === 'enemy') {
          executePlayerAttack(activeUnit, target);
          return;
        }
      }
    }

    // 3. Skill Mode
    if (actionMode === 'target_skill' && selectedSkill && !activeUnit.hasActed && !animController.isUnitAnimating(activeUnit.id)) {
      if (selectedSkill.aoeRadius === 0) {
        // Single target skill (Knight Power Strike, Archer Piercing Shot)
        if (attackableCoords.has(`${coord.x},${coord.y}`)) {
          const target = units.find(
            (u) => u.isAlive && areCoordsEqual(u.coord, coord)
          );
          if (target && target.faction === 'enemy') {
            executePlayerSkill(activeUnit, selectedSkill, coord, [target]);
            return;
          }
        }
      } else {
        // Area of Effect skill (Mage Fireball)
        if (attackableCoords.has(`${coord.x},${coord.y}`)) {
          const blastCoords = getSkillAffectedCoords(coord, selectedSkill.aoeRadius);
          const targets = units.filter(
            (u) =>
              u.isAlive &&
              u.faction === 'enemy' &&
              blastCoords.some((bc) => areCoordsEqual(bc, u.coord))
          );
          executePlayerSkill(activeUnit, selectedSkill, coord, targets);
          return;
        }
      }
    }

    // Default tile click: inspect unit on tile
    if (unitOnTile) {
      sounds.playSelect();
      setSelectedUnitId(unitOnTile.id);
    }
  };

  const executePlayerAttack = (attacker: Unit, target: Unit) => {
    const isRanged = attacker.attackRange > 1;
    const damage = calculateAttackDamage(attacker, target);
    const remHp = Math.max(0, target.currentHp - damage);
    const isFatal = remHp === 0;

    animController.startAttack(
      attacker.id,
      target.coord,
      attacker.faction,
      () => {
        // Impact callback
        if (isRanged) {
          sounds.playBow();
          const proj: ProjectileAnimation = {
            id: `arrow-${Date.now()}`,
            type: 'arrow',
            startCoord: attacker.coord,
            targetCoord: target.coord,
            startTime: performance.now(),
            duration: 220,
            onComplete: () => {},
          };
          setProjectiles((prev) => [...prev, proj]);
        } else {
          sounds.playSlash();
          const slash: ProjectileAnimation = {
            id: `slash-${Date.now()}`,
            type: 'slash',
            startCoord: attacker.coord,
            targetCoord: target.coord,
            startTime: performance.now(),
            duration: 180,
            onComplete: () => {},
          };
          setProjectiles((prev) => [...prev, slash]);
        }

        animController.startHit(target.id, target.coord, target.faction);
        addFloatingText(`-${damage}`, target.coord, '#ef4444');
        addLog(
          `${attacker.name} attacked ${target.name} for ${damage} damage.${
            isFatal ? ` ${target.name} was vanquished!` : ''
          }`,
          'attack'
        );

        if (isFatal) {
          sounds.playDeath();
        }

        setUnits((prev) =>
          prev.map((u) => {
            if (u.id === target.id) {
              return { ...u, currentHp: remHp, isAlive: !isFatal };
            }
            if (u.id === attacker.id) {
              return { ...u, hasActed: true };
            }
            return u;
          })
        );
      },
      () => {
        // Attack complete callback
        setProjectiles([]);
        setActionMode('idle');

        // If moved already, end turn
        if (attacker.hasMoved) {
          advanceTurn();
        }
      }
    );
  };

  const executePlayerSkill = (
    attacker: Unit,
    skill: SkillDefinition,
    castCoord: GridCoord,
    targets: Unit[]
  ) => {
    animController.startAttack(
      attacker.id,
      castCoord,
      attacker.faction,
      () => {
        // Impact callback
        if (skill.id === 'fireball') {
          sounds.playFireball();
          const proj: ProjectileAnimation = {
            id: `fb-${Date.now()}`,
            type: 'fireball',
            startCoord: attacker.coord,
            targetCoord: castCoord,
            startTime: performance.now(),
            duration: 320,
            onComplete: () => {},
          };
          setProjectiles((prev) => [...prev, proj]);
        } else if (skill.id === 'piercing_shot') {
          sounds.playBow();
          const proj: ProjectileAnimation = {
            id: `pierce-${Date.now()}`,
            type: 'arrow',
            startCoord: attacker.coord,
            targetCoord: castCoord,
            startTime: performance.now(),
            duration: 200,
            onComplete: () => {},
          };
          setProjectiles((prev) => [...prev, proj]);
        } else {
          // Power Strike
          sounds.playSlash();
          const slash: ProjectileAnimation = {
            id: `strike-${Date.now()}`,
            type: 'slash',
            startCoord: attacker.coord,
            targetCoord: castCoord,
            startTime: performance.now(),
            duration: 200,
            onComplete: () => {},
          };
          setProjectiles((prev) => [...prev, slash]);
        }

        const updates = targets.map((t) => {
          const dmg = calculateSkillDamage(attacker, skill, t);
          const remHp = Math.max(0, t.currentHp - dmg);
          const isFatal = remHp === 0;
          animController.startHit(t.id, t.coord, t.faction);
          addFloatingText(`-${dmg}`, t.coord, '#f97316', true);
          addLog(
            `${attacker.name} unleashed ${skill.name} on ${t.name} for ${dmg} damage!${
              isFatal ? ` ${t.name} was incinerated!` : ''
            }`,
            'skill'
          );
          if (isFatal) sounds.playDeath();
          return { targetId: t.id, remHp, isFatal };
        });

        if (targets.length === 0) {
          addLog(`${attacker.name} cast ${skill.name}, striking empty ground.`, 'skill');
        }

        setUnits((prev) =>
          prev.map((u) => {
            const match = updates.find((up) => up.targetId === u.id);
            if (match) {
              return { ...u, currentHp: match.remHp, isAlive: !match.isFatal };
            }
            if (u.id === attacker.id) {
              return { ...u, hasActed: true };
            }
            return u;
          })
        );
      },
      () => {
        // Skill complete callback
        setProjectiles([]);
        setActionMode('idle');
        setSelectedSkill(null);

        // If unit already moved, automatically advance turn
        if (attacker.hasMoved) {
          advanceTurn();
        }
      }
    );
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'battle') return;
      if (animController.isAnyUnitMoving()) return;

      if (e.key === 'Escape') {
        setActionMode('idle');
        setSelectedSkill(null);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (isHeroTurn && activeUnit) {
          advanceTurn();
        }
      } else if (e.key === '1' && isHeroTurn && activeUnit && !activeUnit.hasMoved) {
        setActionMode('moving');
      } else if (e.key === '2' && isHeroTurn && activeUnit && !activeUnit.hasActed) {
        setActionMode('target_attack');
      } else if (
        e.key === '3' &&
        isHeroTurn &&
        activeUnit &&
        activeUnit.skills[0] &&
        !activeUnit.hasActed
      ) {
        setActionMode('target_skill');
        setSelectedSkill(activeUnit.skills[0]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isHeroTurn, activeUnit, advanceTurn]);

  // Audio toggle
  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none flex flex-col">
      {/* TITLE SCREEN */}
      {screen === 'title' && (
        <TitleScreen
          hasSave={Boolean(saveData)}
          saveData={saveData}
          onNewGame={handleStartNewGame}
          onContinue={handleContinueGame}
          onResetSave={handleResetSave}
        />
      )}

      {/* BATTLE SCREEN */}
      {screen === 'battle' && (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          {/* Top Bar Header with Initiative Timeline and Status */}
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 pointer-events-none">
            {/* Left: Game Title and Save Indicator */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setScreen('title')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 text-xs font-cinzel font-bold shadow-md transition-all"
              >
                <span>Ashen Crown</span>
              </button>

              {saveIndicator && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900/90 border border-emerald-500/40 rounded-lg text-[10px] font-mono text-emerald-300 shadow-md animate-fade-in">
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>{saveIndicator}</span>
                </div>
              )}
            </div>

            {/* Center: Initiative Queue */}
            <div className="pointer-events-auto">
              <InitiativeQueue
                queue={queue}
                currentIndex={queueIndex}
                units={units}
                activeUnitId={activeUnitId}
                round={round}
                onSelectUnit={(id) => setSelectedUnitId(id)}
              />
            </div>

            {/* Right: Audio mute button & battle objective */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-neutral-300 shadow-md">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Objective: Slay all 4 enemies</span>
              </div>

              <button
                onClick={toggleSound}
                className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-neutral-100 shadow-md transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            </div>
          </div>

          {/* 60fps HTML5 Canvas Isometric Battlefield */}
          <div className="flex-1 w-full h-full relative">
            <BattlefieldCanvas
              map={map}
              units={units}
              activeUnitId={activeUnitId}
              selectedUnitId={selectedUnitId}
              hoveredCoord={hoveredCoord}
              reachableCoords={reachableCoords}
              attackableCoords={attackableCoords}
              aoeCoords={aoeCoords}
              activePath={activePath}
              actionMode={actionMode}
              floatingTexts={floatingTexts}
              projectiles={projectiles}
              onTileClick={handleTileClick}
              onTileHover={(c) => setHoveredCoord(c)}
            />
          </div>

          {/* Bottom Tactical HUD Clusters */}
          <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-col md:flex-row items-end justify-between gap-3 pointer-events-none">
            {/* Bottom Left: Unit Card Inspector */}
            <div className="pointer-events-auto">
              <UnitCard
                unit={inspectedUnit}
                isActiveTurn={inspectedUnit ? inspectedUnit.id === activeUnitId : false}
              />
            </div>

            {/* Bottom Center: Action Menu */}
            <div className="pointer-events-auto self-center">
              <ActionMenu
                activeUnit={activeUnit}
                isHeroTurn={isHeroTurn}
                actionMode={actionMode}
                selectedSkill={selectedSkill}
                onSetMode={(mode, skill) => {
                  sounds.playSelect();
                  setActionMode(mode);
                  setSelectedSkill(skill || null);
                }}
                onEndTurn={() => {
                  sounds.playSelect();
                  advanceTurn();
                }}
                onCancelMode={() => {
                  sounds.playSelect();
                  setActionMode('idle');
                  setSelectedSkill(null);
                }}
              />
            </div>

            {/* Bottom Right: Combat Chronicle Log */}
            <div className="pointer-events-auto">
              <CombatLog logs={logs} />
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {screen === 'victory' && (
        <VictoryModal
          expGained={rewardData.exp}
          goldGained={rewardData.gold}
          levelUps={rewardData.levelUps}
          heroes={saveData ? saveData.heroes : []}
          onContinue={() => {
            if (saveData) {
              startEncounter(saveData.heroes);
            }
          }}
          onReturnTitle={() => setScreen('title')}
        />
      )}

      {/* DEFEAT MODAL */}
      {screen === 'defeat' && (
        <DefeatModal
          onRetry={() => {
            const heroes = saveData ? saveData.heroes : createNewSaveData().heroes;
            startEncounter(heroes);
          }}
          onReturnTitle={() => setScreen('title')}
        />
      )}
    </div>
  );
}
