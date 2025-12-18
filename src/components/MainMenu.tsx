
import React from 'react';
import styled from 'styled-components';

const MainMenuWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #111;
`;

const MenuItem = styled.div`
  margin: 20px 0;
  padding: 15px 30px;
  font-size: 24px;
  color: #fff;
  background: #333;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #555;
  }
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
  onSelect: (view: 'live' | 'movies' | 'series') => void;
  onLogout: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelect, onLogout }) => {
  return (
    <MainMenuWrapper>
      <LogoutButton onClick={onLogout}>Logout</LogoutButton>
      <MenuItem onClick={() => onSelect('live')}>Live Channels</MenuItem>
      <MenuItem onClick={() => onSelect('movies')}>Movies</MenuItem>
      <MenuItem onClick={() => onSelect('series')}>TV Series</MenuItem>
    </MainMenuWrapper>
  );
};

export default MainMenu;
