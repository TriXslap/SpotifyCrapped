import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView, SafeAreaView, Platform, RefreshControl, Text as RNText, Dimensions, ToastAndroid } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, collection, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { getMonthlyHighlights, saveMonthlyHighlights, shouldUpdateHighlights, getSpotifyAccessToken } from './SpotifyConnectScreen';
import ArtistCard from '../components/ArtistCard';
import TrackCard from '../components/TrackCard';
import { ArtistSkeleton, TrackSkeleton } from '../components/Skeleton';
import Header from '../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshGradient from '../components/MeshGradient';
import { clearColorCache } from '../utils/colorExtractor';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { scheduleAllMonthlyNotifications, getAllScheduledNotifications, getNotificationStatus, sendTestNotification } from '../utils/notificationService';

// Only log in development
const __DEV__ = process.env.NODE_ENV === 'development';

// Centralized logger that only logs in development
const logger = (type, message, data) => {
  if (__DEV__) {
    const prefix = type ? `[${type}]` : '';
    console.log(`${prefix} ${message}`, data !== undefined ? data : '');
  }
};

const SkeletonCard = () => (
  <View style={[styles.card, styles.skeletonCard]}>
    <View style={styles.skeletonTitle} />
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonText} />
  </View>
);

const CACHE_KEY = '@spotify_crapped_data';

const SimpleSpotifyCrappedScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={{ padding: 20 }}>
        <RNText style={{ 
          color: 'white', 
          fontSize: 24, 
          fontWeight: 'bold',
          marginBottom: 20,
          textAlign: 'center'
        }}>
          Your Spotify Stats
        </RNText>
        
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: 10, 
          padding: 15,
          marginBottom: 20
        }}>
          <RNText style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Top Artist
          </RNText>
          <RNText style={{ color: '#1ED760', fontSize: 16 }}>
            Artist Name
          </RNText>
        </View>
        
        <View style={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: 10, 
          padding: 15,
          marginBottom: 20
        }}>
          <RNText style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Top Track
          </RNText>
          <RNText style={{ color: '#1ED760', fontSize: 16 }}>
            Track Name
          </RNText>
        </View>
        
        <TouchableOpacity 
          style={{
            backgroundColor: '#1ED760',
            padding: 15,
            borderRadius: 25,
            alignItems: 'center',
            marginTop: 20
          }}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <RNText style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Back to Profile
          </RNText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Add CountdownTimer component
const CountdownTimer = ({ daysUntilNextRelease }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: daysUntilNextRelease,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      
      const nextReleaseDate = new Date(nextYear, nextMonth, 1);
      const difference = nextReleaseDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [daysUntilNextRelease]);

  return (
    <View style={styles.countdownContainer}>
      <RNText style={styles.countdownTitle}>Next Monthly Stats Available In:</RNText>
      <View style={styles.countdownGrid}>
        <View style={styles.countdownItem}>
          <RNText style={styles.countdownNumber}>{timeLeft.days}</RNText>
          <RNText style={styles.countdownLabel}>Days</RNText>
        </View>
        <View style={styles.countdownItem}>
          <RNText style={styles.countdownNumber}>{timeLeft.hours}</RNText>
          <RNText style={styles.countdownLabel}>Hours</RNText>
        </View>
        <View style={styles.countdownItem}>
          <RNText style={styles.countdownNumber}>{timeLeft.minutes}</RNText>
          <RNText style={styles.countdownLabel}>Minutes</RNText>
        </View>
        <View style={styles.countdownItem}>
          <RNText style={styles.countdownNumber}>{timeLeft.seconds}</RNText>
          <RNText style={styles.countdownLabel}>Seconds</RNText>
        </View>
      </View>
    </View>
  );
};

