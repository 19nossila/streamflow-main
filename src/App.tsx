
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { parse, Channel, Playlist } from 'iptv-playlist-parser';
import { storageService } from './services/storage';
import { User, StoredPlaylist, PlaylistData } from './types';
import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import MainMenu from './components/MainMenu';

const AppWrapper = styled.div`
  display: flex;
  height: 100vh;
  background: #222;
`;

const MainContent = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [playlistData, setPlaylistData] = useState<PlaylistData>({ channels: [], groups: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const loadPlaylists = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const storedPlaylists = await storageService.getPlaylists();
      const userPlaylists = storedPlaylists.filter(pl => pl.userId === currentUser.id);
      setPlaylists(userPlaylists);
      if (userPlaylists.length > 0) {
        await processPlaylist(userPlaylists[0]);
      } else {
        setPlaylistData({ channels: [], groups: [] });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const processPlaylist = async (playlist: StoredPlaylist) => {
    setLoading(true);
    try {
      const allChannels: Channel[] = [];
      const allGroups = new Set<string>();

      for (const source of playlist.sources) {
        const result: Playlist = parse(source.content);
        result.items.forEach(item => {
          const channel: Channel = {
            id: `${playlist.id}-${item.url}`,
            name: item.name,
            logo: item.tvg.logo || null,
            url: item.url,
            group: item.group.title || 'General',
          };
          allChannels.push(channel);
          allGroups.add(channel.group);
        });
      }

      setPlaylistData({ channels: allChannels, groups: Array.from(allGroups) });
    } catch (err: any) {
      setError(`Failed to process playlist: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    storageService.login(user.username, user.password || '');
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setPlaylists([]);
    setPlaylistData({ channels: [], groups: [] });
    setCurrentChannel(null);
  };

  const handleCreatePlaylist = async (name: string) => {
    if (!currentUser) return;
    try {
      const newPlaylist = await storageService.createPlaylist(name, currentUser.id);
      setPlaylists(prev => [...prev, newPlaylist]);
    } catch (err: any) {
      setError(`Failed to create playlist: ${err.message}`);
    }
  };

  if (loading && !currentUser) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AppWrapper>
      {playlistData.channels.length > 0 ? (
        <>
          <Sidebar
            groups={playlistData.groups}
            channels={playlistData.channels}
            onChannelSelect={setCurrentChannel}
            currentChannel={currentChannel}
            loading={loading}
          />
          <MainContent>
            <VideoPlayer channel={currentChannel} onLogout={handleLogout} />
          </MainContent>
        </>
      ) : (
        <MainMenu 
          currentUser={currentUser} // Pass the user
          onLogout={handleLogout} 
          onCreatePlaylist={handleCreatePlaylist} 
          playlists={playlists} 
          onSelectPlaylist={processPlaylist}
          loading={loading}
        />
      )}
      {error && <div style={{ color: 'red', position: 'absolute', bottom: '10px', left: '10px' }}>{error}</div>}
    </AppWrapper>
  );
};

export default App;
