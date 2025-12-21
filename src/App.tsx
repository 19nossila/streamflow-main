
import React, { useState, useEffect, useCallback } from 'react';
import { Channel, PlaylistData, User, StoredPlaylist } from './types';
import { parseM3U } from './services/m3uParser';
import { storageService } from './services/storage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PlaylistSelector from './components/PlaylistSelector';
import HomePage from './pages/Player/HomePage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'selector' | 'player'>('login');
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
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
    setView(user.role === 'admin' ? 'dashboard' : 'selector');
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setPlaylistData(null);
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
      setView('player');
    } catch (e: any) {
      console.error("Failed to load all playlists:", e);
      alert(`Error loading all playlists: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBackToMenu = () => {
    setView(currentUser?.role === 'admin' ? 'dashboard' : 'selector');
    setPlaylistData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Initializing StreamFlow</p>
      </div>
    );
  }

  switch (view) {
    case 'login':
      return <Login onLogin={handleLoginSuccess} />;
    case 'dashboard':
      return <AdminDashboard onLogout={handleLogout} onPreview={handleLoadPlaylist} />;
    case 'selector':
      return (
        <PlaylistSelector
          onSelect={handleLoadPlaylist}
          onSelectAll={handleLoadAllPlaylists}
          onLogout={handleLogout}
          isAdmin={currentUser?.role === 'admin'}
        />
      );
    case 'player':
      if (playlistData && currentUser) {
        return (
          <HomePage
            playlistData={playlistData}
            currentUser={currentUser}
            onLogout={handleLogout}
            onBackToMenu={handleBackToMenu}
            onSwitchToDashboard={() => setView('dashboard')}
          />
        );
      }
      // Fallback if playlistData is not available
      setView('selector');
      return null;
    default:
      return <div className="text-white p-10 bg-[#0f1117] min-h-screen">An unexpected error occurred. Please reload the application.</div>;
  }
};

export default App;
