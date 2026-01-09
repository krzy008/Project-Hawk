

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader, Search, Filter, SlidersHorizontal, Star, Plus, LayoutGrid, Compass, X } from 'lucide-react';
import { api, ExternalAnime } from '../lib/api';
import { Logo } from './Logo';

interface DiscoverViewProps {
  onAdd: (data: any) => void;
  onPreview: (anime: any) => void;
  onMenuOpen: () => void;
  userAvatar?: string;
  onHomeClick?: () => void;
  refreshKey?: number;
  dbTotalCount?: number;
}

const GENRES = [
  'All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Psychological', 
  'Mecha', 'Thriller', 'Seinen', 'Shoujo', 'Shounen', 'Josei', 'Ecchi', 'Hentai', 'Erotica'
];

const DiscoverCard: React.FC<{ anime: ExternalAnime; onClick: () => void }> = ({ anime, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative w-full aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-2xl bg-hawk-ui/20"
    >
      <img 
        src={anime.coverImage} 
        alt={anime.title} 
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1 border border-white/10">
        <Star className="w-3 h-3 fill-hawk-gold text-hawk-gold" />
        <span className="text-[10px] font-black text-white">{anime.score ? Math.round(anime.score / 10) : '—'}</span>
      </div>
      {anime.episodes > 0 && (
        <div className="absolute top-2 right-2 bg-hawk-ui/80 backdrop-blur-md rounded-lg px-2 py-1 border border-white/5">
          <span className="text-[9px] font-black text-white uppercase tracking-tighter">{anime.episodes} EPS</span>
        </div>
      )}
      <div className="absolute bottom-3 left-3 right-3">
        <h3 className="text-sm font-black text-white line-clamp-2 leading-tight uppercase tracking-tight group-hover:text-hawk-gold transition-colors">
          {anime.title}
        </h3>
        <p className="text-[9px] font-bold text-hawk-textMuted mt-1 uppercase tracking-widest">
          {anime.format || 'TV'} • {anime.year || '2026'}
        </p>
      </div>
    </div>
  );
};

// Fix: Corrected "item" to "anime" to correctly reference the destructured prop.
const DiscoverRowCard: React.FC<{ anime: ExternalAnime; onClick: () => void }> = ({ anime, onClick }) => {
  return (
    <div className="shrink-0 w-44 md:w-52 snap-start">
      <DiscoverCard anime={anime} onClick={onClick} />
    </div>
  );
};

