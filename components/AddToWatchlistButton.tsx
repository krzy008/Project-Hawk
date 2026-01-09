
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalAnime } from '../lib/api';
import { Plus, Check, Loader } from 'lucide-react';

interface AddToWatchlistButtonProps {
  anime: ExternalAnime;
  className?: string;
  variant?: 'compact' | 'full';
}

export const AddToWatchlistButton: React.FC<AddToWatchlistButtonProps> = ({ anime, className = '', variant = 'full' }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', Number(anime.id))
        .single();

      if (data) setIsAdded(true);
    };

    checkStatus();
  }, [anime.id]);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdded || loading) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to add to watchlist");
        return;
      }

      const { error } = await supabase
        .from('watchlist')
        .upsert({
          user_id: user.id,
          anime_id: Number(anime.id),
          mal_id: anime.idMal ? Number(anime.idMal) : null,
          title: anime.title,
          cover_image: anime.coverImage,
          status: 'planning',
          progress: 0,
          rating: anime.score ? Math.round(anime.score / 10) : null
        }, {
          onConflict: 'user_id, anime_id'
        });

      if (error) throw error;
      setIsAdded(true);
    } catch (err) {
      console.warn("Failed to add to watchlist", err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleAdd}
        className={`flex items-center justify-center p-2 rounded-lg bg-black/60 backdrop-blur-md border transition-all duration-300 ${
          isAdded 
            ? 'border-emerald-500 text-emerald-500' 
            : 'border-hawk-gold/40 text-hawk-gold hover:border-hawk-gold hover:bg-hawk-gold/20'
        } ${className}`}
      >
        {loading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : isAdded ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border font-black uppercase tracking-widest text-xs transition-all duration-300 active:scale-95 ${
        isAdded 
          ? 'bg-hawk-ui border-emerald-500 text-emerald-500 cursor-default' 
          : 'bg-black border-hawk-gold text-hawk-gold hover:bg-hawk-gold/10 hover:shadow-[0_0_20px_rgba(255,163,26,0.2)]'
      } ${className}`}
    >
      {loading ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : isAdded ? (
        <>
          <Check className="w-4 h-4" />
          <span>Added</span>
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          <span>Add to Watchlist</span>
        </>
      )}
    </button>
  );
};
