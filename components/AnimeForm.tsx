
import React, { useState, useEffect, useRef } from 'react';
import { Anime, AnimeStatus, Season } from '../types';
import { ChevronLeft, Save, Plus, Trash2, Loader, Image as ImageIcon, Lock, Unlock, X } from 'lucide-react';
import { api, ExternalAnime } from '../lib/api';

interface AnimeFormProps {
  initialData?: Anime; // For Editing (has ID)
  prefillData?: Partial<Anime>; // For New Entry from Discover (no ID)
  onSubmit: (data: Omit<Anime, 'id'>) => void;
  onCancel: () => void;
}

export const AnimeForm: React.FC<AnimeFormProps> = ({ initialData, prefillData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Anime, 'id'>>({
    title: '',
    status: AnimeStatus.PlanToWatch,
    watched: 0,
    total: 0, 
    rating: 0,
    season: '',
    notes: '',
    coverUrl: '',
    seasons: [],
    genres: [],
    duration: 24
  });

  const [isTotalLocked, setIsTotalLocked] = useState(false);
  const [isResolvingEps, setIsResolvingEps] = useState(false);

  // Autocomplete State
  const [suggestions, setSuggestions] = useState<ExternalAnime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        status: initialData.status,
        watched: initialData.watched,
        total: initialData.total,
        rating: initialData.rating,
        season: initialData.season,
        notes: initialData.notes,
        coverUrl: initialData.coverUrl,
        seasons: initialData.seasons || [],
        genres: initialData.genres || [],
        duration: initialData.duration || 24
      });
      setIsTotalLocked((initialData.total || 0) > 0);
    } else if (prefillData) {
      setFormData(prev => ({
        ...prev,
        title: prefillData.title || prev.title,
        total: prefillData.total || 0,
        season: prefillData.season || prev.season,
        coverUrl: prefillData.coverUrl || prev.coverUrl,
        notes: prefillData.notes || prev.notes,
        rating: prefillData.rating || prev.rating,
        genres: prefillData.genres || prev.genres,
        duration: prefillData.duration || prev.duration
      }));
      if (prefillData.total && prefillData.total > 0) {
          setIsTotalLocked(true);
      } else {
          setIsTotalLocked(false);
      }
    }
  }, [initialData, prefillData]);

  // Handle Click Outside for Autocomplete Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-calculate totals from seasons if seasons exist
  useEffect(() => {
    if (formData.seasons && formData.seasons.length > 0) {
      const totalWatched = formData.seasons.reduce((acc, s) => acc + (s.watched || 0), 0);
      const totalEpisodes = formData.seasons.reduce((acc, s) => acc + (s.total || 0), 0);
      setFormData(prev => ({
        ...prev,
        watched: totalWatched,
        total: totalEpisodes
      }));
    }
  }, [formData.seasons]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const parsedValue = name === 'watched' || name === 'total' ? (value === '' ? 0 : parseInt(value)) : value;
      const newState = {
        ...prev,
        [name]: parsedValue
      };

      if (name === 'status' && parsedValue === AnimeStatus.Finished) {
        if (!prev.seasons || prev.seasons.length === 0) {
          newState.watched = newState.total;
        }
      }

      return newState;
    });

    if (name === 'title' && !initialData) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (value.trim().length >= 3) {
        setIsSearching(true);
        searchTimeout.current = setTimeout(() => fetchSuggestions(value), 600);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSearching(false);
      }
    }
  };

  const fetchSuggestions = async (query: string) => {
    try {
      const results = await api.search(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = async (item: ExternalAnime) => {
    setShowSuggestions(false);
    setIsResolvingEps(true);
    
    let resolvedEpisodes = item.episodes || 0;
    
    // EPISODE RESOLUTION LOGIC
    if (resolvedEpisodes === 0 && item.idMal) {
      const jikanEps = await api.fetchJikanEpisodes(item.idMal);
      if (jikanEps) resolvedEpisodes = jikanEps;
    }

    const seasonText = item.season && item.year ? `${item.season} ${item.year}` : (item.year ? `${item.year}` : '');
    const cleanDesc = item.description ? item.description.replace(/<[^>]*>?/gm, '') : '';
    
    // LOCK LOGIC: Lock if final count > 0
    const finalKnownTotal = resolvedEpisodes > 0;
    setIsTotalLocked(finalKnownTotal);

    setFormData(prev => {
        const shouldFillWatched = prev.status === AnimeStatus.Finished && (!prev.seasons || prev.seasons.length === 0);
        return {
            ...prev,
            title: item.title,
            total: resolvedEpisodes,
            watched: shouldFillWatched ? resolvedEpisodes : prev.watched,
            season: seasonText,
            coverUrl: item.coverImage,
            notes: cleanDesc, 
            rating: item.score ? Math.round(item.score / 10) : 0,
            genres: item.genres,
            duration: item.duration || 24
        };
    });
    setIsResolvingEps(false);
  };

  const handleAddSeason = () => {
    const newSeason: Season = {
      id: crypto.randomUUID(),
      name: `Season ${formData.seasons ? formData.seasons.length + 1 : 1}`,
      watched: 0,
      total: 12
    };
    setFormData(prev => ({
      ...prev,
      seasons: [...(prev.seasons || []), newSeason]
    }));
  };

  const handleUpdateSeason = (id: string, field: keyof Season, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      seasons: prev.seasons?.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    }));
  };

  const handleRemoveSeason = (id: string) => {
    setFormData(prev => ({
      ...prev,
      seasons: prev.seasons?.filter(s => s.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const hasSeasons = formData.seasons && formData.seasons.length > 0;
  const isTotalDisabled = hasSeasons || isTotalLocked;

  return (
    <div className="pb-20 min-h-screen bg-hawk-base">
      <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 bg-hawk-base/90 backdrop-blur-md z-10 p-4 border-b border-hawk-ui shadow-lg">
        <button onClick={onCancel} className="text-hawk-textSecondary hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xs font-bold text-hawk-gold uppercase tracking-[0.2em]">
          {initialData ? 'Edit Entry' : 'New Entry'}
        </h2>
        <div className="w-6" />
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-8 max-w-2xl mx-auto">
        
        {/* Image Preview */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-48 bg-hawk-ui rounded-2xl overflow-hidden border border-hawk-ui shadow-2xl relative group">
            {formData.coverUrl ? (
              <img src={formData.coverUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-hawk-textMuted text-center p-2 gap-2">
                <ImageIcon className="w-6 h-6 opacity-30" />
                <span className="text-[9px] uppercase tracking-widest">No Cover</span>
              </div>
            )}
          </div>
        </div>

        {/* Title with Autocomplete */}
        <div className="space-y-2 group relative" ref={wrapperRef}>
          <label className="text-[10px] font-bold text-hawk-textSecondary uppercase tracking-widest group-focus-within:text-hawk-gold transition-colors flex justify-between">
            <span>Name</span>
            {(isSearching || isResolvingEps) && <span className="flex items-center gap-1 text-hawk-gold"><Loader className="w-3 h-3 animate-spin" /> {isResolvingEps ? 'Verifying Eps' : 'Searching'}</span>}
          </label>
          <div className="relative">
            <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Search anime..."
                disabled={!!initialData || isResolvingEps} 
                className={`w-full bg-transparent border-b border-hawk-ui py-3 pr-10 text-xl text-white placeholder-hawk-textMuted focus:outline-none focus:border-hawk-gold transition-colors ${initialData || isResolvingEps ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {!initialData && formData.title && !isResolvingEps && (
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, title: '' }))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-hawk-textMuted hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
            {showSuggestions && suggestions.length > 0 && !initialData && (
                <div className="absolute top-full left-0 w-full mt-2 bg-hawk-surface border border-hawk-gold/20 rounded-2xl shadow-2xl z-50 overflow-hidden origin-top">
                    <div className="py-1">
                        <div className="px-3 py-2 text-[10px] uppercase text-hawk-gold font-bold tracking-widest border-b border-hawk-ui bg-hawk-base/50 flex justify-between">
                            <span>Database Suggestions</span>
                            <span className="text-[9px] text-hawk-textMuted">AniList / Jikan</span>
                        </div>
                        {suggestions.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectSuggestion(item)}
                                className="w-full text-left px-3 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-hawk-ui last:border-0"
                            >
                                <img src={item.coverImage} alt="" className="w-8 h-12 object-cover rounded-md bg-hawk-ui" />
                                <div>
                                    <div className="text-sm font-medium text-white line-clamp-1">{item.title}</div>
                                    <div className="text-[10px] text-hawk-textMuted font-mono mt-0.5">
                                        {item.year || 'Unknown'} • {item.episodes ? `${item.episodes} eps` : 'Ongoing'} • ★ {item.score ? Math.round(item.score / 10) : '-'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-hawk-textSecondary uppercase tracking-widest group-focus-within:text-hawk-gold transition-colors">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-hawk-ui border border-hawk-ui rounded-xl px-3 py-3 text-white focus:outline-none focus:border-hawk-gold/50 transition-colors appearance-none text-sm font-bold"
          >
            {Object.values(AnimeStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Overall Progress */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 group">
            <label className="text-[10px] font-bold text-hawk-textSecondary uppercase tracking-widest group-focus-within:text-hawk-gold transition-colors">
              {hasSeasons ? 'Watched (Calc)' : 'Watched'}
            </label>
            <input
              type="number"
              name="watched"
              min="0"
              value={formData.watched}
              onChange={handleChange}
              disabled={hasSeasons || isResolvingEps}
              className={`w-full bg-hawk-ui border border-hawk-ui rounded-xl p-3 text-white focus:outline-none focus:border-hawk-gold transition-colors text-center font-mono font-bold ${hasSeasons || isResolvingEps ? 'opacity-30 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="space-y-2 group relative">
            <label className="text-[10px] font-bold text-hawk-textSecondary uppercase tracking-widest group-focus-within:text-hawk-gold transition-colors flex justify-between">
               <span>{hasSeasons ? 'Total (Calc)' : 'Total Eps'}</span>
               {isTotalLocked && <Lock className="w-3 h-3 text-hawk-gold/70" />}
            </label>
            <div className="relative">
                <input
                  type="number"
                  name="total"
                  min="0"
                  value={formData.total}
                  onChange={handleChange}
                  disabled={isTotalDisabled || isResolvingEps}
                  placeholder={isTotalDisabled ? "" : "?"}
                  className={`w-full bg-hawk-ui border border-hawk-ui rounded-xl p-3 text-white focus:outline-none focus:border-hawk-gold transition-colors text-center font-mono font-bold ${isTotalDisabled || isResolvingEps ? 'opacity-50 cursor-not-allowed bg-hawk-ui/50' : ''}`}
                />
                {(isTotalDisabled || isResolvingEps) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-hawk-textMuted pointer-events-none z-10">
                        {isResolvingEps ? <Loader className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3 opacity-70" />}
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Seasons Management */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-hawk-ui pb-2">
            <label className="text-[10px] font-bold text-hawk-textSecondary uppercase tracking-widest">Seasons</label>
            <button
              type="button"
              onClick={handleAddSeason}
              className="text-[10px] flex items-center gap-1 text-hawk-gold hover:text-hawk-goldLight transition-colors uppercase font-bold tracking-widest"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          
          {hasSeasons && (
            <div className="space-y-3">
              {formData.seasons?.map((season) => (
                <div key={season.id} className="flex gap-3 items-center bg-hawk-surface p-3 rounded-xl border border-hawk-ui">
                  <input
                    type="text"
                    value={season.name}
                    onChange={(e) => handleUpdateSeason(season.id, 'name', e.target.value)}
                    className="flex-grow bg-transparent border-b border-transparent focus:border-hawk-gold focus:outline-none text-sm font-bold text-white transition-colors"
                    placeholder="Season Name"
                  />
                  <div className="flex items-center gap-1 text-sm text-hawk-textMuted font-mono">
                    <input
                      type="number"
                      min="0"
                      value={season.watched}
                      onChange={(e) => handleUpdateSeason(season.id, 'watched', parseInt(e.target.value) || 0)}
                      className="w-10 bg-hawk-ui rounded-lg px-1 py-1 text-center text-white focus:outline-none focus:ring-1 focus:ring-hawk-gold border border-hawk-ui transition-all font-bold"
                    />
                    <span className="text-hawk-textMuted">/</span>
                    <input
                      type="number"
                      min="0"
                      value={season.total}
                      onChange={(e) => handleUpdateSeason(season.id, 'total', parseInt(e.target.value) || 0)}
                      className="w-10 bg-hawk-ui rounded-lg px-1 py-1 text-center text-white focus:outline-none focus:ring-1 focus:ring-hawk-gold border border-hawk-ui transition-all font-bold"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveSeason(season.id)}
                    className="p-1 text-hawk-textMuted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isResolvingEps}
          className="w-full bg-hawk-gold text-black font-black uppercase tracking-[0.15em] py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-3 mt-10 shadow-[0_4px_0_#D48600] hover:translate-y-[-2px] hover:shadow-[0_6px_0_#FFA31A] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
        >
          {isResolvingEps ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isResolvingEps ? 'Verifying Progress...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
};
