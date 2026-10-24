/**
 * Sprite Sheet Generator and Texture Atlas for Ashen Crown
 * Generates transparent 48x48 16-bit pixel-art sprite sheets for all 5 archetypes:
 * Knight, Archer, Mage, Goblin, Slime
 * Supporting 4 directions (SE, SW, NE, NW) and 4 animation states (idle, walk, attack, hit).
 */

import {
  AnimState,
  AnimationDef,
  ArchetypeSpriteDef,
  FRAME_SIZE,
  GROUND_ANCHOR_X,
  GROUND_ANCHOR_Y,
  IsoDirection,
} from './spriteData';

const DIRECTIONS: IsoDirection[] = ['SE', 'SW', 'NE', 'NW'];
const ARCHETYPES = ['knight', 'archer', 'mage', 'goblin', 'slime'] as const;
type Archetype = (typeof ARCHETYPES)[number];

// Palette colors
const C = {
  // Knight
  knightArmor: '#9ba4b5',
  knightArmorLight: '#e2e8f0',
  knightArmorDark: '#475569',
  knightCape: '#dc2626',
  knightCapeDark: '#991b1b',
  knightGold: '#f59e0b',
  knightShield: '#1e3a8a',
  knightBlade: '#f8fafc',

  // Archer
  archerTunic: '#15803d',
  archerTunicLight: '#22c55e',
  archerCape: '#14532d',
  archerLeather: '#78350f',
  archerSkin: '#fed7aa',
  archerBow: '#b45309',
  archerFeather: '#fde047',

  // Mage
  mageRobe: '#1e1b4b',
  mageRobeLight: '#312e81',
  mageTrim: '#818cf8',
  mageGold: '#fbbf24',
  mageEyes: '#38bdf8',
  mageStaff: '#5c3a21',
  mageCrystal: '#00f0ff',
  mageSpark: '#a5f3fc',

  // Goblin
  goblinSkin: '#65a30d',
  goblinSkinLight: '#84cc16',
  goblinSkinDark: '#3f6212',
  goblinLeather: '#713f12',
  goblinEyes: '#facc15',
  goblinClub: '#451a03',
  goblinSpike: '#94a3b8',

  // Slime
  slimeBody: '#3b82f6',
  slimeLight: '#93c5fd',
  slimeDark: '#1d4ed8',
  slimeCore: '#1e40af',
  slimeEye: '#0f172a',

  // General
  shadow: 'rgba(0, 0, 0, 0.35)',
  hitFlash: '#ffffff',
};

export interface AtlasRegistry {
  canvas: HTMLCanvasElement;
  definitions: Map<string, ArchetypeSpriteDef>;
}

let cachedRegistry: AtlasRegistry | null = null;

