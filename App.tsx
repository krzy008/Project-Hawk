
import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import { Anime, AnimeStatus, TabType, ViewState, Season } from './types';
import { Logo } from './components/Logo';
import { Auth } from './components/Auth';
import { AnimeCard } from './components/AnimeCard';
import { AnimeForm } from './components/AnimeForm';
import { DetailView } from './components/DetailView';
import { DiscoverView } from './components/DiscoverView';
import { ProfileView } from './components/ProfileView';
import { MalImportView } from './components/MalImportView';
import { FriendsView, FriendUser } from './components/FriendsView';
import { FAQsView } from './components/FAQsView';
import { LeaderboardView, LeaderboardEntry, PREVIEW_BOTS } from './components/LeaderboardView';
import { Search, LogOut, Loader, User, LayoutGrid, Compass, Filter, ArrowDownToLine, Trophy, Users, Plus, SlidersHorizontal, HelpCircle, Wallet, Copy, ChevronLeft, Info, MessageCircle, X } from 'lucide-react';
import { api } from './lib/api';

// DB Mapper Helpers for 'watchlist' table
const mapFromDb = (row: any): Anime => ({
    id: row.anime_id?.toString() || row.id,
    title: row.title,
    status: row.status as AnimeStatus,
    watched: row.progress || row.watched || 0,
    total: row.total_episodes || row.total || 0,
    rating: row.rating || 0,
    season: row.season || '',
    notes: row.notes || '',
    coverUrl: row.cover_image || row.cover_url,
    seasons: row.seasons || [],
    genres: row.genres || [],
    duration: row.duration || 24,
    createdAt: row.created_at
});

const sanitize = (val: string) => (val || '').replace(/[<>]/g, '').trim();

const mapToDb = (anime: Partial<Anime>, userId: string) => ({
    user_id: userId,
    anime_id: Number(String(anime.id).replace(/\D/g, '')),
    title: sanitize(anime.title || ''),
    status: anime.status,
    progress: anime.watched || 0,
    total_episodes: anime.total || 0,
    rating: anime.rating && anime.rating > 0 ? anime.rating : null,
    season: sanitize(anime.season || ''),
    notes: sanitize(anime.notes || '').slice(0, 3000),
    cover_image: anime.coverUrl || '',
    seasons: anime.seasons || [],
    genres: (anime.genres || []).map(g => sanitize(g)),
    duration: anime.duration || 24
});

type SortOption = 'title' | 'rating' | 'newest';

interface HistoryState {
  view: ViewState;
  activeBottomTab: 'discover' | 'library';
  selectedAnimeId: string | null;
  previewAnime: Anime | null;
  discoverPrefill: Partial<Anime> | undefined;
  activeTab: TabType;
  viewingProfile: LeaderboardEntry | null;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { id: 'bot-1', rank: 1, username: 'Zenith', avatarUrl: 'https://i.pinimg.com/736x/6a/cb/1d/6acb1de989feaafa0d2869b1f3cfd9e2.jpg', hawkRating: 18.0, animeCount: 10, followersCount: 124 },
    { id: 'bot-2', rank: 2, username: 'KaoriVibes', avatarUrl: 'https://images3.alphacoders.com/133/1335950.png', hawkRating: 14.4, animeCount: 9, followersCount: 85 },
    { id: 'bot-4', rank: 3, username: 'LuffyFan99', avatarUrl: 'https://w0.peakpx.com/wallpaper/261/829/HD-wallpaper-monkey-d-luffy-portrait-artwork-manga-one-piece.jpg', hawkRating: 16.0, animeCount: 8, followersCount: 22 },
];

