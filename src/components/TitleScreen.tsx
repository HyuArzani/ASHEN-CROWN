import React, { useState } from 'react';
import { SaveGameData } from '../types/game';
import { Shield, Sparkles, Crosshair, Volume2, VolumeX, BookOpen, RotateCcw, Play, Check } from 'lucide-react';
import { sounds } from '../audio/sound';

interface TitleScreenProps {
  hasSave: boolean;
  saveData: SaveGameData | null;
  onNewGame: () => void;
  onContinue: () => void;
  onResetSave: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSave,
  saveData,
  onNewGame,
  onContinue,
  onResetSave,
}) => {
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-neutral-950 overflow-hidden text-neutral-100 select-none">
      {/* Dark fantasy ambient background with animated subtle dust motes */}
      <div className="absolute inset-0 bg-radial-gradient from-neutral-900/40 via-neutral-950/80 to-black pointer-events-none" />

      {/* Decorative medieval grid backdrop */}
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Sound toggle at top-right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <button
          onClick={handleToggleSound}
          className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-colors shadow-lg"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Main Hero Title Lockup */}
      <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto px-6 text-center">
        {/* Bespoke inline crown crest */}
        <div className="mb-3 relative">
          <svg className="w-16 h-16 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
          </svg>
        </div>

        <h1 className="text-4xl md:text-5xl font-cinzel font-black tracking-widest text-neutral-100 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          ASHEN CROWN
        </h1>
        <p className="mt-2 text-xs md:text-sm font-pixel text-amber-400/90 tracking-widest uppercase">
          Tactical Turn-Based RPG · Isometric Vertical Slice
        </p>

        {/* Hero showcase silhouettes */}
        <div className="flex items-center justify-center gap-6 my-8 py-3 px-6 bg-neutral-900/70 border border-neutral-800/80 rounded-2xl backdrop-blur-sm shadow-xl">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-600/50 flex items-center justify-center text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-neutral-300">Knight</span>
            <span className="text-[9px] font-mono text-neutral-500">Power Strike</span>
          </div>

          <div className="w-px h-10 bg-neutral-800" />

          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-neutral-300">Archer</span>
            <span className="text-[9px] font-mono text-neutral-500">Piercing Shot</span>
          </div>

          <div className="w-px h-10 bg-neutral-800" />

          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-600/50 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-neutral-300">Mage</span>
            <span className="text-[9px] font-mono text-neutral-500">Fireball AoE</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col w-64 gap-2.5">
          {hasSave && (
            <button
              onClick={() => {
                sounds.playSelect();
                onContinue();
              }}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-neutral-950 font-bold font-cinzel text-sm shadow-[0_0_20px_rgba(217,119,6,0.35)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Continue Campaign</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playSelect();
              if (hasSave) {
                setShowConfirmNew(true);
              } else {
                onNewGame();
              }
            }}
            className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-cinzel text-sm transition-all cursor-pointer ${
              hasSave
                ? 'bg-neutral-850 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80'
                : 'bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold shadow-[0_0_20px_rgba(217,119,6,0.35)] active:scale-95'
            }`}
          >
            <span>New Game</span>
          </button>

          <button
            onClick={() => {
              sounds.playSelect();
              setShowRules(true);
            }}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Field Manual & Tactics</span>
          </button>

          {hasSave && (
            <button
              onClick={() => {
                sounds.playSelect();
                setShowConfirmReset(true);
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-neutral-500 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Progression</span>
            </button>
          )}
        </div>

        {/* Saved campaign stats pill */}
        {hasSave && saveData && (
          <div className="mt-5 text-[11px] font-mono text-neutral-400 flex items-center gap-2">
            <span>Battles Won: {saveData.battlesWon}</span>
            <span>·</span>
            <span>Gold: {saveData.gold}g</span>
            <span>·</span>
            <span>Heroes Lv.{saveData.heroes[0]?.level || 1}</span>
          </div>
        )}

        {/* Flat control-hint line as per game guidelines */}
        <div className="mt-8 text-[11px] font-mono text-neutral-500">
          Click / Touch to Select & Move · 1-3 Skills · Space End Turn · Esc Cancel
        </div>
      </div>

      {/* Confirmation Modal: Overwrite Save for New Game */}
      {showConfirmNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-750 p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center">
            <h3 className="font-cinzel text-lg font-bold text-neutral-100">
              Overwrite Saved Campaign?
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Starting a new game will reset your hero levels, stats, and accumulated gold. This cannot be undone.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setShowConfirmNew(false)}
                className="flex-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmNew(false);
                  onNewGame();
                }}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Overwrite & Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Save */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-750 p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center">
            <h3 className="font-cinzel text-lg font-bold text-rose-400">
              Clear All Saved Data?
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to delete your localStorage campaign save? All progression will be lost.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium"
              >
                Keep Save
              </button>
              <button
                onClick={() => {
                  setShowConfirmReset(false);
                  onResetSave();
                }}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Manual Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-750 p-6 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-cinzel text-lg font-bold text-amber-400">
                Tactical Field Manual
              </h3>
              <button
                onClick={() => setShowRules(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-neutral-300 leading-relaxed font-sans">
              <div>
                <h4 className="font-bold text-neutral-100 mb-1">1. Initiative Turn Order</h4>
                <p className="text-neutral-400">
                  Turns are determined by unit Speed stats in a unified queue. The fastest hero or enemy acts first. Each activation grants one Move and one Action (Attack, Skill, or Wait).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-100 mb-1">2. Isometric Movement & Obstacles</h4>
                <p className="text-neutral-400">
                  Units move in 4 cardinal directions across the 10x10 diamond grid. Rocks, trees, and ruins are impassable and block line-of-sight for ranged attacks.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-100 mb-1">3. Hero Archetypes & Skills</h4>
                <ul className="list-disc pl-4 space-y-1 text-neutral-400 mt-1">
                  <li><strong className="text-neutral-200">Knight (Sir Gareth):</strong> Frontline juggernaut. Movement 3, Range 1. <em>Power Strike</em> adds +6 physical damage.</li>
                  <li><strong className="text-neutral-200">Archer (Aleria):</strong> High speed ranger. Movement 4, Range 3. <em>Piercing Shot</em> deals +4 damage and pierces 2 defense. Requires line of sight.</li>
                  <li><strong className="text-neutral-200">Mage (Vaelen):</strong> Mystic area caster. Movement 3, Range 2. <em>Fireball</em> blasts the target tile and 4 adjacent tiles (+3 magic damage).</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-neutral-100 mb-1">4. Enemy Hostiles</h4>
                <p className="text-neutral-400">
                  <strong>Goblins:</strong> Fast agile skirmishers that flank weakened heroes.<br/>
                  <strong>Slimes:</strong> High-defense gelatinous masses that absorb physical blows.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-neutral-100 mb-1">5. Campaign Progression</h4>
                <p className="text-neutral-400">
                  Victory rewards +100 EXP and +75 Gold. Accumulating enough EXP automatically levels up heroes, permanently boosting Max HP, Attack, Defense, and Speed. Progression is saved automatically to localStorage.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 text-xs font-bold font-cinzel transition-colors"
            >
              Ready for Battle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
