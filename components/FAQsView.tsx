
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronDown, HelpCircle, Shield, Zap, Database, User, Star, Globe, MessageSquare, AlertCircle, Search, X } from 'lucide-react';

interface FAQItem {
    q: string;
    a: string;
    icon?: any;
}

interface FAQsViewProps {
    onBack: () => void;
}

const FAQ_DATA: FAQItem[] = [
    {
        q: "What is HAWK?",
        a: "HAWK is a premium, high-performance anime watchlist tracker designed for enthusiasts who appreciate a bold, minimalist aesthetic and seamless data management.",
        icon: Zap
    },
    {
        q: "Is it free to use?",
        a: "Absolutely. HAWK is built by fans for fans. It is 100% free and contains zero advertisements to ensure your experience remains focused and premium.",
        icon: Star
    },
    {
        q: "How do I create an account?",
        a: "You can sign up using your email and a unique username. Head to the authentication screen to initialize your profile and start syncing your data to the cloud.",
        icon: User
    },
    {
        q: "Can I use HAWK without an account?",
        a: "Yes! HAWK features a 'Guest Mode' (Preview) that allows you to explore the interface and use discovery features. However, to save a persistent watchlist and climb the leaderboard, a registered account is required.",
        icon: Shield
    },
    {
        q: "How do I add anime to my watchlist?",
        a: "Use the 'Discover' tab to search for titles. You can use the 'Quick Add' button for instant entry or the 'Add to Watchlist' modal to customize your starting status and progress.",
        icon: Database
    },
    {
        q: "What do the different status badges mean?",
        a: "Watching: Titles you are currently viewing. Finished: Completed entries. Plan to Watch: Your future queue. On-Hold: Temporarily paused viewing. Dropped: Titles you no longer wish to continue.",
        icon: Shield
    },
    {
        q: "How are 'Hawk Points' calculated?",
        a: "Hawk Points are a proprietary metric calculated based on your total watch days multiplied by your mean score. This rewards both the volume of anime consumed and the quality of your rated library.",
        icon: Star
    },
    {
        q: "What are the different user ranks?",
        a: "Ranks include NEWBIE (0-299 Pts), VERIFIED (300-599 Pts), ELITE (600-999 Pts), and HAWK CERTIFIED (1000+ Pts). Your rank badge color and glow intensity change as you level up.",
        icon: Globe
    },
    {
        q: "How does the Leaderboard work?",
        a: "The Global Ranking tracks users based on their Hawk Points. The top 50 users are displayed publicly. You can see your own rank relative to the top tiers at the bottom of the leaderboard view.",
        icon: Zap
    },
    {
        q: "How can I change my username?",
        a: "Go to your Profile, click the 'Edit' icon, and enter your new username. Note that you must follow the strict character rules (letters, numbers, underscores) and adhere to the cooldown period.",
        icon: User
    },
    {
        q: "Why is there a 30-day limit on username changes?",
        a: "To maintain the integrity of the leaderboard and social system, we enforce a once-per-month username change policy. This prevents confusion and impersonation within the community.",
        icon: Shield
    },
    {
        q: "How do I change my profile avatar?",
        a: "In the Profile Edit modal, you can select from a curated list of high-quality anime character presets to represent your account uniquely.",
        icon: User
    },
    {
        q: "Can I make my profile private?",
        a: "Yes. In the Profile Edit settings, toggle the 'Private Profile' switch. This will hide your detailed watchlist from other users while still allowing you to appear on the leaderboard.",
        icon: Shield
    },
    {
        q: "How do I follow other users?",
        a: "Find users via the 'Find People' search or the Leaderboard. On their profile page, click the 'Follow' button to add them to your circle for quick access.",
        icon: User
    },
    {
        q: "Why does MAL username import show 'Failed to fetch list'?",
        a: "Direct MAL username import can sometimes fail due to MyAnimeList API restrictions or rate limits. As a reliable alternative, export your list from MAL (Settings → Export) as XML or JSON file, then use the 'Manual File Import' option in HAWK — it works 100% of the time.",
        icon: AlertCircle
    },
    {
        q: "How do I use Manual File Import?",
        a: "Go to the Data Hub (Import/Export), select 'Manual File Import', and upload your exported file. HAWK supports official MAL XML exports, simple JSON arrays, and even formatted .txt files.",
        icon: Database
    },
    {
        q: "What file formats are supported for manual import?",
        a: "We currently support .xml (MyAnimeList format), .json (HAWK or generic structure), and .txt (one entry per line) formats.",
        icon: Database
    },
    {
        q: "How do I export my data?",
        a: "In the Data Hub, navigate to the 'Export' tab. Select your desired format (JSON, XML, or Text) and click 'Download Data' to save a local backup of your library.",
        icon: Database
    },
    {
        q: "How can I report a bug or suggest a feature?",
        a: "We value community feedback! Join our official Discord server (link in the 'About' section) to talk directly with the developers and help shape the future of HAWK.",
        icon: MessageSquare
    }
];

export const FAQsView: React.FC<FAQsViewProps> = ({ onBack }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const filteredFaqs = useMemo(() => {
        if (!searchQuery.trim()) return FAQ_DATA;
        const q = searchQuery.toLowerCase();
        return FAQ_DATA.filter(item => 
            item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-hawk-base pb-32">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-hawk-surface/90 backdrop-blur-md border-b border-hawk-goldDim/30 p-4 shadow-lg shadow-black/40 flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 text-hawk-textSecondary hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-hawk-gold" />
                    <h1 className="text-sm font-bold text-hawk-gold uppercase tracking-[0.2em]">FAQs</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 space-y-4 animate-fade-in">
                <div className="mb-10 text-center px-4">
                    {/* Search Bar Section */}
                    <div className="relative max-w-md mx-auto mt-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-hawk-textMuted w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search problems..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-hawk-surface border border-hawk-ui focus:border-hawk-gold rounded-2xl py-3.5 pl-11 pr-11 text-white placeholder-hawk-textMuted text-xs focus:outline-none transition-all shadow-inner"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-hawk-textMuted hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {filteredFaqs.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 bg-hawk-ui rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
                            <Search className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-hawk-textMuted">No matches found for your search</p>
                    </div>
                ) : (
                    filteredFaqs.map((item, idx) => {
                        const isOpen = openIndex === idx;
                        const Icon = item.icon || HelpCircle;
                        
                        return (
                            <div 
                                key={idx} 
                                className={`bg-hawk-surface border rounded-2xl transition-all duration-300 ${
                                    isOpen ? 'border-hawk-gold shadow-[0_0_40px_rgba(0,0,0,1)]' : 'border-hawk-ui hover:border-hawk-gold/30'
                                }`}
                            >
                                <button 
                                    onClick={() => toggleAccordion(idx)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`p-2 rounded-lg transition-all duration-300 ${isOpen ? 'bg-hawk-gold text-black shadow-[0_0_15px_rgba(255,163,26,0.4)]' : 'bg-hawk-base text-hawk-textMuted'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isOpen ? 'text-white' : 'text-hawk-textSecondary'}`}>
                                            {item.q}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <ChevronDown className={`w-4 h-4 text-hawk-textMuted transition-transform duration-500 ${isOpen ? 'rotate-180 text-hawk-gold' : ''}`} />
                                    </div>
                                </button>
                                
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        isOpen ? 'max-h-[300px] opacity-100 pb-6' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="px-5 pl-[68px] pr-8 text-[11px] text-hawk-textSecondary leading-relaxed font-bold uppercase tracking-widest border-t border-hawk-ui/50 pt-5 italic">
                                        {item.a}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
