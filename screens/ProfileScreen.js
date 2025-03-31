// Import required React hooks and components
import React, { useEffect, useState, useRef } from 'react'; // Import React and hooks for state/effects
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,      
  ActivityIndicator, 
  Image,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Text as RNText
} from 'react-native'; // Import core React Native UI components
import { LinearGradient } from 'expo-linear-gradient'; // Import gradient background component
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for icons
import { auth, db } from '../firebase/config'; // Import Firebase auth and database instances
import { signOut } from 'firebase/auth'; // Import Firebase signout method
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore database methods
import NetInfo from '@react-native-community/netinfo'; // Import network connectivity checker
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage for storing tokens
import { colors, spacing, borderRadius, shadows } from '../src/theme'; // Import theme constants
import Text from '../components/Text'; // Import Text component for consistent text styling
import Card from '../components/Card'; // Import Card component for user stats
import Button from '../components/Button'; // Import Button component for action buttons
import IconSet from '../components/IconSet';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import safe area hooks

// Get screen dimensions for responsive layout
const { width, height } = Dimensions.get('window');

// Add this at the top of the file after imports
console.log('[DEBUG] ProfileScreen is being loaded - testing typography issue');

// Define the complete ProfileScreen component
const ProfileScreen = ({ navigation }) => {
  // Get safe area insets
  const insets = useSafeAreaInsets();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [hasSpotifyConnected, setHasSpotifyConnected] = useState(false);
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [spotifyStats, setSpotifyStats] = useState(null);
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  // Check network status on mount
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Load user data on mount
  useEffect(() => {
    loadUserData();
    checkSpotifyConnection();
  }, []);
  
  // Function to load user data
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user is signed in');
        navigation.navigate('Welcome');
        return;
      }
      
      setUser(currentUser);
      
      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('User data loaded:', data.username);
        setUserData(data);
        
        // Check if user has Spotify data
        if (data.spotifyProfile) {
          setSpotifyProfile(data.spotifyProfile);
        }
        
        if (data.spotifyTopArtists && data.spotifyTopTracks) {
          setSpotifyStats({
            topArtists: data.spotifyTopArtists,
            topTracks: data.spotifyTopTracks,
            lastUpdated: data.lastDataUpdate
          });
        }
      } else {
        console.log('User document not found');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Check if the user has connected to Spotify
  const checkSpotifyConnection = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const tokenData = await AsyncStorage.getItem(`spotify_token_${currentUser.uid}`);
      if (tokenData) {
        setHasSpotifyConnected(true);
      } else {
        setHasSpotifyConnected(false);
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setHasSpotifyConnected(false);
    }
  };
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await checkSpotifyConnection();
  };
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Log Out',
          onPress: async () => {
            try {
              console.log('Attempting to sign out...');
              
              // Clear any stored tokens first
              const currentUser = user; // Store reference before logout
              if (currentUser) {
                await AsyncStorage.removeItem(`spotify_token_${currentUser.uid}`);
                console.log('Cleared Spotify tokens');
              }
              
              // Sign out from Firebase
              await signOut(auth);
              console.log('Successfully signed out');
              
              // Let the auth state change listener in App.js handle navigation
              // The listener will detect user is null and render the Welcome screen
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  // Handle navigation to Spotify Connect screen
  const goToSpotifyConnect = () => {
    navigation.navigate('SpotifyConnect');
  };
  
  // Handle navigation to Spotify Crapped screen
  const goToSpotifyCrapped = () => {
    navigation.navigate('SpotifyCrapped');
  };
  
  // Create a specific handler for the scroll event
  const handleScroll = (event) => {
    // Extract the y offset from the nativeEvent
    const offsetY = event.nativeEvent.contentOffset.y;
    // Manually set the Animated.Value
    scrollY.setValue(offsetY);
  };
  
  // If loading, show a loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#121212', '#232323']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <RNText style={{ color: 'white', marginTop: spacing.md, fontSize: 16 }}>
            Loading profile...
          </RNText>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render the profile screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['#121212', '#232323']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="white" />
          <RNText style={{ color: 'white', marginLeft: 8, fontSize: 14 }}>
            You're offline
          </RNText>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadUserData}
          >
            <RNText style={{ color: colors.primary, fontSize: 14 }}>Retry</RNText>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Animated header */}
      <Animated.View style={[
        styles.animatedHeader,
        { opacity: headerOpacity }
      ]}>
        <RNText style={styles.headerTitle}>Profile</RNText>
      </Animated.View>
      
      {/* Main content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 80 : 80 }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* User profile section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <RNText style={{ fontSize: 36, color: 'white' }}>
                  {(userData?.username || user?.email || 'U')[0].toUpperCase()}
                </RNText>
              </View>
            )}
          </View>
          
          <RNText style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: 'white',
            marginBottom: spacing.xs 
          }}>
            {userData?.username || 'User'}
          </RNText>
          
          <RNText style={{ 
            fontSize: 16, 
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: spacing.md 
          }}>
            {user?.email || 'No email'}
          </RNText>
          
          {hasSpotifyConnected ? (
            <View style={styles.spotifyBadge}>
              <Ionicons name="musical-notes" size={14} color="white" />
              <RNText style={{ 
                fontSize: 14, 
                color: 'white', 
                marginLeft: 4 
              }}>
                Spotify Connected
              </RNText>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.connectSpotifyButton}
              onPress={goToSpotifyConnect}
            >
              <Ionicons name="musical-notes" size={14} color="white" />
              <RNText style={{ 
                fontSize: 14, 
                color: 'white', 
                marginLeft: 4 
              }}>
                Connect Spotify
              </RNText>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Stats section */}
        {hasSpotifyConnected && (
          <View style={styles.statsSection}>
            <RNText style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: 'white',
              marginBottom: spacing.md 
            }}>
              Your Music Stats
            </RNText>
            
            <TouchableOpacity 
              style={styles.statCard}
              onPress={goToSpotifyCrapped}
            >
              <View style={styles.statCardContent}>
                <View>
                  <RNText style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: 'white' 
                  }}>
                    Monthly Highlights
                  </RNText>
                  
                  <RNText style={{ 
                    fontSize: 14, 
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginTop: 4 
                  }}>
                    View your top tracks and artists
                  </RNText>
                </View>
                
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color="rgba(255, 255, 255, 0.7)" 
                />
              </View>
              
              {spotifyStats && (
                <View style={styles.spotifyStatsPreview}>
                  {spotifyStats.topArtists && spotifyStats.topArtists[0] && (
                    <View style={styles.spotifyPreviewItem}>
                      <RNText style={{ 
                        fontSize: 12, 
                        color: 'rgba(255, 255, 255, 0.5)' 
                      }}>
                        Top Artist
                      </RNText>
                      <RNText style={{ 
                        fontSize: 16, 
                        color: 'white', 
                        fontWeight: 'bold' 
                      }}>
                        {spotifyStats.topArtists[0].name}
                      </RNText>
                    </View>
                  )}
                  
                  {spotifyStats.topTracks && spotifyStats.topTracks[0] && (
                    <View style={styles.spotifyPreviewItem}>
                      <RNText style={{ 
                        fontSize: 12, 
                        color: 'rgba(255, 255, 255, 0.5)' 
                      }}>
                        Top Track
                      </RNText>
                      <RNText style={{ 
                        fontSize: 16, 
                        color: 'white', 
                        fontWeight: 'bold',
                        maxWidth: 200
                      }} numberOfLines={1}>
                        {spotifyStats.topTracks[0].name}
                      </RNText>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
            
            {!spotifyStats && hasSpotifyConnected && (
              <View style={styles.noStatsContainer}>
                <RNText style={{ 
                  fontSize: 16, 
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                  marginBottom: spacing.md 
                }}>
                  No Spotify data found yet.
                </RNText>
                
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={goToSpotifyCrapped}
                >
                  <RNText style={{ 
                    fontSize: 14, 
                    color: 'white',
                    fontWeight: 'bold' 
                  }}>
                    Refresh My Stats
                  </RNText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {/* Action buttons */}
        <View style={styles.actionsSection}>
          <RNText style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: 'white',
            marginBottom: spacing.md 
          }}>
            Account Settings
          </RNText>
          
          {hasSpotifyConnected ? (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={goToSpotifyConnect}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="musical-notes" size={20} color={colors.primary} />
                <RNText style={{ 
                  fontSize: 16, 
                  color: 'white',
                  marginLeft: spacing.sm 
                }}>
                  Spotify Settings
                </RNText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={goToSpotifyConnect}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <RNText style={{ 
                  fontSize: 16, 
                  color: 'white',
                  marginLeft: spacing.sm 
                }}>
                  Connect Spotify
                </RNText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'This feature is under development.')}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="settings-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
              <RNText style={{ 
                fontSize: 16, 
                color: 'white',
                marginLeft: spacing.sm 
              }}>
                App Settings
              </RNText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'This feature is under development.')}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="help-circle-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
              <RNText style={{ 
                fontSize: 16, 
                color: 'white',
                marginLeft: spacing.sm 
              }}>
                Help & Feedback
              </RNText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
              <RNText style={{ 
                fontSize: 16, 
                color: '#ff6b6b',
                marginLeft: spacing.sm 
              }}>
                Log Out
              </RNText>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* App info */}
        <View style={styles.appInfo}>
          <RNText style={{ 
            fontSize: 14, 
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center' 
          }}>
            SpotifyClog v1.0.0
          </RNText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Define component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? insets => insets.bottom + 80 : 80, // Dynamic padding based on safe area
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    zIndex: 100,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    borderRadius: borderRadius.md,
  },
  retryButton: {
    marginLeft: 'auto',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  headerSection: {
    marginTop: Platform.OS === 'ios' ? 100 : 80,
    alignItems: 'center',
    marginBottom: spacing.lg, // Reduced from xl to lg
  },
  avatarContainer: {
    padding: spacing.xs,
    borderRadius: borderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.md, // Reduced from lg to md
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.circle,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  connectSpotifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statsSection: {
    marginBottom: spacing.lg, // Reduced from xl to lg
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotifyStatsPreview: {
    marginTop: spacing.md, // Reduced from lg to md
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spotifyPreviewItem: {
    flex: 1,
  },
  noStatsContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionsSection: {
    marginBottom: spacing.lg, // Reduced from xl to lg
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, // Reduced from 16
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10, // Reduced from 12
    borderRadius: borderRadius.md,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: spacing.md, // Reduced from lg to md
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  appInfo: {
    marginTop: spacing.lg, // Reduced from xxl to lg
    marginBottom: spacing.md, // Reduced from xl to md
  },
});

// Export component for use in other files
export default ProfileScreen;