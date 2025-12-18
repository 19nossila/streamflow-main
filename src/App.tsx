
import React, { useState, useEffect, useCallback } from 'react';
import { Channel, PlaylistData, User } from './types';
import { parseM3U } from './services/m3uParser';
import { storageService } from './services/storage';
import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Navbar from './components/Navbar';
import MainMenu from './components/MainMenu';
import './styles/Streamity.css';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation State
  const [view, setView] = useState<'login' | 'main' | 'live' | 'movies' | 'series'>('login');
  
  // Player Data State
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  
  // Global Loading State
  const [loading, setLoading] = useState(true);

  // Check for existing session on initial load
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
    setView('main');
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setPlaylistData(null);
    setCurrentChannel(null);
    setView('login');
  };

  const handleMenuSelect = (selectedView: 'live' | 'movies' | 'series') => {
    setView(selectedView);
    handleLoadAllPlaylists();
  };
  
  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
  };

  const handleLoadAllPlaylists = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
        const allPlaylists = await storageService.getPlaylists();
        let mergedChannels: Channel[] = [];
        const mergedGroups = new Set<string>();

        allPlaylists.forEach(pl => {
            // We only load playlists for the current user
            if (pl.userId === currentUser.id) {
                pl.sources.forEach(source => {
                    try {
                        const data = parseM3U(source.content);
                        mergedChannels = [...mergedChannels, ...data.channels];
                        data.groups.forEach(g => mergedGroups.add(g));
                    } catch (e) {
                        console.warn(`Could not parse source ${source.identifier}:`, e);
                    }
                });
            }
        });

        if (mergedChannels.length === 0) {
            console.warn("No channels found for the current user.");
        }

        setPlaylistData({ channels: mergedChannels, groups: Array.from(mergedGroups).sort() });
        
        if (mergedChannels.length > 0) {
            setCurrentChannel(mergedChannels[0]);
        }

    } catch (e: any) {
        console.error("Failed to load all playlists:", e);
        alert(`Error loading all playlists: ${e.message}`);
    } finally {
        setLoading(false);
    }
  }, [currentUser]);

  // --- RENDER LOGIC ---

  if (loading && !currentUser) {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading Application...</p>
          </div>
      );
  }

  if (!currentUser || view === 'login') {
    return <Login onLogin={handleLoginSuccess} />;
  }

  if (view === 'main') {
    return <MainMenu onSelect={handleMenuSelect} onLogout={handleLogout} />;
  }

  if (view === 'live' || view === 'movies' || view === 'series') {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#1a1a1a' }}>
        <Sidebar 
          groups={playlistData?.groups || []}
          channels={playlistData?.channels || []}
          onChannelSelect={handleChannelSelect}
          currentChannel={currentChannel}
          loading={loading}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Navbar onLogout={handleLogout} />
          <div style={{ flex: 1, background: '#222', padding: '20px' }}>
            {loading ? (
               <div className="min-h-full flex flex-col items-center justify-center text-white">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>Loading Playlist...</p>
                </div>
            ) : currentChannel ? (
              <VideoPlayer url={currentChannel.url} poster={currentChannel.logo} />
            ) : (
              <div className="text-white text-center">No channels found for the current user. Please upload a playlist.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-white p-10">An unexpected error occurred. Please reload.</div>;
};

export default App;
