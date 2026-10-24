import React from 'react';
import { Skull, RotateCcw, Home } from 'lucide-react';
import { sounds } from '../audio/sound';

interface DefeatModalProps {
  onRetry: () => void;
  onReturnTitle: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  onRetry,
  onReturnTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="relative bg-neutral-900 border border-rose-800/60 p-6 md:p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(225,29,72,0.25)] flex flex-col items-center text-center">
        {/* Defeat icon */}
        <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-700/60 flex items-center justify-center mb-4 text-rose-500">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-2xl md:text-3xl font-cinzel font-black text-rose-500 tracking-wider">
          VANQUISHED
        </h2>
        <p className="text-xs font-mono text-neutral-400 mt-2 leading-relaxed">
          Your vanguard was overwhelmed by the goblin host. Regroup and rethink your positioning and choke point control.
        </p>

        {/* Tactical advice tip */}
        <div className="my-5 p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-left text-[11px] text-neutral-400 leading-normal">
          <strong className="text-neutral-200 block mb-0.5">Tactical Counsel:</strong>
          Position Sir Gareth in narrow chokepoints between rocks and ruins to shield Aleria and Vaelen. Use Vaelen's Fireball AoE when enemies clump up.
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
              onRetry();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-cinzel shadow-lg active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Battle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
