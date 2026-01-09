import React from 'react';
import { Anime, AnimeStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { StarRating } from './StarRating';
import { ProgressBar } from './ProgressBar';
import { QuickAddButton } from './QuickAddButton';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
}

const FALLBACK_COVER = "https://placehold.co/400x600/000000/FFA31A?text=HAWK";

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick }) => {
  const getStatusShadowColor = (status: AnimeStatus) => {
    switch (status) {
      case AnimeStatus.Watching: return '#FACC15'; // yellow-400
      case AnimeStatus.Finished: return '#34D399'; // emerald-400
      case AnimeStatus.PlanToWatch: return '#38BDF8'; // sky-400
      case AnimeStatus.OnHold: return '#A1A1AA'; // zinc-400
      case AnimeStatus.Dropped: return '#EF4444'; // red-500
      default: return '#FFA31A'; // hawk-gold
    }
  };

  const shadowColor = getStatusShadowColor(anime.status);

  // Adapt Anime to ExternalAnime for the button
  const externalAnimeData = {
    id: anime.id,
    title: anime.title,
    coverImage: anime.coverUrl,
    score: anime.rating * 10,
    episodes: anime.total,
    status: anime.status,
    format: 'TV',
    genres: anime.genres || [],
    studios: [],
    source: 'anilist' as const
  };

  return (
    <div 
      onClick={onClick}
      style={{ 
        '--status-shadow': shadowColor,
        boxShadow: `0 4px 0 var(--status-shadow)`
      } as React.CSSProperties}
      className="group relative bg-hawk-ui/40 backdrop-blur-sm border border-hawk-ui rounded-2xl overflow-hidden cursor-pointer flex flex-row h-32 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_6px_0_var(--status-shadow)]"
    >
      {/* Image Left Side - Fixed width */}
      <div className="relative w-28 shrink-0 overflow-hidden bg-hawk-ui/20 rounded-l-2xl border-r border-hawk-ui/50">
        <img 
          src={anime.coverUrl || FALLBACK_COVER} 
          alt={anime.title} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => {
              // Fallback for broken images
              (e.target as HTMLImageElement).src = FALLBACK_COVER;
          }}
        />
      </div>

      {/* Info Right Side */}
      <div className="p-3 flex flex-col justify-between flex-grow min-w-0 relative">
        <div className="relative z-10">
            <div className="flex justify-between items-start gap-3 mb-1">
                <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-hawk-goldLight tracking-tight transition-colors uppercase pr-8">
                    {anime.title}
                </h3>
            </div>
          
          <div className="flex items-center gap-2 mb-2">
             <StatusBadge status={anime.status} />
             {anime.season && (
                <span className="text-hawk-textMuted text-[9px] uppercase tracking-wider line-clamp-1 border-l border-hawk-ui pl-2 font-bold">
                {anime.season}
                </span>
            )}
          </div>

          <div className="mt-auto">
             <div className="flex justify-between items-center text-[10px] text-hawk-textSecondary mb-1 font-mono tracking-wide font-bold">
               <div className="flex items-center gap-2">
                 <span>EP {anime.watched} / {anime.total > 0 ? anime.total : '?'}</span>
                 {anime.rating > 0 && (
                   <>
                    <span className="text-hawk-ui">|</span>
                    <StarRating rating={anime.rating} size="sm" />
                   </>
                 )}
               </div>
               <span className={anime.watched === anime.total && anime.total > 0 ? 'text-hawk-gold' : ''}>
                   {anime.total > 0 ? Math.round((anime.watched / anime.total) * 100) : 0}%
               </span>
             </div>
             <ProgressBar current={anime.watched} total={anime.total} />
          </div>
        </div>

        {/* Quick Add Overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 scale-90 origin-top-right">
          <QuickAddButton anime={externalAnimeData} />
        </div>
      </div>
    </div>
  );
};
