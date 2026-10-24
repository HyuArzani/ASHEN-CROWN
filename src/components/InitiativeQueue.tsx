import React from 'react';
import { Unit } from '../types/game';
import { Shield, Sparkles, Crosshair, Skull } from 'lucide-react';

interface InitiativeQueueProps {
  queue: string[];
  currentIndex: number;
  units: Unit[];
  activeUnitId: string | null;
  round: number;
  onSelectUnit: (unitId: string) => void;
}

export const InitiativeQueue: React.FC<InitiativeQueueProps> = ({
  queue,
  currentIndex,
  units,
  activeUnitId,
  round,
  onSelectUnit,
}) => {
  const unitMap = new Map<string, Unit>();
  units.forEach((u) => unitMap.set(u.id, u));

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md rounded-xl shadow-xl max-w-full overflow-x-auto select-none">
      {/* Round indicator */}
      <div className="flex flex-col items-center justify-center pr-3 border-r border-neutral-700/60 shrink-0">
        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
          Round
        </span>
        <span className="text-lg font-cinzel font-black text-neutral-100 tabular-nums">
          {round}
        </span>
      </div>

      {/* Timeline units */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {queue.map((unitId, idx) => {
          const unit = unitMap.get(unitId);
          if (!unit || !unit.isAlive) return null;

          const isActive = unit.id === activeUnitId;
          const hasActed = idx < currentIndex;
          const isHero = unit.faction === 'hero';

          return (
            <button
              key={`${unitId}-${idx}`}
              onClick={() => onSelectUnit(unit.id)}
              className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all shrink-0 ${
                isActive
                  ? isHero
                    ? 'bg-sky-950/80 border-sky-400 text-sky-100 ring-2 ring-sky-500/40 shadow-lg scale-105'
                    : 'bg-rose-950/80 border-rose-400 text-rose-100 ring-2 ring-rose-500/40 shadow-lg scale-105'
                  : hasActed
                  ? 'bg-neutral-900/40 border-neutral-800/40 text-neutral-500 opacity-60'
                  : isHero
                  ? 'bg-neutral-850/80 border-sky-800/50 text-neutral-200 hover:border-sky-500/60'
                  : 'bg-neutral-850/80 border-rose-800/50 text-neutral-200 hover:border-rose-500/60'
              }`}
            >
              {/* Unit icon / badge */}
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs uppercase ${
                  isHero
                    ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                    : 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                }`}
              >
                {unit.archetype === 'knight' && <Shield className="w-3.5 h-3.5" />}
                {unit.archetype === 'archer' && <Crosshair className="w-3.5 h-3.5" />}
                {unit.archetype === 'mage' && <Sparkles className="w-3.5 h-3.5" />}
                {unit.archetype === 'goblin' && <Skull className="w-3.5 h-3.5" />}
                {unit.archetype === 'slime' && (
                  <span className="text-xs font-mono font-bold">SL</span>
                )}
              </div>

              {/* Unit name & speed */}
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {unit.name.split(' ')[0]}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                  <span>SPD {unit.speed}</span>
                  <span className="text-neutral-500">·</span>
                  <span
                    className={
                      unit.currentHp <= unit.maxHp * 0.3
                        ? 'text-rose-400 font-bold'
                        : 'text-neutral-300'
                    }
                  >
                    {unit.currentHp}/{unit.maxHp} HP
                  </span>
                </div>
              </div>

              {/* Status flag */}
              {hasActed && (
                <span className="absolute -top-1 -right-1 px-1 bg-neutral-800 text-[9px] text-neutral-400 rounded font-mono border border-neutral-700">
                  Done
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
