import React, { useEffect, useRef, useState } from 'react';
import { LogMessage } from '../types/game';
import { ScrollText, ChevronDown, ChevronUp } from 'lucide-react';

interface CombatLogProps {
  logs: LogMessage[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const [collapsed, setCollapsed] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!collapsed) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, collapsed]);

  return (
    <div className="w-80 bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md rounded-xl shadow-xl flex flex-col overflow-hidden text-neutral-300 text-xs select-none">
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-3 py-2 bg-neutral-950/60 border-b border-neutral-800/80 cursor-pointer hover:bg-neutral-800/40 transition-colors"
      >
        <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
          <ScrollText className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-cinzel text-xs">Battle Chronicle</span>
        </div>
        <button className="text-neutral-400 hover:text-neutral-200">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Log items container */}
      {!collapsed && (
        <div className="p-2.5 max-h-48 overflow-y-auto flex flex-col gap-1.5 font-mono text-[11px] leading-tight">
          {logs.length === 0 ? (
            <span className="text-neutral-500 italic py-2 text-center">
              Battle begins. Choose your tactics wisely.
            </span>
          ) : (
            logs.map((log) => {
              let color = 'text-neutral-300';
              if (log.type === 'attack') color = 'text-rose-300';
              if (log.type === 'skill') color = 'text-amber-300';
              if (log.type === 'death') color = 'text-rose-500 font-bold';
              if (log.type === 'turn') color = 'text-sky-300 font-semibold';
              if (log.type === 'level') color = 'text-emerald-400 font-bold';

              return (
                <div key={log.id} className="flex items-start gap-1.5">
                  <span className="text-neutral-500 text-[10px] shrink-0">
                    R{log.round}
                  </span>
                  <span className={color}>{log.text}</span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
};
