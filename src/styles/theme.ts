/**
 * Global theme configuration
 * This file defines all design tokens used throughout the application
 * including colors, spacing, typography, shadows, and transitions.
 */
const theme = {
  colors: {
    // Brand colors
    primary: '#1DB954', // Spotify green
    secondary: '#191414', // Spotify black
    
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3', // Light gray for secondary text
      tertiary: '#727272', // Darker gray for less important text
    },
    
    // Background colors
    background: {
      primary: '#121212', // Main app background (dark)
      secondary: '#181818', // Secondary background (slightly lighter)
      card: '#282828', // Card and container backgrounds
      elevated: '#333333', // Elevated components like modals
    },
    
    // Semantic colors
    success: '#1ED760', // Brighter green for success states
    error: '#E13300', // Red for errors
    warning: '#F59B23', // Orange for warnings
    info: '#3399FF', // Blue for information
    
    // Gradient presets
    gradients: {
      primary: 'linear-gradient(90deg, #1DB954, #1ED760)',
      dark: 'linear-gradient(180deg, #333333, #121212)',
    },
  },
  
  // Consistent spacing scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  // Border radius scale
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    round: '50%',
    pill: '9999px',
  },
  
  // Typography system
  typography: {
    // Font families
    fontFamily: '"Circular Std", -apple-system, system-ui, sans-serif',
    monoFontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    
    // Font weights
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
    
    // Font sizes scale
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      xxl: '32px',
      xxxl: '48px',
    },
    
    // Line heights
    lineHeights: {
      tight: 1.1,
      normal: 1.5,
      relaxed: 1.8,
    },
    
    // Letter spacing
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.01em',
    },
  },
  
  // Elevation shadows
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.14)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.2)',
    focus: '0 0 0 3px rgba(29, 185, 84, 0.4)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    none: 'none',
  },
  
  // Animation transitions
  transitions: {
    default: '0.3s ease',
    fast: '0.15s ease',
    slow: '0.5s ease',
    bounce: '0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Z-index scale to manage stacking order
  zIndices: {
    base: 0,
    elevated: 1,
    sticky: 100,
    dropdown: 200,
    modal: 300,
    tooltip: 400,
  },
  
  // Media queries for responsive design
  breakpoints: {
    xs: '320px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px',
  },
};

export default theme; 