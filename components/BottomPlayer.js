import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text as RNText,
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../src/theme';
import IconSet from './IconSet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom navigation bar component for the app with animations
 */
const BottomPlayer = ({ 
  currentRouteName = null
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get('window').width;
  
  // Animation values for tab indicators
  const statsScale = React.useRef(new Animated.Value(currentRouteName === 'SpotifyCrapped' ? 1 : 0)).current;
  const profileScale = React.useRef(new Animated.Value(currentRouteName === 'ProfileScreen' ? 1 : 0)).current;
  const connectScale = React.useRef(new Animated.Value(currentRouteName === 'SpotifyConnect' ? 1 : 0)).current;
  
  // Update animations when the current route changes
  useEffect(() => {
    // Animate the active tab indicator
    Animated.parallel([
      Animated.timing(statsScale, {
        toValue: currentRouteName === 'SpotifyCrapped' ? 1 : 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(profileScale, {
        toValue: currentRouteName === 'ProfileScreen' ? 1 : 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(connectScale, {
        toValue: currentRouteName === 'SpotifyConnect' ? 1 : 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  }, [currentRouteName]);
  
  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };
  
  // Calculate safe area bottom padding
  const bottomPadding = Math.max(insets.bottom, 0);
  
  return (
    <View style={[
      styles.container, 
      { paddingBottom: bottomPadding }
    ]}>
      {/* Tab Navigation Area */}
      <View style={styles.tabBar}>
        {/* Stats Tab */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigateTo('SpotifyCrapped')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Animated.View 
              style={[
                styles.activeIndicator,
                {
                  opacity: statsScale,
                  transform: [{ scaleX: statsScale }]
                }
              ]} 
            />
            <IconSet 
              name="stats-chart" 
              size={24} 
              color={currentRouteName === 'SpotifyCrapped' ? '#1DB954' : 'rgba(255, 255, 255, 0.7)'} 
            />
            <RNText style={[
              styles.tabLabel,
              currentRouteName === 'SpotifyCrapped' && styles.activeTabLabel
            ]}>
              Stats
            </RNText>
          </View>
        </TouchableOpacity>
        
        {/* Profile Tab */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigateTo('ProfileScreen')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Animated.View 
              style={[
                styles.activeIndicator,
                {
                  opacity: profileScale,
                  transform: [{ scaleX: profileScale }]
                }
              ]} 
            />
            <IconSet 
              name="person" 
              size={24} 
              color={currentRouteName === 'ProfileScreen' ? '#1DB954' : 'rgba(255, 255, 255, 0.7)'} 
            />
            <RNText style={[
              styles.tabLabel,
              currentRouteName === 'ProfileScreen' && styles.activeTabLabel
            ]}>
              Profile
            </RNText>
          </View>
        </TouchableOpacity>
        
        {/* Connect Tab */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigateTo('SpotifyConnect')}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Animated.View 
              style={[
                styles.activeIndicator,
                {
                  opacity: connectScale,
                  transform: [{ scaleX: connectScale }]
                }
              ]} 
            />
            <IconSet 
              name="musical-notes" 
              size={24} 
              color={currentRouteName === 'SpotifyConnect' ? '#1DB954' : 'rgba(255, 255, 255, 0.7)'} 
            />
            <RNText style={[
              styles.tabLabel,
              currentRouteName === 'SpotifyConnect' && styles.activeTabLabel
            ]}>
              Connect
            </RNText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 12,
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: 'row',
    height: 56, // Fixed height for the tab bar
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 6,
    width: '100%',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  activeTabLabel: {
    color: '#1DB954',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1DB954',
  }
});

export default BottomPlayer; 