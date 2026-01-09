
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalAnime } from '../lib/api';
import { X, Save, Loader, Plus, ChevronDown, AlertCircle } from 'lucide-react';
import { AnimeStatus } from '../types';

interface AddToWatchlistModalProps {
  anime: ExternalAnime;
}

export const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({ anime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    status: AnimeStatus.PlanToWatch,
    progress: 0,
    rating: 0
  });

  // Reset form when anime changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        status: AnimeStatus.PlanToWatch,
        progress: 0,
        rating: anime.score ? Math.round(anime.score / 10) : 0
      });
    }
  }, [isOpen, anime.id]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || '00000000-0000-0000-0000-000000000000';

      // Robust ID parsing: ensure we have a number for anime_id in the watchlist table
      let animeId: number;
      if (typeof anime.id === 'number') {
        animeId = anime.id;
      } else {
        const parsed = parseInt(String(anime.id).replace(/\D/g, ''));
        animeId = isNaN(parsed) ? Math.abs(JSON.stringify(anime.id).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)) : parsed;
      }

      const payload = {
        user_id: userId,
        anime_id: animeId,
        mal_id: anime.idMal ? Number(anime.idMal) : null,
        title: anime.title,
        cover_image: anime.coverImage,
        status: formData.status,
        progress: formData.progress,
        total_episodes: anime.episodes || 0,
        rating: formData.rating > 0 ? formData.rating : null,
        notes: anime.description || '',
        genres: anime.genres || [],
        duration: anime.duration || 24,
        seasons: []
      };

      const { error } = await supabase
        .from('watchlist')
        .upsert(payload, { onConflict: 'user_id,anime_id' });

      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('watchlist_updated'));
      setIsOpen(false);
    } catch (err: any) {
      console.error('HAWK Modal Save Detail Error:', err);
      setErrorMsg(err.message || 'Connection failed - try refresh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="w-full h-[48px] flex items-center justify-center gap-2 px-6 rounded-xl border-2 border-[#FFD60A] bg-transparent text-[#FFD60A] font-black uppercase tracking-widest text-[11px] transition-all duration-300 hover:bg-[#FFD60A]/10 active:scale-95 shadow-lg"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>ADD TO WATCHLIST</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          {/* Opaque dark backdrop */}
          <div 
            className="fixed inset-0 bg-black/98 backdrop-blur-xl" 
            onClick={() => !loading && setIsOpen(false)} 
          />
          
          {/* Modal Container with solid black background to fix transparency */}
          <div className="relative w-full max-w-md bg-[#0A0A0A] border border-hawk-ui rounded-[32px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] animate-fade-in z-[10000] opacity-100">
            <div className="p-6 border-b border-hawk-ui flex items-center justify-between bg-black">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#FFD60A]">NEW ENTRY</h3>
              <button 
                onClick={() => !loading && setIsOpen(false)} 
                className="p-2 text-hawk-textMuted hover:text-white transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide bg-[#0A0A0A]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 aspect-[2/3] rounded-2xl overflow-hidden border border-hawk-ui shadow-2xl bg-black">
                  <img src={anime.coverImage} className="w-full h-full object-cover" alt={anime.title} />
                </div>
                <h2 className="text-lg font-black text-center text-white uppercase tracking-tighter leading-tight">
                  {anime.title}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Status</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AnimeStatus })}
                      className="w-full bg-[#151515] border border-hawk-ui rounded-2xl px-5 py-4 text-white text-sm font-bold appearance-none focus:outline-none focus:border-[#FFD60A] transition-colors"
                    >
                      <option value={AnimeStatus.PlanToWatch}>Plan to Watch</option>
                      <option value={AnimeStatus.Watching}>Watching</option>
                      <option value={AnimeStatus.Finished}>Finished</option>
                      <option value={AnimeStatus.OnHold}>On Hold</option>
                      <option value={AnimeStatus.Dropped}>Dropped</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-hawk-textMuted pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Watched</label>
                    <input
                      type="number"
                      min="0"
                      max={anime.episodes || 9999}
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-[#151515] border border-hawk-ui rounded-2xl px-5 py-4 text-white text-sm font-bold focus:outline-none focus:border-[#FFD60A] transition-colors text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Total Eps</label>
                    <div className="w-full bg-black/40 border border-hawk-ui rounded-2xl px-5 py-4 text-hawk-textMuted text-sm font-bold flex items-center justify-center">
                      {anime.episodes || '?'}
                    </div>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-[#FFD60A] text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_5px_0_#BFA100] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>Save Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
