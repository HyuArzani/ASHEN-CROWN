import { GridCoord, TerrainType, Unit, UnitArchetype } from '../types/game';
import { TILE_HEIGHT, TILE_WIDTH } from '../logic/grid';

/**
 * Procedural 16-bit pixel art renderer for Ashen Crown
 */

// Palette definitions (tactical fantasy)
export const PALETTE = {
  // Terrain
  grassTop: '#3e6b2c',
  grassHighlight: '#4e8637',
  grassShadow: '#2c4e1f',
  grassSide: '#1f3515',
  dirtSide: '#3b2f21',

  stoneTop: '#5a626a',
  stoneHighlight: '#747c85',
  stoneShadow: '#42484f',
  stoneSide: '#2e3338',

  rockColor: '#606770',
  rockHighlight: '#8b939c',
  rockShadow: '#3e4349',

  woodTrunk: '#4a2f1b',
  foliageTop: '#245229',
  foliageLight: '#327038',
  foliageShadow: '#163319',

  ruinColor: '#7a7672',
  ruinHighlight: '#9c9792',
  ruinShadow: '#4d4a47',

  // Hero colors
  knightArmor: '#9ba4b5',
  knightArmorHighlight: '#d4dbe8',
  knightArmorShadow: '#4f5665',
  knightCape: '#b91c1c',
  knightGold: '#d97706',

  archerTunic: '#15803d',
  archerLeather: '#78350f',
  archerCape: '#166534',
  archerBow: '#a16207',

  mageRobe: '#1e1b4b',
  mageTrim: '#818cf8',
  mageCrystal: '#38bdf8',
  mageGlow: 'rgba(56, 189, 248, 0.4)',

  // Enemy colors
  goblinSkin: '#65a30d',
  goblinCloth: '#713f12',
  goblinEyes: '#facc15',

  slimeBody: '#3b82f6',
  slimeHighlight: '#93c5fd',
  slimeCore: '#1d4ed8',

  // UI overlays
  moveFill: 'rgba(6, 182, 212, 0.35)',
  moveStroke: '#22d3ee',
  attackFill: 'rgba(239, 68, 68, 0.38)',
  attackStroke: '#f87171',
  aoeFill: 'rgba(249, 115, 22, 0.45)',
  aoeStroke: '#fb923c',
  hoverStroke: '#fbbf24',
  selectedStroke: '#f59e0b',
};

