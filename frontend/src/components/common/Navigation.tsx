import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Nav = styled.nav`
  background-color: #34495e;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2rem;
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLink = styled(Link)`
  color: #ecf0f1;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2c3e50;
  }
  
  &.active {
    background-color: #3498db;
  }
`;

const Navigation: React.FC = () => {
  return (
    <Nav>
      <NavList>
        <NavItem>
          <NavLink to="/">Panel de Control</NavLink>
        </NavItem>
        <NavItem>
          <NavLink to="/inventory">Inventario</NavLink>
        </NavItem>
        <NavItem>
          <NavLink to="/sales">Ventas</NavLink>
        </NavItem>
      </NavList>
    </Nav>
  );
};

export default Navigation;