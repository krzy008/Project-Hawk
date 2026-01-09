
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalAnime } from '../lib/api';
import { Plus, Check, Loader, AlertCircle } from 'lucide-react';

interface QuickAddButtonProps {
  anime: ExternalAnime;
  className?: string;
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({ anime, className = '' }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'loading') return;
    setStatus('loading');
    setErrorMsg(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId || userId === '00000000-0000-0000-0000-000000000000') throw new Error("Login required");

      let animeId = typeof anime.id === 'number' ? anime.id : parseInt(String(anime.id).replace(/\D/g, ''));
      if (isNaN(animeId)) animeId = Math.abs(anime.title.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0));

      const payload = {
        user_id: userId,
        anime_id: animeId,
        title: anime.title.replace(/[<>]/g, '').slice(0, 200),
        cover_image: anime.coverImage,
        status: 'Plan to Watch',
        progress: 0,
        total_episodes: anime.episodes || 0,
        rating: null,
        notes: (anime.description || '').replace(/[<>]/g, '').slice(0, 2000),
        genres: (anime.genres || []).map(g => g.replace(/[<>]/g, '')),
        seasons: [],
        duration: anime.duration || 24
      };

      const { error } = await supabase.from('watchlist').upsert(payload, { onConflict: 'user_id,anime_id' });
      if (error) throw error;
      
      setStatus('success');
      window.dispatchEvent(new CustomEvent('watchlist_updated'));
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className={`relative flex flex-col w-full ${className}`}>
      <button onClick={handleQuickAdd} disabled={status === 'loading'} className={`w-full h-[48px] flex items-center justify-center gap-2 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 active:scale-95 shadow-lg border-none ${status === 'success' ? 'bg-emerald-500 text-white' : status === 'error' ? 'bg-red-500 text-white' : 'bg-[#FFD60A] text-black hover:bg-[#FFE047]'}`}>
        {status === 'loading' ? <Loader className="w-4 h-4 animate-spin" /> : status === 'success' ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
        <span>{status === 'success' ? 'ADDED' : 'QUICK ADD'}</span>
      </button>
      {errorMsg && <div className="absolute top-full left-0 right-0 mt-2 flex flex-col items-center justify-center gap-1 text-[8px] font-black text-red-400 uppercase tracking-tighter bg-black/95 px-3 py-2 rounded-lg border border-red-500/20 z-[110] shadow-2xl animate-fade-in text-center"><div className="flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /><span>ERROR</span></div><div className="opacity-80 mt-0.5 leading-tight">{errorMsg}</div></div>}
    </div>
  );
};