export function getSpriteAtlasRegistry(): AtlasRegistry {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  // Create atlas canvas:
  // 5 archetypes vertically (each takes 4 directions * 4 animStates rows)
  // Each animation clip has up to 4 frames horizontally.
  // 4 anim states: idle (4 frames), walk (4 frames), attack (4 frames), hit (2 frames)
  // Total rows per archetype = 4 directions * 4 states = 16 rows
  // 5 archetypes * 16 rows = 80 rows
  // Max frames per row = 4 frames
  // Atlas size: (4 * 48) x (80 * 48) = 192 x 3840
  const cols = 4;
  const rows = ARCHETYPES.length * 16;
  const atlasWidth = cols * FRAME_SIZE;
  const atlasHeight = rows * FRAME_SIZE;

  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create canvas 2D context for sprite atlas');
  }

  ctx.imageSmoothingEnabled = false;

  const definitions = new Map<string, ArchetypeSpriteDef>();
  let currentRow = 0;

  for (const archetype of ARCHETYPES) {
    const archetypeDef: ArchetypeSpriteDef = {
      archetype,
      frameWidth: FRAME_SIZE,
      frameHeight: FRAME_SIZE,
      anchorX: GROUND_ANCHOR_X,
      anchorY: GROUND_ANCHOR_Y,
      animations: {},
    };

    for (const dir of DIRECTIONS) {
      // 1. Idle (4 frames)
      const idleRow = currentRow++;
      for (let f = 0; f < 4; f++) {
        drawCharacterFrame(ctx, archetype, 'idle', dir, f, f * FRAME_SIZE, idleRow * FRAME_SIZE);
      }
      archetypeDef.animations[`idle_${dir}`] = {
        name: 'idle',
        direction: dir,
        fps: 4,
        loop: true,
        frames: [0, 1, 2, 3].map((f) => ({
          sx: f * FRAME_SIZE,
          sy: idleRow * FRAME_SIZE,
          sw: FRAME_SIZE,
          sh: FRAME_SIZE,
        })),
      };

      // 2. Walk (4 frames)
      const walkRow = currentRow++;
      for (let f = 0; f < 4; f++) {
        drawCharacterFrame(ctx, archetype, 'walk', dir, f, f * FRAME_SIZE, walkRow * FRAME_SIZE);
      }
      archetypeDef.animations[`walk_${dir}`] = {
        name: 'walk',
        direction: dir,
        fps: 10,
        loop: true,
        frames: [0, 1, 2, 3].map((f) => ({
          sx: f * FRAME_SIZE,
          sy: walkRow * FRAME_SIZE,
          sw: FRAME_SIZE,
          sh: FRAME_SIZE,
        })),
      };

      // 3. Attack (4 frames)
      const attackRow = currentRow++;
      for (let f = 0; f < 4; f++) {
        drawCharacterFrame(ctx, archetype, 'attack', dir, f, f * FRAME_SIZE, attackRow * FRAME_SIZE);
      }
      archetypeDef.animations[`attack_${dir}`] = {
        name: 'attack',
        direction: dir,
        fps: 10,
        loop: false,
        frames: [0, 1, 2, 3].map((f) => ({
          sx: f * FRAME_SIZE,
          sy: attackRow * FRAME_SIZE,
          sw: FRAME_SIZE,
          sh: FRAME_SIZE,
        })),
      };

      // 4. Hit (2 frames)
      const hitRow = currentRow++;
      for (let f = 0; f < 2; f++) {
        drawCharacterFrame(ctx, archetype, 'hit', dir, f, f * FRAME_SIZE, hitRow * FRAME_SIZE);
      }
      archetypeDef.animations[`hit_${dir}`] = {
        name: 'hit',
        direction: dir,
        fps: 8,
        loop: false,
        frames: [0, 1].map((f) => ({
          sx: f * FRAME_SIZE,
          sy: hitRow * FRAME_SIZE,
          sw: FRAME_SIZE,
          sh: FRAME_SIZE,
        })),
      };
    }

    definitions.set(archetype, archetypeDef);
  }

  cachedRegistry = { canvas, definitions };
  return cachedRegistry;
}

/**
 * Procedural rasterizer for specific character animation frames
 */
function drawCharacterFrame(
  ctx: CanvasRenderingContext2D,
  archetype: Archetype,
  anim: AnimState,
  dir: IsoDirection,
  frame: number,
  destX: number,
  destY: number
) {
  ctx.save();
  ctx.translate(destX, destY);

  const cx = GROUND_ANCHOR_X;
  const cy = GROUND_ANCHOR_Y;

  // Ground shadow
  const shadowScale = anim === 'walk' && (frame === 1 || frame === 3) ? 0.85 : 1.0;
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 12 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dispatch to archetype drawer
  switch (archetype) {
    case 'knight':
      drawKnightFrame(ctx, cx, cy, anim, dir, frame);
      break;
    case 'archer':
      drawArcherFrame(ctx, cx, cy, anim, dir, frame);
      break;
    case 'mage':
      drawMageFrame(ctx, cx, cy, anim, dir, frame);
      break;
    case 'goblin':
      drawGoblinFrame(ctx, cx, cy, anim, dir, frame);
      break;
    case 'slime':
      drawSlimeFrame(ctx, cx, cy, anim, dir, frame);
      break;
  }

  ctx.restore();
}

/**
 * KNIGHT SPRITE DRAWER
 */
