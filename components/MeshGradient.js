import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, Circle } from 'react-native-svg';
import { extractColorsFromImage, getDefaultGradientColors } from '../utils/colorExtractor';

const { width, height } = Dimensions.get('window');

// Default colors for countdown screen - prevent image extraction attempts
const COUNTDOWN_COLORS = ['#121212', '#1DB954', '#005b27', '#191414'];

/**
 * A simpler, more efficient MeshGradient component
 * Uses SVG for better performance and visual quality
 */
const MeshGradient = ({ 
  imageUrls = [], 
  colors = [], 
  style = {},
  children,
  isCountdownScreen = false
}) => {
  // Generate unique ID only once on mount
  const uniqueId = useRef(`gradient_${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Memoize gradient IDs
  const gradientIds = useMemo(() => ({
    id1: `${uniqueId}_1`,
    id2: `${uniqueId}_2`,
    id3: `${uniqueId}_3`,
    id4: `${uniqueId}_4`
  }), [uniqueId]);

  // Always start with default colors
  const [gradientColors, setGradientColors] = useState(
    isCountdownScreen ? COUNTDOWN_COLORS : getDefaultGradientColors()
  );
  
  // Used to track if we've attempted color extraction
  const hasAttemptedExtraction = useRef(false);

  // Extract colors whenever imageUrls change, but only in main screen
  useEffect(() => {
    // Skip if this is countdown screen - always use predefined colors
    if (isCountdownScreen) {
      return;
    }
    
    // Skip if we've already attempted extraction or have explicit colors
    if (colors.length >= 4) {
      setGradientColors(colors);
      return;
    }

    // Skip extraction if no valid URLs
    if (!imageUrls || imageUrls.length === 0) {
      return;
    }
    
    // Prevent duplicate extraction attempts
    if (hasAttemptedExtraction.current) {
      return;
    }
    
    hasAttemptedExtraction.current = true;
    let isMounted = true;
    
    const extractColors = async () => {
      try {
        // Initialize with default colors
        const extractedColors = [...getDefaultGradientColors()];
        
        // Try to get colors from first image for positions 0 and 1
        if (imageUrls[0]) {
          try {
            const colors1 = await extractColorsFromImage(imageUrls[0], 2);
            if (colors1 && colors1.length === 2) {
              extractedColors[0] = colors1[0];
              extractedColors[1] = colors1[1];
            }
          } catch (err) {
            // Silent fail
          }
        }
        
        // Try to get colors from second image for positions 2 and 3
        if (imageUrls.length > 1 && imageUrls[1]) {
          try {
            const colors2 = await extractColorsFromImage(imageUrls[1], 2);
            if (colors2 && colors2.length === 2) {
              extractedColors[2] = colors2[0];
              extractedColors[3] = colors2[1];
            }
          } catch (err) {
            // Silent fail
          }
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          setGradientColors(extractedColors);
        }
      } catch (error) {
        // Silent fail - keep default colors
      }
    };

    // Execute the extraction
    extractColors();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [imageUrls, colors, isCountdownScreen]);

  return (
    <View style={[styles.container, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Create radial gradients for each blob with unique IDs */}
          <RadialGradient id={gradientIds.id1} cx="10%" cy="20%" r="80%" fx="10%" fy="20%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={gradientColors[0]} stopOpacity="0" />
          </RadialGradient>
          
          <RadialGradient id={gradientIds.id2} cx="90%" cy="30%" r="80%" fx="90%" fy="30%">
            <Stop offset="0%" stopColor={gradientColors[1]} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="0" />
          </RadialGradient>
          
          <RadialGradient id={gradientIds.id3} cx="80%" cy="90%" r="80%" fx="80%" fy="90%">
            <Stop offset="0%" stopColor={gradientColors[2]} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={gradientColors[2]} stopOpacity="0" />
          </RadialGradient>
          
          <RadialGradient id={gradientIds.id4} cx="20%" cy="80%" r="80%" fx="20%" fy="80%">
            <Stop offset="0%" stopColor={gradientColors[3]} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={gradientColors[3]} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        
        {/* Background */}
        <Rect width="100%" height="100%" fill="#121212" />
        
        {/* Gradient circles */}
        <Circle cx="10%" cy="20%" r={width * 0.6} fill={`url(#${gradientIds.id1})`} />
        <Circle cx="90%" cy="30%" r={width * 0.65} fill={`url(#${gradientIds.id2})`} />
        <Circle cx="80%" cy="90%" r={width * 0.55} fill={`url(#${gradientIds.id3})`} />
        <Circle cx="20%" cy="80%" r={width * 0.5} fill={`url(#${gradientIds.id4})`} />
      </Svg>
      
      {/* Content container */}
      <View style={styles.childrenContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  childrenContainer: {
    flex: 1,
    position: 'relative',
  }
});

export default MeshGradient; 