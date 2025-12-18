
import React, { useState } from 'react';
import styled from 'styled-components';

const SidebarWrapper = styled.div`
  width: 280px;
  background: #111;
  color: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Logo = styled.div`
  padding: 20px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid #333;
  &:hover {
    background: #333;
  }
`;

const SubNav = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  background: #222;
`;

const SubNavItem = styled.li`
  padding: 10px 30px;
  cursor: pointer;
  &:hover {
    background: #444;
  }
`;

const Sidebar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <SidebarWrapper>
      <Logo>StreamFlow</Logo>
      <NavList>
        <NavItem onClick={() => handleMenuClick('live')}>
          Live Channels
        </NavItem>
        {openMenu === 'live' && (
          <SubNav>
            <SubNavItem>Search</SubNavItem>
            <SubNavItem>TV Guide</SubNavItem>
            <SubNavItem>Select Category</SubNavItem>
          </SubNav>
        )}
        <NavItem onClick={() => handleMenuClick('movies')}>
          Movies
        </NavItem>
        {openMenu === 'movies' && (
          <SubNav>
            <SubNavItem>Search</SubNavItem>
            <SubNavItem>Select Category</SubNavItem>
          </SubNav>
        )}
        <NavItem onClick={() => handleMenuClick('series')}>
          TV Series
        </NavItem>
        {openMenu === 'series' && (
          <SubNav>
            <SubNavItem>Search</SubNavItem>
            <SubNavItem>Select Category</SubNavItem>
          </SubNav>
        )}
        <NavItem>Account Info</NavItem>
      </NavList>
    </SidebarWrapper>
  );
};

export default Sidebar;
