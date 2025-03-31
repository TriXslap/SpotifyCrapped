import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
// @ts-ignore
import theme from '../styles/theme';

const NavContainer = styled.nav`
  background-color: ${theme.colors.background.secondary};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
`;

const NavList = styled.ul`
  list-style: none;
  display: flex;
  gap: ${theme.spacing.md};
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  position: relative;
`;

const NavLink = styled(Link)<{ active: boolean }>`
  display: block;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  color: ${props => props.active ? theme.colors.text.primary : theme.colors.text.secondary};
  font-weight: ${props => props.active ? theme.typography.fontWeights.bold : theme.typography.fontWeights.medium};
  position: relative;
  z-index: 1;
  transition: color ${theme.transitions.fast};
  
  &:hover {
    color: ${theme.colors.text.primary};
  }
`;

const ActiveIndicator = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.sm};
`;

interface NavLinkData {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const links: NavLinkData[] = [
    { path: '/', label: 'Home' },
    { path: '/top-artists', label: 'Top Artists' },
    { path: '/top-tracks', label: 'Top Tracks' },
    { path: '/playlists', label: 'Playlists' },
    { path: '/profile', label: 'Profile' },
  ];

  return (
    <NavContainer>
      <NavList>
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          
          return (
            <NavItem key={link.path}>
              <NavLink to={link.path} active={isActive}>
                {link.label}
                {isActive && (
                  <ActiveIndicator 
                    layoutId="activeNav"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </NavLink>
            </NavItem>
          );
        })}
      </NavList>
    </NavContainer>
  );
};

export default Navigation; 