/**
 * Draws the isometric tile base and 3D depth extrusion.
 */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  terrain: TerrainType,
  width: number = TILE_WIDTH,
  height: number = TILE_HEIGHT,
  isHovered: boolean = false
) {
  const halfW = width / 2;
  const halfH = height / 2;
  const depth = 8; // Depth of isometric block side

  // 1. Draw tile 3D side block (extrusion below diamond)
  ctx.beginPath();
  ctx.moveTo(screenX - halfW, screenY + halfH);
  ctx.lineTo(screenX, screenY + height);
  ctx.lineTo(screenX, screenY + height + depth);
  ctx.lineTo(screenX - halfW, screenY + halfH + depth);
  ctx.closePath();
  ctx.fillStyle = terrain === 'stone' ? PALETTE.stoneSide : PALETTE.dirtSide;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(screenX, screenY + height);
  ctx.lineTo(screenX + halfW, screenY + halfH);
  ctx.lineTo(screenX + halfW, screenY + halfH + depth);
  ctx.lineTo(screenX, screenY + height + depth);
  ctx.closePath();
  ctx.fillStyle = terrain === 'stone' ? '#22262a' : '#261e15';
  ctx.fill();

  // 2. Draw top diamond face
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + halfW, screenY + halfH);
  ctx.lineTo(screenX, screenY + height);
  ctx.lineTo(screenX - halfW, screenY + halfH);
  ctx.closePath();

  if (terrain === 'stone') {
    ctx.fillStyle = PALETTE.stoneTop;
    ctx.fill();

    // Cobblestone grooves
    ctx.strokeStyle = PALETTE.stoneShadow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX - 10, screenY + halfH - 4);
    ctx.lineTo(screenX + 12, screenY + halfH + 6);
    ctx.moveTo(screenX - 8, screenY + halfH + 5);
    ctx.lineTo(screenX + 15, screenY + halfH - 5);
    ctx.stroke();
  } else {
    // Grass or default
    ctx.fillStyle = PALETTE.grassTop;
    ctx.fill();

    // Pixel grass details
    ctx.fillStyle = PALETTE.grassHighlight;
    ctx.fillRect(screenX - 8, screenY + halfH - 4, 3, 2);
    ctx.fillRect(screenX + 6, screenY + halfH + 2, 3, 2);
    ctx.fillRect(screenX - 2, screenY + halfH - 7, 2, 2);

    // Subtle flower accent
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(screenX + 12, screenY + halfH - 2, 2, 2);
  }

  // Diamond subtle border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hover outline
  if (isHovered) {
    ctx.save();
    ctx.strokeStyle = PALETTE.hoverStroke;
    ctx.lineWidth = 2;
    ctx.shadowColor = PALETTE.hoverStroke;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draws obstacles (rocks, trees, ruins) positioned on top of the tile.
 */
export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  terrain: TerrainType,
  width: number = TILE_WIDTH,
  height: number = TILE_HEIGHT
) {
  const centerX = screenX;
  const centerY = screenY + height / 2;

  if (terrain === 'rocks') {
    // Cast shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 4, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Multi-faceted rock boulder
    ctx.beginPath();
    ctx.moveTo(centerX - 16, centerY + 2);
    ctx.lineTo(centerX - 12, centerY - 16);
    ctx.lineTo(centerX + 2, centerY - 24);
    ctx.lineTo(centerX + 14, centerY - 14);
    ctx.lineTo(centerX + 16, centerY + 2);
    ctx.lineTo(centerX, centerY + 6);
    ctx.closePath();
    ctx.fillStyle = PALETTE.rockColor;
    ctx.fill();
    ctx.strokeStyle = '#282b2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rock highlights
    ctx.fillStyle = PALETTE.rockHighlight;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY - 16);
    ctx.lineTo(centerX + 2, centerY - 24);
    ctx.lineTo(centerX - 2, centerY - 8);
    ctx.lineTo(centerX - 10, centerY - 4);
    ctx.closePath();
    ctx.fill();

    // Moss patch on rock
    ctx.fillStyle = '#4d7c0f';
    ctx.fillRect(centerX - 8, centerY - 6, 5, 3);
    ctx.fillRect(centerX - 6, centerY - 3, 4, 2);
  } else if (terrain === 'trees') {
    // Tree ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 6, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden trunk
    ctx.fillStyle = PALETTE.woodTrunk;
    ctx.fillRect(centerX - 5, centerY - 20, 10, 24);
    ctx.strokeStyle = '#27170b';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - 5, centerY - 20, 10, 24);

    // Layered foliage canopy
    // Back shadow layer
    ctx.fillStyle = PALETTE.foliageShadow;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 34, 22, 0, Math.PI * 2);
    ctx.fill();

    // Mid layer
    ctx.fillStyle = PALETTE.foliageTop;
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 38, 19, 0, Math.PI * 2);
    ctx.fill();

    // Highlight top layer
    ctx.fillStyle = PALETTE.foliageLight;
    ctx.beginPath();
    ctx.arc(centerX - 7, centerY - 43, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 6, centerY - 40, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (terrain === 'ruins') {
    // Ancient stone pillar ruins
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 4, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Broken pillar column
    ctx.fillStyle = PALETTE.ruinColor;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY + 4);
    ctx.lineTo(centerX - 10, centerY - 24);
    ctx.lineTo(centerX - 3, centerY - 28);
    ctx.lineTo(centerX + 8, centerY - 22);
    ctx.lineTo(centerX + 10, centerY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.ruinShadow;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pillar carved grooves
    ctx.strokeStyle = PALETTE.ruinShadow;
    ctx.beginPath();
    ctx.moveTo(centerX - 4, centerY - 22);
    ctx.lineTo(centerX - 4, centerY + 2);
    ctx.moveTo(centerX + 3, centerY - 20);
    ctx.lineTo(centerX + 3, centerY + 3);
    ctx.stroke();

    // Highlight edge
    ctx.strokeStyle = PALETTE.ruinHighlight;
    ctx.beginPath();
    ctx.moveTo(centerX - 9, centerY - 23);
    ctx.lineTo(centerX - 9, centerY + 3);
    ctx.stroke();
  }
}