function drawKnightFrame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  anim: AnimState,
  dir: IsoDirection,
  frame: number
) {
  const isBack = dir === 'NW' || dir === 'NE';
  const flip = dir === 'SW' || dir === 'NW' ? -1 : 1;

  let bodyY = cy - 20;
  let legSpread = 0;
  let swordAngle = 0;
  let shieldOffset = 0;
  let capeWave = 0;

  if (anim === 'idle') {
    bodyY += frame % 2 === 1 ? -1 : 0;
    capeWave = frame % 2 === 1 ? 1 : 0;
  } else if (anim === 'walk') {
    // 4 walk frames: 0: left forward, 1: pass, 2: right forward, 3: pass
    if (frame === 0) {
      legSpread = -3;
      bodyY += 0;
      swordAngle = -0.2;
    } else if (frame === 1) {
      legSpread = 0;
      bodyY -= 2; // Rise
      swordAngle = 0;
      capeWave = 2;
    } else if (frame === 2) {
      legSpread = 3;
      bodyY += 0;
      swordAngle = 0.2;
    } else {
      legSpread = 0;
      bodyY -= 2;
      swordAngle = 0;
      capeWave = -1;
    }
  } else if (anim === 'attack') {
    if (frame === 0) {
      // Windup
      bodyY += 1;
      swordAngle = -0.6 * flip;
      shieldOffset = -2;
    } else if (frame === 1) {
      // Forward strike
      bodyY -= 1;
      swordAngle = 0.8 * flip;
      shieldOffset = 1;
      legSpread = 4;
    } else if (frame === 2) {
      // Extension
      swordAngle = 1.2 * flip;
      legSpread = 3;
    } else {
      // Recovery
      swordAngle = 0.3 * flip;
    }
  } else if (anim === 'hit') {
    bodyY += 2;
    swordAngle = -0.4;
  }

  ctx.save();
  ctx.translate(cx, bodyY);

  // Cape behind body
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.knightCape;
  ctx.beginPath();
  ctx.moveTo(-5 * flip, 0);
  ctx.lineTo((-9 - capeWave) * flip, 14);
  ctx.lineTo((1 + capeWave) * flip, 14);
  ctx.lineTo(3 * flip, 0);
  ctx.closePath();
  ctx.fill();

  // Legs & Greaves
  ctx.fillStyle = C.knightArmorDark;
  ctx.fillRect(-5 + legSpread, 10, 3, 8);
  ctx.fillRect(2 - legSpread, 10, 3, 8);

  // Armor Breastplate
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.knightArmor;
  ctx.fillRect(-7, -2, 14, 13);
  ctx.fillStyle = C.knightArmorLight;
  ctx.fillRect(-6, -1, 3, 4);

  // Gold belt / crest
  ctx.fillStyle = C.knightGold;
  ctx.fillRect(-4, 7, 8, 2);
  ctx.fillRect(-1, 2, 2, 4);

  // Pauldrons (shoulders)
  ctx.fillStyle = C.knightArmorLight;
  ctx.fillRect(-9, -2, 3, 4);
  ctx.fillRect(6, -2, 3, 4);

  // Shield (on left side)
  ctx.save();
  ctx.translate((-7 + shieldOffset) * flip, 4);
  ctx.fillStyle = C.knightShield;
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.lineTo(4, -5);
  ctx.lineTo(4, 3);
  ctx.lineTo(0, 7);
  ctx.lineTo(-4, 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.knightGold;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Sword (on right side)
  ctx.save();
  ctx.translate(7 * flip, 3);
  ctx.rotate(swordAngle);
  // Blade
  ctx.fillStyle = C.knightBlade;
  ctx.fillRect(-1, -16, 2, 16);
  // Crossguard
  ctx.fillStyle = C.knightGold;
  ctx.fillRect(-3, -2, 6, 2);
  // Pommel
  ctx.fillRect(-1, 1, 2, 2);
  ctx.restore();

  // Helmet
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.knightArmor;
  ctx.fillRect(-5, -12, 10, 10);
  // Visor or back of helm
  if (!isBack) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3 * flip, -8, 6, 2);
  }
  // Crest feather plume
  ctx.fillStyle = C.knightCape;
  ctx.fillRect(-2, -15, 4, 3);

  ctx.restore();
}

