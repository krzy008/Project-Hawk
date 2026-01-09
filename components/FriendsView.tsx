
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, UserPlus, UserCheck, Users, Bookmark, BadgeCheck, Lock, X } from 'lucide-react';
import { PREVIEW_BOTS, LeaderboardEntry } from './LeaderboardView';
import { supabase } from '../lib/supabase';

export interface FriendUser {
    id: string;
    username: string;
    avatarUrl: string;
    status: string;
    hawkRating: number;
    isPrivate?: boolean;
}

interface FriendsViewProps {
    onBack: () => void;
    bookmarkedFriends: FriendUser[];
    onToggleBookmark: (user: FriendUser) => void;
    onUserClick?: (userId: string) => void;
}

const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/shapes/svg?seed=hawk&backgroundColor=000000&shapeColor=FFA31A";

export const FriendsView: React.FC<FriendsViewProps> = ({ onBack, bookmarkedFriends, onToggleBookmark, onUserClick }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LeaderboardEntry[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) {
            setResults([]);
            return;
        }
        
        setIsSearching(true);
        
        // Simulation delay for realism
        await new Promise(resolve => setTimeout(resolve, 400));

        // 1. Search mock bots (Preview Mode)
        const lowerQuery = query.toLowerCase();
        const botResults = PREVIEW_BOTS.filter(bot => 
            bot.username.toLowerCase().includes(lowerQuery)
        );

        // 2. Real search (If you have a users table in Supabase)
        // In a real production app, you'd do:
        // const { data } = await supabase.from('profiles').select('*').ilike('username', `%${query}%`).limit(10);
        
        setResults(botResults);
        setIsSearching(false);
    };

    // Auto-search on typing
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const isBookmarked = (id: string) => bookmarkedFriends.some(f => f.id === id);

    const renderUserRow = (user: LeaderboardEntry) => {
        const pts = user.hawkRating;
        let badgeColor = "text-gray-500";
        let glowClass = "";
        
        if (pts >= 1000) {
          badgeColor = "text-red-500";
          glowClass = "drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]";
        } else if (pts >= 600) {
          badgeColor = "text-yellow-400";
          glowClass = "drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]";
        } else if (pts >= 300) {
          badgeColor = "text-sky-400";
          glowClass = "drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]";
        }

        return (
            <div key={user.id} className="flex items-center justify-between p-3 bg-hawk-surface border border-hawk-ui rounded-2xl group hover:border-hawk-gold/30 transition-all">
                <button 
                    onClick={() => onUserClick?.(user.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                >
                    <div className="w-10 h-10 rounded-full border border-hawk-ui overflow-hidden group-hover:border-hawk-gold transition-colors relative bg-black">
                        <img 
                            src={user.avatarUrl || DEFAULT_AVATAR} 
                            alt={user.username} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-hawk-gold transition-colors">
                            {user.username}
                            {user.isPrivate && <Lock className="w-3 h-3 text-hawk-textMuted" />}
                            <BadgeCheck className={`w-3.5 h-3.5 ${badgeColor} ${glowClass}`} />
                        </div>
                        <div className="text-[10px] text-hawk-textMuted font-mono">
                            {pts.toFixed(1)} Hawk Pts • {user.animeCount} Entries
                        </div>
                    </div>
                </button>
                <button 
                    onClick={() => onToggleBookmark({
                        id: user.id,
                        username: user.username,
                        avatarUrl: user.avatarUrl,
                        status: 'Online',
                        hawkRating: user.hawkRating,
                        isPrivate: user.isPrivate
                    })}
                    className={`p-2 rounded-full transition-all ${isBookmarked(user.id) ? 'bg-hawk-gold text-black' : 'bg-hawk-ui text-hawk-textSecondary hover:text-white'}`}
                >
                    {isBookmarked(user.id) ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-hawk-base pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-hawk-surface/90 backdrop-blur-md border-b border-hawk-goldDim/30 p-4 shadow-lg shadow-black/40 flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 text-hawk-textSecondary hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-hawk-gold" />
                    <h1 className="text-sm font-bold text-hawk-gold uppercase tracking-[0.2em]">Find People</h1>
                </div>
            </div>

            <div className="p-4 max-w-3xl mx-auto space-y-8">
                {/* Search Section */}
                <div>
                    <form onSubmit={handleSearch} className="relative w-full mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-hawk-textMuted w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search by username..." 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-hawk-surface border border-hawk-ui rounded-full py-3 pl-11 pr-11 text-white focus:outline-none focus:border-hawk-gold placeholder-hawk-textMuted text-sm font-medium transition-all shadow-inner"
                        />
                        {query && (
                          <button 
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-hawk-textMuted hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                    </form>

                    {isSearching ? (
                        <div className="text-center py-8 text-hawk-textMuted text-[10px] uppercase tracking-[0.4em] animate-pulse">
                            Scanning Hawk Network...
                        </div>
                    ) : query && results.length === 0 ? (
                        <div className="text-center py-8 text-hawk-textMuted text-[10px] uppercase tracking-widest">
                            No users found for "{query}"
                        </div>
                    ) : results.length > 0 && (
                        <div className="space-y-3 animate-fade-in">
                             <h2 className="text-[10px] font-bold text-hawk-textMuted uppercase tracking-[0.2em] mb-3 px-1">Search Results</h2>
                             {results.map(user => renderUserRow(user))}
                        </div>
                    )}
                </div>

                {/* Following Section */}
                {!query && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-4 border-b border-hawk-ui pb-2">
                            <Bookmark className="w-4 h-4 text-hawk-gold" />
                            <h2 className="text-[10px] font-bold text-hawk-gold uppercase tracking-[0.2em]">Following</h2>
                        </div>

                        {bookmarkedFriends.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-hawk-ui/40 rounded-3xl text-hawk-textMuted text-[10px] uppercase tracking-[0.3em] font-bold">
                                Your circle is empty
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {bookmarkedFriends.map(friend => renderUserRow({
                                    id: friend.id,
                                    username: friend.username,
                                    avatarUrl: friend.avatarUrl,
                                    hawkRating: friend.hawkRating,
                                    animeCount: 0, // Placeholder
                                    rank: 0,
                                    isPrivate: friend.isPrivate
                                }))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
