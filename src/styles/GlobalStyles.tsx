import { createGlobalStyle } from 'styled-components';
// @ts-ignore
import theme from './theme';

/**
 * Global styles applied to the entire application
 * Includes reset styles, base typography, and animation classes
 */
const GlobalStyles = createGlobalStyle`
  /* Reset styles */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  /* Set base font and colors */
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
  }
  
  body {
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.sizes.md};
    line-height: ${theme.typography.lineHeights.normal};
    background-color: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    overflow-x: hidden;
    min-height: 100vh;
  }
  
  /* Improved typography defaults */
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${theme.typography.fontWeights.bold};
    line-height: ${theme.typography.lineHeights.tight};
    margin-bottom: ${theme.spacing.md};
  }
  
  h1 {
    font-size: ${theme.typography.sizes.xxxl};
    letter-spacing: ${theme.typography.letterSpacing.tight};
  }
  
  h2 {
    font-size: ${theme.typography.sizes.xxl};
  }
  
  h3 {
    font-size: ${theme.typography.sizes.xl};
  }
  
  h4 {
    font-size: ${theme.typography.sizes.lg};
  }
  
  h5 {
    font-size: ${theme.typography.sizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
  }
  
  h6 {
    font-size: ${theme.typography.sizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    text-transform: uppercase;
    letter-spacing: ${theme.typography.letterSpacing.wide};
  }
  
  p {
    margin-bottom: ${theme.spacing.md};
  }
  
  /* Link styles */
  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    transition: color ${theme.transitions.fast};
    
    &:hover {
      color: ${theme.colors.success};
      text-decoration: underline;
    }
    
    &:focus-visible {
      outline: none;
      box-shadow: ${theme.shadows.focus};
      border-radius: ${theme.borderRadius.xs};
    }
  }
  
  /* Button reset */
  button {
    background: none;
    border: none;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    color: inherit;
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    &:focus-visible {
      outline: none;
      box-shadow: ${theme.shadows.focus};
      border-radius: ${theme.borderRadius.sm};
    }
  }
  
  /* List styles */
  ul, ol {
    padding-left: ${theme.spacing.lg};
    margin-bottom: ${theme.spacing.md};
  }
  
  /* Image defaults */
  img {
    max-width: 100%;
    height: auto;
  }
  
  /* Form elements */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    border: 1px solid ${theme.colors.text.tertiary};
    border-radius: ${theme.borderRadius.sm};
    background-color: rgba(0, 0, 0, 0.1);
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    transition: all ${theme.transitions.fast};
    
    &:focus {
      outline: none;
      border-color: ${theme.colors.primary};
      box-shadow: ${theme.shadows.focus};
    }
    
    &::placeholder {
      color: ${theme.colors.text.tertiary};
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  /* Selection styling */
  ::selection {
    background-color: ${theme.colors.primary};
    color: white;
  }
  
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${theme.colors.background.secondary};
  }
  
  ::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: ${theme.borderRadius.pill};
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
  
  /* Helper classes */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  /* Animation utility classes */
  .fade-in {
    animation: fadeIn 0.3s ease forwards;
  }
  
  .slide-up {
    animation: slideUp 0.4s ease forwards;
  }
  
  /* Keyframe animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Container and grid helpers */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 ${theme.spacing.md};
  }
  
  /* Responsive design adjustments */
  @media (max-width: ${theme.breakpoints.sm}) {
    html {
      font-size: 14px;
    }
    
    h1 {
      font-size: ${theme.typography.sizes.xxl};
    }
    
    h2 {
      font-size: ${theme.typography.sizes.xl};
    }
    
    h3 {
      font-size: ${theme.typography.sizes.lg};
    }
  }
`;

export default GlobalStyles; 