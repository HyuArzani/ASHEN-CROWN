/**
 * Movement and Action Animation Controller for Ashen Crown
 * Manages transient visual states, segment progress, facing direction,
 * frame progression, and action completions at 60 FPS.
 */

import { GridCoord } from '../types/game';
import {
  AnimState,
  getDefaultDirection,
  getDirectionFromDelta,
  IsoDirection,
} from './spriteData';

export interface UnitVisualState {
  unitId: string;
  animation: AnimState;
  direction: IsoDirection;
  elapsedTime: number; // in seconds
  isMoving: boolean;

  // Movement along path
  path: GridCoord[];
  currentSegmentIndex: number;
  segmentProgress: number; // 0 to 1
  speed: number; // tiles per second (e.g. 3.5)

  // Computed visual position in logical grid space (interpolated float)
  visualCoord: { x: number; y: number };

  // Callbacks
  onComplete?: () => void;
  onStep?: (node: GridCoord) => void;

  // Custom action timer
  actionDuration?: number;
}

export class AnimationController {
  private unitStates = new Map<string, UnitVisualState>();

  /**
   * Initializes or gets current visual state for a unit
   */
  public getOrCreateState(
    unitId: string,
    initialCoord: GridCoord,
    faction: 'hero' | 'enemy'
  ): UnitVisualState {
    let state = this.unitStates.get(unitId);
    if (!state) {
      state = {
        unitId,
        animation: 'idle',
        direction: getDefaultDirection(faction),
        elapsedTime: 0,
        isMoving: false,
        path: [initialCoord],
        currentSegmentIndex: 0,
        segmentProgress: 0,
        speed: 3.6, // tiles per second
        visualCoord: { x: initialCoord.x, y: initialCoord.y },
      };
      this.unitStates.set(unitId, state);
    }
    return state;
  }

  public getState(unitId: string): UnitVisualState | undefined {
    return this.unitStates.get(unitId);
  }

  public isUnitAnimating(unitId: string): boolean {
    const s = this.unitStates.get(unitId);
    return s ? s.isMoving || s.animation === 'attack' || s.animation === 'hit' : false;
  }

  public isAnyUnitMoving(): boolean {
    for (const state of this.unitStates.values()) {
      if (state.isMoving) return true;
    }
    return false;
  }

  /**
   * Starts walking animation along a pre-calculated BFS path
   */
  public startMovement(
    unitId: string,
    path: GridCoord[],
    faction: 'hero' | 'enemy',
    onComplete: () => void,
    onStep?: (node: GridCoord) => void
  ) {
    if (!path || path.length < 2) {
      onComplete();
      return;
    }

    const state = this.getOrCreateState(unitId, path[0], faction);
    state.isMoving = true;
    state.animation = 'walk';
    state.path = path;
    state.currentSegmentIndex = 0;
    state.segmentProgress = 0;
    state.elapsedTime = 0;
    state.onComplete = onComplete;
    state.onStep = onStep;

    // Face direction of first step
    state.direction = getDirectionFromDelta(
      path[1].x - path[0].x,
      path[1].y - path[0].y
    );
  }

  /**
   * Starts an attack animation towards a target coordinate
   */
  public startAttack(
    unitId: string,
    targetCoord: GridCoord,
    faction: 'hero' | 'enemy',
    onImpact: () => void,
    onComplete: () => void
  ) {
    const state = this.getOrCreateState(unitId, targetCoord, faction);
    state.isMoving = false;
    state.animation = 'attack';
    state.elapsedTime = 0;
    state.actionDuration = 0.4; // 400ms attack animation

    // Face target
    const current = state.visualCoord;
    state.direction = getDirectionFromDelta(
      targetCoord.x - current.x,
      targetCoord.y - current.y
    );

    let impactTriggered = false;

    // We trigger impact callback halfway through attack
    state.onComplete = () => {
      if (!impactTriggered) {
        impactTriggered = true;
        onImpact();
      }
      state.animation = 'idle';
      onComplete();
    };

    // Trigger impact at ~200ms
    setTimeout(() => {
      if (!impactTriggered) {
        impactTriggered = true;
        onImpact();
      }
    }, 200);
  }

  /**
   * Plays a brief hit flinch animation
   */
  public startHit(unitId: string, coord: GridCoord, faction: 'hero' | 'enemy') {
    const state = this.getOrCreateState(unitId, coord, faction);
    state.animation = 'hit';
    state.elapsedTime = 0;
    state.actionDuration = 0.25; // 250ms flinch
    state.onComplete = () => {
      state.animation = 'idle';
    };
  }

  /**
   * Main update tick called on every animation frame with delta time
   */
  public update(rawDt: number) {
    // Clamp dt to maximum 50ms to prevent jumps after tab suspend
    const dt = Math.min(rawDt, 0.05);

    for (const state of this.unitStates.values()) {
      state.elapsedTime += dt;

      // 1. Process movement
      if (state.isMoving && state.path.length > 1) {
        state.segmentProgress += dt * state.speed;

        const curIndex = state.currentSegmentIndex;
        const cur = state.path[curIndex];
        const next = state.path[curIndex + 1];

        if (cur && next) {
          // Linear interpolation between path nodes
          const p = Math.min(1.0, state.segmentProgress);
          state.visualCoord = {
            x: cur.x + (next.x - cur.x) * p,
            y: cur.y + (next.y - cur.y) * p,
          };
        }

        // Check if current segment reached
        if (state.segmentProgress >= 1.0) {
          state.currentSegmentIndex++;
          state.segmentProgress = 0;

          if (state.currentSegmentIndex < state.path.length) {
            const arrivedNode = state.path[state.currentSegmentIndex];
            state.visualCoord = { x: arrivedNode.x, y: arrivedNode.y };
            if (state.onStep) {
              state.onStep(arrivedNode);
            }
          }

          // Check if path is finished
          if (state.currentSegmentIndex >= state.path.length - 1) {
            const finalNode = state.path[state.path.length - 1];
            state.visualCoord = { x: finalNode.x, y: finalNode.y };
            state.isMoving = false;
            state.animation = 'idle';
            const cb = state.onComplete;
            state.onComplete = undefined;
            if (cb) {
              cb();
            }
          } else {
            // Update direction for next segment
            const nodeA = state.path[state.currentSegmentIndex];
            const nodeB = state.path[state.currentSegmentIndex + 1];
            state.direction = getDirectionFromDelta(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
          }
        }
      } else if (state.actionDuration && state.animation !== 'idle' && state.animation !== 'walk') {
        // Non-movement timed action (attack / hit)
        if (state.elapsedTime >= state.actionDuration) {
          state.actionDuration = undefined;
          const cb = state.onComplete;
          state.onComplete = undefined;
          state.animation = 'idle';
          if (cb) {
            cb();
          }
        }
      }
    }
  }

  /**
   * Resets or aligns a unit's visual coordinate to logical coordinate
   */
  public syncUnitPosition(unitId: string, coord: GridCoord, faction: 'hero' | 'enemy') {
    const state = this.getOrCreateState(unitId, coord, faction);
    if (!state.isMoving) {
      state.visualCoord = { x: coord.x, y: coord.y };
    }
  }
}

export const animController = new AnimationController();
