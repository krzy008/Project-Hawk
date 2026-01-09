
import React, { useState, useMemo, useEffect } from 'react';
import { Anime, AnimeStatus } from '../types';
import { ChevronLeft, Lock, Tv, CheckCircle, Clock, PauseCircle, XCircle, ChevronDown, Star, Edit3, X, BadgeCheck, Share2, Users, Trophy, BookOpen, BarChart3, Timer, Save, Camera, Shield, UserPlus, UserCheck, AlertCircle, User as UserIcon } from 'lucide-react';
import { AnimeCard } from './AnimeCard';

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

    const calculatedStats = useMemo(() => {
        const rated = animeList.filter(a => a.rating > 0);
        const meanScoreNum = rated.length > 0 ? (rated.reduce((acc, curr) => acc + (curr.rating || 0), 0) / rated.length) : 0;
        
        // Use duration from anime if available, otherwise default to 24 mins
        const totalMinutes = animeList.reduce((acc, curr) => acc + ((curr.watched || 0) * (curr.duration || 24)), 0);
        const watchDays = totalMinutes / 1440;
        
        // HAWK POINT FORMULA: Days Watched * Mean Score
        const hawkPts = Number((watchDays * meanScoreNum).toFixed(1));

        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const watchTimeStr = `${days}d ${hours}h`;

        const counts = {
            [AnimeStatus.Watching]: animeList.filter(a => a.status === AnimeStatus.Watching).length,
            [AnimeStatus.Finished]: animeList.filter(a => a.status === AnimeStatus.Finished).length,
            [AnimeStatus.PlanToWatch]: animeList.filter(a => a.status === AnimeStatus.PlanToWatch).length,
            [AnimeStatus.OnHold]: animeList.filter(a => a.status === AnimeStatus.OnHold).length,
            [AnimeStatus.Dropped]: animeList.filter(a => a.status === AnimeStatus.Dropped).length,
        };

        return { meanScore: meanScoreNum.toFixed(1), watchTimeStr, counts, hawkPts };
    }, [animeList]);

    const handleSaveProfile = async () => {
        if (onUpdateProfile) {
            await onUpdateProfile({
                username: editUsername,
                avatar_url: editAvatarUrl,
                is_private: editIsPrivate
            });
        }
        setIsEditing(false);
    };

    const StatusCard = ({ status, label, icon: Icon, color }: { status: AnimeStatus, label: string, icon: any, color: string }) => {
        const count = calculatedStats.counts[status];
        const isActive = selectedStatus === status;
        const filteredEntries = animeList.filter(a => a.status === status);
        
        return (
            <div className="space-y-3">
                <button onClick={() => setSelectedStatus(isActive ? null : status)} className={`w-full flex items-center justify-between p-4 bg-hawk-ui/40 border rounded-[20px] transition-all group ${isActive ? 'border-hawk-gold bg-hawk-gold/5' : 'border-hawk-ui/60 hover:border-hawk-gold/30'}`}>
                    <div className="flex items-center gap-4"><div className={`p-2.5 rounded-xl bg-hawk-base/60 ${isActive ? 'text-hawk-gold' : color}`}><Icon className="w-4 h-4" /></div><span className={`text-[10px] font-black uppercase tracking-[0.25em] ${isActive ? 'text-hawk-gold' : 'text-white'}`}>{label}</span></div>
                    <div className="flex items-center gap-3"><span className={`text-lg font-black font-mono ${isActive ? 'text-hawk-gold' : 'text-white'}`}>{count}</span><ChevronDown className={`w-4 h-4 text-hawk-textMuted transition-all ${isActive ? 'rotate-180 text-hawk-gold' : ''}`} /></div>
                </button>
                <div className={`grid gap-3 overflow-hidden transition-all duration-500 ${isActive ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                    {filteredEntries.map(anime => <div key={anime.id} className="animate-slide-up"><AnimeCard anime={anime} onClick={() => onAnimeClick?.(anime.id)} /></div>)}
                </div>
            </div>
        );
    };

    const displayRating = isOwnProfile ? calculatedStats.hawkPts : (profile.hawkRating || 0);
    const displayMean = isOwnProfile ? calculatedStats.meanScore : (profile.hawkRating ? (profile.hawkRating / (animeList.length || 1)).toFixed(1) : '0.0');

    const rankInfo = useMemo(() => {
        if (displayRating >= 1000) return { tag: 'HAWK CERTIFIED', color: 'text-red-500', glow: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]' };
        if (displayRating >= 600) return { tag: 'ELITE', color: 'text-yellow-400', glow: 'drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]' };
        if (displayRating >= 300) return { tag: 'VERIFIED', color: 'text-sky-400', glow: 'drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]' };
        return { tag: 'NEWBIE', color: 'text-gray-500', glow: '' };
    }, [displayRating]);

    return (
        <div className="min-h-screen bg-hawk-base pb-32 font-sans text-white">
            <div className="sticky top-0 z-40 bg-hawk-surface/90 backdrop-blur-xl border-b border-hawk-gold/20 p-4 flex items-center justify-between"><button onClick={onBack} className="p-2 text-hawk-textSecondary hover:text-white"><ChevronLeft className="w-6 h-6" /></button><h1 className="text-[10px] font-black text-hawk-gold uppercase tracking-[0.4em]">Profile</h1><div className="flex items-center gap-1"><button onClick={() => alert('Copied!')} className="p-2 text-hawk-gold"><Share2 className="w-5 h-5" /></button>{isOwnProfile && <button onClick={() => setIsEditing(true)} className="p-2 text-hawk-gold"><Edit3 className="w-5 h-5" /></button>}</div></div>
            <div className="p-6 flex flex-col items-center">
                <div className="w-28 h-28 rounded-full border-2 border-hawk-gold p-1.5 shadow-2xl bg-hawk-surface overflow-hidden mb-6"><img src={profile.avatar_url || DEFAULT_AVATAR_PLACEHOLDER} className="w-full h-full rounded-full object-cover" /></div>
                <div className="text-center mb-8 w-full"><h2 className={`text-xl font-black italic uppercase tracking-widest mb-1 flex items-center justify-center gap-2 ${rankInfo.glow}`}>{profile.username}{rankInfo.tag !== 'NEWBIE' && <BadgeCheck className="w-5 h-5 text-hawk-gold" />}</h2><div className={`text-[8px] uppercase tracking-[0.4em] font-black ${rankInfo.color}`}>{rankInfo.tag}</div></div>
                <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-hawk-ui/20 border border-hawk-ui/60 rounded-[24px] p-5 flex flex-col items-center"><div className="text-hawk-gold font-black text-2xl font-mono mb-2">{displayRating}</div><div className="text-[8px] text-hawk-textMuted uppercase font-black tracking-[0.2em]">Hawk Pts</div></div>
                    <div className="bg-hawk-ui/20 border border-hawk-ui/60 rounded-[24px] p-5 flex flex-col items-center"><div className="text-white font-black text-2xl font-mono mb-2">{profile.followersCount ?? 0}</div><div className="text-[8px] text-hawk-textMuted uppercase font-black tracking-[0.2em]">Circle</div></div>
                    <div className="bg-hawk-ui/20 border border-hawk-ui/60 rounded-[24px] p-5 flex flex-col items-center"><div className="text-white font-black text-xl font-mono mb-2">{calculatedStats.watchTimeStr}</div><div className="text-[8px] text-hawk-textMuted uppercase font-black tracking-[0.2em]">Watch Time</div></div>
                    <div className="bg-hawk-ui/20 border border-hawk-ui/60 rounded-[24px] p-5 flex flex-col items-center"><div className="text-hawk-gold font-black text-2xl font-mono mb-2">{displayMean}</div><div className="text-[8px] text-hawk-textMuted uppercase font-black tracking-[0.2em]">Mean Score</div></div>
                </div>
            </div>
            {!isEditing ? (
                <div className="px-6 space-y-4 mb-20">
                    <StatusCard status={AnimeStatus.Watching} label="Watching" icon={Tv} color="text-yellow-400" />
                    <StatusCard status={AnimeStatus.Finished} label="Finished" icon={CheckCircle} color="text-emerald-400" />
                    <StatusCard status={AnimeStatus.PlanToWatch} label="Planned" icon={Clock} color="text-sky-400" />
                    <StatusCard status={AnimeStatus.OnHold} label="On-Hold" icon={PauseCircle} color="text-zinc-400" />
                    <StatusCard status={AnimeStatus.Dropped} label="Dropped" icon={XCircle} color="text-red-500" />
                </div>
            ) : (
                <div className="px-6 space-y-6">
                    <div className="space-y-4 bg-hawk-ui/40 border border-hawk-ui p-6 rounded-3xl">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-hawk-textMuted tracking-widest pl-1">Display Name</label><input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full bg-hawk-base border border-hawk-ui rounded-xl p-3 text-white focus:outline-none focus:border-hawk-gold" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-hawk-textMuted tracking-widest pl-1">Avatar URL</label><input type="text" value={editAvatarUrl || ''} onChange={(e) => setEditAvatarUrl(e.target.value)} className="w-full bg-hawk-base border border-hawk-ui rounded-xl p-3 text-white focus:outline-none focus:border-hawk-gold" /></div>
                        <div className="flex items-center justify-between py-2 border-t border-hawk-ui mt-4">
                            <div><h4 className="text-[10px] font-black uppercase text-white tracking-wider">Private Profile</h4><p className="text-[8px] text-hawk-textMuted uppercase font-black mt-1">Hide library from others</p></div>
                            <button onClick={() => setEditIsPrivate(!editIsPrivate)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${editIsPrivate ? 'bg-hawk-gold' : 'bg-hawk-ui'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${editIsPrivate ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                        </div>
                    </div>
                    <button onClick={handleSaveProfile} className="w-full bg-hawk-gold text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-white transition-all">Save Changes</button>
                    <button onClick={() => setIsEditing(false)} className="w-full bg-hawk-ui text-hawk-textSecondary font-black uppercase tracking-widest py-4 rounded-xl">Cancel</button>
                </div>
            )}
        </div>
    );
};
