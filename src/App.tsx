
import React, { useState, useEffect, useCallback } from 'react';
import { PlaylistData, User, StoredPlaylist, ContentItem, Series, Episode, LiveChannel, Movie } from './types';
import { parseM3U } from './services/m3uParser';
import { storageService } from './services/storage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PlaylistSelector from './components/PlaylistSelector';
import HomePage from './pages/Player/HomePage';
import SeriesDetailPage from './pages/Player/SeriesDetailPage';
import MovieDetailPage from './pages/Player/MovieDetailPage';
import VideoPlayer from './components/VideoPlayer';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'selector' | 'player'>('login');
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Player Navigation State ---
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [itemToPlay, setItemToPlay] = useState<LiveChannel | Movie | Episode | null>(null);

  useEffect(() => {
    const user = storageService.getCurrentUser();
    user ? handleLoginSuccess(user) : setLoading(false);
  }, []);

  const resetPlayerState = () => {
    setSelectedSeries(null);
    setSelectedMovie(null);
    setItemToPlay(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setLoading(false);
    setView(user.role === 'admin' ? 'dashboard' : 'selector');
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setPlaylistData(null);
    resetPlayerState();
    setView('login');
  };

  const loadAndParsePlaylists = (sources: { identifier: string; content: string }[]): PlaylistData | null => {
    let mergedItems: ContentItem[] = [];
    const mergedGroups = new Set<string>();

    sources.forEach(source => {
      try {
        const data = parseM3U(source.content);
        mergedItems.push(...data.items);
        data.groups.forEach(g => mergedGroups.add(g));
      } catch (err) {
        console.error(`Error parsing source: ${source.identifier}`, err);
      }
    });

    if (mergedItems.length === 0) {
      alert("No playable content found in the selected playlist(s).");
      return null;
    }
    return { items: mergedItems, groups: Array.from(mergedGroups).sort() };
  };

  const handleLoadPlaylist = useCallback((storedPlaylist: StoredPlaylist) => {
    setLoading(true);
    setTimeout(() => {
      const data = loadAndParsePlaylists(storedPlaylist.sources);
      if (data) {
        setPlaylistData(data);
        setView('player');
      }
      setLoading(false);
    }, 100);
  }, []);

  const handleLoadAllPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const allPlaylists = await storageService.getPlaylists();
      const allSources = allPlaylists.flatMap(p => p.sources);
      const data = loadAndParsePlaylists(allSources);
      if (data) {
        setPlaylistData(data);
        setView('player');
      }
    } catch (e: any) {
      console.error("Failed to load all playlists:", e);
      alert(`Error loading all playlists: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Navigation from Content Grid --- //
  const handleSelectItem = (item: ContentItem) => {
    switch (item.type) {
      case 'series':
        setSelectedSeries(item);
        break;
      case 'movie':
        setSelectedMovie(item);
        break;
      case 'live':
        setItemToPlay(item);
        break;
    }
  };

  // --- Navigation from Detail Pages --- //
  const handlePlayMovie = (movie: Movie) => setItemToPlay(movie);
  const handlePlayEpisode = (episode: Episode) => setItemToPlay(episode);

  // --- Back / Close Actions --- //
  const handleBackToGrid = () => {
    setSelectedSeries(null);
    setSelectedMovie(null);
  };
  
  const handleClosePlayer = () => setItemToPlay(null);
  
  const handleBackToMenu = () => {
    setView(currentUser?.role === 'admin' ? 'dashboard' : 'selector');
    setPlaylistData(null);
    resetPlayerState();
  };

  // --- Render Logic --- //
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-gray-400 text-xs tracking-widest uppercase">Initializing StreamFlow</p>
      </div>
    );
  }

  const renderPlayerView = () => {
    if (!playlistData || !currentUser) {
        handleBackToMenu();
        return null;
    }

    if (itemToPlay) return <VideoPlayer url={itemToPlay.url} onClose={handleClosePlayer} poster={itemToPlay.logo} />;
    if (selectedMovie) return <MovieDetailPage movie={selectedMovie} onPlay={handlePlayMovie} onBack={handleBackToGrid} />;
    if (selectedSeries) return <SeriesDetailPage series={selectedSeries} onPlayEpisode={handlePlayEpisode} onBack={handleBackToGrid} />;
    
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
    case 'login': return <Login onLogin={handleLoginSuccess} />;
    case 'dashboard': return <AdminDashboard onLogout={handleLogout} onPreview={handleLoadPlaylist} />;
    case 'selector': return <PlaylistSelector onSelect={handleLoadPlaylist} onSelectAll={handleLoadAllPlaylists} onLogout={handleLogout} isAdmin={currentUser?.role === 'admin'} onGoToDashboard={() => setView('dashboard')} />;
    case 'player': return renderPlayerView();
    default: return <div>An unexpected error occurred.</div>;
  }
};

export default App;
