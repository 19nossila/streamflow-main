
import React, { useState } from 'react';
import styled from 'styled-components';
import { StoredPlaylist, User } from '../types'; // Import User type

const MainMenuWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background: #1e1e1e;
  color: white;
`;

const Title = styled.h1`
  color: #fff;
  margin-bottom: 40px;
`;

const PlaylistSection = styled.div`
  width: 80%;
  max-width: 600px;
  text-align: center;
`;

const PlaylistList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 20px;
`;

const PlaylistItem = styled.li`
  background: #333;
  padding: 15px;
  margin: 10px 0;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #444;
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin: 5px;

  &:hover {
    background-color: #0056b3;
  }
`;

const Input = styled.input`
    padding: 10px;
    margin-right: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
`;

const LogoutButton = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    background: #d9534f;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        background: #c9302c;
    }
`;

interface MainMenuProps {
  currentUser: User; // Pass the whole user object
  onCreatePlaylist: (name: string) => void;
  onSelectPlaylist: (playlist: StoredPlaylist) => void;
  playlists: StoredPlaylist[];
  onLogout: () => void;
  loading: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ currentUser, onCreatePlaylist, onSelectPlaylist, playlists, onLogout, loading }) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateInput(false);
    }
  };

  return (
    <MainMenuWrapper>
      <LogoutButton onClick={onLogout}>Logout</LogoutButton>
      <Title>Welcome, {currentUser.username}!</Title>
      
      <PlaylistSection>
        <h2>Your Playlists</h2>
        {loading ? (
          <p>Loading playlists...</p>
        ) : (
          <>
            <PlaylistList>
              {playlists.length > 0 ? (
                playlists.map(p => (
                  <PlaylistItem key={p.id} onClick={() => onSelectPlaylist(p)}>
                    {p.name}
                  </PlaylistItem>
                ))
              ) : (
                <p>No playlists found. Create one to get started!</p>
              )}
            </PlaylistList>
            
            {/* Only show create option to admins */}
            {currentUser.role === 'admin' && (
              <div>
                {showCreateInput ? (
                  <div>
                    <Input 
                      type="text" 
                      value={newPlaylistName}
                      onChange={e => setNewPlaylistName(e.target.value)}
                      placeholder="Enter new playlist name"
                    />
                    <Button onClick={handleCreate}>Confirm</Button>
                    <Button onClick={() => setShowCreateInput(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button onClick={() => setShowCreateInput(true)}>Create New Playlist</Button>
                )}
              </div>
            )}
          </>
        )}
      </PlaylistSection>

    </MainMenuWrapper>
  );
};

export default MainMenu;