// Fixed local item ref in DiscoverRowCard mapping in usage below if needed, but keeping logic to user's search cross fix

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="relative pl-5 flex items-center justify-between mb-8 group overflow-hidden">
    <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-hawk-gold rounded-r-sm shadow-[0_0_12px_rgba(255,163,26,0.6)]" />
    <div className="flex flex-col">
      <h2 className="text-3xl font-black italic text-white uppercase tracking-tight leading-none mb-2">
        {title}
      </h2>
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-7 bg-hawk-gold" />
        <span className="text-[11px] font-black text-hawk-gold uppercase tracking-[0.25em] opacity-90 italic">
          {subtitle}
        </span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-1.5 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-500 mr-6 scale-125">
      <div className="w-2.5 h-2.5 rounded-[2px] border-2 border-white" />
      <div className="w-2.5 h-2.5 rounded-[2px] border-2 border-white" />
      <div className="w-2.5 h-2.5 rounded-[2px] border-2 border-white" />
      <div className="w-2.5 h-2.5 rounded-[2px] border-2 border-white" />
    </div>
  </div>
);

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onPreview, onMenuOpen, userAvatar, onHomeClick, refreshKey, dbTotalCount }) => {
  const [trending, setTrending] = useState<ExternalAnime[]>([]);
  const [seasonal, setSeasonal] = useState<ExternalAnime[]>([]);
  const [topRated, setTopRated] = useState<ExternalAnime[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'title' | 'rating' | 'newest'>('title');
  const [searchResults, setSearchResults] = useState<ExternalAnime[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatCount = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num.toString();
  };

  useEffect(() => {
    // Add a slight delay to the initial mount to prevent layout jumping
    const timer = setTimeout(async () => {
      try {
        const [t, s, r] = await Promise.all([
          api.getTrending(1, 15),
          api.getSeasonal(1, 15),
          api.getTopRated(1, 15)
        ]);
        setTrending(t);
        setSeasonal(s);
        setTopRated(r);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [refreshKey]);

  const performSearch = useCallback(async (query: string, genre: string, sort: 'title' | 'rating' | 'newest', page: number) => {
    if (!query.trim() && genre === 'All' && page === 1) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await api.search(query, genre === 'All' ? undefined : genre, sort, page);
      setSearchResults(prev => page === 1 ? results : [...prev, ...results]);
      setSearchPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    const delay = searchQuery.trim() ? 600 : 0;
    
    searchTimeout.current = setTimeout(() => {
      performSearch(searchQuery, selectedGenre, sortBy, 1);
    }, delay);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery, selectedGenre, sortBy, performSearch]);

  const isBrowsing = !searchQuery.trim() && selectedGenre === 'All';

  return (
    <div className="bg-black min-h-screen pb-32 font-sans selection:bg-hawk-gold selection:text-black animate-fade-in">
      <div className="sticky top-0 z-50 bg-hawk-surface/95 backdrop-blur-xl border-b border-hawk-ui transition-all">
        <div className="flex items-center justify-between h-16 px-6 relative">
          <button onClick={onHomeClick} className="w-10 h-10 shrink-0 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer relative group">
            <Logo />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-sm font-bold uppercase tracking-[0.4em] text-hawk-gold">H A W K</h1>
            <span className="text-[8px] font-bold text-hawk-textMuted uppercase tracking-[0.2em]">Anime Watchlist Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onMenuOpen} className="relative group w-10 h-10">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,163,26,0.15)]">
                <defs>
                  <clipPath id="avatarClipDisc">
                    <path d="M 15 35 L 55 15 L 95 45 L 65 55 L 55 85 L 35 60 L 10 50 Z" />
                  </clipPath>
                </defs>
                <path 
                  d="M 15 35 L 55 15 L 95 45 L 65 55 L 55 85 L 35 60 L 10 50 Z" 
                  className="fill-hawk-ui stroke-hawk-goldDim/50 group-hover:stroke-hawk-gold transition-all duration-300"
                  strokeWidth="5"
                />
                <image 
                  href={userAvatar || 'https://api.dicebear.com/9.x/lorelei/svg?seed=Hawk&backgroundColor=111111'} 
                  width="100" 
                  height="100" 
                  preserveAspectRatio="xMidYMid slice" 
                  clipPath="url(#avatarClipDisc)" 
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hawk-textMuted w-3 h-3" />
              <input 
                type="text" 
                placeholder="Search anime..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className={`w-full bg-hawk-base/50 border border-hawk-ui focus:border-hawk-gold rounded-xl py-2 pl-9 ${searchQuery || isSearching ? 'pr-10' : 'pr-3'} text-white placeholder-hawk-textMuted text-xs focus:outline-none transition-all shadow-inner h-9`} 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSearching && <Loader className="w-3 h-3 text-hawk-gold animate-spin" />}
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-hawk-textMuted hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="relative shrink-0">
              <div className={`h-9 px-3 rounded-xl border flex items-center gap-2 bg-hawk-base/50 ${selectedGenre !== 'All' ? 'border-hawk-gold text-hawk-gold' : 'border-hawk-ui text-hawk-textMuted'}`}>
                <span className="text-[10px] font-bold uppercase truncate max-w-[60px]">
                  {selectedGenre === 'All' ? 'all' : selectedGenre.toLowerCase()}
                </span>
                <Filter className="w-3 h-3 shrink-0" />
              </div>
              <select 
                value={selectedGenre} 
                onChange={(e) => setSelectedGenre(e.target.value)} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="relative shrink-0">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center bg-hawk-base/50 transition-colors ${sortBy !== 'title' ? 'border-hawk-gold text-hawk-gold' : 'border-hawk-ui text-hawk-textMuted hover:text-white'}`}>
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="title">A-Z</option>
                <option value="newest">Newest</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6">
        {isBrowsing ? (
          <div className="space-y-12">
            <section>
              <SectionHeader title="Trending Now" subtitle="Most Popular" />
              <div className="flex gap-4 overflow-x-auto px-6 pb-6 scrollbar-hide snap-x">
                {trending.length > 0 ? trending.map(item => <div key={item.id} className="shrink-0 w-44 md:w-52 snap-start"><DiscoverCard anime={item} onClick={() => onPreview(item)} /></div>) : 
                Array.from({length: 5}).map((_, i) => <div key={i} className="shrink-0 w-44 md:w-52 aspect-[2/3] bg-hawk-ui/20 rounded-2xl animate-pulse" />)}
              </div>
            </section>

            <section>
              <SectionHeader title="Latest Releases" subtitle="Currently Airing" />
              <div className="flex gap-4 overflow-x-auto px-6 pb-6 scrollbar-hide snap-x">
                {seasonal.length > 0 ? seasonal.map(item => <div key={item.id} className="shrink-0 w-44 md:w-52 snap-start"><DiscoverCard anime={item} onClick={() => onPreview(item)} /></div>) : 
                Array.from({length: 5}).map((_, i) => <div key={i} className="shrink-0 w-44 md:w-52 aspect-[2/3] bg-hawk-ui/20 rounded-2xl animate-pulse" />)}
              </div>
            </section>

            <section>
              <SectionHeader title="Hall of Fame" subtitle="Top Rated" />
              <div className="flex gap-4 overflow-x-auto px-6 pb-6 scrollbar-hide snap-x">
                {topRated.length > 0 ? topRated.map(item => <div key={item.id} className="shrink-0 w-44 md:w-52 snap-start"><DiscoverCard anime={item} onClick={() => onPreview(item)} /></div>) : 
                Array.from({length: 5}).map((_, i) => <div key={i} className="shrink-0 w-44 md:w-52 aspect-[2/3] bg-hawk-ui/20 rounded-2xl animate-pulse" />)}
              </div>
            </section>
          </div>
        ) : (
          <div className="px-4">
             <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black italic text-white uppercase tracking-tighter leading-none">
                    Discovery Results
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-[2px] w-6 bg-hawk-gold" />
                    <span className="text-[9px] font-black text-hawk-textMuted uppercase tracking-[0.2em]">
                      {searchResults.length} {searchQuery ? `for "${searchQuery}"` : 'found'}
                    </span>
                  </div>
                </div>
             </div>

             {searchResults.length === 0 && !isSearching ? (
               <div className="py-20 flex flex-col items-center justify-center opacity-40">
                  <Compass className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No results in sector</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {searchResults.map(item => (
                   <DiscoverCard key={item.id} anime={item} onClick={() => onPreview(item)} />
                 ))}
               </div>
             )}

             {searchResults.length > 0 && (
               <div className="flex justify-center mt-10">
                 <button 
                  onClick={() => performSearch(searchQuery, selectedGenre, sortBy, searchPage + 1)}
                  disabled={isSearching}
                  className="px-8 py-3 bg-hawk-ui/50 border border-hawk-ui rounded-2xl flex items-center gap-2 text-hawk-textSecondary hover:text-white transition-colors"
                 >
                   {isSearching ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                   <span className="text-[10px] font-black uppercase tracking-widest">Load More</span>
                 </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
