import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

/**
 * Simple Text component that acts as a wrapper around React Native's Text component.
 * This component is designed to be a drop-in replacement that won't cause typing errors.
 */
const Text = ({
  children,
  style,
  color = 'primary',
  variant = 'body',
  weight = 'regular',
  ...props
}) => {
  // Add console logs to debug props
  console.log('[DEBUG TEXT] Rendering Text with props:', { color, variant, weight });
  
  // Create a default style based on the variant and weight
  let variantStyle = {};
  
  // Basic variants
  switch (variant) {
    case 'heading':
      variantStyle = styles.heading;
      break;
    case 'subheading':
      variantStyle = styles.subheading;
      break;
    case 'body':
      variantStyle = styles.body;
      break;
    case 'caption':
      variantStyle = styles.caption;
      break;
    default:
      variantStyle = styles.body;
  }
  
  // Weight mapping
  let fontWeight = '400'; // default regular
  switch (weight) {
    case 'light':
      fontWeight = '300';
      break;
    case 'regular':
      fontWeight = '400';
      break;
    case 'medium':
      fontWeight = '500';
      break;
    case 'semibold':
    case 'semiBold':
      fontWeight = '600';
      break;
    case 'bold':
      fontWeight = '700';
      break;
    case 'extraBold':
      fontWeight = '800';
      break;
    default:
      fontWeight = '400';
  }
  
  // Color mapping
  let textColor = 'white';
  switch (color) {
    case 'primary':
      textColor = 'white';
      break;
    case 'secondary':
      textColor = 'rgba(255, 255, 255, 0.7)';
      break;
    case 'tertiary':
      textColor = 'rgba(255, 255, 255, 0.5)';
      break;
    case 'accent':
      textColor = '#1DB954'; // Spotify green
      break;
    default:
      textColor = 'white';
  }
  
  const combinedStyle = [
    variantStyle,
    { fontWeight, color: textColor },
    style
  ];
  
  return (
    <RNText
      style={combinedStyle}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 18,
    marginBottom: 4,
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 12,
  }
});

export default Text; 