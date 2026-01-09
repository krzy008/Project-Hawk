import React from 'react';
import { AnimeStatus } from '../types';

interface StatusBadgeProps {
  status: AnimeStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let styleClass = "";
  
  switch (status) {
    case AnimeStatus.Watching:
      // Active: Gold/Yellow text with dark gold bg
      styleClass = "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.1)]";
      break;
    case AnimeStatus.Finished:
      // Success: Emerald Green
      styleClass = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_10px_rgba(52,211,153,0.1)]";
      break;
    case AnimeStatus.PlanToWatch:
      // Future: Blue/Sky
      styleClass = "text-sky-400 border-sky-500/30 bg-sky-500/10";
      break;
    case AnimeStatus.OnHold:
      // Paused: Zinc/Gray
      styleClass = "text-zinc-400 border-zinc-600 bg-zinc-800/40";
      break;
    case AnimeStatus.Dropped:
      // Negative: Red
      styleClass = "text-red-500 border-red-900/40 bg-red-900/10";
      break;
  }

  return (
    <span className={`px-2 py-[3px] rounded-md border text-[9px] uppercase tracking-widest font-bold ${styleClass} backdrop-blur-sm`}>
      {status}
    </span>
  );
};