
import React from 'react';
import styled from 'styled-components';

const NavWrapper = styled.nav`
  height: 60px;
  background: #111;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
`;

const NavMenu = styled.div`
  display: flex;
  align-items: center;
`;

const NavItem = styled.a`
  margin: 0 15px;
  color: #fff;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #f00;
  }
`;

const LogoutButton = styled.button`
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
    margin-left: 15px;

    &:hover {
        color: #f00;
    }
`;

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  return (
    <NavWrapper>
      <Logo>StreamFlow</Logo>
      <NavMenu>
        <NavItem>TV Guide</NavItem>
        <NavItem>Search</NavItem>
        <NavItem>Categories</NavItem>
        <NavItem>Menu</NavItem>
        <LogoutButton onClick={onLogout}>Logout</LogoutButton>
      </NavMenu>
    </NavWrapper>
  );
};

export default Navbar;
