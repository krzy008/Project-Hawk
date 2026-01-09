
import React, { useState, useMemo, useEffect } from 'react';
import { Anime, AnimeStatus } from '../types';
import { ChevronLeft, Lock, Tv, CheckCircle, Clock, PauseCircle, XCircle, ChevronDown, Star, Edit3, X, BadgeCheck, Share2, Users, Trophy, BookOpen, BarChart3, Timer, Save, Camera, Shield, UserPlus, UserCheck, AlertCircle, User as UserIcon } from 'lucide-react';
import { AnimeCard } from './AnimeCard';

const PRESET_AVATARS = [
    { name: 'Gojo Satoru', url: 'https://i.pinimg.com/736x/6a/cb/1d/6acb1de989feaafa0d2869b1f3cfd9e2.jpg' },
    { name: 'Makima', url: 'https://images3.alphacoders.com/133/1335950.png' },
    { name: 'Power', url: 'https://wallpapers.com/images/hd/all-anime-chainsaw-man-character-power-xar7575kzokbuyuv.jpg' },
    { name: 'Eren Yeager', url: 'https://wallpapers.com/images/hd/eren-yeager-pfp-with-bright-eyes-5yilum1awdhkr9zm.jpg' },
    { name: 'Monkey D. Luffy', url: 'https://w0.peakpx.com/wallpaper/261/829/HD-wallpaper-monkey-d-luffy-portrait-artwork-manga-one-piece.jpg' },
    { name: 'Guts (Berserk)', url: 'https://i.redd.it/jogiai9xdvs71.jpg' },
    { name: 'Naruto Uzumaki', url: 'https://wallpapers.com/images/hd/naruto-face-hpracgzord0mm3tv.jpg' },
    { name: 'Itachi Uchiha', url: 'https://wallpapers.com/images/hd/anime-profile-uchiha-itachi-e8pf79rfxlazjt3o.jpg' },
    { name: 'Kakashi Hatake', url: 'https://wallpapers-clan.com/wp-content/uploads/2024/05/naruto-kakashi-profile-portrait-desktop-wallpaper-cover.jpg' },
    { name: 'Zero Two', url: 'https://www.hdwallpapers.in/download/darling_in_the_franxx_pink_hair_green_eyes_zero_two_hd_anime-1600x900.jpg'},
    { name: 'Yor Forger', url: 'https://wallpapers.com/images/hd/yor-forger-p5yg9x6z183pb9n9.jpg'},
    { name: 'Thorfin', url: 'https://i.redd.it/s1-thorfinn-was-looking-so-cool-v0-pos6jzra2lhf1.jpg?width=861&format=pjpg&auto=webp&s=41248ef69241b3c4da6274c7e5831934342feeb6' },
];

const DEFAULT_AVATAR_PLACEHOLDER = "https://api.dicebear.com/9.x/shapes/svg?seed=hawk&backgroundColor=000000&shapeColor=FFA31A";

export interface UserProfile {
    username: string;
    avatar_url: string | null;
    email?: string;
    id?: string;
    is_private?: boolean;
    joined_at?: string;
    last_username_change?: string;
    hawkRating?: number;
    animeCount?: number;
    followersCount?: number;
}

