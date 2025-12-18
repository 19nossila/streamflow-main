
import React, { useState } from 'react';
import styled from 'styled-components';
import { Channel } from '../types';

const SidebarWrapper = styled.div`
  width: 280px;
  background: #111;
  color: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const Logo = styled.div`
  padding: 20px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  background: #000;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const GroupItem = styled.li`
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid #333;
  font-weight: bold;
  &:hover {
    background: #333;
  }
`;

const ChannelList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  background: #222;
`;

const ChannelItem = styled.li<{
  isActive: boolean
}>`
  padding: 10px 30px;
  cursor: pointer;
  background: ${props => props.isActive ? '#c9302c' : 'transparent'};
  border-bottom: 1px solid #333;
  font-size: 0.9em;

  &:hover {
    background: #444;
  }
`;

const LoadingWrapper = styled.div`
    padding: 20px;
    text-align: center;
`;

interface SidebarProps {
  groups: string[];
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
  currentChannel: Channel | null;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ groups, channels, onChannelSelect, currentChannel, loading }) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const handleGroupClick = (group: string) => {
    setOpenGroup(openGroup === group ? null : group);
  };

  if (loading) {
      return (
          <SidebarWrapper>
              <Logo>StreamFlow</Logo>
              <LoadingWrapper>Loading channels...</LoadingWrapper>
          </SidebarWrapper>
      )
  }

  return (
    <SidebarWrapper>
      <Logo>StreamFlow</Logo>
      <NavList>
        {groups.map(group => (
          <React.Fragment key={group}>
            <GroupItem onClick={() => handleGroupClick(group)}>
              {group}
            </GroupItem>
            {openGroup === group && (
              <ChannelList>
                {channels
                  .filter(channel => channel.group === group)
                  .map(channel => (
                    <ChannelItem 
                      key={channel.id}
                      isActive={currentChannel?.id === channel.id}
                      onClick={() => onChannelSelect(channel)}
                    >
                      {channel.name}
                    </ChannelItem>
                  ))}
              </ChannelList>
            )}
          </React.Fragment>
        ))}
      </NavList>
    </SidebarWrapper>
  );
};

export default Sidebar;
