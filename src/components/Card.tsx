import React from 'react';
import styled from 'styled-components';
// @ts-ignore
import theme from '../styles/theme';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: keyof typeof theme.spacing;
}

const StyledCard = styled.div<{ 
  hoverable?: boolean; 
  padding: keyof typeof theme.spacing;
}>`
  background-color: ${theme.colors.background.card};
  border-radius: ${theme.borderRadius.md};
  padding: ${props => theme.spacing[props.padding]};
  box-shadow: ${theme.shadows.sm};
  transition: all ${theme.transitions.default};
  
  ${props => props.hoverable && `
    cursor: pointer;
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${theme.shadows.md};
    }
  `}
  
  &:active {
    transform: ${props => props.hoverable ? 'translateY(-2px)' : 'none'};
  }
`;

const Card: React.FC<CardProps> = ({ 
  children, 
  onClick, 
  hoverable = false,
  padding = 'md'
}) => {
  return (
    <StyledCard 
      onClick={onClick}
      hoverable={hoverable}
      padding={padding}
    >
      {children}
    </StyledCard>
  );
};

export default Card; 