const MOCK_ANIME_FOR_OTHERS: Anime[] = [
    { id: 'mock-1', title: 'One Piece', status: AnimeStatus.Watching, watched: 1116, total: 1116, rating: 10, season: 'Fall 1999', notes: 'Peak fiction.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-69Y0pGatPAX8.jpg', genres: ['Action', 'Adventure', 'Comedy'], duration: 24 },
    { id: 'mock-2', title: 'Death Note', status: AnimeStatus.Finished, watched: 37, total: 37, rating: 9, season: 'Fall 2006', notes: 'God of the new world.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx1535-7Xis7pmO6pCc.jpg', genres: ['Mystery', 'Psychological', 'Thriller'], duration: 23 },
    { id: 'mock-3', title: 'Attack on Titan', status: AnimeStatus.Finished, watched: 25, total: 25, rating: 10, season: 'Spring 2013', notes: 'Shinzou wo Sasageyo!', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx16498-73peTReV9i9v.jpg', genres: ['Action', 'Drama', 'Fantasy'], duration: 24 },
    { id: 'mock-4', title: 'Fullmetal Alchemist: Brotherhood', status: AnimeStatus.Finished, watched: 64, total: 64, rating: 10, season: 'Spring 2009', notes: 'Equivalent exchange.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx5114-6F399N7zMof9.jpg', genres: ['Action', 'Adventure', 'Drama', 'Fantasy'], duration: 24 },
    { id: 'mock-5', title: 'Your Name.', status: AnimeStatus.Finished, watched: 1, total: 1, rating: 9, season: 'Summer 2016', notes: 'Beautiful animation.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21519-79mWEalA67YF.jpg', genres: ['Romance', 'Drama', 'Supernatural'], duration: 107 },
    { id: 'mock-6', title: 'Demon Slayer', status: AnimeStatus.Watching, watched: 12, total: 26, rating: 8, season: 'Spring 2019', notes: 'Ufotable carrying.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx101922-WBsBl0Clmg9d.jpg', genres: ['Action', 'Adventure', 'Supernatural'], duration: 23 },
    { id: 'mock-7', title: 'Jujutsu Kaisen', status: AnimeStatus.Finished, watched: 24, total: 24, rating: 9, season: 'Fall 2020', notes: 'Domain Expansion.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx113415-bbBWj4PByu12.jpg', genres: ['Action', 'Supernatural'], duration: 23 },
    { id: 'mock-8', title: 'Cyberpunk: Edgerunners', status: AnimeStatus.Finished, watched: 10, total: 10, rating: 10, season: 'Fall 2022', notes: 'I want to stay at your house.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx120547-066GzXW0R8zS.jpg', genres: ['Action', 'Sci-Fi'], duration: 25 },
    { id: 'mock-9', title: 'Steins;Gate', status: AnimeStatus.Finished, watched: 24, total: 24, rating: 10, season: 'Spring 2011', notes: 'El Psyc Kongroo.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx9253-764972.jpg', genres: ['Sci-Fi', 'Thriller'], duration: 24 },
    { id: 'mock-10', title: 'Monster', status: AnimeStatus.Watching, watched: 40, total: 74, rating: 9, season: 'Spring 2004', notes: 'Johan is the best antagonist.', coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx19-Y9vB7VzRhkWn.jpg', genres: ['Drama', 'Mystery', 'Psychological', 'Thriller'], duration: 24 },
];

const PREVIEW_SESSION = {
  user: {
    id: '00000000-0000-0000-0000-000000000000',
    user_metadata: {
      username: 'GUEST_HAWK',
      avatar_url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=GuestHawk&backgroundColor=111111'
    }
  }
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  
  const [view, setView] = useState<ViewState>('discover');
  const [activeBottomTab, setActiveBottomTab] = useState<'discover' | 'library'>('discover');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('ptw');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedAnimeId, setSelectedAnimeId] = useState<string | null>(null);
  const [previewAnime, setPreviewAnime] = useState<Anime | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showMenu, setShowMenu] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [discoverPrefill, setDiscoverPrefill] = useState<Partial<Anime> | undefined>(undefined);
  const [bookmarkedFriends, setBookmarkedFriends] = useState<FriendUser[]>([]);
  const [viewingProfile, setViewingProfile] = useState<LeaderboardEntry | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dbTotalCount, setDbTotalCount] = useState<number>(18000);

  const checkActionLimit = () => {
    const now = Date.now();
    const historyStr = localStorage.getItem('hawk_action_limit');
    const history: number[] = historyStr ? JSON.parse(historyStr) : [];
    const oneMinuteAgo = now - 60000;
    const recentActions = history.filter(ts => ts > oneMinuteAgo);
    
    if (recentActions.length >= 10) return false;
    
    recentActions.push(now);
    localStorage.setItem('hawk_action_limit', JSON.stringify(recentActions));
    return true;
  };

  useEffect(() => {
    const initApp = async () => {
      const startTime = Date.now();
      const isBypassActive = localStorage.getItem('hawk_debug_bypass') === 'true';

      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) {
          setSession(s);
          await fetchAnime(s.user.id);
        } else if (isBypassActive) {
          setSession(PREVIEW_SESSION);
        } else {
          setSession(null);
        }
      } catch (e) {
        console.error("Auth initialization failed", e);
        if (isBypassActive) setSession(PREVIEW_SESSION);
      }

      const elapsed = Date.now() - startTime;
      const delay = Math.max(1200 - elapsed, 0);
      
      setTimeout(() => {
        setInitializing(false);
        setLoading(false);
      }, delay);
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, ns) => {
      const isBypass = localStorage.getItem('hawk_debug_bypass') === 'true';
      
      if (!ns && isBypass) {
        setSession(PREVIEW_SESSION);
      } else {
        setSession(ns);
      }

      if (ns) {
        fetchAnime(ns.user.id);
        setShowAuth(false);
      } else if (!isBypass) {
        setAnimeList([]);
      }
    });

    const handleSync = () => {
      if (session?.user?.id && session.user.id !== PREVIEW_SESSION.user.id) {
        fetchAnime(session.user.id);
      }
    };
    window.addEventListener('watchlist_updated', handleSync);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('watchlist_updated', handleSync);
    };
  }, []);

  useEffect(() => {
    if (!initializing) {
      api.getTotalCount(true).then(setDbTotalCount);
    }
  }, [refreshKey, initializing]);

  useEffect(() => {
    setStatusFilter('All');
  }, [activeTab]);

  const fetchAnime = async (userId: string) => {
    if (userId === PREVIEW_SESSION.user.id) return; 
    const { data } = await supabase.from('watchlist').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setAnimeList(data.map(mapFromDb));
  };

  const filteredAnime = useMemo(() => {
    let list = [...animeList];
    
    if (activeTab === 'watching') {
        list = list.filter(a => a.status === AnimeStatus.Watching);
    } else if (activeTab === 'finished') {
        if (statusFilter === 'All') {
            list = list.filter(a => a.status === AnimeStatus.Finished || a.status === AnimeStatus.Dropped);
        } else {
            list = list.filter(a => a.status === statusFilter);
        }
    } else if (activeTab === 'ptw') {
        if (statusFilter === 'All') {
            list = list.filter(a => a.status === AnimeStatus.PlanToWatch || a.status === AnimeStatus.OnHold);
        } else {
            list = list.filter(a => a.status === statusFilter);
        }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [animeList, searchQuery, sortBy, activeTab, statusFilter]);

  const handleBack = () => {
    if (history.length === 0) {
      setView('discover');
      setViewingProfile(null);
      return;
    }
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setView(prev.view);
    setActiveBottomTab(prev.activeBottomTab);
    setSelectedAnimeId(prev.selectedAnimeId);
    setPreviewAnime(prev.previewAnime);
    setDiscoverPrefill(prev.discoverPrefill);
    setActiveTab(prev.activeTab);
    setViewingProfile(prev.viewingProfile);
    if (session?.user?.id && session.user.id !== PREVIEW_SESSION.user.id) {
        fetchAnime(session.user.id);
    }
  };

  const pushHistory = () => {
    setHistory(prev => [...prev, { view, activeBottomTab, selectedAnimeId, previewAnime, discoverPrefill, activeTab, viewingProfile }]);
  };

  const requireAuth = (callback: () => void) => {
    if (!session || session.user.id === PREVIEW_SESSION.user.id) {
      setShowAuth(true);
      return;
    }
    callback();
  };

  const handleOpenDetail = (anime: any) => {
    pushHistory();
    const existing = animeList.find(a => a.id === String(anime.id));
    if (existing) {
      setSelectedAnimeId(existing.id);
      setPreviewAnime(null);
    } else {
      setSelectedAnimeId(null);
      setPreviewAnime(anime as Anime);
    }
    setView('detail');
  };

  const handleHomeClick = () => {
    setRefreshKey(prev => prev + 1);
    setHistory([]);
    setView('discover');
    setActiveBottomTab('discover');
    setShowMenu(false);
    setSelectedAnimeId(null);
    setPreviewAnime(null);
    setViewingProfile(null);
    setDiscoverPrefill(undefined);
  };

  const handleAdd = async (data: Omit<Anime, 'id'>) => {
    if (!session?.user?.id || session.user.id === PREVIEW_SESSION.user.id) {
      setShowAuth(true);
      return;
    }
    if (!checkActionLimit()) {
      alert("Too many actions — wait a moment");
      return;
    }
    const { data: inserted, error } = await supabase.from('watchlist').upsert([mapToDb(data, session.user.id)]).select();
    if (error) {
      console.error("Supabase Add Error:", error);
      alert(`Save failed: ${error.message || 'Database error'}`);
      return;
    }
    if (inserted) {
        fetchAnime(session.user.id);
        setView('list');
        setActiveBottomTab('library');
    }
  };

  const handleEdit = async (data: Omit<Anime, 'id'>) => {
    if (!selectedAnimeId || !session?.user?.id || session.user.id === PREVIEW_SESSION.user.id) return;
    if (!checkActionLimit()) {
      alert("Too many actions — wait a moment");
      return;
    }
    const { error } = await supabase.from('watchlist').update(mapToDb(data, session.user.id)).eq('anime_id', Number(selectedAnimeId)).eq('user_id', session.user.id);
    if (error) {
      console.error("Supabase Edit Error:", error);
      alert(`Update failed: ${error.message}`);
      return;
    }
    fetchAnime(session.user.id);
    setView('detail');
  };

  const handleDelete = async () => {
    if (!selectedAnimeId || !session?.user?.id || session.user.id === PREVIEW_SESSION.user.id) return;
    await supabase.from('watchlist').delete().eq('anime_id', Number(selectedAnimeId)).eq('user_id', session.user.id);
    fetchAnime(session.user.id);
    setView('list');
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Address copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Address copied to clipboard!');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const formatCount = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num.toString();
  };

  const renderContent = () => {
    if (view === 'detail') {
      const anime = selectedAnimeId ? animeList.find(a => a.id === selectedAnimeId) : previewAnime;
      if (!anime) return null;
      return <DetailView anime={anime} onBack={handleBack} onEdit={selectedAnimeId ? () => { pushHistory(); setView('edit'); } : undefined} onDelete={selectedAnimeId ? handleDelete : undefined} onAdd={(a) => { setDiscoverPrefill(a); pushHistory(); setView('add'); }} onRelationClick={handleOpenDetail} />;
    }
    if (view === 'add') return <AnimeForm prefillData={discoverPrefill} onSubmit={handleAdd} onCancel={handleBack} />;
    if (view === 'edit') return <AnimeForm initialData={animeList.find(a => a.id === selectedAnimeId)} onSubmit={handleEdit} onCancel={handleBack} />;
    if (view === 'profile') {
        const isSelf = session && !viewingProfile && session.user.id !== PREVIEW_SESSION.user.id;
        const profileData = viewingProfile ? { 
            username: viewingProfile.username, 
            avatar_url: viewingProfile.avatarUrl, 
            is_private: viewingProfile.isPrivate,
            hawkRating: viewingProfile.hawkRating,
            followersCount: viewingProfile.followersCount,
            animeCount: viewingProfile.animeCount,
            id: viewingProfile.id,
            last_username_change: (viewingProfile as any).last_username_change
        } : { 
            username: session?.user?.user_metadata?.username || 'HAWK_MEMBER', 
            avatar_url: session?.user?.user_metadata?.avatar_url || null,
            is_private: session?.user?.user_metadata?.is_private || false,
            id: session?.user?.id,
            last_username_change: session?.user?.user_metadata?.last_username_change
        };
        const isFollowing = viewingProfile ? bookmarkedFriends.some(f => f.id === viewingProfile.id) : false;

        return <ProfileView profile={profileData} animeList={viewingProfile ? MOCK_ANIME_FOR_OTHERS.slice(0, viewingProfile.animeCount) : animeList} onBack={handleBack} isOwnProfile={isSelf} isFollowing={isFollowing} onUpdateProfile={async (data) => {
            if (!session) return;
            const { error } = await supabase.auth.updateUser({ data });
            if (!error) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  setSession((prev: any) => ({ ...prev, user }));
                }
            }
        }} onFollow={() => {
            requireAuth(() => {
                if (viewingProfile) {
                    const friend: FriendUser = {
                        id: viewingProfile.id,
                        username: viewingProfile.username,
                        avatarUrl: viewingProfile.avatarUrl,
                        status: 'Online',
                        hawkRating: viewingProfile.hawkRating,
                        isPrivate: viewingProfile.isPrivate
                    };
                    setBookmarkedFriends(prev => prev.some(f => f.id === friend.id) ? prev.filter(f => f.id !== friend.id) : [...prev, friend]);
                }
            });
        }} onAnimeClick={(id) => { const list = viewingProfile ? MOCK_ANIME_FOR_OTHERS : animeList; const a = list.find(x => x.id === id); if (a) handleOpenDetail(a); }} />;
    }
    if (view === 'leaderboard') return <LeaderboardView entries={MOCK_LEADERBOARD} onBack={handleBack} onUserClick={(id) => { 
        const u = [...MOCK_LEADERBOARD, ...PREVIEW_BOTS].find(x => x.id === id); 
        if (u) { 
            pushHistory(); 
            setViewingProfile(u); 
            setView('profile'); 
        } 
    }} currentUser={session ? { username: session.user.user_metadata.username, avatarUrl: session.user.user_metadata.avatar_url, hawkRating: 0, animeCount: animeList.length, followersCount: 0 } : undefined} />;
    if (view === 'friends') return <FriendsView onBack={handleBack} bookmarkedFriends={bookmarkedFriends} onToggleBookmark={(u) => setBookmarkedFriends(prev => prev.some(f => f.id === u.id) ? prev.filter(f => f.id !== u.id) : [...prev, u])} onUserClick={(id) => { 
        const u = [...MOCK_LEADERBOARD, ...PREVIEW_BOTS].find(x => x.id === id);
        if (u) {
            pushHistory();
            setViewingProfile(u);
            setView('profile');
        }
    }} />;
    if (view === 'mal_import') return <MalImportView onBack={handleBack} currentList={animeList} onImport={async (u, w) => {}} />;
    if (view === 'faq') return <FAQsView onBack={handleBack} />;
    if (view === 'about') return (
      <div className="min-h-screen bg-hawk-base pb-32 text-white animate-fade-in">
        <div className="sticky top-0 z-30 bg-hawk-surface/90 backdrop-blur-md border-b border-hawk-gold/20 p-4 flex items-center gap-4">
          <button onClick={handleBack} className="p-2 text-hawk-textSecondary hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-bold text-hawk-gold uppercase tracking-[0.2em]">About Us</h1>
        </div>
        
        <div className="p-8 max-w-2xl mx-auto text-center space-y-8">
          <div className="w-24 h-24 mx-auto drop-shadow-[0_0_20px_rgba(255,163,26,0.3)]">
            <Logo />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-[0.2em]">Project HAWK</h2>
            <p className="text-white text-[13px] leading-relaxed font-normal text-justify">
              HAWK is a minimalist, completely ad-free anime watchlist tracker made for fans who want a clean, focused experience. No clutter, no ads, no distractions. Just your personal library, beautifully designed and packed with unique interactive features that make tracking your journey feel effortless and enjoyable. We are building a small, passionate community around high-end aesthetics and real functionality because your anime list deserves to look as good as the stories you love.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            <h3 className="text-[10px] font-black text-hawk-gold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
              <Wallet className="w-3.5 h-3.5" /> SUPPORTY DEV
            </h3>
            
            <div className="grid gap-4">
              <div className="bg-hawk-surface/50 p-6 rounded-[28px] border border-white/5 group transition-all hover:border-hawk-gold/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-hawk-gold font-black uppercase tracking-widest">BNB (BSC)</span>
                  <button onClick={() => copyToClipboard('0x7eAf6E9C0eAc83CA99c15053Ac0c05bBc40eFB62')} className="p-1.5 hover:text-hawk-gold transition-colors text-hawk-textMuted active:scale-90">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[10px] font-mono text-hawk-textPrimary text-left break-all select-all">0x7eAf6E9C0eAc83CA99c15053Ac0c05bBc40eFB62</div>
              </div>

              <div className="bg-hawk-surface/50 p-6 rounded-[28px] border border-white/5 group transition-all hover:border-hawk-gold/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-hawk-gold font-black uppercase tracking-widest">SOL (SOLANA)</span>
                  <button onClick={() => copyToClipboard('AxmAUY8Wkt9PEn5n7pgNYTr1f8k2W9WKMgxsf6YVLywx')} className="p-1.5 hover:text-hawk-gold transition-colors text-hawk-textMuted active:scale-90">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[10px] font-mono text-hawk-textPrimary text-left break-all select-all">AxmAUY8Wkt9PEn5n7pgNYTr1f8k2W9WKMgxsf6YVLywx</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            <h3 className="text-[10px] font-black text-hawk-gold uppercase tracking-[0.4em]">SOCIALS</h3>
            <a 
              href="https://discord.gg/QTcusKf5aj" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1e2039] hover:bg-blue-600 text-white rounded-full font-black uppercase tracking-[0.2em] text-[10px] transition-all transform active:scale-95 shadow-xl w-full sm:w-auto"
            >
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="leading-none">DISCORD SERVER</span>
            </a>
          </div>

          <p className="text-[10px] text-hawk-textMuted font-black uppercase tracking-[0.4em] pt-6">BETA V0.9.9</p>
        </div>
      </div>
    );
    
    if (activeBottomTab === 'discover') return <DiscoverView onAdd={(d) => requireAuth(() => { setDiscoverPrefill(d); pushHistory(); setView('add'); })} onPreview={handleOpenDetail} onMenuOpen={() => setShowMenu(true)} userAvatar={session?.user?.user_metadata?.avatar_url} onHomeClick={handleHomeClick} refreshKey={refreshKey} dbTotalCount={dbTotalCount} />;
    
    return (
      <div className="bg-hawk-base min-h-screen pb-24 animate-fade-in">
        <div className="sticky top-0 z-40 bg-hawk-surface/95 backdrop-blur-xl border-b border-hawk-ui transition-all">
          <div className="flex items-center justify-between h-16 px-6 relative">
             <button onClick={handleHomeClick} className="w-10 h-10 shrink-0 flex items-center justify-center hover:scale-105 transition-transform"><Logo /></button>
             <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                <h1 className="text-sm font-bold uppercase tracking-[0.4em] text-hawk-gold">H A W K</h1>
                <span className="text-[8px] font-bold text-hawk-textMuted uppercase tracking-[0.2em]">Anime Watchlist Tracker</span>
             </div>
             <div className="flex items-center gap-3">
                 <button onClick={() => setShowMenu(true)} className="relative group w-10 h-10">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,163,26,0.15)]">
                       <defs><clipPath id="avatarClipLib"><path d="M 15 35 L 55 15 L 95 45 L 65 55 L 55 85 L 35 60 L 10 50 Z" /></clipPath></defs>
                       <path d="M 15 35 L 55 15 L 95 45 L 65 55 L 55 85 L 35 60 L 10 50 Z" className="fill-hawk-ui stroke-hawk-goldDim/50 group-hover:stroke-hawk-gold transition-all duration-300" strokeWidth="5"/>
                       {session?.user?.user_metadata?.avatar_url ? (
                         <image href={session.user.user_metadata.avatar_url} width="100" height="100" preserveAspectRatio="xMidYMid slice" clipPath="url(#avatarClipLib)" />
                       ) : (
                         <g clipPath="url(#avatarClipLib)"><rect width="100" height="100" fill="#151515"/><path d="M50 45a15 15 0 100-30 15 15 0 000 30zm0 10c-20 0-35 15-35 15v5h70v-5s-15-15-35-15z" fill="#505050"/></g>
                       )}
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
                  placeholder="Search library..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className={`w-full bg-hawk-base/50 border border-hawk-ui focus:border-hawk-gold rounded-xl py-2 pl-9 pr-10 text-white placeholder-hawk-textMuted text-xs focus:outline-none transition-all shadow-inner h-9`} 
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-hawk-textMuted hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              <div className="relative shrink-0">
                <div className={`h-9 px-3 rounded-xl border flex items-center gap-2 bg-hawk-base/50 ${statusFilter !== 'All' ? 'border-hawk-gold text-hawk-gold' : 'border-hawk-ui text-hawk-textMuted'}`}>
                  <span className="text-[10px] font-bold uppercase truncate max-w-[60px]">
                    {statusFilter === 'All' ? 'all' : statusFilter.toLowerCase()}
                  </span>
                  <Filter className="w-3 h-3 shrink-0" />
                </div>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)} 
                  disabled={activeTab === 'watching'}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {activeTab === 'watching' ? (
                    <option value="Watching">Watching</option>
                  ) : activeTab === 'finished' ? (
                    ['All', 'Finished', 'Dropped'].map(s => <option key={s} value={s}>{s}</option>)
                  ) : (
                    ['All', 'Plan to Watch', 'On-Hold'].map(s => <option key={s} value={s}>{s}</option>)
                  )}
                </select>
              </div>

              <div className="relative shrink-0">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center bg-hawk-base/50 transition-colors ${sortBy !== 'newest' ? 'border-hawk-gold text-hawk-gold' : 'border-hawk-ui text-hawk-textMuted hover:text-white'}`}>
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="title">A-Z</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex px-4">
              {['ptw', 'finished', 'watching'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t as TabType)} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === t ? 'text-hawk-gold border-hawk-gold' : 'text-hawk-textMuted border-transparent'}`}>
                    {t === 'ptw' ? 'planned' : (t === 'finished' ? 'finished' : t)}
                  </button>
              ))}
          </div>
        </div>
        <div className="p-4 grid gap-4"> {filteredAnime.map(a => <AnimeCard key={a.id} anime={a} onClick={() => handleOpenDetail(a)} />)} </div>
        {session && session.user.id !== PREVIEW_SESSION.user.id && (
          <button onClick={() => requireAuth(() => { pushHistory(); setView('add'); })} className="fixed bottom-24 right-6 w-14 h-14 bg-hawk-gold rounded-full flex items-center justify-center text-black shadow-xl z-50"><Plus className="w-8 h-8" /></button>
        )}
      </div>
    );
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 animate-fade-in">
        <div className="w-32 h-32 drop-shadow-[0_0_20px_rgba(255,163,26,0.3)]"><Logo /></div>
        <Loader className="w-8 h-8 text-hawk-gold animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showAuth && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
           <Auth onBack={() => setShowAuth(false)} />
        </div>
      )}
      {showMenu && (
          <div className="fixed inset-0 z-[100] flex justify-end">
              <div className="absolute inset-0 bg-black/80" onClick={() => setShowMenu(false)} />
              <div className="relative w-64 bg-hawk-surface h-full border-l border-hawk-ui flex flex-col p-6 space-y-4 animate-slide-up">
                  <div className="flex items-center gap-4 mb-6">
                      {session?.user?.user_metadata?.avatar_url ? (
                        <img src={session.user.user_metadata.avatar_url} className="w-12 h-12 rounded-full border border-hawk-gold" />
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-hawk-gold bg-hawk-ui flex items-center justify-center"><User className="w-6 h-6 text-hawk-textMuted" /></div>
                      )}
                      <div className="font-bold text-white uppercase truncate">{session?.user?.user_metadata?.username || 'GUEST_USER'}</div>
                  </div>
                  <button onClick={() => { setShowMenu(false); pushHistory(); setView('profile'); }} className="text-left py-2 text-hawk-textSecondary hover:text-hawk-gold flex items-center gap-3 transition-colors"><User className="w-4 h-4" /> Profile</button>
                  <button onClick={() => { setShowMenu(false); requireAuth(() => { pushHistory(); setView('friends'); }); }} className="text-left py-2 text-hawk-textSecondary hover:text-hawk-gold flex items-center gap-3 transition-colors"><Users className="w-4 h-4" /> Find People</button>
                  <button onClick={() => { setShowMenu(false); pushHistory(); setView('leaderboard'); }} className="text-left py-2 text-hawk-textSecondary hover:text-hawk-gold flex items-center gap-3 transition-colors"><Trophy className="w-4 h-4" /> Leaderboard</button>
                  <button onClick={() => { setShowMenu(false); requireAuth(() => { pushHistory(); setView('mal_import'); }); }} className="text-left py-2 text-hawk-textSecondary hover:text-hawk-gold flex items-center gap-3 transition-colors"><ArrowDownToLine className="w-4 h-4" /> Import/Export</button>
                  <button onClick={() => { setShowMenu(false); pushHistory(); setView('faq'); }} className="text-left py-2 text-hawk-textSecondary hover:text-hawk-gold flex items-center gap-3 transition-colors"><HelpCircle className="w-4 h-4" /> FAQs</button>
                  <button onClick={() => { setShowMenu(false); pushHistory(); setView('about'); }} className="text-left py-2 text-hawk-textSecondary hover:text-hawk-gold flex items-center gap-3 transition-colors"><Info className="w-4 h-4" /> About Us</button>
                  <div className="flex-grow" />
                  {session && session.user.id !== PREVIEW_SESSION.user.id ? (
                    <button onClick={() => { localStorage.removeItem('hawk_debug_bypass'); supabase.auth.signOut(); }} className="text-left py-2 text-red-500 flex items-center gap-3 hover:opacity-70 transition-all"><LogOut className="w-4 h-4" /> Sign Out</button>
                  ) : (
                    <button onClick={() => { setShowMenu(false); setShowAuth(true); }} className="text-left py-2 text-hawk-gold flex items-center gap-3 hover:opacity-70 transition-all"><User className="w-4 h-4" /> Sign In</button>
                  )}
              </div>
          </div>
      )}
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader className="w-6 h-6 text-hawk-gold animate-spin" /></div>}>
        {renderContent()}
      </Suspense>
      {(view === 'list' || view === 'discover' || view === 'profile') && (
          <div className="fixed bottom-0 left-0 right-0 bg-hawk-surface/90 backdrop-blur-xl border-t border-hawk-ui p-4 flex justify-around items-center z-40">
              <button onClick={handleHomeClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeBottomTab === 'discover' ? 'text-hawk-gold scale-110' : 'text-hawk-textMuted opacity-60 hover:opacity-100'}`}>
                  <div className="relative">
                      <Compass className="w-6 h-6" />
                      <div className="absolute -top-3 -right-4 bg-hawk-gold text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-black shadow-lg">
                          {formatCount(dbTotalCount)}
                      </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">Discover</span>
              </button>
              <button onClick={() => requireAuth(() => { setActiveBottomTab('library'); setView('list'); })} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeBottomTab === 'library' ? 'text-hawk-gold scale-110' : 'text-hawk-textMuted opacity-60 hover:opacity-100'}`}>
                  <div className="relative">
                      <LayoutGrid className="w-6 h-6" />
                      <div className="absolute -top-3 -right-4 bg-hawk-gold text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-black shadow-lg">
                          {animeList.length}
                      </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">Library</span>
              </button>
          </div>
      )}
    </>
  );
};

export default App;