/**
 * Draws tile overlay for range (Move, Attack, AoE) or selection.
 */
export function drawTileOverlay(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  type: 'move' | 'attack' | 'aoe' | 'selected' | 'path',
  width: number = TILE_WIDTH,
  height: number = TILE_HEIGHT
) {
  const halfW = width / 2;
  const halfH = height / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + halfW, screenY + halfH);
  ctx.lineTo(screenX, screenY + height);
  ctx.lineTo(screenX - halfW, screenY + halfH);
  ctx.closePath();

  switch (type) {
    case 'move':
      ctx.fillStyle = PALETTE.moveFill;
      ctx.fill();
      ctx.strokeStyle = PALETTE.moveStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case 'attack':
      ctx.fillStyle = PALETTE.attackFill;
      ctx.fill();
      ctx.strokeStyle = PALETTE.attackStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case 'aoe':
      ctx.fillStyle = PALETTE.aoeFill;
      ctx.fill();
      ctx.strokeStyle = PALETTE.aoeStroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    case 'selected':
      ctx.strokeStyle = PALETTE.selectedStroke;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = PALETTE.selectedStroke;
      ctx.shadowBlur = 8;
      ctx.stroke();
      break;
    case 'path':
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
  }
  ctx.restore();
}

import { getSpriteAtlasRegistry } from './spriteSheetGenerator';
import {
  AnimState,
  FRAME_SIZE,
  GROUND_ANCHOR_X,
  GROUND_ANCHOR_Y,
  IsoDirection,
} from './spriteData';

/**
 * Sprite-sheet character rendering with animations and directional facing.
 */
