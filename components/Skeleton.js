import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

/**
 * Enhanced Skeleton Loader with Shimmer Effect
 */
const SkeletonLoader = ({ 
  width = '100%', 
  height = 16, 
  borderRadius = 4,
  style
}) => {
  // Animation value for shimmer effect
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Start shimmer animation on component mount
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    
    shimmerAnimation.start();
    
    // Clean up animation on unmount
    return () => {
      shimmerAnimation.stop();
    };
  }, []);
  
  // Calculate the shimmer animation position
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          width: typeof width === 'string' ? width : width,
          height: height,
          borderRadius: borderRadius
        },
        style
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }]
          }
        ]}
      />
    </View>
  );
};

// Specialized skeleton components
export const TextSkeleton = ({ width = '80%', height = 16, ...props }) => (
  <SkeletonLoader width={width} height={height} {...props} />
);

export const CircleSkeleton = ({ size = 48, ...props }) => (
  <SkeletonLoader 
    width={size} 
    height={size} 
    borderRadius={size/2} 
    {...props} 
  />
);

export const CardSkeleton = ({ height = 120, ...props }) => (
  <SkeletonLoader 
    height={height} 
    borderRadius={8} 
    {...props} 
  />
);

// Artist skeleton display
export const ArtistSkeleton = () => (
  <View style={styles.artistSkeletonContainer}>
    <CircleSkeleton size={64} />
    <View style={styles.artistTextContainer}>
      <TextSkeleton width='70%' height={20} style={styles.skeletonMargin} />
      <TextSkeleton width='40%' height={16} />
    </View>
  </View>
);

// Track skeleton display
export const TrackSkeleton = () => (
  <View style={styles.trackSkeletonContainer}>
    <SkeletonLoader 
      width={64} 
      height={64} 
      borderRadius={4} 
    />
    <View style={styles.trackTextContainer}>
      <TextSkeleton width='60%' height={18} style={styles.skeletonMargin} />
      <TextSkeleton width='40%' height={14} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  shimmer: {
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  artistSkeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
  },
  artistTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  trackSkeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
  },
  trackTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  skeletonMargin: {
    marginBottom: 8,
  }
});

export default SkeletonLoader; 