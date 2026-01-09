
import React, { useState, useRef } from 'react';
import { ChevronLeft, Download, Upload, Loader, FileJson, FileText, FileCode, CheckCircle, AlertCircle, ArrowRight, User, FileUp } from 'lucide-react';
import { Anime, AnimeStatus } from '../types';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

interface MalImportViewProps {
  onBack: () => void;
  onImport: (username: string, wipeCurrent: boolean) => Promise<void>;
  currentList: Anime[];
}

type Tab = 'import' | 'export';

// Provided MAL Client ID
const MAL_CLIENT_ID = '5c20f2499d15107e761606faa9b7e1b7';

export const MalImportView: React.FC<MalImportViewProps> = ({ onBack, onImport, currentList }) => {
  const [activeTab, setActiveTab] = useState<Tab>('import');
  
  // Import State
  const [username, setUsername] = useState('');
  const [eraseList, setEraseList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export State
  const [groupByFolder, setGroupByFolder] = useState(true);
  const [exportFormat, setExportFormat] = useState<'text' | 'xml' | 'json'>('json');
  const [isVerified, setIsVerified] = useState(false);

  // Status mapping from MAL API v2 strings to HAWK Types
  const mapMalV2Status = (status: string): AnimeStatus => {
    switch (status) {
      case 'watching': return AnimeStatus.Watching;
      case 'completed': return AnimeStatus.Finished;
      case 'on_hold': return AnimeStatus.OnHold;
      case 'dropped': return AnimeStatus.Dropped;
      case 'plan_to_watch': return AnimeStatus.PlanToWatch;
      default: return AnimeStatus.PlanToWatch;
    }
  };

  const processImportData = async (data: any[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Authentication required");

    if (eraseList) {
      setStatusMsg("Clearing existing list...");
      await supabase.from('watchlist').delete().eq('user_id', userId);
    }

    let count = 0;
    const total = data.length;

    for (const item of data) {
      count++;
      setStatusMsg(`Processing ${count}/${total}: ${item.title}`);
      
      // Attempt to get high-quality details from our HAWK API (AniList/Jikan)
      let details = null;
      try {
        details = await api.getDetailsByTitle(item.title);
      } catch (e) {
        console.warn(`Details fetch failed for ${item.title}`, e);
      }

      const payload = {
        user_id: userId,
        anime_id: details?.id ? Number(details.id) : (item.mal_id || Math.floor(Math.random() * 10000000)),
        mal_id: item.mal_id || details?.idMal || null,
        title: item.title,
        cover_image: details?.coverImage || item.cover_image || '',
        status: item.status,
        progress: item.progress || 0,
        total_episodes: details?.episodes || item.total_episodes || 0,
        rating: item.rating > 0 ? item.rating : null,
        notes: details?.description || '',
        genres: details?.genres || [],
        duration: details?.duration || 24,
        seasons: []
      };

      await supabase.from('watchlist').upsert(payload, { onConflict: 'user_id,anime_id' });
    }

    window.dispatchEvent(new CustomEvent('watchlist_updated'));
  };

  const handleMalUsernameImport = async () => {
    if (!username.trim()) {
      setErrorMsg("Please enter a valid MAL username.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    setStatusMsg('Connecting to MyAnimeList API v2...');
    
    try {
      let offset = 0;
      let allEntries: any[] = [];
      let hasMore = true;

      while (hasMore) {
        setStatusMsg(`Fetching MAL entries (Offset: ${offset})...`);
        
        // MAL API v2 endpoint
        // Using corsproxy.io to bypass browser CORS restrictions for the MAL API
        const targetUrl = `https://api.myanimelist.net/v2/users/${username}/animelist?limit=1000&offset=${offset}&fields=list_status{status,score,num_episodes_watched},title,main_picture&status=all`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(proxyUrl, {
          headers: {
            'X-MAL-CLIENT-ID': MAL_CLIENT_ID
          }
        });
        
        if (response.status === 404) {
          throw new Error("User not found or list is private. Make sure privacy is Public.");
        }
        
        if (response.status === 401) {
          throw new Error("Invalid Client ID - API authentication failed.");
        }

        if (!response.ok) {
          throw new Error("Failed to fetch list from MyAnimeList.");
        }

        const json = await response.json();
        const data = json.data || [];
        
        if (data.length === 0) {
          hasMore = false;
        } else {
          const mapped = data.map((item: any) => ({
            title: item.node.title,
            mal_id: item.node.id,
            status: mapMalV2Status(item.list_status.status),
            rating: item.list_status.score,
            progress: item.list_status.num_episodes_watched,
            cover_image: item.node.main_picture?.large || item.node.main_picture?.medium
          }));
          
          allEntries = [...allEntries, ...mapped];
          offset += 1000;
          
          // Check if there is a next page
          if (!json.paging?.next) {
            hasMore = false;
          }
        }
      }

      if (allEntries.length === 0) {
        throw new Error("No anime found in this user's list.");
      }

      await processImportData(allEntries);
      setStatusMsg(`Import Complete! Added ${allEntries.length} entries.`);
      setTimeout(() => onBack(), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to import list.");
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg('');
    setStatusMsg('Reading file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let entries: any[] = [];

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text);
          entries = Array.isArray(data) ? data : [data];
          entries = entries.map(e => ({
            title: e.title || e.anime_title,
            status: e.status || AnimeStatus.PlanToWatch,
            rating: e.rating || e.score || 0,
            progress: e.progress || e.watched || 0
          }));
        } 
        else if (file.name.endsWith('.xml')) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, 'text/xml');
          const animeNodes = xmlDoc.getElementsByTagName('anime');
          
          // Legacy MAL XML format mapper
          const mapXmlStatus = (id: string): AnimeStatus => {
             switch (id) {
               case '1': return AnimeStatus.Watching;
               case '2': return AnimeStatus.Finished;
               case '3': return AnimeStatus.OnHold;
               case '4': return AnimeStatus.Dropped;
               default: return AnimeStatus.PlanToWatch;
             }
          };

          for (let i = 0; i < animeNodes.length; i++) {
            const node = animeNodes[i];
            const title = node.getElementsByTagName('series_title')[0]?.textContent || '';
            const statusId = node.getElementsByTagName('my_status')[0]?.textContent || '6';
            const score = parseInt(node.getElementsByTagName('my_score')[0]?.textContent || '0');
            const watched = parseInt(node.getElementsByTagName('my_watched_episodes')[0]?.textContent || '0');
            
            if (title) {
              entries.push({
                title,
                status: mapXmlStatus(statusId),
                rating: score,
                progress: watched
              });
            }
          }
        } 
        else if (file.name.endsWith('.txt')) {
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            const match = line.match(/(.+) - (Watching|Finished|Plan to Watch|On-Hold|Dropped) \((\d+)\/10\)/i);
            if (match) {
              entries.push({
                title: match[1].trim(),
                status: match[2].trim(),
                rating: parseInt(match[3]),
                progress: 0
              });
            } else {
              entries.push({
                title: line.trim(),
                status: AnimeStatus.PlanToWatch,
                rating: 0,
                progress: 0
              });
            }
          }
        }

        if (entries.length === 0) throw new Error("No valid entries found in file.");
        await processImportData(entries);
        setStatusMsg(`File Import Successful! Added ${entries.length} entries.`);
        setTimeout(() => onBack(), 2000);
      } catch (err: any) {
        setErrorMsg("Parsing Error: " + (err.message || "Invalid file format."));
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExportSubmit = () => {
    if (!isVerified) return;
    
    const dataStr = exportFormat === 'json' 
        ? "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentList, null, 2))
        : exportFormat === 'xml'
        ? "data:text/xml;charset=utf-8," + encodeURIComponent(`<myanimelist><myinfo><user_name>HAWK_USER</user_name></myinfo>${currentList.map(a => `<anime><series_title>${a.title}</series_title><my_status>${a.status === AnimeStatus.Watching ? 1 : a.status === AnimeStatus.Finished ? 2 : a.status === AnimeStatus.OnHold ? 3 : a.status === AnimeStatus.Dropped ? 4 : 6}</my_status><my_score>${a.rating}</my_score><my_watched_episodes>${a.watched}</my_watched_episodes></anime>`).join('')}</myanimelist>`)
        : "data:text/plain;charset=utf-8," + encodeURIComponent(currentList.map(a => `${a.title} - ${a.status} (${a.rating}/10)`).join('\n'));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `hawk_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-hawk-base text-hawk-textPrimary font-sans pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-hawk-surface/90 backdrop-blur-md border-b border-hawk-goldDim/30 p-4 shadow-lg shadow-black/40 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 text-hawk-textSecondary hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
            <ArrowRight className="w-5 h-5 text-hawk-gold rotate-45" />
            <h1 className="text-sm font-bold text-hawk-gold uppercase tracking-[0.2em]">Import/Export</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6">
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-hawk-surface border border-hawk-ui rounded-xl mb-8">
            <button 
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'import' ? 'bg-hawk-gold text-black shadow-lg' : 'text-hawk-textMuted hover:text-white'}`}
            >
                Import
            </button>
            <button 
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'export' ? 'bg-hawk-gold text-black shadow-lg' : 'text-hawk-textMuted hover:text-white'}`}
            >
                Export
            </button>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
            
            {activeTab === 'import' ? (
                <div className="space-y-6">
                    {/* Shared Toggle Section */}
                    <div className="bg-hawk-surface/50 border border-hawk-ui p-6 rounded-3xl mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Erase Current List?</h4>
                                <p className="text-[10px] text-hawk-textMuted mt-1">Delete local library before sync</p>
                            </div>
                            <button 
                                onClick={() => setEraseList(!eraseList)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${eraseList ? 'bg-hawk-gold' : 'bg-hawk-ui'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${eraseList ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    {/* MAL Username Import Card */}
                    <div className="bg-hawk-surface/50 border border-hawk-ui p-6 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <User className="w-5 h-5 text-hawk-gold" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-white">Sync from MAL Username (v2)</h3>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-bold text-hawk-textMuted uppercase tracking-widest pl-1">Target Account</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. MAL_User_99"
                                disabled={isLoading}
                                className="w-full bg-hawk-base border border-hawk-ui rounded-xl p-4 text-white placeholder-hawk-textMuted focus:outline-none focus:border-hawk-gold transition-all font-mono text-sm"
                            />
                        </div>
                        <button
                            onClick={handleMalUsernameImport}
                            disabled={isLoading}
                            className="w-full bg-hawk-gold text-black font-bold uppercase tracking-[0.15em] py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_#8C7343] disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Sync MAL Profile'}
                            {!isLoading && <Download className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* File Import Card */}
                    <div className="bg-hawk-surface/50 border border-hawk-ui p-6 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <FileUp className="w-5 h-5 text-hawk-gold" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-white">Manual File Import</h3>
                        </div>
                        <p className="text-[10px] text-hawk-textMuted uppercase tracking-widest leading-relaxed">
                            Supports .XML (MAL Style), .JSON, and .TXT lists
                        </p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept=".xml,.json,.txt"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="w-full bg-hawk-ui/50 text-white font-bold uppercase tracking-[0.15em] py-4 rounded-xl border border-hawk-ui hover:border-hawk-gold transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Reading File...' : 'Upload File'}
                            {!isLoading && <Upload className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Progress & Error Displays */}
                    {(statusMsg || errorMsg) && (
                        <div className="animate-fade-in space-y-3">
                            {errorMsg && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-900/10 p-4 rounded-xl border border-red-900/30 shadow-lg">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{errorMsg}</span>
                                </div>
                            )}

                            {statusMsg && !errorMsg && (
                                <div className="flex items-center gap-3 text-hawk-gold bg-hawk-gold/10 p-4 rounded-xl border border-hawk-gold/30 shadow-[0_0_20px_rgba(255,163,26,0.1)]">
                                    {isLoading ? <Loader className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{statusMsg}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-hawk-surface/50 border border-hawk-ui p-6 rounded-3xl space-y-6">
                    <div className="p-4 bg-hawk-ui/30 rounded-xl border-l-2 border-hawk-gold">
                         <p className="text-xs text-hawk-textSecondary leading-relaxed">
                            Export your watchlist to a compatible format for backup or use on other platforms.
                        </p>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-hawk-ui/50">
                        <label className="text-sm font-medium text-white">Group by folder</label>
                        <button 
                            onClick={() => setGroupByFolder(!groupByFolder)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${groupByFolder ? 'bg-hawk-gold' : 'bg-hawk-ui'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${groupByFolder ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-hawk-textMuted uppercase tracking-widest pl-1">Export Format</label>
                        <div className="grid grid-cols-3 gap-3">
                             <button 
                                onClick={() => setExportFormat('text')}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${exportFormat === 'text' ? 'bg-hawk-gold/10 border-hawk-gold text-hawk-gold' : 'bg-hawk-base border-hawk-ui text-hawk-textMuted hover:border-hawk-textSecondary'}`}
                             >
                                <FileText className="w-5 h-5" />
                                <span className="text-[10px] font-bold">TEXT</span>
                             </button>
                             <button 
                                onClick={() => setExportFormat('xml')}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${exportFormat === 'xml' ? 'bg-hawk-gold/10 border-hawk-gold text-hawk-gold' : 'bg-hawk-base border-hawk-ui text-hawk-textMuted hover:border-hawk-textSecondary'}`}
                             >
                                <FileCode className="w-5 h-5" />
                                <span className="text-[10px] font-bold">XML</span>
                             </button>
                             <button 
                                onClick={() => setExportFormat('json')}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${exportFormat === 'json' ? 'bg-hawk-gold/10 border-hawk-gold text-hawk-gold' : 'bg-hawk-base border-hawk-ui text-hawk-textMuted hover:border-hawk-textSecondary'}`}
                             >
                                <FileJson className="w-5 h-5" />
                                <span className="text-[10px] font-bold">JSON</span>
                             </button>
                        </div>
                    </div>

                    <div 
                        className="bg-zinc-900 border border-zinc-700 p-4 rounded-lg flex items-center mt-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        onClick={() => { setIsVerified(!isVerified); setErrorMsg(''); }}
                    >
                         <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors mr-3 ${isVerified ? 'bg-hawk-gold border-hawk-gold' : 'border-zinc-500'}`}>
                             {isVerified && <CheckCircle className="w-4 h-4 text-black" />}
                         </div>
                         <span className="text-sm text-zinc-300 select-none">Verify you are human</span>
                    </div>

                    <button
                        onClick={handleExportSubmit}
                        disabled={!isVerified}
                        className="w-full bg-hawk-gold text-black font-black uppercase tracking-[0.15em] py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_4px_0_#8C7343] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Download Data
                        <Upload className="w-4 h-4" />
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
