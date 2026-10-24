/**
 * Animation and Sprite Sheet Metadata for Ashen Crown
 */

export type IsoDirection = 'SE' | 'SW' | 'NE' | 'NW';
export type AnimState = 'idle' | 'walk' | 'attack' | 'hit';

export interface FrameRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface AnimationDef {
  name: AnimState;
  direction: IsoDirection;
  frames: FrameRect[];
  fps: number;
  loop: boolean;
}

export interface ArchetypeSpriteDef {
  archetype: string;
  frameWidth: number;
  frameHeight: number;
  anchorX: number; // Ground contact X in frame (e.g. 24)
  anchorY: number; // Ground contact Y in frame (e.g. 44)
  animations: Record<string, AnimationDef>; // Key: `${animState}_${direction}`
}

export const FRAME_SIZE = 48;
export const GROUND_ANCHOR_X = 24;
export const GROUND_ANCHOR_Y = 44;

/**
 * Maps coordinate delta to the 4 isometric facing directions
 * (+X: SE, -X: NW, +Y: SW, -Y: NE)
 */
export function getDirectionFromDelta(dx: number, dy: number): IsoDirection {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'SE' : 'NW';
  } else {
    return dy >= 0 ? 'SW' : 'NE';
  }
}

/**
 * Returns default facing direction based on faction
 */
export function getDefaultDirection(faction: 'hero' | 'enemy'): IsoDirection {
  return faction === 'hero' ? 'SE' : 'NW';
}