export function drawUnitSprite(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  screenX: number,
  screenY: number,
  animState: AnimState = 'idle',
  direction: IsoDirection = 'SE',
  elapsedTime: number = 0,
  isCurrentTurn: boolean = false,
  isSelected: boolean = false
) {
  const centerX = screenX;
  const baseCenterY = screenY + TILE_HEIGHT / 2;

  // 1. Active turn glow ring
  if (isCurrentTurn) {
    ctx.save();
    ctx.strokeStyle = unit.faction === 'hero' ? '#38bdf8' : '#f87171';
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(centerX, baseCenterY + 2, 16, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Selection pointer arrow
  if (isSelected) {
    ctx.save();
    const arrowY = baseCenterY - 50 + Math.sin(elapsedTime * 8) * 3;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(centerX, arrowY + 8);
    ctx.lineTo(centerX - 6, arrowY);
    ctx.lineTo(centerX + 6, arrowY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. Render animated sprite from texture atlas
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  try {
    const registry = getSpriteAtlasRegistry();
    const archetypeDef = registry.definitions.get(unit.archetype);

    if (archetypeDef) {
      const clipKey = `${animState}_${direction}`;
      const clip = archetypeDef.animations[clipKey] || archetypeDef.animations[`idle_${direction}`] || archetypeDef.animations[`idle_SE`];

      if (clip && clip.frames.length > 0) {
        let frameIndex = Math.floor(elapsedTime * clip.fps);
        if (clip.loop) {
          frameIndex = frameIndex % clip.frames.length;
        } else {
          frameIndex = Math.min(frameIndex, clip.frames.length - 1);
        }

        const f = clip.frames[frameIndex];
        const destX = Math.round(centerX - GROUND_ANCHOR_X);
        const destY = Math.round(baseCenterY - GROUND_ANCHOR_Y);

        ctx.drawImage(
          registry.canvas,
          f.sx,
          f.sy,
          f.sw,
          f.sh,
          destX,
          destY,
          f.sw,
          f.sh
        );
      }
    }
  } catch (err) {
    console.error('Error drawing unit sprite:', err);
  }
  ctx.restore();

  // 4. HP Bar above unit
  drawHpBar(ctx, centerX, baseCenterY - 42, unit.currentHp, unit.maxHp, unit.faction);
}

function drawKnight(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Facing East / North-East toward enemies
  // Red battle cape
  ctx.fillStyle = PALETTE.knightCape;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 20);
  ctx.lineTo(x - 14, y - 2);
  ctx.lineTo(x - 5, y - 2);
  ctx.closePath();
  ctx.fill();

  // Steel Legs & Greaves
  ctx.fillStyle = PALETTE.knightArmorShadow;
  ctx.fillRect(x - 6, y - 8, 4, 8);
  ctx.fillRect(x + 2, y - 8, 4, 8);

  // Breastplate
  ctx.fillStyle = PALETTE.knightArmor;
  ctx.fillRect(x - 7, y - 22, 14, 14);
  // Gold crest on breastplate
  ctx.fillStyle = PALETTE.knightGold;
  ctx.fillRect(x - 1, y - 19, 3, 6);
  ctx.fillRect(x - 3, y - 17, 7, 2);

  // Pauldrons (shoulders)
  ctx.fillStyle = PALETTE.knightArmorHighlight;
  ctx.fillRect(x - 10, y - 23, 4, 5);
  ctx.fillRect(x + 6, y - 23, 4, 5);

  // Heater Shield on left arm
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 18);
  ctx.lineTo(x - 6, y - 18);
  ctx.lineTo(x - 6, y - 6);
  ctx.lineTo(x - 9, y - 2);
  ctx.lineTo(x - 12, y - 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.knightGold;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Broadsword in right hand
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 12);
  ctx.lineTo(x + 14, y - 28);
  ctx.stroke();
  // Crossguard & pommel
  ctx.fillStyle = PALETTE.knightGold;
  ctx.fillRect(x + 6, y - 14, 5, 2);
  ctx.fillRect(x + 7, y - 10, 3, 3);

  // Great Helm
  ctx.fillStyle = PALETTE.knightArmorHighlight;
  ctx.fillRect(x - 6, y - 32, 12, 10);
  // Visor slit
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 4, y - 27, 8, 2);
  // Red feather plume
  ctx.fillStyle = PALETTE.knightCape;
  ctx.fillRect(x - 2, y - 36, 4, 4);
}

function drawArcher(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Green scout tunic & cloak
  ctx.fillStyle = PALETTE.archerCape;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 22);
  ctx.lineTo(x - 12, y - 4);
  ctx.lineTo(x - 4, y - 4);
  ctx.closePath();
  ctx.fill();

  // Leather boots
  ctx.fillStyle = PALETTE.archerLeather;
  ctx.fillRect(x - 5, y - 8, 3, 8);
  ctx.fillRect(x + 2, y - 8, 3, 8);

  // Hunter Tunic
  ctx.fillStyle = PALETTE.archerTunic;
  ctx.fillRect(x - 6, y - 22, 12, 14);

  // Leather cross-belt & quiver
  ctx.fillStyle = PALETTE.archerLeather;
  ctx.fillRect(x - 8, y - 28, 4, 12);
  // Arrow feathers in quiver
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(x - 8, y - 32, 2, 4);
  ctx.fillRect(x - 6, y - 30, 2, 4);

  // Hooded Cowl
  ctx.fillStyle = PALETTE.archerTunic;
  ctx.fillRect(x - 5, y - 31, 10, 9);
  // Face shadow inside hood
  ctx.fillStyle = '#fed7aa'; // Skin
  ctx.fillRect(x - 2, y - 27, 5, 4);
  ctx.fillStyle = '#451a03'; // Eyes
  ctx.fillRect(x + 1, y - 26, 2, 2);

  // Recurve Bow in hand
  ctx.strokeStyle = PALETTE.archerBow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 10, y - 16, 12, -Math.PI / 2, Math.PI / 2, false);
  ctx.stroke();
  // Bowstring
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 28);
  ctx.lineTo(x + 10, y - 4);
  ctx.stroke();
}

