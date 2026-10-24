import React from 'react';
import { Unit } from '../types/game';
import { Shield, Swords, Zap, Footprints, Target, Sparkles, Heart } from 'lucide-react';

interface UnitCardProps {
  unit: Unit | null;
  isActiveTurn: boolean;
}

export const UnitCard: React.FC<UnitCardProps> = ({ unit, isActiveTurn }) => {
  if (!unit) {
    return (
      <div className="p-4 bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md rounded-xl text-neutral-500 text-xs text-center">
        Select a tile or unit to inspect
      </div>
    );
  }

  const isHero = unit.faction === 'hero';
  const hpPercent = Math.max(0, Math.min(100, (unit.currentHp / unit.maxHp) * 100));

  return (
    <div className="p-3.5 bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md rounded-xl shadow-xl flex flex-col gap-2.5 text-neutral-200 select-none w-72">
      {/* Header with name and class */}
      <div className="flex items-start justify-between border-b border-neutral-800/80 pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-cinzel font-bold text-sm text-neutral-100">
              {unit.name}
            </span>
            {isActiveTurn && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                Active
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-neutral-400 capitalize">
            {unit.archetype} · {isHero ? 'Ally Vanguard' : 'Enemy Hostile'}
          </span>
        </div>

        {isHero && (
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-amber-400">
              Lv. {unit.level}
            </span>
            <div className="text-[9px] font-mono text-neutral-400">
              EXP {unit.exp}/{unit.expToNextLevel}
            </div>
          </div>
        )}
      </div>

      {/* HP Bar */}
      <div>
        <div className="flex justify-between text-[11px] font-mono mb-1">
          <span className="flex items-center gap-1 text-neutral-400">
            <Heart className="w-3 h-3 text-rose-500" /> HP
          </span>
          <span className="font-bold tabular-nums">
            {unit.currentHp} / {unit.maxHp}
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700/50">
          <div
            className={`h-full transition-all duration-300 ${
              isHero
                ? hpPercent > 40
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Combat Stat Grid */}
      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono bg-neutral-950/50 p-2 rounded-lg border border-neutral-800/40">
        <div className="flex items-center gap-1 text-neutral-300">
          <Swords className="w-3 h-3 text-amber-400" />
          <span>ATK {unit.attack}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-300">
          <Shield className="w-3 h-3 text-sky-400" />
          <span>DEF {unit.defense}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-300">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span>SPD {unit.speed}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-300">
          <Footprints className="w-3 h-3 text-emerald-400" />
          <span>MOV {unit.movementRange}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-300">
          <Target className="w-3 h-3 text-orange-400" />
          <span>RNG {unit.attackRange}</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-300">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>POS ({unit.coord.x},{unit.coord.y})</span>
        </div>
      </div>

      {/* Skills list */}
      {unit.skills.length > 0 && (
        <div className="border-t border-neutral-800/80 pt-2 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
            Skills
          </span>
          {unit.skills.map((s) => (
            <div
              key={s.id}
              className="p-1.5 bg-neutral-950/40 border border-neutral-800/50 rounded text-[10px]"
            >
              <div className="flex justify-between font-semibold text-neutral-200">
                <span>{s.name}</span>
                <span className="font-mono text-amber-400">
                  RNG {s.range} {s.aoeRadius > 0 ? `· AoE ${s.aoeRadius}` : ''}
                </span>
              </div>
              <p className="text-neutral-400 text-[9px] mt-0.5 leading-snug">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Turn status flags */}
      {isActiveTurn && (
        <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-neutral-400 border-t border-neutral-800/80">
          <span className={unit.hasMoved ? 'text-neutral-500 line-through' : 'text-emerald-400'}>
            ● Move {unit.hasMoved ? 'Used' : 'Ready'}
          </span>
          <span className={unit.hasActed ? 'text-neutral-500 line-through' : 'text-sky-400'}>
            ● Action {unit.hasActed ? 'Used' : 'Ready'}
          </span>
        </div>
      )}
    </div>
  );
};