interface ProfileViewProps {
    profile: UserProfile;
    animeList: Anime[];
    onBack: () => void;
    isOwnProfile: boolean;
    onAnimeClick?: (id: string) => void;
    onUpdateProfile?: (data: Partial<UserProfile>) => void;
    onFollow?: () => void;
    isFollowing?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, animeList, onBack, isOwnProfile, onAnimeClick, onUpdateProfile, onFollow, isFollowing }) => {
    const [selectedStatus, setSelectedStatus] = useState<AnimeStatus | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const [editUsername, setEditUsername] = useState(profile.username);
    const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatar_url);
    const [editIsPrivate, setEditIsPrivate] = useState(profile.is_private || false);

    const sanitize = (val: string) => val.replace(/[<>]/g, '').trim();

    useEffect(() => {
        if (isEditing) {
            setEditUsername(profile.username);
            setEditAvatarUrl(profile.avatar_url);
            setEditIsPrivate(profile.is_private || false);
        }
    }, [isEditing, profile]);

    const validateUsername = (name: string) => {
        const regex = /^[a-zA-Z0-9_]{2,16}$/;
        return regex.test(name);
    };

    const calculatedStats = useMemo(() => {
        const completedList = animeList.filter(a => a.status === AnimeStatus.Finished);
        const rated = completedList.filter(a => a.rating > 0);
        const meanScore = rated.length > 0 ? (rated.reduce((acc, curr) => acc + curr.rating, 0) / rated.length) : 0;
        
        const totalMinutes = completedList.reduce((acc, curr) => acc + ((curr.watched || 0) * (curr.duration || 24)), 0);
        const watchDays = totalMinutes / (24 * 60);
        const hawkPts = Math.floor(watchDays * meanScore);

        const totalWatchMinutes = animeList.reduce((acc, curr) => acc + ((curr.watched || 0) * (curr.duration || 24)), 0);
        const days = Math.floor(totalWatchMinutes / (24 * 60));
        const hours = Math.floor((totalWatchMinutes % (24 * 60)) / 60);
        const watchTimeStr = `${days}d ${hours}h`;

        const genreCounts: Record<string, number> = {};
        completedList.forEach(anime => {
            anime.genres?.forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        });
        const favGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'NONE';

        const counts = {
            [AnimeStatus.Watching]: animeList.filter(a => a.status === AnimeStatus.Watching).length,
            [AnimeStatus.Finished]: animeList.filter(a => a.status === AnimeStatus.Finished).length,
            [AnimeStatus.PlanToWatch]: animeList.filter(a => a.status === AnimeStatus.PlanToWatch).length,
            [AnimeStatus.OnHold]: animeList.filter(a => a.status === AnimeStatus.OnHold).length,
            [AnimeStatus.Dropped]: animeList.filter(a => a.status === AnimeStatus.Dropped).length,
        };

        return { 
            meanScore: meanScore.toFixed(1), 
            watchTimeStr, 
            favGenre: favGenre.toUpperCase(), 
            counts,
            hawkPts
        };
    }, [animeList]);

    const displayRating = isOwnProfile ? calculatedStats.hawkPts : (profile.hawkRating ?? 0);
    const displayFollowers = profile.followersCount ?? 0;
    const displayAnimeCount = profile.animeCount ?? animeList.length;

    const rankInfo = useMemo(() => {
        if (displayRating >= 1000) return { tag: 'HAWK CERTIFIED', color: 'text-red-500', glow: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]', tickColor: 'text-red-500' };
        if (displayRating >= 600) return { tag: 'ELITE', color: 'text-yellow-400', glow: 'drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]', tickColor: 'text-yellow-400' };
        if (displayRating >= 300) return { tag: 'VERIFIED', color: 'text-sky-400', glow: 'drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]', tickColor: 'text-sky-400' };
        return { tag: 'NEWBIE', color: 'text-gray-500', glow: '', tickColor: 'text-gray-500' };
    }, [displayRating]);

    const handleSaveProfile = async () => {
        const cleanName = sanitize(editUsername);
        if (!validateUsername(cleanName)) {
            alert("Username must be 2-16 chars (letters, numbers, underscore).");
            return;
        }

        if (onUpdateProfile) {
            const updateData: Partial<UserProfile> = {
                avatar_url: sanitize(editAvatarUrl || ''),
                is_private: editIsPrivate
            };
            if (cleanName !== profile.username) {
                updateData.username = cleanName;
                updateData.last_username_change = new Date().toISOString();
            }
            await onUpdateProfile(updateData);
        }
        setIsEditing(false);
    };

    const handleShare = () => {
        const profileUrl = `${window.location.origin}/profile/${profile.username}`;
        navigator.clipboard.writeText(profileUrl).then(() => {
            alert('Profile link copied!');
        });
    };

    const StatusCard = ({ status, label, icon: Icon, color }: { status: AnimeStatus, label: string, icon: any, color: string }) => {
        const count = calculatedStats.counts[status];
        const isActive = selectedStatus === status;
        const filteredEntries = animeList.filter(a => a.status === status);
        
        return (
            <div className="space-y-3 transition-all duration-500 ease-in-out">
                <button 
                    onClick={() => setSelectedStatus(isActive ? null : status)}
                    className={`w-full flex items-center justify-between p-4 bg-hawk-ui/40 border rounded-[20px] transition-all duration-300 group ${
                        isActive ? 'border-hawk-gold bg-hawk-gold/5' : 'border-hawk-ui/60 hover:border-hawk-gold/30'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl bg-hawk-base/60 shadow-inner ${isActive ? 'text-hawk-gold' : color}`}>
                            <Icon className="w-4 h-4" strokeWidth={2.5} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.25em] transition-colors ${isActive ? 'text-hawk-gold' : 'text-white'}`}>
                            {label}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-lg font-black font-mono leading-none ${isActive ? 'text-hawk-gold' : 'text-white'}`}>{count}</span>
                        <ChevronDown className={`w-4 h-4 text-hawk-textMuted group-hover:text-hawk-gold transition-all duration-300 ${isActive ? 'rotate-180 text-hawk-gold' : ''}`} />
                    </div>
                </button>
                
                <div className={`grid gap-3 px-0.5 overflow-hidden transition-all duration-500 ease-in-out ${isActive ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                    {filteredEntries.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-hawk-ui rounded-[20px] opacity-30">
                            <p className="text-[9px] font-bold uppercase tracking-widest italic">Sector Empty</p>
                        </div>
                    ) : (
                        filteredEntries.map(anime => (
                            <div key={anime.id} className="animate-slide-up transform-gpu">
                                <AnimeCard 
                                    anime={anime} 
                                    onClick={() => onAnimeClick?.(anime.id)} 
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-hawk-base pb-32 font-sans text-white relative overflow-x-hidden">
            <div className="sticky top-0 z-40 bg-hawk-surface/90 backdrop-blur-xl border-b border-hawk-gold/20 p-4 flex items-center justify-between">
                <button onClick={onBack} className="p-2 text-hawk-textSecondary hover:text-white transition-colors active:scale-90">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-[10px] font-black text-hawk-gold uppercase tracking-[0.4em] italic">Profile</h1>
                <div className="flex items-center gap-1">
                    <button onClick={handleShare} className="p-2 text-hawk-gold hover:text-white transition-colors active:scale-90">
                        <Share2 className="w-5 h-5" />
                    </button>
                    {isOwnProfile && (
                        <button onClick={() => setIsEditing(true)} className="p-2 text-hawk-gold hover:text-white transition-colors active:scale-90">
                            <Edit3 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 flex flex-col items-center">
                <div className="w-28 h-28 rounded-full border-2 border-hawk-gold p-1.5 shadow-[0_0_20px_rgba(255,163,26,0.2)] bg-hawk-surface overflow-hidden mb-6 relative group transition-all duration-500 hover:scale-105">
                    <img 
                        src={profile.avatar_url || DEFAULT_AVATAR_PLACEHOLDER} 
                        alt={profile.username} 
                        className="w-full h-full rounded-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" 
                        referrerPolicy="no-referrer"
                    />
                </div>

                <div className="text-center mb-8 w-full flex flex-col items-center">
                    <h2 className={`text-xl font-black italic uppercase tracking-widest mb-1 flex items-center justify-center gap-2 ${rankInfo.glow}`}>
                        {profile.username}
                        {rankInfo.tag !== 'NEWBIE' && <BadgeCheck className={`w-5 h-5 ${rankInfo.tickColor}`} />}
                        {profile.is_private && <Lock className="w-3.5 h-3.5 text-hawk-textMuted" />}
                    </h2>
                    <div className={`text-[8px] uppercase tracking-[0.4em] font-black ${rankInfo.color} text-center`}>
                        {rankInfo.tag}
                    </div>
                </div>

                <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-hawk-ui/20 border border-hawk-ui/60 rounded-[24px] p-5 shadow-xl flex flex-col items-center">
                        <div className="text-hawk-gold font-black text-2xl font-mono leading-none mb-2">{displayRating}</div>
                        <div className="flex items-center gap-1.5 text-[8px] text-hawk-textMuted uppercase font-black tracking-[0.2em]">
                            <Trophy className="w-3 h-3" /> Hawk Pts
                        </div>
                    </div>
                    <div className="bg-hawk-ui/20 border border-hawk-ui/60 rounded-[24px] p-5 shadow-xl flex flex-col items-center">
                        <div className="text-white font-black text-2xl font-mono leading-none mb-2">{displayFollowers}</div>
                        <div className="flex items-center gap-1.5 text-[8px] text-hawk-textMuted uppercase font-black tracking-[0.2em]">
                            <Users className="w-3 h-3" /> Circle
                        </div>
                    </div>
                    <div className="bg-hawk-ui/20 border border-hawk-ui/60 rounded-[24px] p-5 shadow-xl flex flex-col items-center">
                        <div className="text-white font-black text-xl font-mono leading-none mb-2">{calculatedStats.watchTimeStr}</div>
                        <div className="flex items-center gap-1.5 text-[8px] text-hawk-textMuted uppercase font-black tracking-[0.2em]">
                            <Timer className="w-3 h-3" /> Watch
                        </div>
                    </div>
                    <div className="bg-hawk-ui/20 border border-hawk-ui/60 rounded-[24px] p-5 shadow-xl flex flex-col items-center">
                        <div className="text-hawk-gold font-black text-2xl font-mono leading-none mb-2">{calculatedStats.meanScore}</div>
                        <div className="flex items-center gap-1.5 text-[8px] text-hawk-textMuted uppercase font-black tracking-[0.2em]">
                            <Star className="w-3 h-3" /> Mean
                        </div>
                    </div>
                </div>

                {!isOwnProfile && (
                    <button 
                        onClick={onFollow}
                        className={`w-full max-w-sm py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 mb-8 active:scale-95 shadow-lg border border-transparent ${
                            isFollowing ? 'bg-hawk-ui text-hawk-gold border-hawk-gold/30' : 'bg-hawk-gold text-black hover:bg-white'
                        }`}
                    >
                        {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                )}
            </div>

            <div className="px-6 space-y-4 mb-20">
                {profile.is_private && !isOwnProfile ? (
                    <div className="flex flex-col items-center py-20 bg-hawk-ui/10 border border-dashed border-hawk-ui/40 rounded-[32px] animate-fade-in">
                        <Lock className="w-12 h-12 text-hawk-textMuted mb-3" />
                        <p className="text-[8px] uppercase font-black tracking-[0.4em] text-hawk-textMuted">Private Access Only</p>
                    </div>
                ) : (
                    <>
                        <StatusCard status={AnimeStatus.Watching} label="Watching" icon={Tv} color="text-yellow-400" />
                        <StatusCard status={AnimeStatus.Finished} label="Finished" icon={CheckCircle} color="text-emerald-400" />
                        <StatusCard status={AnimeStatus.PlanToWatch} label="Planned" icon={Clock} color="text-sky-400" />
                        <StatusCard status={AnimeStatus.OnHold} label="On-Hold" icon={PauseCircle} color="text-zinc-400" />
                        <StatusCard status={AnimeStatus.Dropped} label="Dropped" icon={XCircle} color="text-red-500" />
                    </>
                )}
            </div>

            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
                    <div className="relative w-full max-w-[320px] max-h-[85vh] bg-hawk-surface border border-hawk-gold/30 rounded-[28px] p-6 shadow-2xl overflow-y-auto scrollbar-hide">
                        <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 p-2 text-hawk-textMuted hover:text-white transition-colors z-10">
                            <X className="w-4 h-4" />
                        </button>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-hawk-gold text-center mb-6 italic">Member Edit</h3>
                        <div className="mb-6">
                            <div className="w-16 h-16 mx-auto rounded-full border border-hawk-gold shadow-lg overflow-hidden mb-4 bg-hawk-ui">
                                {editAvatarUrl ? (
                                    <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-hawk-textMuted" />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_AVATARS.slice(0, 8).map((avatar) => (
                                    <button
                                        key={avatar.name}
                                        onClick={() => setEditAvatarUrl(avatar.url)}
                                        className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                                            editAvatarUrl === avatar.url ? 'border-hawk-gold scale-105' : 'border-hawk-ui/50 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
                                        }`}
                                    >
                                        <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mb-5 space-y-1.5">
                            <label className="text-[7px] font-black uppercase tracking-[0.3em] text-hawk-textMuted pl-1">Handle</label>
                            <input 
                                type="text" 
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                className="w-full bg-hawk-base border border-hawk-ui rounded-xl px-4 py-3 text-white font-black text-[10px] tracking-widest focus:border-hawk-gold focus:outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center justify-between mb-8 p-3 bg-hawk-base/50 rounded-xl border border-hawk-ui">
                            <span className="text-[8px] font-black uppercase tracking-widest">Vault: {editIsPrivate ? 'Private' : 'Public'}</span>
                            <button 
                                onClick={() => setEditIsPrivate(!editIsPrivate)}
                                className={`w-9 h-4.5 rounded-full p-0.5 transition-all ${editIsPrivate ? 'bg-hawk-gold' : 'bg-hawk-ui'}`}
                            >
                                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-all ${editIsPrivate ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <button 
                            onClick={handleSaveProfile}
                            className="w-full bg-hawk-gold text-black font-black uppercase tracking-[0.3em] py-3.5 rounded-xl shadow-xl hover:bg-white active:scale-95 transition-all text-[9px]"
                        >
                            Confirm Sync
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