/**
 * ARCHER SPRITE DRAWER
 */
function drawArcherFrame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  anim: AnimState,
  dir: IsoDirection,
  frame: number
) {
  const isBack = dir === 'NW' || dir === 'NE';
  const flip = dir === 'SW' || dir === 'NW' ? -1 : 1;

  let bodyY = cy - 20;
  let legSpread = 0;
  let bowPull = 0;

  if (anim === 'idle') {
    bodyY += frame % 2 === 1 ? -1 : 0;
  } else if (anim === 'walk') {
    if (frame === 0) legSpread = -3;
    else if (frame === 1) {
      legSpread = 0;
      bodyY -= 2;
    } else if (frame === 2) legSpread = 3;
    else {
      legSpread = 0;
      bodyY -= 2;
    }
  } else if (anim === 'attack') {
    if (frame === 0) bowPull = 2; // draw
    else if (frame === 1) bowPull = 5; // full draw
    else if (frame === 2) bowPull = 0; // release
    else bowPull = 0;
  } else if (anim === 'hit') {
    bodyY += 2;
  }

  ctx.save();
  ctx.translate(cx, bodyY);

  // Cloak behind
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.archerCape;
  ctx.beginPath();
  ctx.moveTo(-4 * flip, 0);
  ctx.lineTo(-8 * flip, 13);
  ctx.lineTo(2 * flip, 13);
  ctx.closePath();
  ctx.fill();

  // Boots
  ctx.fillStyle = C.archerLeather;
  ctx.fillRect(-4 + legSpread, 10, 3, 7);
  ctx.fillRect(1 - legSpread, 10, 3, 7);

  // Tunic
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.archerTunic;
  ctx.fillRect(-5, 0, 10, 11);
  ctx.fillStyle = C.archerTunicLight;
  ctx.fillRect(-3, 1, 2, 4);

  // Quiver across back
  ctx.fillStyle = C.archerLeather;
  ctx.fillRect(-6 * flip, -4, 3, 10);
  ctx.fillStyle = '#e2e8f0'; // Arrows
  ctx.fillRect(-6 * flip, -7, 2, 3);

  // Bow
  ctx.save();
  ctx.translate(6 * flip, 3);
  ctx.strokeStyle = C.archerBow;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 9, -Math.PI / 2, Math.PI / 2, flip < 0);
  ctx.stroke();

  // String & drawn arrow
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(-bowPull * flip, 0);
  ctx.lineTo(0, 9);
  ctx.stroke();

  if (bowPull > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-bowPull * flip, 0);
    ctx.lineTo(8 * flip, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Hood & Head
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.archerTunic;
  ctx.fillRect(-4, -10, 8, 9);
  if (!isBack) {
    ctx.fillStyle = C.archerSkin;
    ctx.fillRect(-2 * flip, -7, 4, 3);
    ctx.fillStyle = '#451a03'; // Eyes
    ctx.fillRect(0, -6, 2, 1);
  }
  // Golden feather
  ctx.fillStyle = C.archerFeather;
  ctx.fillRect(2 * flip, -12, 2, 4);

  ctx.restore();
}

/**
 * MAGE SPRITE DRAWER
 */
