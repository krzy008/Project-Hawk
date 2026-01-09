
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

  const checkRateLimit = () => {
    const now = Date.now();
    const historyStr = localStorage.getItem('hawk_qa_limit');
    const history: number[] = historyStr ? JSON.parse(historyStr) : [];
    const oneMinuteAgo = now - 60000;
    const recentActions = history.filter(ts => ts > oneMinuteAgo);
    
    if (recentActions.length >= 5) return false;
    
    recentActions.push(now);
    localStorage.setItem('hawk_qa_limit', JSON.stringify(recentActions));
    return true;
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'loading') return;

    if (!checkRateLimit()) {
      setErrorMsg("Too many actions — wait a moment");
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setErrorMsg(null); }, 3000);
      return;
    }

    setStatus('loading');
    setErrorMsg(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fixed: Properly check for Guest/Preview ID which should act as unauthenticated for write operations
      const userId = session?.user?.id;
      const isGuest = !userId || userId === '00000000-0000-0000-0000-000000000000';
      
      if (isGuest) {
        throw new Error("Login required to save progress");
      }

      let animeId: number;
      if (typeof anime.id === 'number') {
        animeId = anime.id;
      } else {
        const parsed = parseInt(String(anime.id).replace(/\D/g, ''));
        animeId = isNaN(parsed) ? Math.abs(anime.title.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)) : parsed;
      }

      // Input Sanitization
      const cleanTitle = anime.title.replace(/[<>]/g, '').slice(0, 200);

      const payload = {
        user_id: userId,
        anime_id: animeId,
        mal_id: anime.idMal ? Number(anime.idMal) : null,
        title: cleanTitle,
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

      const { error } = await supabase
        .from('watchlist')
        .upsert(payload, { onConflict: 'user_id,anime_id' });

      if (error) throw error;
      
      setStatus('success');
      window.dispatchEvent(new CustomEvent('watchlist_updated'));
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err: any) {
      console.error('HAWK QuickAdd Connection Error:', err);
      setErrorMsg(err.message || 'Connection failed');
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setErrorMsg(null); }, 4000);
      
      // Fixed: If it's a login error, notify the app to show Auth
      if (err.message.includes("Login required")) {
        window.dispatchEvent(new CustomEvent('hawk_auth_required'));
      }
    }
  };

  return (
    <div className={`relative flex flex-col w-full ${className}`}>
      <button
        onClick={handleQuickAdd}
        disabled={status === 'loading'}
        className={`w-full h-[48px] flex items-center justify-center gap-2 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 active:scale-95 shadow-lg border-none ${
          status === 'success' 
            ? 'bg-emerald-500 text-white' 
            : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-[#FFD60A] text-black hover:bg-[#FFE047]'
        }`}
      >
        {status === 'loading' ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : status === 'success' ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4 stroke-[3]" />
        )}
        <span>{status === 'success' ? 'ADDED' : 'QUICK ADD'}</span>
      </button>
      
      {errorMsg && (
        <div className="absolute top-full left-0 right-0 mt-2 flex items-center justify-center gap-1 text-[8px] font-black text-red-400 uppercase tracking-tighter bg-black/95 px-2 py-1.5 rounded-lg border border-red-500/20 z-[110] shadow-2xl animate-fade-in whitespace-nowrap">
          <AlertCircle className="w-2.5 h-2.5" />
          {errorMsg}
        </div>
      )}
    </div>
  );
};
