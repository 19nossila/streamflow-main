
import React, { useState, useEffect, useCallback } from 'react';
import { PlaylistData, User, StoredPlaylist, ContentItem, Series, Episode, LiveChannel, Movie } from './types';
import { parseM3U } from './services/m3uParser';
import { storageService } from './services/storage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PlaylistSelector from './components/PlaylistSelector';
import HomePage from './pages/Player/HomePage';
import SeriesDetailPage from './pages/Player/SeriesDetailPage';
import VideoPlayer from './components/VideoPlayer';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'selector' | 'player'>('login');
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);

  // State for navigation within the 'player' view
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [itemToPlay, setItemToPlay] = useState<LiveChannel | Movie | Episode | null>(null);

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
    setSelectedSeries(null);
    setItemToPlay(null);
    setView('login');
  };

  const handleLoadPlaylist = useCallback((storedPlaylist: StoredPlaylist) => {
    setLoading(true);
    setTimeout(() => { 
      try {
        let mergedItems: ContentItem[] = [];
        const mergedGroups = new Set<string>();

        if (storedPlaylist.sources.length === 0) {
          alert("This playlist has no M3U sources yet.");
          setLoading(false);
          return;
        }

        storedPlaylist.sources.forEach(source => {
          try {
            const data = parseM3U(source.content);
            mergedItems = [...mergedItems, ...data.items];
            data.groups.forEach(g => mergedGroups.add(g));
          } catch (err) {
            console.error(`Error parsing source: ${source.identifier}`, err);
          }
        });

        if (mergedItems.length === 0) {
          alert("No playable content found.");
          setLoading(false);
          return;
        }

        setPlaylistData({ items: mergedItems, groups: Array.from(mergedGroups).sort() });
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
      let mergedItems: ContentItem[] = [];
      const mergedGroups = new Set<string>();

      allPlaylists.forEach(pl => {
        pl.sources.forEach(source => {
          try {
            const data = parseM3U(source.content);
            mergedItems = [...mergedItems, ...data.items];
            data.groups.forEach(g => mergedGroups.add(g));
          } catch (e) {
            console.warn(`Could not parse source ${source.identifier}:`, e);
          }
        });
      });

      if (mergedItems.length === 0) {
        alert("No content found across all playlists.");
        return;
      }

      setPlaylistData({ items: mergedItems, groups: Array.from(mergedGroups).sort() });
      setView('player');
      
    } catch (e: any) {
      console.error("Failed to load all playlists:", e);
      alert(`Error loading all playlists: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleSelectItem = (item: ContentItem) => {
    if (item.type === 'series') {
      setSelectedSeries(item);
    } else {
      setItemToPlay(item);
    }
  };

  const handlePlayEpisode = (episode: Episode) => {
    setItemToPlay(episode);
  };
  
  const handleBackToGrid = () => {
    setSelectedSeries(null);
  };
  
  const handleClosePlayer = () => {
    setItemToPlay(null);
  };
  
  const handleBackToMenu = () => {
    setView(currentUser?.role === 'admin' ? 'dashboard' : 'selector');
    setPlaylistData(null);
    setSelectedSeries(null);
    setItemToPlay(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Initializing StreamFlow</p>
      </div>
    );
  }

  const renderPlayerView = () => {
    if (!playlistData || !currentUser) {
        setView('selector');
        return null;
    }

    if (itemToPlay) {
        return <VideoPlayer url={itemToPlay.url} onClose={handleClosePlayer} />;
    }

    if (selectedSeries) {
        return <SeriesDetailPage series={selectedSeries} onPlayEpisode={handlePlayEpisode} onBack={handleBackToGrid} />;
    }
    
    return (
      <HomePage
        playlistData={playlistData}
        currentUser={currentUser}
        onLogout={handleLogout}
        onBackToMenu={handleBackToMenu}
        onSwitchToDashboard={() => setView('dashboard')}
        onSelectItem={handleSelectItem}
      />
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
          onGoToDashboard={() => setView('dashboard')}
        />
      );
    case 'player':
      return renderPlayerView();
    default:
      return <div className="text-white p-10 bg-[#0f1117] min-h-screen">An unexpected error occurred. Please reload the application.</div>;
  }
};

export default App;