function drawMage(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number) {
  // Flowing dark purple/midnight robe
  ctx.fillStyle = PALETTE.mageRobe;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 22);
  ctx.lineTo(x - 10, y - 2);
  ctx.lineTo(x + 8, y - 2);
  ctx.lineTo(x + 6, y - 22);
  ctx.closePath();
  ctx.fill();

  // Gold trim on robe bottom
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x - 10, y - 4, 18, 2);

  // Robe sleeves
  ctx.fillStyle = PALETTE.mageTrim;
  ctx.fillRect(x - 8, y - 20, 4, 10);
  ctx.fillRect(x + 4, y - 20, 4, 10);

  // Hood
  ctx.fillStyle = PALETTE.mageRobe;
  ctx.fillRect(x - 6, y - 32, 12, 10);
  // Mysterious glowing eyes under hood
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 4, y - 27, 8, 4);
  ctx.fillStyle = '#38bdf8'; // Glowing cyan eyes
  ctx.fillRect(x - 2, y - 26, 2, 2);
  ctx.fillRect(x + 2, y - 26, 2, 2);

  // Wizard Staff
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 10, y - 30, 2, 28);

  // Pulsing magic crystal on top of staff
  const pulse = Math.sin(timeMs / 180) * 0.3 + 0.7;
  ctx.fillStyle = PALETTE.mageCrystal;
  ctx.beginPath();
  ctx.arc(x + 11, y - 32, 4 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Staff aura
  ctx.fillStyle = PALETTE.mageGlow;
  ctx.beginPath();
  ctx.arc(x + 11, y - 32, 8 * pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoblin(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Hunched green goblin facing South-West
  // Leather loincloth
  ctx.fillStyle = PALETTE.goblinCloth;
  ctx.fillRect(x - 6, y - 10, 12, 6);

  // Green legs
  ctx.fillStyle = PALETTE.goblinSkin;
  ctx.fillRect(x - 5, y - 4, 3, 5);
  ctx.fillRect(x + 2, y - 4, 3, 5);

  // Hunched torso
  ctx.fillStyle = PALETTE.goblinSkin;
  ctx.fillRect(x - 6, y - 20, 11, 11);

  // Leather harness straps
  ctx.fillStyle = PALETTE.goblinCloth;
  ctx.fillRect(x - 6, y - 18, 11, 2);

  // Big goblin head & ears
  ctx.fillStyle = PALETTE.goblinSkin;
  ctx.fillRect(x - 5, y - 28, 9, 8);
  // Pointy ears
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 26);
  ctx.lineTo(x - 11, y - 29);
  ctx.lineTo(x - 5, y - 23);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 26);
  ctx.lineTo(x + 10, y - 29);
  ctx.lineTo(x + 4, y - 23);
  ctx.closePath();
  ctx.fill();

  // Menacing glowing yellow eyes
  ctx.fillStyle = PALETTE.goblinEyes;
  ctx.fillRect(x - 4, y - 25, 2, 2);
  ctx.fillRect(x, y - 25, 2, 2);

  // Spiked wooden club
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(x - 10, y - 20, 3, 14);
  ctx.fillStyle = '#94a3b8'; // Iron spike
  ctx.fillRect(x - 12, y - 21, 2, 2);
}

function drawSlime(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number) {
  // Translucent wobbling slime blob
  const wobbleX = Math.sin(timeMs / 250) * 1.5;
  const wobbleY = Math.cos(timeMs / 250) * 1.5;

  ctx.fillStyle = PALETTE.slimeBody;
  ctx.beginPath();
  ctx.ellipse(x, y - 8 + wobbleY, 13 + wobbleX, 9 - wobbleY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shiny highlight bubble
  ctx.fillStyle = PALETTE.slimeHighlight;
  ctx.beginPath();
  ctx.ellipse(x - 5, y - 12 + wobbleY, 4, 2.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Inner nucleus core
  ctx.fillStyle = PALETTE.slimeCore;
  ctx.beginPath();
  ctx.ellipse(x + 1, y - 7 + wobbleY, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute/derpy dark eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 5, y - 8 + wobbleY, 2, 3);
  ctx.fillRect(x + 2, y - 8 + wobbleY, 2, 3);
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  currentHp: number,
  maxHp: number,
  faction: 'hero' | 'enemy'
) {
  const barW = 26;
  const barH = 4;
  const barX = x - barW / 2;
  const hpPct = Math.max(0, Math.min(1, currentHp / maxHp));

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(barX - 1, y - 1, barW + 2, barH + 2);

  // HP fill
  const fillColor =
    faction === 'hero'
      ? hpPct > 0.4
        ? '#22c55e'
        : hpPct > 0.2
        ? '#eab308'
        : '#ef4444'
      : '#f87171';

  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, y, barW * hpPct, barH);
}
