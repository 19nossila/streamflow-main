
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

const Navbar: React.FC = () => {
  return (
    <NavWrapper>
      <Logo>StreamFlow</Logo>
      <NavMenu>
        <NavItem>TV Guide</NavItem>
        <NavItem>Search</NavItem>
        <NavItem>Categories</NavItem>
        <NavItem>Menu</NavItem>
      </NavMenu>
    </NavWrapper>
  );
};

export default Navbar;
