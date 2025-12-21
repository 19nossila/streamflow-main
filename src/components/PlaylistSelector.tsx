
import React, { useState, useEffect } from 'react';
import { StoredPlaylist } from '../types';
import { storageService } from '../services/storage';
import { 
  PlayCircle, 
  LogOut, 
  LayoutDashboard, 
  ChevronRight, 
  Layers, 
  Tv, 
  Film, 
  Activity,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface PlaylistSelectorProps {
  onSelect: (playlist: StoredPlaylist) => void;
  onSelectAll: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  onGoToDashboard: () => void;
}

const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({ onSelect, onSelectAll, onLogout, isAdmin, onGoToDashboard }) => {
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      setLoading(true);
      try {
        const fetchedPlaylists = await storageService.getPlaylists();
        setPlaylists(fetchedPlaylists);
      } catch (err: any) {
        console.error("Failed to fetch playlists:", err);
        setError(err.message || 'Could not load playlists.');
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
                  onClick={onGoToDashboard} 
                  className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  title="Go to Admin Dashboard"
                >
                    <LayoutDashboard size={20} />
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
            <div className="mb-12">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Your Playlists</h2>
            </div>
            {playlists.length === 0 ? (
                <div className="text-center bg-[#0f1117] p-16 rounded-[40px] border border-white/5">
                    <Layers className="text-gray-700 w-16 h-16 mx-auto mb-4"/>
                    <h3 className="text-2xl font-bold mb-2">Library is Empty</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">Admin needs to upload M3U playlists.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <button
                        onClick={onSelectAll}
                        className="group relative overflow-hidden bg-gradient-to-br from-red-600 to-red-900 rounded-[32px] p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-600/30 flex flex-col justify-between h-[240px]"
                    >
                        <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <Activity className="text-white" size={24} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white leading-tight">All Content</h3>
                            <div className="flex items-center gap-2 text-red-200 text-xs font-bold">
                              <span>Merge & Play</span>
                              <ChevronRight size={14} />
                            </div>
                        </div>
                    </button>

                    {playlists.map((playlist) => {
                        const isMovie = playlist.name.toLowerCase().includes('movie') || playlist.name.toLowerCase().includes('filme');
                        const isLive = playlist.name.toLowerCase().includes('live') || playlist.name.toLowerCase().includes('tv');

                        return (
                          <button
                              key={playlist.id}
                              onClick={() => onSelect(playlist)}
                              className="group relative bg-[#0f1117] rounded-[32px] p-8 text-left transition-all hover:bg-[#161922] border border-white/5 hover:border-white/10 flex flex-col justify-between h-[240px] shadow-xl"
                          >
                              <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-red-600/10 group-hover:text-red-500 transition-colors">
                                    {isMovie ? <Film size={22} /> : isLive ? <Tv size={22} /> : <Layers size={22} />}
                                </div>
                                <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-500">
                                  {playlist.sources.length} sources
                                </div>
                              </div>
                              <div>
                                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors line-clamp-2 leading-tight">
                                    {playlist.name}
                                  </h3>
                                  <div className="flex items-center gap-1 text-gray-600 text-[10px] font-bold">
                                    <span>Browse</span>
                                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                  </div>
                              </div>
                          </button>
                        );
                    })}
                </div>
            )}
        </main>
        <footer className="py-12 px-6 border-t border-white/5 text-center mt-16">
          <p className="text-gray-600 text-xs">StreamFlow v2.0</p>
        </footer>
    </div>
  );
};

export default PlaylistSelector;