function drawMageFrame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  anim: AnimState,
  dir: IsoDirection,
  frame: number
) {
  const isBack = dir === 'NW' || dir === 'NE';
  const flip = dir === 'SW' || dir === 'NW' ? -1 : 1;

  let bodyY = cy - 20;
  let robeSway = 0;
  let staffLift = 0;
  let crystalFlare = 1.0;

  if (anim === 'idle') {
    bodyY += frame % 2 === 1 ? -1 : 0;
    crystalFlare = 0.8 + (frame % 4) * 0.15;
  } else if (anim === 'walk') {
    if (frame === 0) robeSway = -2;
    else if (frame === 1) {
      robeSway = 0;
      bodyY -= 2;
    } else if (frame === 2) robeSway = 2;
    else {
      robeSway = 0;
      bodyY -= 2;
    }
  } else if (anim === 'attack') {
    if (frame === 0) {
      staffLift = -4;
      crystalFlare = 1.5;
    } else if (frame === 1) {
      staffLift = -8;
      crystalFlare = 2.2;
    } else if (frame === 2) {
      staffLift = -3;
      crystalFlare = 1.8;
    } else {
      staffLift = 0;
      crystalFlare = 1.0;
    }
  } else if (anim === 'hit') {
    bodyY += 2;
    crystalFlare = 0.4;
  }

  ctx.save();
  ctx.translate(cx, bodyY);

  // Flowing robe body
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.mageRobe;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-8 + robeSway, 17);
  ctx.lineTo(8 + robeSway, 17);
  ctx.lineTo(5, 0);
  ctx.closePath();
  ctx.fill();

  // Gold trim on hem
  ctx.fillStyle = C.mageGold;
  ctx.fillRect(-8 + robeSway, 15, 16, 2);

  // Robe sleeves
  ctx.fillStyle = C.mageTrim;
  ctx.fillRect(-7, 1, 3, 8);
  ctx.fillRect(4, 1, 3, 8);

  // Staff in hand
  ctx.save();
  ctx.translate(8 * flip, 6 + staffLift);
  ctx.fillStyle = C.mageStaff;
  ctx.fillRect(-1, -18, 2, 28);

  // Pulsing crystal orb
  ctx.fillStyle = C.mageCrystal;
  ctx.beginPath();
  ctx.arc(0, -20, 3.5 * crystalFlare, 0, Math.PI * 2);
  ctx.fill();

  // Crystal sparks
  if (crystalFlare > 1.2) {
    ctx.fillStyle = C.mageSpark;
    ctx.fillRect(-4, -24, 2, 2);
    ctx.fillRect(3, -22, 2, 2);
  }
  ctx.restore();

  // Deep cowl hood
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.mageRobe;
  ctx.fillRect(-5, -11, 10, 11);
  if (!isBack) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3 * flip, -8, 6, 4);
    // Glowing cyan mystic eyes
    ctx.fillStyle = C.mageEyes;
    ctx.fillRect(-2 * flip, -7, 2, 2);
    ctx.fillRect(1 * flip, -7, 2, 2);
  }

  ctx.restore();
}

/**
 * GOBLIN SPRITE DRAWER
 */
function drawGoblinFrame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  anim: AnimState,
  dir: IsoDirection,
  frame: number
) {
  const isBack = dir === 'NW' || dir === 'NE';
  const flip = dir === 'SW' || dir === 'NW' ? -1 : 1;

  let bodyY = cy - 18;
  let legSpread = 0;
  let clubAngle = 0;

  if (anim === 'idle') {
    bodyY += frame % 2 === 1 ? -1 : 0;
  } else if (anim === 'walk') {
    if (frame === 0) legSpread = -3;
    else if (frame === 1) {
      legSpread = 0;
      bodyY -= 2;
      clubAngle = 0.2;
    } else if (frame === 2) legSpread = 3;
    else {
      legSpread = 0;
      bodyY -= 2;
      clubAngle = -0.2;
    }
  } else if (anim === 'attack') {
    if (frame === 0) clubAngle = -0.8 * flip; // windup overhead
    else if (frame === 1) clubAngle = 0.9 * flip; // smash down
    else if (frame === 2) clubAngle = 1.2 * flip; // ground impact
    else clubAngle = 0.3 * flip;
  } else if (anim === 'hit') {
    bodyY += 2;
    clubAngle = -0.5;
  }

  ctx.save();
  ctx.translate(cx, bodyY);

  // Legs
  ctx.fillStyle = C.goblinSkinDark;
  ctx.fillRect(-4 + legSpread, 9, 3, 7);
  ctx.fillRect(1 - legSpread, 9, 3, 7);

  // Hunched torso & loincloth
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.goblinSkin;
  ctx.fillRect(-5, 0, 10, 10);
  ctx.fillStyle = C.goblinLeather;
  ctx.fillRect(-5, 7, 10, 4);

  // Spiked club
  ctx.save();
  ctx.translate(-7 * flip, 3);
  ctx.rotate(clubAngle);
  ctx.fillStyle = C.goblinClub;
  ctx.fillRect(-2, -14, 4, 16);
  // Iron spike
  ctx.fillStyle = C.goblinSpike;
  ctx.fillRect(-4, -13, 2, 2);
  ctx.fillRect(2, -10, 2, 2);
  ctx.restore();

  // Head and pointy ears
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.goblinSkin;
  ctx.fillRect(-4, -9, 8, 8);
  // Big ears
  ctx.beginPath();
  ctx.moveTo(-4, -7);
  ctx.lineTo(-9, -10);
  ctx.lineTo(-4, -4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, -7);
  ctx.lineTo(9, -10);
  ctx.lineTo(4, -4);
  ctx.closePath();
  ctx.fill();

  // Yellow menacing eyes
  if (!isBack) {
    ctx.fillStyle = C.goblinEyes;
    ctx.fillRect(-3 * flip, -6, 2, 2);
    ctx.fillRect(1 * flip, -6, 2, 2);
  }

  ctx.restore();
}

