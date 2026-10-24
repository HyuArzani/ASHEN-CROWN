import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActionMode,
  FloatingText,
  GridCoord,
  ProjectileAnimation,
  TileData,
  Unit,
} from '../types/game';
import {
  areCoordsEqual,
  GRID_COLS,
  GRID_ROWS,
  gridToScreen,
  screenToGrid,
  TILE_HEIGHT,
  TILE_WIDTH,
} from '../logic/grid';
import {
  drawObstacle,
  drawTile,
  drawTileOverlay,
  drawUnitSprite,
} from '../graphics/sprites';
import { animController } from '../graphics/animationController';

interface BattlefieldCanvasProps {
  map: TileData[][];
  units: Unit[];
  activeUnitId: string | null;
  selectedUnitId: string | null;
  hoveredCoord: GridCoord | null;
  reachableCoords: Set<string>;
  attackableCoords: Set<string>;
  aoeCoords: Set<string>;
  activePath: GridCoord[] | null;
  actionMode: ActionMode;
  floatingTexts: FloatingText[];
  projectiles: ProjectileAnimation[];
  onTileClick: (coord: GridCoord) => void;
  onTileHover: (coord: GridCoord | null) => void;
}

export const BattlefieldCanvas: React.FC<BattlefieldCanvasProps> = ({
  map,
  units,
  activeUnitId,
  selectedUnitId,
  hoveredCoord,
  reachableCoords,
  attackableCoords,
  aoeCoords,
  activePath,
  actionMode,
  floatingTexts,
  projectiles,
  onTileClick,
  onTileHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Camera offset
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mouseMovedRef = useRef(false);

  // Auto-center camera when container resizes
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Center of 10x10 isometric diamond is at gridX = 4.5, gridY = 4.5
    // Screen center = (originX, originY + (4.5 + 4.5) * TILE_HEIGHT / 2) = originY + 4.5 * TILE_HEIGHT
    const originX = width / 2;
    const originY = Math.max(40, (height - 10 * TILE_HEIGHT) / 2);

    setCamera({ x: originX, y: originY });
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Main 60fps Render Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const now = timestamp / 1000;
      const dt = lastTimeRef.current ? now - lastTimeRef.current : 0.016;
      lastTimeRef.current = now;

      // Update unit movement and animations with clamped delta time
      animController.update(dt);

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);

      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Clear with dark tactical atmosphere background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric grid vignette
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        80,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.1
      );
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      gradient.addColorStop(1, 'rgba(3, 7, 18, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const originX = camera.x;
      const originY = camera.y;

      // Group rendering by isometric depth (gridX + gridY from 0 to 18)
      // This strictly enforces correct visual layering
      const pathSet = new Set(activePath ? activePath.map((c) => `${c.x},${c.y}`) : []);

      for (let depth = 0; depth <= (GRID_COLS - 1) + (GRID_ROWS - 1); depth++) {
        for (let gx = 0; gx < GRID_COLS; gx++) {
          const gy = depth - gx;
          if (gy < 0 || gy >= GRID_ROWS) continue;

          const key = `${gx},${gy}`;
          const tile = map[gx]?.[gy];
          if (!tile) continue;

          const { x: sx, y: sy } = gridToScreen(gx, gy, originX, originY);
          const isHovered = areCoordsEqual(hoveredCoord, { x: gx, y: gy });

          // 1. Draw tile terrain base
          drawTile(ctx, sx, sy, tile.terrain, TILE_WIDTH, TILE_HEIGHT, isHovered);

          // 2. Draw overlays on the tile diamond
          if (aoeCoords.has(key)) {
            drawTileOverlay(ctx, sx, sy, 'aoe');
          } else if (attackableCoords.has(key)) {
            drawTileOverlay(ctx, sx, sy, 'attack');
          } else if (reachableCoords.has(key)) {
            drawTileOverlay(ctx, sx, sy, 'move');
          }

          if (pathSet.has(key)) {
            drawTileOverlay(ctx, sx, sy, 'path');
          }

          // 3. Draw obstacles (rocks, trees, ruins)
          if (!tile.walkable) {
            drawObstacle(ctx, sx, sy, tile.terrain, TILE_WIDTH, TILE_HEIGHT);
          }
        }

        // 4. Draw living units whose visual depth matches current layer
        for (const u of units) {
          if (!u.isAlive) continue;
          const vState = animController.getOrCreateState(u.id, u.coord, u.faction);
          const uDepth = Math.round(vState.visualCoord.x + vState.visualCoord.y);

          if (uDepth === depth) {
            const { x: sx, y: sy } = gridToScreen(
              vState.visualCoord.x,
              vState.visualCoord.y,
              originX,
              originY
            );

            drawUnitSprite(
              ctx,
              u,
              sx,
              sy,
              vState.animation,
              vState.direction,
              vState.elapsedTime,
              u.id === activeUnitId,
              u.id === selectedUnitId
            );
          }
        }
      }

      // 5. Draw active projectiles (arrows, fireballs, slash arcs)
      for (const proj of projectiles) {
        const elapsed = timestamp - proj.startTime;
        const t = Math.min(1, Math.max(0, elapsed / proj.duration));

        const startScreen = gridToScreen(
          proj.startCoord.x,
          proj.startCoord.y,
          originX,
          originY
        );
        const targetScreen = gridToScreen(
          proj.targetCoord.x,
          proj.targetCoord.y,
          originX,
          originY
        );

        const currentX = startScreen.x + (targetScreen.x - startScreen.x) * t;
        // Arc peak for arrow/fireball
        const arcPeak = -35 * Math.sin(t * Math.PI);
        const currentY =
          startScreen.y +
          TILE_HEIGHT / 2 +
          (targetScreen.y - startScreen.y) * t +
          arcPeak;

        ctx.save();
        if (proj.type === 'arrow') {
          // Arrow projectile
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          const angle = Math.atan2(
            targetScreen.y - startScreen.y,
            targetScreen.x - startScreen.x
          );
          ctx.moveTo(currentX - Math.cos(angle) * 12, currentY - Math.sin(angle) * 12);
          ctx.lineTo(currentX, currentY);
          ctx.stroke();

          // Arrow head
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === 'fireball') {
          // Fireball sphere with glowing trail
          const pulse = Math.sin(timestamp / 50) * 2;
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(currentX, currentY, 8 + pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === 'slash') {
          // Melee slash arc
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(currentX, currentY, 20 * t, 0, Math.PI * 1.5);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Draw floating combat numbers
      for (const ft of floatingTexts) {
        const elapsed = timestamp - ft.startTime;
        if (elapsed > ft.duration) continue;

        const progress = elapsed / ft.duration;
        const alpha = 1 - progress;
        const floatUp = progress * 32;

        const screenPos = gridToScreen(
          ft.worldCoord.x,
          ft.worldCoord.y,
          originX,
          originY
        );

        ctx.save();
        ctx.font = ft.isCrit
          ? 'bold 16px "JetBrains Mono", monospace'
          : 'bold 14px "JetBrains Mono", monospace';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.fillText(
          ft.text,
          screenPos.x,
          screenPos.y + TILE_HEIGHT / 2 - 30 - floatUp
        );
        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    map,
    units,
    activeUnitId,
    selectedUnitId,
    hoveredCoord,
    reachableCoords,
    attackableCoords,
    aoeCoords,
    activePath,
    actionMode,
    floatingTexts,
    projectiles,
    camera,
  ]);

  // Pointer event handlers for diamond click detection
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    mouseMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        mouseMovedRef.current = true;
        setCamera((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    }

    // Resolve hovered grid tile
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const tileCoord = screenToGrid(screenX, screenY, camera.x, camera.y);
    onTileHover(tileCoord);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    if (!mouseMovedRef.current) {
      // Trigger tile click
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const tileCoord = screenToGrid(screenX, screenY, camera.x, camera.y);
      if (tileCoord) {
        onTileClick(tileCoord);
      }
    }
  };

  const handlePointerLeave = () => {
    isDraggingRef.current = false;
    onTileHover(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none touch-none bg-neutral-950"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
};
