// theme.js - Central location for styling constants and design system
import { Platform } from 'react-native';

// Add this debug log at the top of the file
console.log('[DEBUG] theme.js is being loaded');

// Colors
export const colors = {
  // Primary brand colors
  primary: '#1ED760', // Spotify green - our accent color
  secondary: '#181818', // Dark gray
  
  // UI backgrounds
  background: {
    primary: '#121212', // Main background
    secondary: '#212121', // Card background
    gradient: {
      start: '#121212',
      middle: '#202020',
      end: '#303030',
    },
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#6C6C6C',
    accent: '#1ED760',
  },
  
  // Status colors
  status: {
    success: '#1ED760',
    error: '#F15E5E',
    warning: '#FFAE42',
  },
  
  // Utility colors
  divider: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

// Typography
export const typography = {
  // Font family
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System-UI, -apple-system, BlinkMacSystemFont, sans-serif'
  }),
  
  // Font sizes
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 42,
  },
  
  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 30,
    xxl: 36,
    xxxl: 48,
  },
  
  // Font weights
  weight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    semibold: '600', // Add both versions
    bold: '700',
    extraBold: '800'
  }
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
  circle: 999,
};

// Shadows
export const shadows = Platform.select({
  web: {
    light: {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    medium: {
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.15)',
    },
    strong: {
      boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.2)',
    },
  },
  default: {
    light: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    strong: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  }
});

// Animation constants
export const animation = {
  defaultDuration: 300, // ms
  longDuration: 500, // ms
};

// Layout constants
export const layout = {
  contentPadding: spacing.md,
  cardSpacing: spacing.md,
  bottomSafeArea: Platform.OS === 'ios' ? 90 : 80, // Updated space to account for bottom player
}; 