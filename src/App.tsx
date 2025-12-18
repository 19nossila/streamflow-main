import React, { useState, useEffect, useCallback } from 'react';
import { Channel, PlaylistData, User, StoredPlaylist } from './types';
import { parseM3U } from './services/m3uParser';
import { storageService } from './services/storage';
import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PlaylistSelector from './components/PlaylistSelector';
import { Menu, X, ArrowLeft, LogOut, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation State
  const [view, setView] = useState<'login' | 'dashboard' | 'selector' | 'player'>('login');
  
  // Player Data State
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Global Loading State
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) {
      handleLoginSuccess(user);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setLoading(false);
    if (user.role === 'admin') {
      setView('dashboard');
    } else {
      setView('selector');
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setPlaylistData(null);
    setCurrentChannel(null);
    setView('login');
  };

  const handleLoadPlaylist = useCallback((storedPlaylist: StoredPlaylist) => {
    setLoading(true);
    setTimeout(() => {
      try {
        let mergedChannels: Channel[] = [];
        const mergedGroups = new Set<string>();
        
        if (storedPlaylist.sources.length === 0) {
            alert("This playlist has no M3U sources yet.");
            setLoading(false);
            return;
        }

        storedPlaylist.sources.forEach(source => {
            try {
                const data = parseM3U(source.content);
                mergedChannels = [...mergedChannels, ...data.channels];
                data.groups.forEach(g => mergedGroups.add(g));
            } catch (err) {
                console.error(`Error parsing source: ${source.identifier}`, err);
            }
        });

        if (mergedChannels.length === 0) {
             alert("No playable channels found.");
             setLoading(false);
             return;
        }

        setPlaylistData({ channels: mergedChannels, groups: Array.from(mergedGroups).sort() });
        if (mergedChannels.length > 0) {
          setCurrentChannel(mergedChannels[0]);
        }
        setView('player');
      } catch (e) {
        console.error("Error processing playlist:", e);
        alert("Failed to load playlist.");
      } finally {
        setLoading(false);
      }
    }, 100);
  }, []);

  const handleLoadAllPlaylists = useCallback(async () => {
    setLoading(true);
    try {
        const allPlaylists = await storageService.getPlaylists();
        let mergedChannels: Channel[] = [];
        const mergedGroups = new Set<string>();

        allPlaylists.forEach(pl => {
            pl.sources.forEach(source => {
                try {
                    const data = parseM3U(source.content);
                    mergedChannels = [...mergedChannels, ...data.channels];
                    data.groups.forEach(g => mergedGroups.add(g));
                } catch (e) {
                    console.warn(`Could not parse source ${source.identifier}:`, e);
                }
            });
        });

        if (mergedChannels.length === 0) {
            alert("No channels found across all playlists.");
            return;
        }

        setPlaylistData({ channels: mergedChannels, groups: Array.from(mergedGroups).sort() });
        setCurrentChannel(mergedChannels[0]);
        setView('player');

    } catch (e: any) {
        console.error("Failed to load all playlists:", e);
        alert(`Error loading all playlists: ${e.message}`);
    } finally {
        setLoading(false);
    }
  }, []);

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setMobileMenuOpen(false);
  };

  const handleBackToMenu = () => {
      setView(currentUser?.role === 'admin' ? 'dashboard' : 'selector');
      setPlaylistData(null);
      setCurrentChannel(null);
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center text-white">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Initializing StreamFlow</p>
          </div>
      );
  }

  if (!currentUser || view === 'login') {
    return <Login onLogin={handleLoginSuccess} />;
  }

  if (view === 'dashboard' && currentUser.role === 'admin') {
    return <AdminDashboard onLogout={handleLogout} onPreview={handleLoadPlaylist} />;
  }

  if (view === 'selector') {
      return (
          <PlaylistSelector 
            onSelect={handleLoadPlaylist}
            onSelectAll={handleLoadAllPlaylists}
            onLogout={handleLogout}
            isAdmin={currentUser.role === 'admin'}
          />
      );
  }

  if (view === 'player' && playlistData) {
    return (
      <div className="flex flex-col h-screen bg-[#07080a] overflow-hidden text-white font-sans">
        {/* Mobile Header */}
        <div className="md:hidden bg-[#0f1117] px-4 py-3 border-b border-white/5 flex justify-between items-center z-50 shadow-lg">
          <div className="font-bold text-red-600 flex items-center gap-2 tracking-tighter text-lg">
            STREAMFLOW
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-400 p-1 hover:text-white transition-colors">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar */}
          <div className={`absolute md:static inset-0 z-40 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex`}>
            <Sidebar 
                channels={playlistData.channels} 
                currentChannel={currentChannel}
                onSelectChannel={handleChannelSelect}
                groups={playlistData.groups}
            />
            {/* Overlay for mobile when sidebar is open */}
            {mobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black/60 md:hidden -z-10 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Player Header */}
            <div className="h-16 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-10">
              <div className="flex items-center gap-4 overflow-hidden">
                {currentChannel?.logo && (
                  <div className="w-10 h-10 bg-black/50 rounded-lg p-1 border border-white/10 shrink-0">
                    <img src={currentChannel.logo} className="w-full h-full object-contain" alt="" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-bold truncate leading-tight">{currentChannel?.name || 'Select a Channel'}</h2>
                  {currentChannel?.group && (
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5 truncate">{currentChannel.group}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleBackToMenu} 
                  className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all group flex items-center gap-2"
                  title="Back to Playlists"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Back</span>
                </button>
                {currentUser.role === 'admin' && (
                  <button 
                    onClick={() => setView('dashboard')}
                    className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                    title="Dashboard"
                  >
                    <LayoutDashboard size={20} />
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            {/* Video Player Section */}
            <div className="flex-1 bg-black relative flex items-center justify-center p-0 md:p-4 lg:p-6 overflow-hidden">
              <div className="w-full h-full max-w-6xl mx-auto shadow-2xl shadow-red-900/10 rounded-xl overflow-hidden bg-black ring-1 ring-white/5">
                {currentChannel ? (
                  <VideoPlayer url={currentChannel.url} poster={currentChannel.logo} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 bg-[#07080a]">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <Tv size={48} className="opacity-20" />
                    </div>
                    <p className="text-lg font-medium">Ready to broadcast</p>
                    <p className="text-sm opacity-50 mt-1 text-center max-w-xs px-4">Select a channel or movie from the sidebar to start your experience.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-white p-10 bg-[#0f1117] min-h-screen">An unexpected error occurred. Please reload the application.</div>;
};

export default App;