const SpotifyCrappedScreen = ({ navigation }) => {
  // Initialize insets
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topArtist, setTopArtist] = useState(null);
  const [topTrack, setTopTrack] = useState(null);
  const [error, setError] = useState(null);
  const [isFirstWeekOfMonth, setIsFirstWeekOfMonth] = useState(false);
  const [bypassTimeRestriction, setBypassTimeRestriction] = useState(false);
  const [daysUntilNextRelease, setDaysUntilNextRelease] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [spotifyData, setSpotifyData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const viewRef = useRef(null);
  
  // Check if it's the first week of the month
  const checkIfFirstWeekOfMonth = () => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    // If day is between 1-7, it's the first week
    const isFirstWeek = dayOfMonth <= 7;
    setIsFirstWeekOfMonth(isFirstWeek);
    
    // Calculate days until next month's release if not in first week
    if (!isFirstWeek) {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      
      const nextReleaseDate = new Date(nextYear, nextMonth, 1);
      const timeUntilNextRelease = nextReleaseDate - now;
      const daysUntil = Math.ceil(timeUntilNextRelease / (1000 * 60 * 60 * 24));
      setDaysUntilNextRelease(daysUntil);
    }
    
    logger('TIME', 'First week check', { 
      dayOfMonth, 
      isFirstWeek,
      currentMonth: now.toISOString().substring(0, 7)
    });
    return isFirstWeek;
  };

  // Use this to manually trigger refresh when the UI is tapped
  const handleScreenTap = () => {
    // Add haptic feedback - only on native platforms
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Check if tap is within the time window for counting (3 seconds)
    const now = Date.now();
    if (now - lastTapTime > 3000) {
      // If it's been more than 3 seconds, reset count to 1
      setTapCount(1);
    } else {
      // Otherwise increment the count
      const newCount = tapCount + 1;
      setTapCount(newCount);
      
      // If we reach 5 taps, enable the bypass
      if (newCount >= 5) {
        // Set bypass flag immediately
        setBypassTimeRestriction(true);
        
        // Clear any existing data first to force a fresh load
        setTopArtist(null);
        setTopTrack(null);
        
        // Show an alert to indicate bypass is activated
        Alert.alert(
          "Developer Mode",
          "Developer mode activated! Loading your data now.",
          [{ 
            text: "OK"
          }]
        );
        
        // Set loading state and trigger data fetch with a slight delay
        setLoading(true);
        setTimeout(() => {
          fetchUserData();
        }, 300);
      }
    }
    
    // Update the last tap time
    setLastTapTime(now);
  };

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(() => {
    console.log('User initiated refresh');
    setRefreshing(true);
    
    // Clear any stale data to ensure we get fresh colors
    setTopArtist(null);
    setTopTrack(null);
    
    // Clear color cache in the colorExtractor
    if (typeof clearColorCache === 'function') {
      try {
        clearColorCache();
        console.log('Color cache cleared');
      } catch (e) {
        console.log('Could not clear color cache');
      }
    }
    
    // Enable developer mode during refresh
    setBypassTimeRestriction(true);
    
    // Add a slight delay to ensure state updates before fetching
    setTimeout(() => {
      fetchUserData();
    }, 300);
  }, []);

  // Save data to local cache for quicker loading next time
  const saveToCache = async (data) => {
    try {
      if (!auth.currentUser?.uid) return;
      
      const userId = auth.currentUser.uid;
      const cacheKey = `spotifyData_${userId}`;
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
      
      logger('CACHE', 'Data saved to cache');
    } catch (error) {
      logger('ERROR', 'Failed to save to cache:', error);
    }
  };

  // Load data from local cache
  const loadFromCache = async () => {
    try {
      if (!auth.currentUser?.uid) return false;
      
      const userId = auth.currentUser.uid;
      const cacheKey = `spotifyData_${userId}`;
      
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        logger('CACHE', 'No cached data found');
        return false;
      }
      
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Check if data is stale (older than 24 hours)
      const cachedTime = new Date(timestamp);
      const currentTime = new Date();
      const diffHours = (currentTime - cachedTime) / (1000 * 60 * 60);
      
      if (diffHours > 24) {
        logger('CACHE', 'Cached data is stale');
        return false;
      }
      
      // Use cached data
      if (data?.topArtist && data?.topTrack) {
        setTopArtist(data.topArtist);
        setTopTrack(data.topTrack);
        setLastUpdated(timestamp);
        logger('CACHE', 'Using cached data from', new Date(timestamp).toLocaleString());
        return true;
      }
      
      return false;
    } catch (error) {
      logger('ERROR', 'Error loading from cache:', error);
      return false;
    }
  };

  // Initial data loading effect
  useEffect(() => {
    if (!auth.currentUser) {
      logger('AUTH', 'No user logged in, redirecting to login');
      navigation.navigate('Login');
      return;
    }
    
    const isFirstWeek = checkIfFirstWeekOfMonth();
    fetchUserData();
    
    // Log current state for debugging
    logger('INIT', 'Component mounted', { 
      userId: auth.currentUser?.uid,
      isFirstWeekOfMonth: isFirstWeek,
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleButtonPress = async (action) => {
    // Only trigger haptic feedback on native platforms
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        logger('ERROR', 'Haptic feedback not available:', error);
      }
    }
    
    switch (action) {
      case 'refresh':
        setLoading(true);
        fetchUserData();
        break;
      case 'profile':
        handleViewProfile();
        break;
      case 'reconnect':
        handleReconnectSpotify();
        break;
    }
  };

  // Add new function to check if we need to fetch new data
  const shouldFetchNewData = (lastUpdateTime) => {
    if (!lastUpdateTime) return true;
    
    const now = new Date();
    const lastUpdate = new Date(lastUpdateTime);
    const currentMonth = now.getMonth();
    const lastUpdateMonth = lastUpdate.getMonth();
    const currentYear = now.getFullYear();
    const lastUpdateYear = lastUpdate.getFullYear();
    
    // Fetch new data if we're in a different month/year
    return currentMonth !== lastUpdateMonth || currentYear !== lastUpdateYear;
  };

  // Add new function to store data in Firestore
  const storeSpotifyData = async (userId, artistData, trackData) => {
    try {
      const userRef = doc(db, 'users', userId);
      const now = new Date();
      
      // First get the current user data
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      
      // Create the updated Spotify data
      const updatedSpotifyData = {
        ...(currentData.spotify || {}),
        lastDataUpdate: now.toISOString(),
        cachedTopArtist: artistData,
        cachedTopTrack: trackData
      };
      
      // Update the document with the new data
      await setDoc(userRef, {
        spotify: updatedSpotifyData
      }, { merge: true });
      
      logger('FIRESTORE', 'Successfully stored Spotify data in Firestore');
    } catch (error) {
      logger('ERROR', 'Error storing Spotify data:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      console.log('Starting to fetch user data');
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.log('No authenticated user, redirecting to login');
        setError("Please login to view your Spotify data");
        setLoading(false);
        navigation.navigate('Login');
        return;
      }
      
      const userId = auth.currentUser.uid;
      console.log('Fetching data for user', { userId });
      
      // IMPORTANT: For testing, always fetch fresh data when bypass is activated
      if (!refreshing && !bypassTimeRestriction) {
        console.log('Attempting to load from cache first');
        const hasCachedData = await loadFromCache();
        if (hasCachedData) {
          console.log('Successfully loaded data from cache');
          setLoading(false);
          return;
        }
      } else {
        console.log('Skipping cache due to refresh or bypass mode');
      }
      
      // Get current month string in format YYYY-MM
      const currentMonth = new Date().toISOString().substring(0, 7);
      console.log('Current month:', currentMonth);
      
      // Step 1: Try to get data from Firestore using the utility function
      console.log('Fetching monthly highlights from Firestore');
      let monthlyData;
      try {
        monthlyData = await getMonthlyHighlights(currentMonth);
        console.log('Firestore data result:', monthlyData ? 'Found data' : 'No data found');
      } catch (firestoreError) {
        console.log('Error fetching from Firestore:', firestoreError.message);
        // Continue with fetch from Spotify if Firestore fails
      }
      
      // Step 2: Check if we have valid monthly data
      if (monthlyData && monthlyData.topArtist && monthlyData.topTrack && !bypassTimeRestriction) {
        console.log('Using stored monthly data for ' + currentMonth);
        
        // Set UI state with the data from Firestore
        setTopArtist(monthlyData.topArtist);
        setTopTrack(monthlyData.topTrack);
        setLoading(false);
        return;
      }
      
      // At this point, we either don't have data in Firebase or bypassTimeRestriction is true
      // Step 3: We need to fetch new data from Spotify regardless of time restrictions
      // Only check time restrictions if we're not in bypass mode AND we already have data
      if (!bypassTimeRestriction && !isFirstWeekOfMonth && monthlyData && monthlyData.topArtist && monthlyData.topTrack) {
        console.log('Not in first week of month and no bypass activated, but we have existing data');
        
        // Set the data anyway
        setTopArtist(monthlyData.topArtist);
        setTopTrack(monthlyData.topTrack);
        setLoading(false);
        return;
      }
      
      // If we're here, either:
      // 1. We have no data for this month, OR
      // 2. The time restriction is bypassed, OR
      // 3. It's the first week of the month
      // In all cases, we should fetch new data from Spotify
      
      console.log('Attempting to fetch new data from Spotify');
      
      // Step 4: We need to get a valid Spotify token using the utility function
      let accessToken;
      try {
        console.log('Getting Spotify access token');
        accessToken = await getSpotifyAccessToken();
        console.log('Token received:', accessToken ? 'Valid token' : 'No token');
        
        if (!accessToken) {
          console.log('No valid Spotify token found');
          setError("Your Spotify connection has expired. Please reconnect.");
          setLoading(false);
          return;
        }
      } catch (tokenError) {
        console.log('Error getting token:', tokenError.message);
        setError("Error connecting to Spotify. Please try again.");
        setLoading(false);
        return;
      }
      
      // Step 5: Fetch top artists and tracks from Spotify
      console.log('Fetching top artists and tracks from Spotify API');
      const timeRange = 'short_term'; // last 4 weeks
      
      let artistResult = null;
      let trackResult = null;
      
      try {
        // Fetch top artist
        console.log('Fetching top artist');
        const artistResponse = await fetch(
          `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!artistResponse.ok) {
          const statusText = artistResponse.statusText;
          const artistError = await artistResponse.text();
          console.log('Error response from Spotify API (artists)', { 
            status: artistResponse.status, 
            statusText, 
            error: artistError 
          });
          throw new Error(`Error fetching top artist (${artistResponse.status}): ${statusText}`);
        }
        
        const artistData = await artistResponse.json();
        artistResult = artistData.items[0] || null;
        console.log('Artist result:', artistResult ? 'Found artist' : 'No artist found');
        
        // IMPORTANT: For developers - if we get here, use test data if no real artist found
        if (!artistResult && bypassTimeRestriction) {
          console.log('Using test artist data in developer mode');
          artistResult = {
            name: "Test Artist",
            images: [{ url: "https://via.placeholder.com/300" }],
            genres: ["test genre"],
            popularity: 75
          };
        }
        
        // Fetch top track
        console.log('Fetching top track');
        const trackResponse = await fetch(
          `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!trackResponse.ok) {
          const statusText = trackResponse.statusText;
          const trackError = await trackResponse.text();
          console.log('Error response from Spotify API (tracks)', { 
            status: trackResponse.status, 
            statusText, 
            error: trackError 
          });
          throw new Error(`Error fetching top track (${trackResponse.status}): ${statusText}`);
        }
        
        const trackData = await trackResponse.json();
        trackResult = trackData.items[0] || null;
        console.log('Track result:', trackResult ? 'Found track' : 'No track found');
        
        // IMPORTANT: For developers - if we get here, use test data if no real track found
        if (!trackResult && bypassTimeRestriction) {
          console.log('Using test track data in developer mode');
          trackResult = {
            name: "Test Track",
            artists: [{ name: "Test Artist" }],
            album: {
              name: "Test Album",
              images: [{ url: "https://via.placeholder.com/300" }]
            },
            popularity: 80,
            duration_ms: 180000
          };
        }
        
        // Step 6: Save the data to Firestore for future use using the utility function
        if ((artistResult && trackResult) || bypassTimeRestriction) {
          console.log('Successfully fetched top artist and track');
          
          // Update local state
          setTopArtist(artistResult);
          setTopTrack(trackResult);
          
          // Save to local cache
          await saveToCache({
            topArtist: artistResult,
            topTrack: trackResult
          });
          
          // Don't await these to prevent blocking the UI
          if (artistResult && trackResult) {
            // Save to Firestore in the background
            setTimeout(() => {
              saveMonthlyHighlights({
                topArtist: artistResult,
                topTrack: trackResult,
                fetchedAt: new Date().toISOString()
              }, currentMonth).catch(e => console.log('Background save failed:', e.message));
            }, 100);
          }
        } else {
          console.log('No top artist or track found in Spotify response');
          setError("No listening data found. Try again later.");
        }
      } catch (error) {
        console.log('Error during Spotify API fetch', { error: error.message });
        setError("Error fetching your Spotify data: " + error.message);
      }
    } catch (error) {
      console.log('Unexpected error', { error: error.message });
      setError("An unexpected error occurred. Please try again.");
    } finally {
      // Always set loading to false at the end
      console.log('Finished fetching data, setting loading to false');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Save track and artist data for historical analysis
  const saveHistoricalData = async (userId, artistData, trackData) => {
    try {
      // Only save if we have valid data
      if (!artistData?.items || !trackData?.items) {
        logger('CACHE', 'No valid data to save for history');
        return;
      }

      // Test user permissions first
      logger('CACHE', 'Testing write permissions to user document');
      const userDocRef = doc(db, 'users', userId);
      
      try {
        // Try to write to user document first
        await setDoc(userDocRef, { 
          hasSpotifyData: true,
          lastSpotifyUpdate: new Date() 
        }, { merge: true });
        logger('CACHE', 'Successfully wrote to user document');
      } catch (permError) {
        logger('ERROR', 'Error writing to user document', permError);
        throw new Error(`Permission error writing to user document: ${permError.message}`);
      }

      // Get current month as ID to prevent duplicates
      const now = new Date();
      const historyId = `history-${now.getFullYear()}-${now.getMonth() + 1}`;
      
      logger('CACHE', 'Preparing historical data', { historyId });
      
      // Extract top 5 artists
      const topArtists = artistData.items.slice(0, 5).map((artist, index) => ({
        name: artist.name,
        imageUrl: artist.images[0]?.url || 'https://via.placeholder.com/150',
        rank: index + 1
      }));
      
      // Extract top 5 tracks
      const topTracks = trackData.items.slice(0, 5).map((track, index) => ({
        name: track.name,
        artist: track.artists[0]?.name || "Unknown Artist",
        imageUrl: track.album.images[0]?.url || 'https://via.placeholder.com/150',
        rank: index + 1
      }));
      
      // Extract genres from top artists
      const allGenres = artistData.items.flatMap(artist => artist.genres || []);
      
      // Count genre occurrences
      const genreCounts = {};
      allGenres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
      
      // Get top 5 genres
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
      
      // Calculate a rough estimate of listening time (just for demonstration)
      // In a real app, this would come from actual listening data
      const listening_minutes = 2500 + Math.floor(Math.random() * 1500);
      
      // Create the history entry
      const historyEntry = {
        timestamp: now,
        topGenres,
        topArtists,
        topTracks,
        listening_minutes
      };
      
      // Save to Firestore subcollection with better error handling
      try {
        logger('CACHE', 'Writing to musicHistory subcollection');
        const historyRef = doc(collection(db, 'users', userId, 'musicHistory'), historyId);
        
        // Use the set method with merge option
        await setDoc(historyRef, historyEntry, { merge: true });
        logger('CACHE', 'Saved historical data successfully', { historyId });
      } catch (historyError) {
        // Log specific error details
        logger('ERROR', 'Error writing to musicHistory subcollection', {
          code: historyError.code,
          message: historyError.message
        });
        
        // Re-throw with more context
        throw new Error(`Failed to save to musicHistory: ${historyError.message}`);
      }
    } catch (error) {
      logger('ERROR', 'Error saving historical data', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Check specific Firestore error codes
      if (error.code === 'permission-denied') {
        logger('ERROR', 'Permission denied error - check Firestore rules', { 
          rule: 'users/{userId}/musicHistory/{historyId}'
        });
        console.error('Permission denied error - check Firestore rules:', error);
      } else {
        // Non-critical error, so we don't need to show to user
        console.error("Error saving historical data:", error.message);
      }
    }
  };

  // Function to handle reconnecting to Spotify
  const handleReconnectSpotify = () => {
    logger('USER', 'User initiated Spotify reconnect');
    // Navigate directly to the SpotifyConnect screen
    navigation.navigate('SpotifyConnect');
  };

  const handleViewProfile = () => {
    navigation.navigate('ProfileScreen');
  };

  // Add a force refresh function for the retry button
  const forceRefresh = () => {
    setBypassTimeRestriction(true);
    setLoading(true);
    setError(null);
    
    // Clear any stale data
    setTopArtist(null);
    setTopTrack(null);
    
    // Add a slight delay to ensure state updates before fetching
    setTimeout(() => {
      // Check token first before attempting to fetch data again
      getSpotifyAccessToken().then(token => {
        if (!token) {
          logger('AUTH', 'No valid token during force refresh');
          setError("Your Spotify connection has expired.");
          setLoading(false);
        } else {
          fetchUserData();
        }
      }).catch((error) => {
        logger('ERROR', 'Error during force refresh:', error);
        setError("Unable to verify Spotify connection.");
        setLoading(false);
      });
    }, 300);
  };

  // Add toast component
  const Toast = ({ message, type }) => {
    if (!message) return null;

    return (
      <View style={[
        styles.toastContainer,
        type === 'success' ? styles.toastSuccess : styles.toastError
      ]}>
        <RNText style={styles.toastText}>{message}</RNText>
      </View>
    );
  };

  // Function to show toast
  const showToastMessage = (message, type = 'success') => {
    // For Android, use native toast
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
    } else {
      // For iOS and other platforms, use custom toast
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  // Function to capture and share content
  const handleInstagramShare = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Make sure viewRef.current exists
      if (!viewRef.current) {
        showToastMessage('Unable to capture content. Please try again.', 'error');
        return;
      }

      // Ensure the content is ready to be captured
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the view
      const uri = await captureRef(viewRef.current, {
        format: 'jpg',
        quality: 0.9,
        result: 'data-uri',
        height: 1920,
        width: 1080
      });

      // Convert data URI to file
      const filePath = `${FileSystem.cacheDirectory}spotify-crapped-share.jpg`;
      const base64Data = uri.split(',')[1];
      await FileSystem.writeAsStringAsync(filePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        showToastMessage('Sharing is not available on this platform', 'error');
        return;
      }

      // Share the image
      await Sharing.shareAsync(filePath, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share your monthly music highlights'
      });

      showToastMessage('Successfully captured your stats!');
    } catch (error) {
      console.error('Error sharing:', error);
      showToastMessage('Failed to share. Please try again.', 'error');
    }
  };

  // Schedule notifications when the screen loads
  useEffect(() => {
    async function setupNotifications() {
      try {
        // First check if notifications are already enabled
        const notificationStatusEnabled = await getNotificationStatus();
        setNotificationsEnabled(notificationStatusEnabled);
        
        if (notificationStatusEnabled) {
          logger('NOTIFICATIONS', 'Notifications already enabled, no need to request again');
          return;
        }
        
        // If not already enabled, try to schedule new notifications
        // Don't use test mode for automatic scheduling on app load
        const scheduled = await scheduleAllMonthlyNotifications(false);
        setNotificationsEnabled(scheduled);
        
        if (scheduled) {
          logger('NOTIFICATIONS', 'Monthly notifications scheduled successfully');
          
          // For debugging - get and log all scheduled notifications
          if (__DEV__) {
            const notifications = await getAllScheduledNotifications();
            logger('NOTIFICATIONS', 'All scheduled notifications', notifications);
          }
          
          // Display a toast or confirmation message
          showToastMessage('Notifications enabled for monthly updates', 'success');
        } else {
          logger('NOTIFICATIONS', 'Failed to schedule notifications or permission denied');
        }
      } catch (error) {
        // Handle errors more gracefully
        logger('NOTIFICATIONS', 'Error setting up notifications', error);
        
        // Even if there's an error with push notifications,
        // we can still try to set the notifications flag to true
        // so that users can use the app without seeing the error
        setNotificationsEnabled(true);
        
        // Don't show an error toast to the user for a better experience
        // If we're in development, we can still see the error in the logs
      }
    }
    
    setupNotifications();
    
    // Only run this once when the component mounts
  }, []);
  
  // Function to handle notification permission request
  const requestNotificationPermission = async () => {
    try {
      // Use testMode=true in development for testing notifications
      const scheduled = await scheduleAllMonthlyNotifications(__DEV__);
      setNotificationsEnabled(scheduled);
      
      if (scheduled) {
        logger('NOTIFICATIONS', 'Notifications enabled successfully');
        showToastMessage('Notifications enabled for monthly updates', 'success');
        
        // Add haptic feedback for successful permission
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        logger('NOTIFICATIONS', 'Notification permission denied');
        showToastMessage('Please enable notifications in settings', 'error');
        
        // Add haptic feedback for error
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        
        // Show alert with more information
        Alert.alert(
          "Notifications Disabled",
          "To receive updates when new monthly stats are available, please enable notifications in your device settings.",
          [{ 
            text: "OK"
          }]
        );
      }
    } catch (error) {
      logger('NOTIFICATIONS', 'Error requesting notification permission', error);
      showToastMessage('Failed to set up notifications', 'error');
    }
  };

  // Add a test notification function (only available in development)
  const sendNotificationTest = async () => {
    if (!__DEV__) return;
    
    try {
      await sendTestNotification();
      showToastMessage('Test notification sent', 'success');
      
      // Provide haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      logger('NOTIFICATIONS', 'Error sending test notification', error);
      showToastMessage('Error sending test notification', 'error');
    }
  };

  if (loading) {
    console.log('Rendering loading screen');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#121212'
        }}>
          <View style={styles.headerContainer}>
            <RNText style={styles.headerTitle}>Spotify Crapped</RNText>
            <RNText style={styles.headerSubtitle}>Loading your highlights...</RNText>
          </View>
          
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSpacing} />
            <ArtistSkeleton />
            <View style={styles.skeletonSpacing} />
            <TrackSkeleton />
            <View style={styles.buttonContainer}>
              <View style={styles.skeletonButton} />
              <View style={styles.skeletonButton} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MeshGradient>
          <View style={styles.headerContainer}>
            <RNText style={styles.headerTitle}>Connection Issue</RNText>
          </View>
          
          <View style={styles.errorContainer}>
            <RNText style={styles.errorTitle}>Connect Spotify</RNText>
            <RNText style={styles.errorText}>{error}</RNText>
            <TouchableOpacity 
              style={[styles.reconnectButton, {marginTop: 20}]} 
              onPress={handleReconnectSpotify}
            >
              <RNText style={styles.buttonText}>Reconnect Spotify</RNText>
            </TouchableOpacity>
            
            {/* Add a retry button only for non-expired token errors */}
            {!error.includes("expired") && (
              <TouchableOpacity 
                style={[styles.button, {marginTop: 15, backgroundColor: '#191414', borderWidth: 1, borderColor: '#1DB954'}]} 
                onPress={forceRefresh}
              >
                <RNText style={styles.buttonText}>Retry</RNText>
              </TouchableOpacity>
            )}
          </View>
        </MeshGradient>
      </SafeAreaView>
    );
  }

  // Show countdown if not in first week and bypass not activated
  if (!isFirstWeekOfMonth && !bypassTimeRestriction) {
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        style={{ flex: 1 }}
        onPress={handleScreenTap}
      >
        <SafeAreaView style={styles.safeArea}>
          <MeshGradient isCountdownScreen={true}>
            <View style={styles.headerContainer}>
              <RNText style={styles.headerTitle}>Spotify Crapped</RNText>
              <RNText style={styles.headerSubtitle}>Updates monthly</RNText>
            </View>
            
            <View style={styles.countdownContainer}>
              <View style={styles.lockIconContainer}>
                <RNText style={styles.lockIcon}>🔒</RNText>
              </View>
              
              <View style={styles.countdownTimerContainer}>
                <RNText style={styles.daysNumber}>{daysUntilNextRelease}</RNText>
                <RNText style={styles.daysText}>days until next release</RNText>
              </View>
              
              <RNText style={styles.comingSoonText}>
                Your Spotify Crapped report is only available during the first week of each month.
                {tapCount > 0 ? `\n\nTapped ${tapCount}/5 times...` : ""}
              </RNText>
              
              <TouchableOpacity 
                style={styles.profileButton} 
                onPress={handleViewProfile}
              >
                <RNText style={styles.buttonText}>Back to Profile</RNText>
              </TouchableOpacity>
              
              <RNText style={styles.devHint}>
                Developer hint: Try tapping rapidly...
              </RNText>
            </View>
          </MeshGradient>
        </SafeAreaView>
      </TouchableOpacity>
    );
  }

  // Check if we have valid data before rendering
  if (!topArtist || !topTrack) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MeshGradient>
          <View style={styles.headerContainer}>
            <RNText style={styles.headerTitle}>Spotify Crapped</RNText>
          </View>
          
          <View style={styles.errorContainer}>
            <RNText style={styles.errorText}>No data available. Please try again later.</RNText>
            <TouchableOpacity 
              style={styles.button} 
              onPress={forceRefresh}
            >
              <RNText style={styles.buttonText}>Retry</RNText>
            </TouchableOpacity>
          </View>
        </MeshGradient>
      </SafeAreaView>
    );
  }

  // Create placeholder objects if needed properties are missing
  const artist = {
    name: topArtist.name || "Unknown Artist",
    imageUrl: topArtist.images?.[0]?.url || topArtist.imageUrl || 'https://via.placeholder.com/150',
    genre: topArtist.genres?.[0] || topArtist.genre || "Unknown Genre",
    spotifyUrl: topArtist.external_urls?.spotify || null
  };

  const track = {
    name: topTrack.name || "Unknown Track",
    artist: topTrack.artists?.[0]?.name || topTrack.artist || "Unknown Artist",
    imageUrl: topTrack.album?.images?.[0]?.url || topTrack.imageUrl || 'https://via.placeholder.com/150',
    album: topTrack.album?.name || topTrack.album || "Unknown Album",
    spotifyUrl: topTrack.external_urls?.spotify || null
  };

  // Get image URLs for the mesh gradient to extract colors from - ensure valid strings only
  const imageUrls = [
    artist.imageUrl,
    track.imageUrl
  ].filter(url => url && typeof url === 'string');
  
  // Debug URLs in development only
  if (__DEV__) {
    logger('IMAGES', 'Using image URLs for gradient:', imageUrls);
  }

  // Modify your UI to include a notification permission button or indication
  const renderNotificationButton = () => {
    if (!notificationsEnabled) {
      return (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={requestNotificationPermission}
        >
          <View style={styles.notificationButtonContent}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            <RNText style={styles.notificationButtonText}>
              Enable Monthly Reminders
            </RNText>
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={styles.notificationControlsContainer}>
          <View style={styles.notificationEnabledContainer}>
            <Ionicons name="notifications" size={18} color="#1DB954" />
            <RNText style={styles.notificationEnabledText}>
              Monthly Reminders Enabled
            </RNText>
          </View>
          
          {/* Only show test button in development */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.testNotificationButton}
              onPress={sendNotificationTest}
            >
              <RNText style={styles.testNotificationText}>
                Send Test Notification
              </RNText>
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MeshGradient
        imageUrls={imageUrls}
        key={`gradient-${artist.name}-${track.name}-${refreshing ? 'refreshing' : 'normal'}`}
      >
        <View style={styles.headerContainer}>
          <RNText style={styles.headerTitle}>Spotify Crapped</RNText>
          <RNText style={styles.headerSubtitle}>Your monthly listening highlights</RNText>
        </View>
        
        <ScrollView 
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: Math.max(insets.bottom + 100, 120) }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEnabled={true}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={['#1DB954']}
              progressBackgroundColor="#191414"
            />
          }
        >
          {/* Main content - this is both what you see and what gets captured */}
          <View 
            ref={viewRef} 
            style={styles.mainContent}
            collapsable={false}
          >
            {/* App branding */}
            <View style={styles.shareBranding}>
              <RNText style={styles.shareTitle}>Spotify Crapped</RNText>
              <RNText style={styles.shareSubtitle}>Monthly Highlights</RNText>
            </View>

            {/* Month display */}
            <View style={styles.monthDisplay}>
              <RNText style={styles.monthText}>
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </RNText>
            </View>

            {/* Artist Section */}
            <View style={styles.shareSection}>
              <RNText style={styles.shareSectionTitle}>Top Artist</RNText>
              <ArtistCard
                name={artist.name}
                imageUrl={artist.imageUrl}
                genres={topArtist.genres || [artist.genre]}
                popularity={topArtist.popularity || 70}
                spotifyUrl={artist.spotifyUrl}
                onPress={() => {}}
                isShareView={true}
              />
            </View>
            
            {/* Track Section */}
            <View style={styles.shareSection}>
              <RNText style={styles.shareSectionTitle}>Top Track</RNText>
              <TrackCard
                name={track.name}
                artist={track.artist}
                albumName={track.album}
                imageUrl={track.imageUrl}
                duration={topTrack.duration_ms || 180000}
                popularity={topTrack.popularity || 70}
                preview_url={topTrack.preview_url}
                spotifyUrl={track.spotifyUrl}
                onPress={() => {}}
                isShareView={true}
              />
            </View>

            {/* App promotion */}
            <View style={styles.sharePromotion}>
              <RNText style={styles.sharePromotionText}>
                Get your music stats at
              </RNText>
              <RNText style={styles.sharePromotionUrl}>
                spotifycrapped.com
              </RNText>
            </View>
          </View>
          
          {/* Bottom Buttons */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.refreshButton]} 
                onPress={() => handleButtonPress('refresh')}
              >
                <RNText style={styles.buttonText}>Refresh</RNText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.profileButton]} 
                onPress={() => handleButtonPress('profile')}
              >
                <RNText style={styles.buttonText}>Profile</RNText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.instagramShareButton]} 
                onPress={handleInstagramShare}
              >
                <Ionicons name="share-outline" size={20} color="white" style={styles.shareIcon} />
                <RNText style={styles.buttonText}>Share</RNText>
              </TouchableOpacity>
            </View>
          </View>
          
          {bypassTimeRestriction && !isFirstWeekOfMonth && (
            <View style={styles.bypassNoticeContainer}>
              <RNText style={styles.bypassNoticeText}>
                ⚠️ Testing mode: You're viewing this outside the normal release window
              </RNText>
            </View>
          )}
        </ScrollView>

        {/* Toast */}
        {showToast && <Toast message={toastMessage} type={toastType} />}

        {/* Notification button */}
        {renderNotificationButton()}
      </MeshGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 20,
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
  },
  topArtistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
  },
  artistInfo: {
    marginLeft: 15,
    flex: 1,
  },
  artistName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  genreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  numberText: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  topTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
  },
  trackInfo: {
    marginLeft: 15,
    flex: 1,
  },
  trackName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  artistTrackName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  viewMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  viewMoreText: {
    color: '#1DB954',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  profileButton: {
    backgroundColor: '#1DB954',
  },
  instagramShareButton: {
    backgroundColor: '#E4405F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  reconnectButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  
  // Countdown styles
  countdownContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  lockIconContainer: {
    marginBottom: 25,
  },
  lockIcon: {
    fontSize: 60,
  },
  countdownTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownNumber: {
    color: '#1DB954',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  countdownLabel: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  countdownTimerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  daysNumber: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#1DB954',
  },
  daysText: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
  comingSoonText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 28,
  },
  bypassNoticeContainer: {
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.3)',
  },
  bypassNoticeText: {
    color: '#FFCC00',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  devHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 40,
    position: 'absolute',
    bottom: 25,
  },
  // Skeleton loading styles
  skeletonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  skeletonTitle: {
    height: 36,
    width: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'center',
  },
  skeletonImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    alignSelf: 'center',
  },
  skeletonText: {
    height: 20,
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
  skeletonButton: {
    height: 55,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginTop: 15,
  },
  skeletonSpacing: {
    height: 30,
  },
  // Add new styles for sections and headers
  sectionContainer: {
    width: '100%',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  mainContent: {
    width: '100%',
    padding: 20,
    paddingTop: 32,
    paddingBottom: 32,
  },
  shareBranding: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shareTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: -1,
  },
  shareSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  monthDisplay: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.3)',
  },
  monthText: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  shareSection: {
    marginBottom: 32,
  },
  shareSectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sharePromotion: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sharePromotionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  sharePromotionUrl: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  toastSuccess: {
    backgroundColor: '#1DB954',
  },
  toastError: {
    backgroundColor: '#FF4444',
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationButton: {
    backgroundColor: 'rgba(29, 185, 84, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notificationControlsContainer: {
    marginHorizontal: 20,
    marginVertical: 15,
  },
  notificationEnabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
  },
  notificationEnabledText: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  testNotificationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  testNotificationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

// Export the full SpotifyCrappedScreen component
export default SpotifyCrappedScreen; 