import React from 'react';
import { HeroProgressionData } from '../types/game';
import { Trophy, Coins, Sparkles, ArrowRight, Home } from 'lucide-react';
import { sounds } from '../audio/sound';

interface VictoryModalProps {
  expGained: number;
  goldGained: number;
  levelUps: Array<{ name: string; newLevel: number }>;
  heroes: HeroProgressionData[];
  onContinue: () => void;
  onReturnTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  expGained,
  goldGained,
  levelUps,
  heroes,
  onContinue,
  onReturnTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="relative bg-neutral-900 border border-amber-500/50 p-6 md:p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center text-center">
        {/* Glow victory icon */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 text-amber-400">
          <Trophy className="w-8 h-8 animate-bounce" />
        </div>

        <h2 className="text-2xl md:text-3xl font-cinzel font-black text-amber-400 tracking-wider">
          VICTORY ACHIEVED
        </h2>
        <p className="text-xs font-mono text-neutral-400 mt-1 uppercase tracking-wide">
          All hostiles vanquished from the ancient ruins
        </p>

        {/* Spoils of War / Rewards */}
        <div className="flex items-center justify-center gap-6 my-5 p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl w-full">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <div className="text-left">
              <span className="text-[10px] font-mono text-neutral-400 block uppercase">
                Experience
              </span>
              <span className="text-sm font-bold font-mono text-sky-300">
                +{expGained} EXP
              </span>
            </div>
          </div>

          <div className="w-px h-8 bg-neutral-800" />

          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[10px] font-mono text-neutral-400 block uppercase">
                Treasure
              </span>
              <span className="text-sm font-bold font-mono text-amber-300">
                +{goldGained} Gold
              </span>
            </div>
          </div>
        </div>

        {/* Level Up announcements */}
        {levelUps.length > 0 && (
          <div className="w-full mb-5 flex flex-col gap-1.5 text-left">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Hero Promotion!
            </span>
            {levelUps.map((l, i) => (
              <div
                key={i}
                className="p-2 bg-emerald-950/40 border border-emerald-600/40 rounded-lg text-xs font-mono text-emerald-200"
              >
                ★ <strong>{l.name}</strong> reached <strong>Level {l.newLevel}</strong>! All combat attributes increased.
              </div>
            ))}
          </div>
        )}

        {/* Hero status summary */}
        <div className="w-full flex flex-col gap-2 mb-6">
          {heroes.map((hero) => (
            <div
              key={hero.id}
              className="flex items-center justify-between px-3 py-1.5 bg-neutral-950/50 border border-neutral-800/60 rounded-lg text-xs font-mono"
            >
              <span className="font-semibold text-neutral-200">{hero.name}</span>
              <span className="text-amber-400">
                Lv. {hero.level} · HP {hero.maxHp} · ATK {hero.attack}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => {
              sounds.playSelect();
              onReturnTitle();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Title Screen</span>
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              onContinue();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-neutral-950 text-xs font-bold font-cinzel shadow-lg active:scale-95 transition-all"
          >
            <span>Next Battle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
