
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
    
    // Edit Form State
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

    const filteredEntries = useMemo(() => {
        if (!selectedStatus) return [];
        return animeList.filter(a => a.status === selectedStatus);
    }, [animeList, selectedStatus]);

    const rankInfo = useMemo(() => {
        if (displayRating >= 1000) return { tag: 'HAWK CERTIFIED', color: 'text-red-500', glow: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]', tickColor: 'text-red-500' };
        if (displayRating >= 600) return { tag: 'ELITE', color: 'text-yellow-400', glow: 'drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]', tickColor: 'text-yellow-400' };
        if (displayRating >= 300) return { tag: 'VERIFIED', color: 'text-sky-400', glow: 'drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]', tickColor: 'text-sky-400' };
        return { tag: 'NEWBIE', color: 'text-gray-500', glow: '', tickColor: 'text-gray-500' };
    }, [displayRating]);

    const canChangeUsername = useMemo(() => {
        if (!profile.last_username_change) return true;
        const lastChange = new Date(profile.last_username_change).getTime();
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return lastChange < oneMonthAgo;
    }, [profile.last_username_change]);

    const handleSaveProfile = async () => {
        const cleanName = sanitize(editUsername);
        if (!validateUsername(cleanName)) {
            alert("Username must be 2-16 characters and only contain letters, numbers, and underscore (_).");
            return;
        }

        if (cleanName !== profile.username && !canChangeUsername) {
            alert("Username changes can only be made once in a month.");
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
            alert('Profile link copied to clipboard!');
        }).catch(() => {
            alert('Profile link: ' + profileUrl);
        });
    };

    const StatusCard = ({ status, label, icon: Icon, color }: { status: AnimeStatus, label: string, icon: any, color: string }) => {
        const count = calculatedStats.counts[status];
        const isActive = selectedStatus === status;
        
        return (
            <div className="space-y-4">
                <button 
                    onClick={() => setSelectedStatus(isActive ? null : status)}
                    className={`w-full flex items-center justify-between p-5 bg-hawk-ui/40 border rounded-[28px] transition-all duration-300 group ${
                        isActive ? 'border-hawk-gold bg-hawk-gold/5' : 'border-hawk-ui/60 hover:border-hawk-gold/30'
                    }`}
                >
                    <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-xl bg-hawk-base/60 shadow-inner ${isActive ? 'text-hawk-gold' : color}`}>
                            <Icon className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-hawk-gold' : 'text-white'}`}>
                            {label}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`text-xl font-black font-mono ${isActive ? 'text-hawk-gold' : 'text-white'}`}>{count}</span>
                        <ChevronDown className={`w-5 h-5 text-hawk-textMuted group-hover:text-hawk-gold transition-all duration-300 ${isActive ? 'rotate-180 text-hawk-gold' : ''}`} />
                    </div>
                </button>
                
                {isActive && (
                    <div className="grid gap-3 px-1 animate-slide-up">
                        {filteredEntries.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-hawk-ui rounded-[28px] opacity-40">
                                <p className="text-[10px] font-bold uppercase tracking-widest italic">No entries in this sector</p>
                            </div>
                        ) : (
                            filteredEntries.map(anime => (
                                <AnimeCard 
                                    key={anime.id} 
                                    anime={anime} 
                                    onClick={() => onAnimeClick?.(anime.id)} 
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-hawk-base pb-24 font-sans text-white relative overflow-x-hidden">
            <div className="sticky top-0 z-40 bg-hawk-surface/90 backdrop-blur-md border-b border-hawk-gold/20 p-4 flex items-center justify-between">
                <button onClick={onBack} className="p-2 text-hawk-textSecondary hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-sm font-bold text-hawk-gold uppercase tracking-[0.2em]">Profile</h1>
                <div className="flex items-center">
                    <button onClick={handleShare} className="p-2 text-hawk-gold hover:text-white transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                    {isOwnProfile && (
                        <button onClick={() => setIsEditing(true)} className="p-2 text-hawk-gold hover:text-white transition-colors">
                            <Edit3 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-4 border-hawk-gold p-1 shadow-[0_0_25px_rgba(255,163,26,0.3)] bg-hawk-surface overflow-hidden mb-8 relative">
                    <img 
                        src={profile.avatar_url || DEFAULT_AVATAR_PLACEHOLDER} 
                        alt={profile.username} 
                        className="w-full h-full rounded-full object-cover" 
                        referrerPolicy="no-referrer"
                    />
                </div>

                <div className="text-center mb-10 w-full flex flex-col items-center">
                    <h2 className={`text-2xl font-black italic uppercase tracking-wider mb-1 flex items-center justify-center gap-3 ${rankInfo.glow}`}>
                        {profile.username}
                        {rankInfo.tag !== 'NEWBIE' && <BadgeCheck className={`w-6 h-6 ${rankInfo.tickColor}`} />}
                        {profile.is_private && <Lock className="w-4 h-4 text-hawk-textMuted" />}
                    </h2>
                    <div className={`text-[10px] uppercase tracking-widest font-bold ${rankInfo.color} text-center`}>
                        {rankInfo.tag}
                    </div>
                </div>

                <div className="w-full max-w-sm space-y-6 mb-12">
                    <div className="bg-hawk-ui/20 border border-hawk-ui rounded-[32px] p-6 shadow-2xl">
                        <div className="grid grid-cols-3">
                            <div className="flex flex-col items-center border-r border-hawk-ui/40">
                                <div className="h-10 flex items-center justify-center mb-1">
                                    <span className="text-hawk-gold font-black text-2xl font-mono leading-none">{displayRating}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-hawk-textMuted uppercase font-bold tracking-widest h-5 text-center">
                                    <Trophy className="w-3 h-3 shrink-0" /> HAWK PTS
                                </div>
                            </div>
                            <div className="flex flex-col items-center border-r border-hawk-ui/40">
                                <div className="h-10 flex items-center justify-center mb-1">
                                    <span className="text-white font-black text-2xl font-mono leading-none">{displayFollowers}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-hawk-textMuted uppercase font-bold tracking-widest h-5 text-center">
                                    <Users className="w-3 h-3 shrink-0" /> CIRCLE
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-10 flex items-center justify-center mb-1">
                                    <span className="text-hawk-gold font-black text-2xl font-mono leading-none">{calculatedStats.meanScore}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-hawk-textMuted uppercase font-bold tracking-widest h-5 text-center">
                                    <Star className="w-3 h-3 shrink-0" /> MEAN
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-hawk-ui/20 border border-hawk-ui rounded-[32px] p-6 shadow-2xl">
                        <div className="grid grid-cols-3">
                            <div className="flex flex-col items-center border-r border-hawk-ui/40">
                                <div className="h-10 flex items-center justify-center mb-1">
                                    <span className="text-white font-black text-xl font-mono leading-none whitespace-nowrap">{calculatedStats.watchTimeStr}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-hawk-textMuted uppercase font-bold tracking-widest h-5 text-center">
                                    <Timer className="w-3 h-3 shrink-0" /> WATCH
                                </div>
                            </div>
                            <div className="flex flex-col items-center border-r border-hawk-ui/40">
                                <div className="h-10 flex items-center justify-center mb-1">
                                    <span className="text-white font-black text-[10px] uppercase tracking-widest leading-none truncate w-full text-center px-1">{calculatedStats.favGenre}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-hawk-textMuted uppercase font-bold tracking-widest h-5 text-center">
                                    <BarChart3 className="w-3 h-3 shrink-0" /> GENRE
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-10 flex items-center justify-center mb-1">
                                    <span className="text-white font-black text-2xl font-mono leading-none">{displayAnimeCount}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-hawk-textMuted uppercase font-bold tracking-widest h-5 text-center">
                                    <BookOpen className="w-3 h-3 shrink-0" /> LOG
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {!isOwnProfile && (
                    <button 
                        onClick={onFollow}
                        className={`w-full max-w-sm py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 mb-10 active:scale-95 shadow-lg ${
                            isFollowing ? 'bg-hawk-ui text-hawk-gold border border-hawk-gold/30' : 'bg-hawk-gold text-black'
                        }`}
                    >
                        {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                    </button>
                )}
            </div>

            <div className="px-6 space-y-4 mb-16">
                {profile.is_private && !isOwnProfile ? (
                    <div className="flex flex-col items-center py-24 bg-hawk-ui/10 border border-dashed border-hawk-ui rounded-[40px] animate-fade-in">
                        <Lock className="w-14 h-14 text-hawk-textMuted mb-4" />
                        <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-hawk-textMuted">Vault Locked</p>
                    </div>
                ) : (
                    <>
                        <StatusCard status={AnimeStatus.Watching} label="WATCHING" icon={Tv} color="text-yellow-400" />
                        <StatusCard status={AnimeStatus.Finished} label="FINISHED" icon={CheckCircle} color="text-emerald-400" />
                        <StatusCard status={AnimeStatus.PlanToWatch} label="PLAN TO WATCH" icon={Clock} color="text-sky-400" />
                        <StatusCard status={AnimeStatus.OnHold} label="ON-HOLD" icon={PauseCircle} color="text-zinc-400" />
                        <StatusCard status={AnimeStatus.Dropped} label="DROPPED" icon={XCircle} color="text-red-500" />
                    </>
                )}
            </div>

            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="relative w-full max-w-[340px] max-h-[90vh] bg-hawk-surface border border-hawk-gold/30 rounded-[32px] p-6 shadow-2xl overflow-y-auto scrollbar-hide">
                        <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 p-2 text-hawk-textMuted hover:text-white transition-colors z-10">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-black uppercase tracking-[0.2em] text-hawk-gold text-center mb-6 italic">Edit Profile</h3>
                        <div className="mb-8">
                            <div className="w-20 h-20 mx-auto rounded-full border-2 border-hawk-gold shadow-lg overflow-hidden mb-4 bg-hawk-ui">
                                {editAvatarUrl ? (
                                    <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <UserIcon className="w-8 h-8 text-hawk-textMuted" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[8px] uppercase tracking-[0.3em] text-hawk-textMuted text-center font-black mb-4 italic underline underline-offset-4">Avatars</p>
                            <div className="grid grid-cols-4 gap-3 px-1">
                                {PRESET_AVATARS.map((avatar) => (
                                    <button
                                        key={avatar.name}
                                        onClick={() => setEditAvatarUrl(avatar.url)}
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                            editAvatarUrl === avatar.url ? 'border-hawk-gold scale-110 shadow-[0_0_10px_rgba(255,163,26,0.3)]' : 'border-hawk-ui grayscale opacity-50 hover:opacity-100 hover:grayscale-0'
                                        }`}
                                    >
                                        <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mb-6 space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-hawk-textMuted">Username</label>
                                <span className={`text-[8px] font-black ${editUsername.length > 16 || editUsername.length < 2 ? 'text-red-500' : 'text-hawk-gold'}`}>
                                    {editUsername.length}/16
                                </span>
                            </div>
                            <input 
                                type="text" 
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                className="w-full bg-hawk-base border border-hawk-ui rounded-xl px-4 py-3 text-white font-black text-xs tracking-widest focus:border-hawk-gold focus:outline-none transition-all"
                                placeholder="USERNAME_X"
                            />
                            <div className="flex items-center gap-1 text-[7px] text-hawk-textMuted uppercase font-bold tracking-tighter mt-1 px-1">
                                <AlertCircle className="w-2 h-2" />
                                change can be made once in a month
                            </div>
                        </div>
                        <div className="flex items-center justify-between mb-8 p-4 bg-hawk-base/50 rounded-xl border border-hawk-ui">
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${editIsPrivate ? 'bg-hawk-gold/10 text-hawk-gold' : 'bg-hawk-ui text-hawk-textMuted'}`}>
                                    <Shield className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest">Privacy: {editIsPrivate ? 'Private' : 'Public'}</span>
                            </div>
                            <button 
                                onClick={() => setEditIsPrivate(!editIsPrivate)}
                                className={`w-10 h-5 rounded-full p-0.5 transition-all ${editIsPrivate ? 'bg-hawk-gold' : 'bg-hawk-ui'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-all ${editIsPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <button 
                            onClick={handleSaveProfile}
                            className="w-full bg-hawk-gold text-black font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-xl hover:bg-yellow-400 active:translate-y-[2px] transition-all text-[10px]"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
