
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, ChevronLeft, ChevronRight, BadgeCheck, Lock } from 'lucide-react';

export interface LeaderboardEntry {
  id: string;
  // Fix: Allow rank to be a string for special cases like '---' when user is not ranked
  rank: number | string;
  username: string;
  avatarUrl: string;
  hawkRating: number;
  animeCount: number;
  followersCount?: number;
  isPrivate?: boolean;
  joinedAt?: string;
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  // Fix: Changed from void to () => void to allow passing a function as a prop.
  onBack: () => void;
  onUserClick: (userId: string) => void;
  currentUser?: {
    username: string;
    avatarUrl: string;
    hawkRating: number;
    animeCount: number;
    followersCount: number;
  };
}

type RankingTab = 'hawk' | 'followers';

const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/shapes/svg?seed=hawk&backgroundColor=000000&shapeColor=FFA31A";

// Varied and Logical Mock Bot Accounts (Expanded to 50 for realistic testing)
export const PREVIEW_BOTS: LeaderboardEntry[] = [
  { id: 'bot-1', rank: 0, username: 'Zenith', avatarUrl: 'https://i.pinimg.com/736x/6a/cb/1d/6acb1de989feaafa0d2869b1f3cfd9e2.jpg', hawkRating: 1450.5, animeCount: 1620, followersCount: 12400, isPrivate: false },
  { id: 'bot-2', rank: 0, username: 'KaoriVibes', avatarUrl: 'https://images3.alphacoders.com/133/1335950.png', hawkRating: 1240.2, animeCount: 1100, followersCount: 8500, isPrivate: false },
  { id: 'bot-3', rank: 0, username: 'GhostInShell', avatarUrl: 'https://wallpapers.com/images/hd/all-anime-chainsaw-man-character-power-xar7575kzokbuyuv.jpg', hawkRating: 1100.0, animeCount: 850, followersCount: 3100, isPrivate: true },
  { id: 'bot-4', rank: 0, username: 'LuffyFan99', avatarUrl: 'https://w0.peakpx.com/wallpaper/261/829/HD-wallpaper-monkey-d-luffy-portrait-artwork-manga-one-piece.jpg', hawkRating: 1050.5, animeCount: 1250, followersCount: 2200, isPrivate: false },
  { id: 'bot-5', rank: 0, username: 'ThorfinnThirst', avatarUrl: 'https://wallpapers.com/images/hd/eren-yeager-pfp-with-bright-eyes-5yilum1awdhkr9zm.jpg', hawkRating: 980.4, animeCount: 1100, followersCount: 3500, isPrivate: false },
  { id: 'bot-6', rank: 0, username: 'AnimeLord', avatarUrl: 'https://wallpapers.com/images/hd/naruto-face-hpracgzord0mm3tv.jpg', hawkRating: 890.2, animeCount: 980, followersCount: 3850, isPrivate: false },
  { id: 'bot-7', rank: 0, username: 'BerserkBeast', avatarUrl: 'https://i.redd.it/jogiai9xdvs71.jpg', hawkRating: 750.1, animeCount: 840, followersCount: 1100, isPrivate: false },
  { id: 'bot-8', rank: 0, username: 'MakimaSimp', avatarUrl: 'https://images3.alphacoders.com/133/1335950.png', hawkRating: 720.0, animeCount: 810, followersCount: 3100, isPrivate: true },
  { id: 'bot-9', rank: 0, username: 'IchigoBankai', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=ichigo&backgroundColor=000000', hawkRating: 680.7, animeCount: 750, followersCount: 720, isPrivate: true },
  { id: 'bot-10', rank: 0, username: 'NeoNexus', avatarUrl: 'https://www.hdwallpapers.in/download/darling_in_the_franxx_pink_hair_green_eyes_zero_two_hd_anime-1600x900.jpg', hawkRating: 610.9, animeCount: 700, followersCount: 530, isPrivate: false },
  // 11-20 (VERIFIED & ELITE)
  { id: 'bot-11', rank: 0, username: 'VashTheStampede', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=vash', hawkRating: 590.0, animeCount: 650, followersCount: 400, isPrivate: false },
  { id: 'bot-12', rank: 0, username: 'SpikeSpiegel', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=spike', hawkRating: 550.8, animeCount: 610, followersCount: 440, isPrivate: false },
  { id: 'bot-13', rank: 0, username: 'Yusuke_Urameshi', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=yusuke', hawkRating: 480.5, animeCount: 550, followersCount: 1200, isPrivate: false },
  { id: 'bot-14', rank: 0, username: 'GonFreecss', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=gon', hawkRating: 420.2, animeCount: 480, followersCount: 300, isPrivate: true },
  { id: 'bot-15', rank: 0, username: 'KilluaZoldyck', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=killua', hawkRating: 395.0, animeCount: 450, followersCount: 280, isPrivate: false },
  { id: 'bot-16', rank: 0, username: 'ZoroLost', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=zoro', hawkRating: 350.2, animeCount: 420, followersCount: 950, isPrivate: false },
  { id: 'bot-17', rank: 0, username: 'SanjiCook', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=sanji', hawkRating: 320.4, animeCount: 380, followersCount: 180, isPrivate: false },
  { id: 'bot-18', rank: 0, username: 'NamiBeli', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=nami', hawkRating: 310.1, animeCount: 350, followersCount: 120, isPrivate: true },
  { id: 'bot-19', rank: 0, username: 'RobinPoneglyph', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=robin', hawkRating: 305.5, animeCount: 320, followersCount: 150, isPrivate: false },
  { id: 'bot-20', rank: 0, username: 'BrookBones', avatarUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=brook', hawkRating: 301.2, animeCount: 310, followersCount: 90, isPrivate: false },
  // 21-50 (NEWBIES & VERIFIED)
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `bot-${i + 21}`,
    rank: 0,
    username: `User_Fan_${i + 21}`,
    avatarUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=bot${i + 21}&backgroundColor=000000`,
    hawkRating: 290 - (i * 8),
    animeCount: 200 - (i * 5),
    followersCount: Math.floor(100 - (i * 2)),
    isPrivate: (i + 21) % 4 === 0
  }))
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ entries, onBack, onUserClick, currentUser }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>('hawk');

  useEffect(() => {
    console.log('Preview mode - using top 50 leaderboard simulation');
  }, []);

  const top50List = useMemo(() => {
    // Merge real entries with mock bots to ensure a full list of 50
    const combined = [...entries];
    PREVIEW_BOTS.forEach(bot => {
      if (!combined.some(e => e.username === bot.username)) {
        combined.push(bot);
      }
    });

    const sorted = combined.sort((a, b) => {
      if (activeTab === 'hawk') return b.hawkRating - a.hawkRating;
      return (b.followersCount || 0) - (a.followersCount || 0);
    });

    return sorted.slice(0, 50).map((e, i) => ({ ...e, rank: i + 1 }));
  }, [entries, activeTab]);

  const userRank = useMemo(() => {
    if (!currentUser) return 0;
    const foundIdx = top50List.findIndex(e => e.username === currentUser.username);
    return foundIdx !== -1 ? foundIdx + 1 : 0;
  }, [currentUser, top50List]);

  const renderEntry = (entry: LeaderboardEntry, isUser: boolean = false) => {
    const pts = entry.hawkRating;
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
      <button
        key={entry.id}
        onClick={() => onUserClick(entry.id)}
        className={`w-full flex items-center justify-between p-4 bg-hawk-surface border rounded-2xl group transition-all duration-300 hover:translate-x-1 ${
          isUser ? 'border-hawk-gold bg-hawk-gold/10 shadow-[0_0_20px_rgba(255,163,26,0.1)]' : 'border-hawk-ui hover:border-hawk-gold/50'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm italic ${
            entry.rank === 1 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' :
            entry.rank === 2 ? 'text-zinc-300' :
            entry.rank === 3 ? 'text-amber-700' :
            'text-hawk-textMuted'
          }`}>
            #{entry.rank}
          </div>
          
          <div className="w-10 h-10 rounded-full border border-hawk-ui overflow-hidden group-hover:border-hawk-gold transition-colors relative bg-black">
            <img 
              src={entry.avatarUrl || DEFAULT_AVATAR} 
              alt={entry.username} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
            {/* Fix: Check for 'number' type before using numeric comparison operators on rank */}
            {typeof entry.rank === 'number' && entry.rank <= 3 && (
              <div className="absolute inset-0 border-2 border-hawk-gold rounded-full opacity-50"></div>
            )}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-hawk-gold transition-colors">
              {entry.username}
              {entry.isPrivate && <Lock className="w-3 h-3 text-hawk-textMuted" />}
              <BadgeCheck className={`w-3.5 h-3.5 ${badgeColor} ${glowClass}`} />
            </div>
            <div className="text-[10px] text-hawk-textMuted font-mono">
              {entry.animeCount} Entries
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-hawk-gold font-mono tracking-wider">
              {activeTab === 'hawk' ? entry.hawkRating.toFixed(1) : (entry.followersCount || 0)}
            </div>
            <div className="text-[9px] text-hawk-textSecondary uppercase tracking-wider">
              {activeTab === 'hawk' ? 'Rating' : 'Followers'}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-hawk-ui group-hover:text-hawk-gold transition-colors" />
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-hawk-base flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-hawk-surface/95 backdrop-blur-md border-b border-hawk-goldDim/30 shadow-lg shadow-black/40">
        <div className="p-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 text-hawk-textSecondary hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-hawk-gold" />
              <h1 className="text-sm font-bold text-hawk-gold uppercase tracking-[0.2em]">Global Ranking</h1>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex px-4 pb-2 gap-2">
          <button 
            onClick={() => setActiveTab('hawk')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
              activeTab === 'hawk' ? 'bg-hawk-gold text-black border-hawk-gold' : 'text-hawk-textMuted border-hawk-ui hover:border-hawk-gold/30'
            }`}
          >
            Hawk pts
          </button>
          <button 
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
              activeTab === 'followers' ? 'bg-hawk-gold text-black border-hawk-gold' : 'text-hawk-textMuted border-hawk-ui hover:border-hawk-gold/30'
            }`}
          >
            Follower
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-3xl mx-auto w-full pb-32">
        <div className="space-y-3 pt-2">
          {top50List.map((entry) => renderEntry(entry))}
        </div>
      </div>

      {/* Sticky Your Rank Row */}
      {currentUser && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-hawk-base via-hawk-surface/95 to-hawk-surface/90 backdrop-blur-xl p-4 flex justify-center shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
          <div className="max-w-3xl w-full">
            {renderEntry({
              id: 'current-user',
              // Fix: Assigning rank correctly as string | number based on current user ranking
              rank: userRank || '---',
              username: currentUser.username,
              avatarUrl: currentUser.avatarUrl,
              hawkRating: currentUser.hawkRating,
              animeCount: currentUser.animeCount,
              followersCount: currentUser.followersCount,
            }, true)}
          </div>
        </div>
      )}
    </div>
  );
};
