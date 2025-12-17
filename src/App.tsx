
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, Channel, Category, VodStream, SeriesStream, SeriesInfo, Episode, Playlist } from './types';

// --- Child Components ---
import PlayerLogin from './components/PlayerLogin';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import AppHeader, { ViewType } from './components/AppHeader';
import MoviesGrid from './components/MoviesGrid';
import SeriesGrid from './components/SeriesGrid';
import SeriesDetail from './components/SeriesDetail';


// =================================================================================================
// --- PLAYER APPLICATION ---
// =================================================================================================

const PlayerApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<number | null>(null);
  
  const [currentView, setCurrentView] = useState<ViewType>('live');

  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [liveChannels, setLiveChannels] = useState<Channel[]>([]);
  const [vodCategories, setVodCategories] = useState<Category[]>([]);
  const [vodStreams, setVodStreams] = useState<VodStream[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  const [seriesStreams, setSeriesStreams] = useState<SeriesStream[]>([]);
  
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [currentMovie, setCurrentMovie] = useState<VodStream | null>(null);
  const [currentSeries, setCurrentSeries] = useState<SeriesInfo | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (data: { user_info: User, playlists: Playlist[] }) => {
    setUser(data.user_info);
    setPlaylists(data.playlists);
    // For simplicity, automatically select the first available playlist.
    if (data.playlists.length > 0) {
      setActivePlaylistId(data.playlists[0].id);
    } else {
      setError("No playlists have been assigned to your account.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPlaylists([]);
    setActivePlaylistId(null);
    // Reset all content
    setLiveChannels([]); setVodStreams([]); setSeriesStreams([]);
    resetSelections();
  };

  const fetchContent = useCallback(async (type: 'live' | 'vod' | 'series') => {
    if (!activePlaylistId) return;
    setLoading(true);
    try {
      const [cat, str] = await Promise.all([
        axios.get(`/api/proxy/playlist/${activePlaylistId}/get`, { params: { action: `get_${type}_categories` } }),
        axios.get(`/api/proxy/playlist/${activePlaylistId}/get`, { params: { action: `get_${type}_streams` } })
      ]);
      if (type === 'live') { setLiveCategories(cat.data || []); setLiveChannels(str.data || []); }
      if (type === 'vod') { setVodCategories(cat.data || []); setVodStreams(str.data || []); }
      if (type === 'series') { setSeriesCategories(cat.data || []); setSeriesStreams(str.data || []); }
    } catch (err) { setError(`Failed to load ${type} data.`); } 
    finally { setLoading(false); }
  }, [activePlaylistId]);

  const fetchSeriesInfo = useCallback(async (seriesId: number) => {
    if (!activePlaylistId) return;
    setLoading(true);
    try {
        const res = await axios.get(`/api/proxy/playlist/${activePlaylistId}/get`, { params: { action: `get_series_info&series_id=${seriesId}` } });
        setCurrentSeries(res.data);
    } catch (err) { setError('Failed to load series details.'); } 
    finally { setLoading(false); }
  }, [activePlaylistId]);

  useEffect(() => {
    if (activePlaylistId) {
      fetchDataForView(currentView);
    }
  }, [activePlaylistId]); // Fetch data when a playlist is activated

  const fetchDataForView = (view: ViewType) => {
    if (view === 'live' && liveChannels.length === 0) fetchContent('live');
    else if (view === 'movies' && vodStreams.length === 0) fetchContent('vod');
    else if (view === 'series' && seriesStreams.length === 0) fetchContent('series');
  };

  const resetSelections = () => { setCurrentChannel(null); setCurrentMovie(null); setCurrentSeries(null); setCurrentEpisode(null); };
  const handleNavClick = (view: ViewType) => { resetSelections(); setCurrentView(view); fetchDataForView(view); };
  
  if (!user) return <PlayerLogin onLogin={handleLogin} />;

  if (error) return <div className="flex-1 flex flex-col items-center justify-center"><div className="text-center text-red-400"><p>{error}</p><button onClick={handleLogout} className="mt-4 bg-red-600 px-4 py-2 rounded">Logout</button></div></div>;
  if (!activePlaylistId) return <div className="h-screen bg-gray-900 flex items-center justify-center text-white"><p>No playable playlist selected.</p></div>

  const renderContent = () => {
    const videoUrl = currentEpisode ? `/api/proxy/playlist/${activePlaylistId}/series/${currentEpisode.id}.${currentEpisode.container_extension}`
                   : currentMovie ? `/api/proxy/playlist/${activePlaylistId}/movie/${currentMovie.stream_id}.${currentMovie.container_extension}`
                   : currentChannel ? `/api/proxy/playlist/${activePlaylistId}/live/${currentChannel.stream_id}.ts` : null;
    const videoPoster = currentEpisode?.info.movie_image || currentMovie?.stream_icon || currentChannel?.stream_icon;

    if (currentEpisode) return <div className="flex-1 bg-black"><VideoPlayer url={videoUrl!} poster={videoPoster} onBack={() => setCurrentEpisode(null)} backButtonText={`Back to ${currentSeries?.info.name}`} /></div>
    if (currentMovie) return <div className="flex-1 bg-black"><VideoPlayer url={videoUrl!} poster={videoPoster} onBack={resetSelections} backButtonText="Back to Movies" /></div>

    if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

    switch (currentView) {
      case 'live': return <div className="flex flex-1 overflow-hidden"><Sidebar c={liveChannels} cat={liveCategories} cur={currentChannel} onSel={setCurrentChannel} /><div className="flex-1 flex flex-col"><div className="h-14 bg-gray-900/80 flex items-center px-6 shrink-0 border-b border-gray-700"><h2 className="text-lg font-semibold truncate">{currentChannel?.name || 'Select Channel'}</h2></div><div className="flex-1 bg-black">{currentChannel && <VideoPlayer url={videoUrl!} poster={videoPoster} />}</div></div></div>;
      case 'movies': return <MoviesGrid movies={vodStreams} categories={vodCategories} onMovieSelect={setCurrentMovie} />;
      case 'series': 
        if (currentSeries) return <SeriesDetail seriesInfo={currentSeries} onPlayEpisode={setCurrentEpisode} onBack={resetSelections} />;
        return <SeriesGrid series={seriesStreams} categories={seriesCategories} onSeriesSelect={(s) => fetchSeriesInfo(s.series_id)} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <AppHeader user={user} currentView={currentView} onNavClick={handleNavClick} onLogout={handleLogout} />
      {renderContent()}
    </div>
  );
}


// =================================================================================================
// --- MAIN APP ROUTER ---
// =================================================================================================

const App: React.FC = () => {
  const [isAdminView, setIsAdminView] = useState(window.location.pathname.startsWith('/admin'));
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const handleUriChange = () => setIsAdminView(window.location.pathname.startsWith('/admin'));
    window.addEventListener('popstate', handleUriChange); // For browser back/forward
    // Also handle direct navigation via a custom event if needed, but this is often enough
    return () => window.removeEventListener('popstate', handleUriChange);
  }, []);

  const handleAdminLogin = (adminData: any) => {
    sessionStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('admin');
    setAdmin(null);
  };

  useEffect(() => {
    const savedAdmin = sessionStorage.getItem('admin');
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
  }, []);

  if (isAdminView) {
    return admin ? <AdminPanel admin={admin} onLogout={handleAdminLogout} /> : <AdminLogin onLoginSuccess={handleAdminLogin} />;
  }
  
  return <PlayerApp />;
};

export default App;
