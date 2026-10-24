import React from 'react';
import { ActionMode, SkillDefinition, Unit } from '../types/game';
import { Footprints, Swords, Sparkles, Hourglass, XCircle } from 'lucide-react';

interface ActionMenuProps {
  activeUnit: Unit | null;
  isHeroTurn: boolean;
  actionMode: ActionMode;
  selectedSkill: SkillDefinition | null;
  onSetMode: (mode: ActionMode, skill?: SkillDefinition) => void;
  onEndTurn: () => void;
  onCancelMode: () => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  activeUnit,
  isHeroTurn,
  actionMode,
  selectedSkill,
  onSetMode,
  onEndTurn,
  onCancelMode,
}) => {
  if (!activeUnit) return null;

  if (!isHeroTurn) {
    return (
      <div className="flex items-center gap-2 px-5 py-3 bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md rounded-xl shadow-xl text-neutral-300 select-none">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-mono tracking-wide text-neutral-300">
          Enemy is activating ({activeUnit.name})...
        </span>
      </div>
    );
  }

  const canMove = !activeUnit.hasMoved;
  const canAct = !activeUnit.hasActed;

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md rounded-xl shadow-xl select-none">
      {/* If in targeting mode, show active banner and Cancel button */}
      {actionMode !== 'idle' ? (
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="text-xs font-mono text-amber-300 font-semibold">
            {actionMode === 'moving' && 'Select highlighted tile to move'}
            {actionMode === 'target_attack' && 'Select highlighted enemy in range'}
            {actionMode === 'target_skill' && `Targeting ${selectedSkill?.name}`}
          </span>
          <button
            onClick={onCancelMode}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-750 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>Cancel (Esc)</span>
          </button>
        </div>
      ) : (
        <>
          {/* Move Button */}
          <button
            onClick={() => onSetMode('moving')}
            disabled={!canMove}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-all ${
              canMove
                ? 'bg-sky-950/60 border-sky-600/50 text-sky-200 hover:bg-sky-900/80 hover:border-sky-400 active:scale-95 shadow-sm'
                : 'bg-neutral-900/40 border-neutral-800/40 text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>

          {/* Basic Attack Button */}
          <button
            onClick={() => onSetMode('target_attack')}
            disabled={!canAct}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-all ${
              canAct
                ? 'bg-rose-950/60 border-rose-600/50 text-rose-200 hover:bg-rose-900/80 hover:border-rose-400 active:scale-95 shadow-sm'
                : 'bg-neutral-900/40 border-neutral-800/40 text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Attack</span>
          </button>

          {/* Hero Skill Buttons */}
          {activeUnit.skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => onSetMode('target_skill', skill)}
              disabled={!canAct}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-all ${
                canAct
                  ? 'bg-amber-950/60 border-amber-600/50 text-amber-200 hover:bg-amber-900/80 hover:border-amber-400 active:scale-95 shadow-sm'
                  : 'bg-neutral-900/40 border-neutral-800/40 text-neutral-600 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{skill.name}</span>
            </button>
          ))}

          {/* Wait / End Turn Button */}
          <button
            onClick={onEndTurn}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border bg-neutral-800/80 border-neutral-700/80 text-neutral-300 hover:bg-neutral-700 active:scale-95 transition-all ml-1 shadow-sm"
          >
            <Hourglass className="w-3.5 h-3.5 text-neutral-400" />
            <span>Wait (End Turn)</span>
          </button>
        </>
      )}
    </div>
  );
};
