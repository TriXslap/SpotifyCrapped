import { css } from 'styled-components';
import theme from './theme';

/**
 * Collection of reusable style mixins for consistent
 * styling across components
 */

// Truncate text with ellipsis
export const truncateText = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Card style preset
export const cardStyle = css`
  background-color: ${theme.colors.background.card};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  box-shadow: ${theme.shadows.sm};
  transition: transform ${theme.transitions.default}, 
              box-shadow ${theme.transitions.default};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${theme.shadows.md};
  }
`;

// Focus ring style
export const focusRing = css`
  &:focus-visible {
    outline: none;
    box-shadow: ${theme.shadows.focus};
  }
`;

// Flex center helper
export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Grid layout helper
export const gridLayout = (columns = 3, gap = theme.spacing.md) => css`
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  gap: ${gap};
  
  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: repeat(${Math.min(columns, 2)}, 1fr);
  }
  
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

// Custom scrollbar styling
export const customScrollbar = css`
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: ${theme.borderRadius.pill};
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: ${theme.borderRadius.pill};
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
  }
`;

// Glass morphism effect
export const glassMorphism = css`
  background: rgba(40, 40, 40, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: ${theme.shadows.sm};
`;

// Text gradient
export const textGradient = (gradient = theme.colors.gradients.primary) => css`
  background: ${gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
`;

// Responsive font size
export const responsiveFontSize = (
  minSize: string, 
  maxSize: string, 
  minWidth = theme.breakpoints.sm, 
  maxWidth = theme.breakpoints.xl
) => css`
  font-size: ${minSize};
  
  @media (min-width: ${minWidth}) {
    font-size: calc(${minSize} + (${parseInt(maxSize)} - ${parseInt(minSize)}) * 
      ((100vw - ${minWidth}) / (${parseInt(maxWidth)} - ${parseInt(minWidth)})));
  }
  
  @media (min-width: ${maxWidth}) {
    font-size: ${maxSize};
  }
`; 