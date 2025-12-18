import React, { useState, useEffect } from 'react';
import { StoredPlaylist } from '../types';
import { storageService } from '../services/storage';

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
    <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700">
        <h1 className="text-xl font-bold text-red-500 flex items-center gap-2"><i className="fas fa-play-circle"></i> StreamFlow</h1>
        <div className="flex items-center gap-4">
            {isAdmin && (
                <button onClick={() => alert("Admin dashboard functionality should be handled in the AdminDashboard component.")} className="text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-cog"></i>
                </button>
            )}
            <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors">
                <i className="fas fa-sign-out-alt"></i><span className="hidden sm:inline ml-2">Logout</span>
            </button>
        </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p>Loading Playlists from Server...</p>
            </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center border border-red-800/50">
                    <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
                    <h2 className="text-xl font-bold mb-2">Failed to Load Content</h2>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
        <Header />
        <main className="p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6 text-white">Select a Playlist</h2>
                
                 {playlists.length === 0 ? (
                    <div className="text-center bg-gray-800 p-8 rounded-lg border border-gray-700">
                        <i className="fas fa-list-ol text-4xl text-gray-500 mb-4"></i>
                        <h3 className="text-xl font-semibold">No Playlists Found on Server</h3>
                        <p className="text-gray-400 mt-2">Admins can create new playlists in the dashboard.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {playlists.map((playlist) => (
                            <button
                                key={playlist.id}
                                onClick={() => onSelect(playlist)}
                                className="bg-gray-800 rounded-lg p-6 text-left hover:bg-gray-700 hover:scale-105 transition-transform duration-200 shadow-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">{playlist.name}</h3>
                                    <i className="fas fa-chevron-right text-gray-500"></i>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">{playlist.sources.length} source(s)</p>
                            </button>
                        ))}

                        {/* "Load All" Card */}
                        <button
                            onClick={onSelectAll}
                            className="bg-red-800 rounded-lg p-6 text-left hover:bg-red-700 hover:scale-105 transition-transform duration-200 shadow-lg border border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Load All Playlists</h3>
                                <i className="fas fa-globe text-red-300"></i>
                            </div>
                            <p className="text-sm text-red-200 mt-2">Merge and play all channels</p>
                        </button>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

export default PlaylistSelector;
