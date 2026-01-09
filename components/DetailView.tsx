
import React, { useEffect, useState } from 'react';
import { Anime } from '../types';
import { ChevronDown, Plus, Loader, Star, Layers, PlayCircle, Calendar, Tag, Edit3, Trash2, GitMerge, Sparkles } from 'lucide-react';
import { api, ExternalAnime } from '../lib/api';
import { QuickAddButton } from './QuickAddButton';

interface DetailViewProps {
  anime: Anime;
  onBack: () => void;
  onAdd?: (anime: Partial<Anime>) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRelationClick?: (anime: Partial<Anime>) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ anime, onBack, onAdd, onEdit, onDelete, onRelationClick }) => {
  const [details, setDetails] = useState<ExternalAnime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const initialize = async () => {
      setLoading(true);
      try {
        const data = await api.getDetailsByTitle(anime.title);
        if (isMounted && data) {
            let finalDetails = { ...data };
            
            // Logic: Suggest similar anime as similar genre and ratings if there is none
            if ((!finalDetails.recommendations || finalDetails.recommendations.length === 0) && finalDetails.genres && finalDetails.genres.length > 0) {
                try {
                    // Fetch top rated anime in the same primary genre
                    const fallbackResults = await api.search('', finalDetails.genres[0], 'rating', 1);
                    finalDetails.recommendations = fallbackResults
                        .filter(f => String(f.id) !== String(finalDetails.id))
                        .slice(0, 10);
                } catch (err) {
                    console.warn("Recommendation fallback search failed", err);
                }
            }
            setDetails(finalDetails);
        }
      } catch (e) {
        console.error("Detail Fetch Error", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setDetails(null);
    initialize();
    return () => { isMounted = false; };
  }, [anime.id, anime.title]);

  const cleanSynopsis = (text?: string) => {
      if (!text) return anime.notes || "No synopsis available.";
      return text.replace(/<[^>]*>?/gm, '').trim();
  };

  const isLibraryMode = !onAdd; 
  const displayTitle = details?.title || anime.title;
  const displayNative = details?.titleNative || '';
  const displayImage = details?.coverImage || anime.coverUrl;
  const displayBanner = details?.bannerImage;
  const score = details?.score ? Math.round(details.score / 10) : (anime.rating > 0 ? anime.rating : 0);
  const scoreDisplay = score > 0 ? score.toFixed(1) : 'N/A';

  // Filter for narrative-driven relation types only (seasons, side stories, alternates)
  const filteredRelations = details?.relations?.filter(rel => 
    ['SEQUEL', 'PREQUEL', 'SIDE_STORY', 'PARENT', 'ALTERNATIVE', 'SUMMARY', 'SPIN_OFF'].includes(rel.relationType)
  ) || [];

  return (
    <div className="min-h-screen bg-hawk-base text-hawk-textPrimary font-sans pb-32 relative overflow-x-hidden animate-fade-in">
      <div className="relative h-[65vh] w-full group">
         <div className="absolute inset-0">
             <img 
                src={displayBanner || displayImage} 
                alt={displayTitle} 
                className={`w-full h-full object-cover opacity-100 ${!displayBanner ? 'object-top' : 'object-center'}`} 
             />
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-hawk-base via-hawk-base/60 to-transparent" />
         <div className="absolute inset-0 bg-gradient-r from-hawk-base/90 via-hawk-base/40 to-transparent" />
         <button onClick={onBack} className="absolute top-safe left-6 z-50 p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-hawk-gold hover:text-black hover:border-hawk-gold transition-all duration-300">
            <ChevronDown className="w-6 h-6 rotate-90" />
         </button>
         {isLibraryMode && (
             <div className="absolute top-safe right-6 z-50 flex gap-3">
                 <button onClick={onEdit} className="p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-white hover:text-black transition-all">
                     <Edit3 className="w-5 h-5" />
                 </button>
                 <button onClick={onDelete} className="p-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-red-500 hover:border-red-500 transition-all">
                     <Trash2 className="w-5 h-5" />
                 </button>
             </div>
         )}
      </div>

      <div className="relative z-10 -mt-48 px-6 md:px-12 max-w-6xl mx-auto flex flex-col gap-6">
         <div className="flex flex-col gap-1 animate-slide-up">
             <div className="md:hidden w-32 aspect-[2/3] rounded-lg overflow-hidden border-2 border-hawk-gold shadow-2xl mb-4">
                 <img src={displayImage} className="w-full h-full object-cover" />
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl font-sans max-w-4xl">
                 {displayTitle}
             </h1>
             {displayNative && (
                 <h2 className="text-lg md:text-xl font-medium text-hawk-goldLight/80 tracking-wide font-serif mt-2">
                     {displayNative}
                 </h2>
             )}
             <div className="flex flex-wrap items-center gap-3 mt-6 text-[10px] font-bold uppercase tracking-widest text-hawk-textSecondary">
                 {details?.status && (
                     <span className={`px-2 py-1 rounded border backdrop-blur-md ${details.status === 'RELEASING' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 border-white/10 text-white'}`}>
                         {details.status}
                     </span>
                 )}
                 <span className="bg-hawk-gold/20 text-hawk-gold px-2 py-1 rounded border border-hawk-gold/20 backdrop-blur-md shadow-[0_0_10px_rgba(255,163,26,0.2)]">
                    {details?.source === 'anilist' ? 'AniList' : 'Jikan'}
                 </span>
                 <span className="bg-white/5 px-2 py-1 rounded border border-white/10">{details?.format || 'TV'}</span>
                 {details?.duration && (
                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-hawk-textMuted" />{details.duration} min</span>
                 )}
                 {details?.season && (
                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-hawk-textMuted" />{details.season} {details.year}</span>
                 )}
             </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 animate-slide-up delay-100 items-start">
            {details && (
              <>
                <QuickAddButton anime={details} className="w-full" />
                <button
                    onClick={() => onAdd?.({
                        id: String(details.id),
                        title: details.title,
                        coverUrl: details.coverImage,
                        total: details.episodes,
                        season: details.season && details.year ? `${details.season} ${details.year}` : String(details.year || ''),
                        notes: details.description,
                        genres: details.genres,
                        duration: details.duration
                    })}
                    className="w-full h-[48px] flex items-center justify-center gap-2 px-6 rounded-xl border-2 border-[#FFD60A] bg-transparent text-[#FFD60A] font-black uppercase tracking-widest text-[11px] transition-all duration-300 hover:bg-[#FFD60A]/10 active:scale-95 shadow-lg"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>ADD TO WATCHLIST</span>
                </button>
              </>
            )}
         </div>
         
         {isLibraryMode && (
             <div className="py-4 flex items-center gap-2">
                 <div className="h-[2px] w-8 bg-hawk-gold" />
                 <span className="text-xs text-hawk-gold uppercase tracking-[0.2em] font-bold">In Library</span>
             </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4 animate-slide-up delay-200">
             <div className="space-y-8 lg:col-span-2">
                 <p className="text-hawk-textSecondary text-sm md:text-base leading-relaxed font-bold whitespace-pre-wrap">
                     {cleanSynopsis(details?.description)}
                 </p>
                 {details?.genres && (
                     <div className="flex flex-wrap gap-2">
                         {details.genres.map(g => (
                             <span key={g} className="px-4 py-1.5 rounded-full border border-hawk-gold/20 text-hawk-gold bg-hawk-gold/5 text-[10px] uppercase font-bold tracking-wider hover:bg-hawk-gold hover:text-black transition-colors">
                                 {g}
                             </span>
                         ))}
                     </div>
                 )}
                 {details?.studios && details.studios.length > 0 && (
                     <div className="flex items-center gap-2 text-xs text-hawk-textMuted pt-2">
                         <span className="uppercase tracking-widest font-bold text-hawk-gold">Studio</span>
                         <span className="w-1 h-1 rounded-full bg-hawk-textMuted" />
                         <span className="text-white font-bold">{details.studios.join(', ')}</span>
                     </div>
                 )}
             </div>

             <div className="bg-hawk-ui/30 p-8 rounded-3xl border border-white/5 backdrop-blur-sm h-fit">
                 <div className="mb-6">
                     <span className="block text-[10px] text-hawk-textMuted uppercase tracking-widest mb-2 font-bold">Score</span>
                     <div className="flex items-baseline gap-3">
                         <Star className="w-8 h-8 fill-hawk-gold text-hawk-gold drop-shadow-[0_0_10px_rgba(255,163,26,0.6)]" />
                         <span className="text-5xl font-black text-white leading-none">{scoreDisplay}</span>
                         <span className="text-sm text-hawk-textMuted font-bold">/ 10</span>
                     </div>
                 </div>
                 <div className="h-[1px] bg-white/10 w-full mb-6" />
                 <div className="grid grid-cols-2 gap-y-6">
                     <div>
                         <span className="block text-[10px] text-hawk-textMuted uppercase tracking-widest mb-1 flex items-center gap-1 font-bold"><PlayCircle className="w-3 h-3" /> Status</span>
                         <span className="text-sm font-bold text-white">{details?.status || 'Unknown'}</span>
                     </div>
                     <div>
                         <span className="block text-[10px] text-hawk-textMuted uppercase tracking-widest mb-1 flex items-center gap-1 font-bold"><Calendar className="w-3 h-3" /> Aired</span>
                         <span className="text-sm font-bold text-white">{details?.year || anime.season || '?'}</span>
                     </div>
                     <div>
                         <span className="block text-[10px] text-hawk-textMuted uppercase tracking-widest mb-1 flex items-center gap-1 font-bold"><Layers className="w-3 h-3" /> Episodes</span>
                         <span className="text-sm font-bold text-white">{details?.episodes || anime.total || '?'}</span>
                     </div>
                     <div>
                         <span className="block text-[10px] text-hawk-textMuted uppercase tracking-widest mb-1 flex items-center gap-1 font-bold"><Tag className="w-3 h-3" /> Format</span>
                         <span className="text-sm font-bold text-white">{details?.format || '-'}</span>
                     </div>
                 </div>
             </div>
         </div>
         
         {/* Related Seasons Section */}
         {filteredRelations.length > 0 && (
             <div className="mt-16 space-y-6 animate-slide-up delay-300">
                 <h3 className="text-hawk-gold text-xs font-black uppercase tracking-[0.25em] flex items-center gap-2 pl-4 border-l-2 border-hawk-gold">
                    <GitMerge className="w-4 h-4" /> Related
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {filteredRelations.map(rel => (
                         <div 
                            key={rel.id} 
                            onClick={() => onRelationClick?.({ id: rel.id as string, title: rel.title, coverUrl: rel.coverImage, season: rel.format })} 
                            className="group flex gap-4 bg-hawk-ui/20 p-3 rounded-2xl border border-hawk-ui hover:border-hawk-gold transition-all duration-300 cursor-pointer backdrop-blur-sm"
                         >
                             <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                 <img src={rel.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rel.title} />
                             </div>
                             <div className="flex flex-col justify-center py-1">
                                 <span className="text-[9px] text-hawk-gold font-black uppercase tracking-[0.2em] mb-1 opacity-80">{rel.relationType}</span>
                                 <span className="text-xs font-black text-white line-clamp-2 leading-snug group-hover:text-hawk-gold transition-colors uppercase tracking-tight mb-1">{rel.title}</span>
                                 <div className="flex items-center gap-2">
                                     <span className="text-[9px] text-hawk-textMuted font-bold border border-white/10 px-1.5 rounded uppercase">{rel.format}</span>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}

         {/* Similar Anime Recommendations Section */}
         {details?.recommendations && details.recommendations.length > 0 && (
             <div className="mt-16 space-y-6 animate-slide-up delay-500">
                 <h3 className="text-hawk-gold text-xs font-black uppercase tracking-[0.25em] flex items-center gap-2 pl-4 border-l-2 border-hawk-gold">
                    <Sparkles className="w-4 h-4" /> Suggestions
                 </h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {details.recommendations.slice(0, 10).map(rec => (
                         <div 
                            key={rec.id} 
                            onClick={() => onRelationClick?.({ id: rec.id as string, title: rec.title, coverUrl: rec.coverImage, rating: rec.score / 10 })} 
                            className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer border border-hawk-ui hover:border-hawk-gold transition-all duration-300 shadow-xl"
                         >
                             <img src={rec.coverImage} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt={rec.title} />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                             <div className="absolute bottom-3 left-3 right-3 transform group-hover:translate-y-[-2px] transition-transform">
                                 <span className="text-[10px] font-black text-white line-clamp-1 group-hover:text-hawk-gold transition-colors uppercase tracking-tighter leading-none mb-1">{rec.title}</span>
                                 {rec.score > 0 && (
                                     <div className="flex items-center gap-1">
                                         <Star className="w-2.5 h-2.5 fill-hawk-gold text-hawk-gold" />
                                         <span className="text-[9px] text-hawk-goldLight font-black font-mono">{Math.round(rec.score / 10).toFixed(1)}</span>
                                     </div>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>
      
      {loading && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
              <Loader className="w-10 h-10 text-hawk-gold animate-spin mb-4" />
              <p className="text-hawk-textSecondary text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Neural Link...</p>
          </div>
      )}
    </div>
  );
};