/**
 * SLIME SPRITE DRAWER
 */
function drawSlimeFrame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  anim: AnimState,
  dir: IsoDirection,
  frame: number
) {
  let scaleX = 1.0;
  let scaleY = 1.0;
  let offsetY = cy - 10;
  let lungeX = 0;

  const flip = dir === 'SW' || dir === 'NW' ? -1 : 1;

  if (anim === 'idle') {
    const pulse = (frame % 4) * 0.05;
    scaleX = 1.0 + pulse;
    scaleY = 1.0 - pulse;
  } else if (anim === 'walk') {
    if (frame === 0) {
      // Squash contact
      scaleX = 1.25;
      scaleY = 0.75;
      offsetY += 2;
    } else if (frame === 1) {
      // Stretch upward
      scaleX = 0.8;
      scaleY = 1.25;
      offsetY -= 4;
      lungeX = 2 * flip;
    } else if (frame === 2) {
      // Forward leap
      scaleX = 1.1;
      scaleY = 0.95;
      offsetY -= 2;
      lungeX = 4 * flip;
    } else {
      // Rebound
      scaleX = 0.95;
      scaleY = 1.05;
      offsetY -= 1;
    }
  } else if (anim === 'attack') {
    if (frame === 0) {
      // Coil back
      scaleX = 0.8;
      scaleY = 1.2;
      lungeX = -3 * flip;
    } else if (frame === 1) {
      // Thrust lunge
      scaleX = 1.4;
      scaleY = 0.7;
      lungeX = 6 * flip;
    } else if (frame === 2) {
      // Extension
      scaleX = 1.2;
      scaleY = 0.85;
      lungeX = 4 * flip;
    } else {
      scaleX = 1.0;
      scaleY = 1.0;
    }
  } else if (anim === 'hit') {
    scaleX = 1.3;
    scaleY = 0.6;
    offsetY += 3;
  }

  ctx.save();
  ctx.translate(cx + lungeX, offsetY);
  ctx.scale(scaleX, scaleY);

  // Gelatinous body
  ctx.fillStyle = anim === 'hit' && frame === 0 ? C.hitFlash : C.slimeBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight specular curve
  ctx.fillStyle = C.slimeLight;
  ctx.beginPath();
  ctx.ellipse(-4 * flip, -4, 4, 2, -0.4 * flip, 0, Math.PI * 2);
  ctx.fill();

  // Inner nucleus core
  ctx.fillStyle = C.slimeCore;
  ctx.beginPath();
  ctx.ellipse(1 * flip, 1, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark playful eyes
  ctx.fillStyle = C.slimeEye;
  ctx.fillRect(-4 * flip, -1, 2, 3);
  ctx.fillRect(2 * flip, -1, 2, 3);

  ctx.restore();
}
