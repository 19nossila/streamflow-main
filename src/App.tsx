
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, Channel, Category, VodStream, SeriesStream, SeriesInfo, Episode } from './types';
import Login from './components/Login';
import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import AppHeader, { ViewType } from './components/AppHeader';
import MoviesGrid from './components/MoviesGrid';
import SeriesGrid from './components/SeriesGrid';
import SeriesDetail from './components/SeriesDetail';

// Store credentials for API requests
let xtreamCredentials = { url: '', user: '', pass: '' };

// Axios interceptor to add Xtream headers to every request
axios.interceptors.request.use(config => {
    // Do not add headers to the login request itself
    if (config.url === '/api/login') {
        return config;
    }
    config.headers['X-Xtream-URL'] = xtreamCredentials.url;
    config.headers['X-Xtream-User'] = xtreamCredentials.user;
    config.headers['X-Xtream-Pass'] = xtreamCredentials.pass;
    return config;
}, error => {
    return Promise.reject(error);
});


const App: React.FC = () => {
  // Auth & View State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('live');

  // State for all content types
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [liveChannels, setLiveChannels] = useState<Channel[]>([]);
  const [vodCategories, setVodCategories] = useState<Category[]>([]);
  const [vodStreams, setVodStreams] = useState<VodStream[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  const [seriesStreams, setSeriesStreams] = useState<SeriesStream[]>([]);
  
  // State for selected items
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [currentMovie, setCurrentMovie] = useState<VodStream | null>(null);
  const [currentSeries, setCurrentSeries] = useState<SeriesInfo | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

  // Global State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoLogin, setIsAutoLogin] = useState(true); // To control initial loading screen

  // Auto-login on component mount
  useEffect(() => {
    const savedCreds = localStorage.getItem('credentials');
    if (savedCreds) {
      const { xtreamUrl, username, password } = JSON.parse(savedCreds);
      handleLoginSuccess(null, { xtreamUrl, username, password }, false); // Attempt auto-login
    } else {
      setIsAutoLogin(false);
    }
  }, []);

  const fetchDataForView = (view: ViewType) => {
    setError(null);
    if (view === 'live' && liveChannels.length === 0) fetchContent('live');
    else if (view === 'movies' && vodStreams.length === 0) fetchContent('vod');
    else if (view === 'series' && seriesStreams.length === 0) fetchContent('series');
  };
  
  const fetchContent = useCallback(async (type: 'live' | 'vod' | 'series') => {
    setLoading(true);
    try {
      const [cat, str] = await Promise.all([
        axios.get(`/get.php`, { params: { action: `get_${type}_categories` } }),
        axios.get(`/get.php`, { params: { action: `get_${type}_streams` } })
      ]);
      if (type === 'live') { setLiveCategories(cat.data || []); setLiveChannels(str.data || []); }
      if (type === 'vod') { setVodCategories(cat.data || []); setVodStreams(str.data || []); }
      if (type === 'series') { setSeriesCategories(cat.data || []); setSeriesStreams(str.data || []); }
    } catch (err) {
        handleFetchError(err, `${type} data`);
    } finally { setLoading(false); }
  }, []);

  const fetchSeriesInfo = useCallback(async (seriesId: number) => {
    setLoading(true);
    try {
        const res = await axios.get(`/get.php`, { params: { action: 'get_series_info', series_id: seriesId } });
        setCurrentSeries(res.data);
    } catch (err) { handleFetchError(err, 'series details'); } finally { setLoading(false); }
  }, []);

  const handleFetchError = (err: any, context: string) => {
    console.error(`Error fetching ${context}:`, err);
    setError(`Failed to load ${context}. Please check credentials and server status.`);
    setLoading(false);
  };

  const handleLoginSuccess = async (userData: any, creds: any, isManualLogin = true) => {
    xtreamCredentials = { url: creds.xtreamUrl, user: creds.username, pass: creds.password };
    
    if (isManualLogin) {
      setCurrentUser(userData.user_info);
      fetchDataForView('live');
    } else {
      // Auto-login: verify credentials silently
      try {
        const response = await axios.post('/api/login', creds);
        setCurrentUser(response.data.user_info);
        fetchDataForView('live');
      } catch (error) {
        console.error("Auto-login failed");
        localStorage.removeItem('credentials'); // Clear invalid stored credentials
        xtreamCredentials = { url: '', user: '', pass: '' }; // Clear in-memory credentials
      } finally {
        setIsAutoLogin(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('credentials');
    xtreamCredentials = { url: '', user: '', pass: '' };
    setCurrentUser(null);
    setCurrentView('live');
    setLiveChannels([]); setVodStreams([]); setSeriesStreams([]);
    resetSelections();
  };

  const resetSelections = () => { setCurrentChannel(null); setCurrentMovie(null); setCurrentSeries(null); setCurrentEpisode(null); };
  const handleNavClick = (view: ViewType) => { resetSelections(); setCurrentView(view); fetchDataForView(view); };
  const handleMovieSelect = (movie: VodStream) => setCurrentMovie(movie);
  const handleSeriesSelect = (series: SeriesStream) => fetchSeriesInfo(series.series_id);
  const handleEpisodePlay = (episode: Episode) => setCurrentEpisode(episode);
  const handleBackToGrid = () => { resetSelections(); };

  if (isAutoLogin) {
      return <div className="h-screen bg-gray-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!currentUser) return <Login onLogin={handleLoginSuccess} />;

  const renderContent = () => {
    if (loading && !currentSeries && liveChannels.length === 0 && vodStreams.length === 0 && seriesStreams.length === 0) {
        return <div className="flex-1 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }
    if (error) return <div className="flex-1 flex items-center justify-center"><div className="text-center text-red-400"><p>{error}</p><button onClick={handleLogout}>Logout</button></div></div>;

    const videoUrl = currentEpisode ? `/series/${currentEpisode.id}.${currentEpisode.container_extension}`
                   : currentMovie ? `/movie/${currentMovie.stream_id}.${currentMovie.container_extension}`
                   : currentChannel ? `/live/${currentChannel.stream_id}.ts` : null;
    const videoPoster = currentEpisode?.info.movie_image || currentMovie?.stream_icon || currentChannel?.stream_icon;

    if (currentEpisode) {
        return <div className="flex-1 bg-black"><VideoPlayer url={videoUrl!} poster={videoPoster} onBack={() => setCurrentEpisode(null)} backButtonText={`Back to ${currentSeries?.info.name}`} /></div>
    }
    if (currentMovie) {
        return <div className="flex-1 bg-black"><VideoPlayer url={videoUrl!} poster={videoPoster} onBack={handleBackToGrid} backButtonText="Back to Movies" /></div>
    }

    switch (currentView) {
      case 'live':
        return <div className="flex flex-1 overflow-hidden"><Sidebar c={liveChannels} cat={liveCategories} cur={currentChannel} onSel={setCurrentChannel} /><div className="flex-1 flex flex-col"><div className="h-14 bg-gray-900/80 flex items-center px-6 shrink-0 border-b border-gray-700"><h2 className="text-lg font-semibold truncate">{currentChannel?.name || 'Select Channel'}</h2></div><div className="flex-1 bg-black">{currentChannel && <VideoPlayer url={videoUrl!} poster={videoPoster} />}</div></div></div>;
      case 'movies':
        return <MoviesGrid movies={vodStreams} categories={vodCategories} onMovieSelect={handleMovieSelect} />;
      case 'series':
        if (loading && !currentSeries) return <div className="flex-1 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
        if (currentSeries) return <SeriesDetail seriesInfo={currentSeries} onPlayEpisode={handleEpisodePlay} onBack={handleBackToGrid} />;
        return <SeriesGrid series={seriesStreams} categories={seriesCategories} onSeriesSelect={handleSeriesSelect} />;
      default: return null;
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <AppHeader user={currentUser} currentView={currentView} onNavClick={handleNavClick} onLogout={handleLogout} />
      {renderContent()}
    </div>
  );
};

export default App;
