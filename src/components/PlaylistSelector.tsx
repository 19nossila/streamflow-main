import React, { useState, useEffect } from 'react';
import { StoredPlaylist } from '../types';
import { storageService } from '../services/storage';
import { 
  PlayCircle, 
  LogOut, 
  Settings, 
  ChevronRight, 
  Layers, 
  Tv, 
  Film, 
  Activity,
  AlertTriangle,
  Loader2,
  LayoutGrid
} from 'lucide-react';

interface PlaylistSelectorProps {
  onSelect: (playlist: StoredPlaylist) => void;
  onSelectAll: () => void;
  onLogout: () => void;
  isAdmin: boolean;
}

const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({ onSelect, onSelectAll, onLogout, isAdmin }) => {
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const fetchedPlaylists = await storageService.getPlaylists();
        setPlaylists(fetchedPlaylists);
      } catch (err: any) {
        console.error("Failed to fetch playlists:", err);
        setError(err.message || 'Could not load playlists. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const Header = () => (
    <div className="flex justify-between items-center px-6 py-4 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <PlayCircle className="text-white" size={24} fill="currentColor" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white">STREAMFLOW</h1>
        </div>
        
        <div className="flex items-center gap-3">
            {isAdmin && (
                <button 
                  onClick={() => window.location.reload()} 
                  className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <Settings size={20} />
                </button>
            )}
            <button 
              onClick={onLogout} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
            >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
            </button>
        </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080a] flex flex-col text-white">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium tracking-widest uppercase text-[10px]">Syncing with servers</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-[#07080a] flex flex-col text-white">
            <Header />
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="bg-[#0f1117] p-10 rounded-3xl shadow-2xl text-center border border-white/5 max-w-md w-full">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="text-red-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Connection Error</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">{error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      Try Again
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-white">
        <Header />
        
        <main className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-[2px] bg-red-600"></span>
                  <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-[10px]">Media Library</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Your Playlists</h2>
              </div>
              
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                <button className="px-4 py-2 bg-red-600 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/20">
                  <LayoutGrid size={14} /> Grid
                </button>
                <button className="px-4 py-2 text-gray-500 text-xs font-bold hover:text-gray-300">
                   List
                </button>
              </div>
            </div>
            
            {playlists.length === 0 ? (
                <div className="text-center bg-[#0f1117] p-16 rounded-[40px] border border-white/5 shadow-inner">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Layers className="text-gray-700" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">The library is empty</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">Please ask your administrator to upload some M3U playlists to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {/* "Load All" High-Impact Card */}
                    <button
                        onClick={onSelectAll}
                        className="group relative overflow-hidden bg-gradient-to-br from-red-600 to-red-900 rounded-[32px] p-8 text-left transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-600/30 flex flex-col justify-between h-[240px]"
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <Activity className="text-white" size={24} />
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white leading-tight mb-2">All Content<br/>Combined</h3>
                            <div className="flex items-center gap-2 text-red-200 text-xs font-bold uppercase tracking-widest">
                              <span>Merge everything</span>
                              <ChevronRight size={14} />
                            </div>
                        </div>
                    </button>

                    {playlists.map((playlist) => {
                        // Attempt to guess type based on name for icons
                        const name = playlist.name.toLowerCase();
                        const isMovie = name.includes('movie') || name.includes('filme') || name.includes('vod');
                        const isLive = name.includes('live') || name.includes('tv') || name.includes('canais');

                        return (
                          <button
                              key={playlist.id}
                              onClick={() => onSelect(playlist)}
                              className="group relative bg-[#0f1117] rounded-[32px] p-8 text-left transition-all duration-300 hover:bg-[#161922] border border-white/5 hover:border-white/10 flex flex-col justify-between h-[240px] shadow-xl"
                          >
                              <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-red-600/10 group-hover:text-red-500 transition-colors">
                                    {isMovie ? <Film size={22} /> : isLive ? <Tv size={22} /> : <Layers size={22} />}
                                </div>
                                <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                  {playlist.sources.length} sources
                                </div>
                              </div>
                              
                              <div>
                                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors line-clamp-2 leading-tight">
                                    {playlist.name}
                                  </h3>
                                  <div className="flex items-center gap-1 text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                                    <span>Browse Library</span>
                                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                  </div>
                              </div>
                          </button>
                        );
                    })}
                </div>
            )}
        </main>

        <footer className="mt-auto py-12 px-6 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs font-medium tracking-widest uppercase">StreamFlow Media Player v2.0</p>
        </footer>
    </div>
  );
};

export default PlaylistSelector;