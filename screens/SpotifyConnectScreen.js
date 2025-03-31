import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, BackHandler, Switch, Text as RNText, SafeAreaView, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import our components
import Header from '../components/Header';
import Card from '../components/Card';
import Text from '../components/Text';

// Platform-specific setup
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Add a global callback function for web
  window.spotifyAuthComplete = function(authData) {
    console.log('[web] Received direct callback from popup window');
    if (window.spotifyConnectScreenInstance) {
      window.spotifyConnectScreenInstance.handleAuthComplete(authData);
    } else {
      console.warn('[web] No SpotifyConnectScreen instance available');
      // Store the data for later processing
      localStorage.setItem('spotify_auth_data', JSON.stringify(authData));
    }
  };
  
  // Add a global event listener for postMessage communication
  window.addEventListener('message', function(event) {
    // Process messages from the popup window
    if (event.data && event.data.type === 'SPOTIFY_AUTH_COMPLETE') {
      console.log('[web] Received postMessage from popup window');
      if (window.spotifyConnectScreenInstance) {
        window.spotifyConnectScreenInstance.handleAuthComplete(event.data.data);
      } else {
        console.warn('[web] No SpotifyConnectScreen instance available for postMessage');
        // Store the data for later processing
        localStorage.setItem('spotify_auth_data', JSON.stringify(event.data.data));
        localStorage.setItem('spotify_auth_communicated', 'true');
      }
    }
  });

  // Add a function to create a callback page that can be loaded in the popup
  const callbackScript = `
    <script>
      function extractTokenFromHash() {
        const hash = window.location.hash.substring(1);
        if (hash) {
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const expiresIn = params.get('expires_in');
          
          if (accessToken && expiresIn) {
            return { access_token: accessToken, expires_in: expiresIn };
          }
        }
        return null;
      }
      
      function sendTokenToOpener() {
        const authData = extractTokenFromHash();
        if (authData) {
          if (window.opener && !window.opener.closed) {
            // Try postMessage first
            try {
              window.opener.postMessage({
                type: 'SPOTIFY_AUTH_COMPLETE',
                data: authData
              }, '*');
              console.log('Sent auth data via postMessage');
            } catch (e) {
              console.error('Failed to send via postMessage:', e);
            }
            
            // Also try direct function call as backup
            try {
              if (typeof window.opener.spotifyAuthComplete === 'function') {
                window.opener.spotifyAuthComplete(authData);
                console.log('Sent auth data via direct function call');
              }
            } catch (e) {
              console.error('Failed to call spotifyAuthComplete:', e);
            }
          } else {
            // Store in localStorage for later retrieval
            localStorage.setItem('spotify_auth_data', JSON.stringify(authData));
            console.log('Stored auth data in localStorage');
          }
        } else {
          console.error('No auth data found in URL');
        }
        
        // Close this window/tab after sending the data
        window.close();
      }
      
      // Run when the page loads
      window.onload = sendTokenToOpener;
    </script>
  `;

  // Create a function to handle the callback
  window.createSpotifyCallbackHandler = function() {
    // This function will be called when the popup window loads
    const callbackPage = document.createElement('html');
    callbackPage.innerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify Authentication</title>
          ${callbackScript}
        </head>
        <body>
          <h1>Spotify Authentication Complete</h1>
          <p>This window will close automatically.</p>
        </body>
      </html>
    `;
    return callbackPage.outerHTML;
  };
}

// Attempt to complete any pending auth sessions at startup
WebBrowser.maybeCompleteAuthSession();

// Replace these with your Spotify API credentials
const CLIENT_ID = "17594e5c0e4b4d1b8655932668bf64d4";
const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";

// Update the redirect URIs
const REDIRECT_URIS = {
  web: "https://wrappedclone.web.app/callback",
  ios: "spotifyclog://callback",
  android: "spotifyclog://callback"
};

// Get the appropriate redirect URI for the current platform
const getRedirectURI = () => {
  const uri = Platform.OS === 'web' ? REDIRECT_URIS.web : 
              (Platform.OS === 'ios' ? REDIRECT_URIS.ios : REDIRECT_URIS.android);
  console.log(`[${Platform.OS}] Generated redirect URI:`, uri);
  return uri;
};

// Log the redirect URI for all platforms to make debugging easier
console.log(`[${Platform.OS}] Spotify redirect URI: ${getRedirectURI()}`);

// Get the current redirect URI
const REDIRECT_URI = getRedirectURI();
console.log(`[${Platform.OS}] Using platform-specific redirect URI:`, REDIRECT_URI);

// Update the scopes to match what Spotify API allows
const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played", 
  "user-read-playback-state",
  "user-top-read",
  "user-modify-playback-state",
  "user-read-email",
  "user-read-private"
];

// Export these utility functions for use in other screens
export const getMonthlyHighlights = async (month) => {
  try {
    if (!auth.currentUser) {
      console.log('[getMonthlyHighlights] No user logged in');
      return null;
    }
    
    const userId = auth.currentUser.uid;
    console.log(`Getting monthly highlights for user ${userId}, month ${month}`);
    
    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log(`No user document found for ID: ${userId}`);
      return null;
    }
    
    // Get the monthly data from the user document
    const userData = userDoc.data();
    
    // First try the new structure
    if (userData.monthlyHighlights && userData.monthlyHighlights[month]) {
      console.log(`Found highlights in monthlyHighlights.${month}`);
      return userData.monthlyHighlights[month];
    }
    
    // Then try the legacy structure
    if (userData.spotify && userData.spotify.highlights && 
        userData.spotify.highlights.monthlyData && 
        userData.spotify.highlights.monthlyData[month]) {
      console.log(`Found highlights in spotify.highlights.monthlyData.${month}`);
      return userData.spotify.highlights.monthlyData[month];
    }
    
    console.log(`No monthly data found for ${month} in any structure`);
    return null;
  } catch (error) {
    console.error('Error getting monthly highlights:', error);
    return null;
  }
};

export const saveMonthlyHighlights = async (data, month) => {
  try {
    if (!auth.currentUser) {
      console.log('[saveMonthlyHighlights] No user logged in');
      return false;
    }
    
    const userId = auth.currentUser.uid;
    console.log(`Saving monthly highlights for user ${userId}, month ${month}`);
    
    // Reference to the user document
    const userRef = doc(db, 'users', userId);
    
    // Get the current user document
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // If user document doesn't exist, create it with the new data
      await setDoc(userRef, {
        monthlyHighlights: {
          [month]: {
            ...data,
            savedAt: new Date().toISOString()
          }
        },
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      console.log(`Created new user document with monthly highlights for ${month}`);
    } else {
      // Update the existing document
      // Create an object with the monthly data using the month as a key
      const updateData = {
        [`monthlyHighlights.${month}`]: {
          ...data,
          savedAt: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };
      
      // Update the user document
      await updateDoc(userRef, updateData);
      console.log(`Successfully updated monthly highlights for ${month}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving monthly highlights:', error);
    return false;
  }
};

export const shouldUpdateHighlights = async () => {
  try {
    if (!auth.currentUser) {
      console.log('[shouldUpdateHighlights] No user logged in');
      return true; // If no user, we'll need to update once logged in
    }
    
    const userId = auth.currentUser.uid;
    
    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log(`[shouldUpdateHighlights] No user document found for ID: ${userId}`);
      return true; // If no document, we should update
    }
    
    const userData = userDoc.data();
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    // Check if we have data for this month
    if (!userData.monthlyHighlights || !userData.monthlyHighlights[currentMonth]) {
      console.log(`[shouldUpdateHighlights] No data for current month ${currentMonth}`);
      return true;
    }
    
    // Check when the data was last updated
    const lastUpdated = userData.monthlyHighlights[currentMonth].savedAt;
    if (!lastUpdated) {
      return true;
    }
    
    // Check if it's been updated in the last 24 hours
    const lastUpdateDate = new Date(lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdateDate) / (1000 * 60 * 60);
    
    console.log(`[shouldUpdateHighlights] Hours since last update: ${hoursSinceUpdate}`);
    
    // Update if it's been more than 24 hours
    return hoursSinceUpdate > 24;
  } catch (error) {
    console.error('[shouldUpdateHighlights] Error:', error);
    return true; // If error, better to update to be safe
  }
};

export const getSpotifyAccessToken = async () => {
  try {
    if (!auth.currentUser) {
      console.log('[getSpotifyAccessToken] No user logged in');
      return null;
    }
    
    const userId = auth.currentUser.uid;
    
    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log(`[getSpotifyAccessToken] No user document found for ID: ${userId}`);
      return null;
    }
    
    const userData = userDoc.data();
    console.log(`[getSpotifyAccessToken] User document found, checking for Spotify connection`);
    
    // Check if we have Spotify data in the updated structure
    if (!userData.spotify || !userData.spotify.connection || !userData.spotify.connection.accessToken) {
      console.log('[getSpotifyAccessToken] No Spotify access token found in user document', {
        hasSpotify: !!userData.spotify,
        hasConnection: !!(userData.spotify && userData.spotify.connection),
        tokenLength: userData.spotify?.connection?.accessToken?.length
      });
      return null;
    }
    
    // Check if token is expired
    if (userData.spotify.connection.expirationTime) {
      const now = Date.now();
      const expirationTime = userData.spotify.connection.expirationTime;
      console.log(`[getSpotifyAccessToken] Token expiration check: now=${now}, expiration=${expirationTime}, expires in ${Math.floor((expirationTime - now) / 1000 / 60)} minutes`);
      
      if (now >= expirationTime) {
        console.log('[getSpotifyAccessToken] Token expired');
        return null;
      }
    } else {
      console.log('[getSpotifyAccessToken] No expirationTime found for token, assuming valid');
    }
    
    console.log(`[getSpotifyAccessToken] Valid token found, length: ${userData.spotify.connection.accessToken.length}`);
    return userData.spotify.connection.accessToken;
  } catch (error) {
    console.error('[getSpotifyAccessToken] Error:', error);
    return null;
  }
};

const SpotifyConnectScreen = ({ navigation, route }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  // For Android WebView
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const webViewRef = useRef(null);
  
  // Flag to determine whether to use WebView or external browser for Android
  const [useExternalBrowser, setUseExternalBrowser] = useState(false);
  
  // Get safe area insets
  const insets = useSafeAreaInsets();
  
  // Define helper functions first
  const fetchSpotifyProfile = async (token) => {
    try {
      console.log(`[${Platform.OS}] Fetching Spotify profile with token length: ${token.length}`);
      
      // Trim the token to remove any whitespace
      const cleanToken = token.trim();
      console.log(`[${Platform.OS}] Clean token length: ${cleanToken.length}`);
      
      // Log the URL and first part of token for debugging
      console.log(`[${Platform.OS}] Making request to: https://api.spotify.com/v1/me`);
      console.log(`[${Platform.OS}] With auth header: Bearer ${cleanToken.substring(0, 5)}...${cleanToken.substring(cleanToken.length - 5)}`);
      
      const response = await fetch('https://api.spotify.com/v1/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Check if the response is successful
      if (!response.ok) {
        const status = response.status;
        let errorText = '';
        
        try {
          // Try to get the response as text first
          errorText = await response.text();
          console.error(`[${Platform.OS}] Spotify API error (${status}):`, errorText);
          
          // Try to parse as JSON if possible
          try {
            const errorJson = JSON.parse(errorText);
            console.error(`[${Platform.OS}] Spotify API error details:`, JSON.stringify(errorJson));
            
            if (errorJson.error && errorJson.error.message) {
              if (errorJson.error.status === 401) {
                throw new Error(`Spotify API unauthorized (401): Token is invalid or expired`);
              }
              if (errorJson.error.status === 403) {
                throw new Error(`Spotify API access forbidden (403): Insufficient permissions. Scopes needed: ${SCOPES.join(', ')}`);
              }
              errorText = errorJson.error.message;
            }
          } catch (jsonError) {
            // Not JSON, use the text as is
            console.log(`[${Platform.OS}] Error response is not valid JSON:`, jsonError);
          }
        } catch (textError) {
          errorText = `Could not read error response: ${textError.message}`;
        }
        
        // Specific error handling based on status codes
        if (status === 401) {
          throw new Error(`Spotify API unauthorized (401): Token is invalid or expired`);
        } else if (status === 403) {
          console.error(`[${Platform.OS}] 403 Forbidden error - Check if these scopes are correct:`, SCOPES.join(', '));
          throw new Error(`Spotify API access forbidden (403): Check settings on developer.spotify.com/dashboard, the user may not be registered.`);
        } else if (status === 429) {
          throw new Error(`Spotify API rate limit exceeded (429): Too many requests`);
        } else {
          throw new Error(`Spotify API error (${status}): ${errorText}`);
        }
      }
      
      // Try to parse the response as JSON
      try {
        const data = await response.json();
        console.log(`[${Platform.OS}] Successfully fetched profile for: ${data.display_name || 'Unknown User'}`);
        console.log(`[${Platform.OS}] User profile data:`, JSON.stringify({
          id: data.id,
          name: data.display_name,
          email: data.email,
          country: data.country,
          product: data.product
        }));
        return data;
      } catch (jsonError) {
        console.error(`[${Platform.OS}] Error parsing profile data JSON:`, jsonError);
        throw new Error(`Failed to parse Spotify response: ${jsonError.message}`);
      }
    } catch (error) {
      console.error(`[${Platform.OS}] Error fetching Spotify profile:`, error);
      // Rethrow with more context for the user
      throw new Error(`Error fetching Spotify profile: ${error.message}`);
    }
  };
  
  const saveSpotifyConnection = async (token, expiresIn, profile) => {
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error('No userId available for saving Spotify connection');
        throw new Error('User not authenticated');
      }
      
      // Calculate expiration time
      const expirationTime = Date.now() + parseInt(expiresIn) * 1000;
      
      // Data to save to Firestore
      const spotifyData = {
        accessToken: token,
        expirationTime: expirationTime,
        spotifyUserId: profile?.id || '',
        displayName: profile?.display_name || 'Spotify User',
        imageUrl: profile?.images?.[0]?.url || '',
        lastConnected: new Date().toISOString(),
        email: profile?.email || '',
        country: profile?.country || '',
        product: profile?.product || '',  // Premium, free, etc.
      };
      
      console.log(`[${Platform.OS}] Saving Spotify connection for user ${userId} with Spotify ID ${spotifyData.spotifyUserId}`);
      console.log(`[${Platform.OS}] Token length: ${token.length}, expires in: ${expiresIn} seconds`);
      
      // Save to AsyncStorage with user-specific key 
      // This ensures different users on same device don't mix data
      await AsyncStorage.setItem(`spotify_token_${userId}`, token);
      await AsyncStorage.setItem(`spotify_expiration_${userId}`, expirationTime.toString());
      await AsyncStorage.setItem(`spotify_user_id_${userId}`, spotifyData.spotifyUserId);
      await AsyncStorage.setItem(`spotify_display_name_${userId}`, spotifyData.displayName);
      
      // Save to Firestore in user document
      // First check if the user document exists
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      // Create an update object that will preserve existing userData
      let updateObject = {};
      
      if (userDoc.exists()) {
        // Get existing data to preserve it
        const userData = userDoc.data();
        
        // Create update object preserving existing data
        updateObject = {
          spotify: {
            connection: spotifyData,
            // Preserve existing highlights or initialize new structure
            highlights: userData.spotify?.highlights || {
              lastUpdated: null,
              monthlyData: {}
            }
          },
          // Only add these if user doc already exists
          lastUpdated: new Date().toISOString()
        };
        
        // Update existing document
        console.log(`[${Platform.OS}] Updating existing user document with Spotify connection`);
        await updateDoc(userRef, updateObject);
      } else {
        // Create new document
        updateObject = {
          spotify: {
            connection: spotifyData,
            highlights: {
              lastUpdated: null,
              monthlyData: {}
            }
          },
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        console.log(`[${Platform.OS}] Creating new user document with Spotify connection`);
        await setDoc(userRef, updateObject);
      }
      
      // Verify the data was saved
      const verifyDoc = await getDoc(userRef);
      if (verifyDoc.exists()) {
        const verifyData = verifyDoc.data();
        const savedToken = verifyData.spotify?.connection?.accessToken;
        console.log(`[${Platform.OS}] Verified saved token: ${savedToken ? 'Present' : 'Missing'}, length: ${savedToken?.length || 0}`);
      } else {
        console.error(`[${Platform.OS}] Failed to verify document after save`);
      }
      
      console.log(`[${Platform.OS}] Spotify connection saved successfully for user ${userId}`);
      
      // Update state
      setUserName(spotifyData.displayName);
      setIsConnected(true);
      
      return spotifyData;
    } catch (error) {
      console.error(`[${Platform.OS}] Error saving Spotify connection:`, error);
      throw error;
    }
  };
  
  // Improve the processAuthResult function to handle token extraction better
  const processAuthResult = React.useCallback(async (url) => {
    console.log(`[${Platform.OS}] Processing auth result:`, typeof url === 'string' ? url.substring(0, 50) + '...' : 'object');
    
    let accessToken = null;
    let expiresIn = null;
    
    try {
      // Handle different URL formats (direct URL string from external browser or result object from WebBrowser)
      if (typeof url === 'string') {
        // Process URL from external browser or deep link
        if (url.includes('#access_token=')) {
          // Hash format
          const accessTokenMatch = url.match(/#access_token=([^&]*)/);
          const expiresInMatch = url.match(/expires_in=([^&]*)/);
          
          if (accessTokenMatch && accessTokenMatch[1]) {
            accessToken = decodeURIComponent(accessTokenMatch[1]);
            expiresIn = expiresInMatch && expiresInMatch[1] ? parseInt(expiresInMatch[1]) : 3600;
            console.log(`[${Platform.OS}] Extracted token from hash fragment, length: ${accessToken.length}`);
          }
        } else if (url.includes('?access_token=')) {
          // Query format
          const accessTokenMatch = url.match(/\?access_token=([^&]*)/);
          const expiresInMatch = url.match(/expires_in=([^&]*)/);
          
          if (accessTokenMatch && accessTokenMatch[1]) {
            accessToken = decodeURIComponent(accessTokenMatch[1]);
            expiresIn = expiresInMatch && expiresInMatch[1] ? parseInt(expiresInMatch[1]) : 3600;
            console.log(`[${Platform.OS}] Extracted token from query string, length: ${accessToken.length}`);
          }
        }
      } else if (url && url.type === 'success' && url.url) {
        // Process result from WebBrowser.openAuthSessionAsync
        const resultUrl = url.url;
        console.log(`[${Platform.OS}] Processing WebBrowser result URL: ${resultUrl.substring(0, 50)}...`);
        
        if (resultUrl.includes('#access_token=')) {
          // Hash format
          const accessTokenMatch = resultUrl.match(/#access_token=([^&]*)/);
          const expiresInMatch = resultUrl.match(/expires_in=([^&]*)/);
          
          if (accessTokenMatch && accessTokenMatch[1]) {
            accessToken = decodeURIComponent(accessTokenMatch[1]);
            expiresIn = expiresInMatch && expiresInMatch[1] ? parseInt(expiresInMatch[1]) : 3600;
            console.log(`[${Platform.OS}] Extracted token from WebBrowser hash, length: ${accessToken.length}`);
          }
        } else if (resultUrl.includes('?access_token=')) {
          // Query format
          const accessTokenMatch = resultUrl.match(/\?access_token=([^&]*)/);
          const expiresInMatch = resultUrl.match(/expires_in=([^&]*)/);
          
          if (accessTokenMatch && accessTokenMatch[1]) {
            accessToken = decodeURIComponent(accessTokenMatch[1]);
            expiresIn = expiresInMatch && expiresInMatch[1] ? parseInt(expiresInMatch[1]) : 3600;
            console.log(`[${Platform.OS}] Extracted token from WebBrowser query, length: ${accessToken.length}`);
          }
        }
      }
      
      if (!accessToken) {
        console.error(`[${Platform.OS}] No access token found in URL:`, typeof url === 'string' ? url.substring(0, 50) + '...' : JSON.stringify(url).substring(0, 50) + '...');
        throw new Error('No access token found in the response');
      }
      
      console.log(`[${Platform.OS}] Successfully extracted token with expiration: ${expiresIn} seconds`);
      
      // Fetch the user profile and save the connection
      try {
        console.log(`[${Platform.OS}] Fetching user profile with token length: ${accessToken.length}`);
        const userProfile = await fetchSpotifyProfile(accessToken);
        await saveSpotifyConnection(accessToken, expiresIn, userProfile);
        
        // Set as connected and navigate to stats screen
        setIsConnected(true);
        setIsAuthenticating(false);
        setLoading(false);
        navigation.navigate('SpotifyCrapped');
      } catch (error) {
        console.error(`[${Platform.OS}] Error saving Spotify connection:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`[${Platform.OS}] Error in processAuthResult:`, error);
      setError(`Authentication failed: ${error.message}`);
      setIsAuthenticating(false);
      setLoading(false);
      throw error;
    }
  }, [navigation]);
  
  // Register this component for callbacks on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Create a direct navigation function that can be called from anywhere
      window.navigateToSpotifyCrapped = () => {
        console.log('[web] Direct navigation to SpotifyCrapped triggered');
        navigation.navigate('SpotifyCrapped');
      };
      
      // Store reference to this component instance for callback handling
      window.spotifyConnectScreenInstance = {
        handleAuthComplete: (authData) => {
          console.log('[web] Processing auth data from callback');
          
          // Create a URL with the token to process
          const reconstructedUrl = `${window.location.origin}#access_token=${authData.access_token}&expires_in=${authData.expires_in}`;
          
          // Process the authentication result
          processAuthResult({ 
            type: 'success', 
            url: reconstructedUrl 
          }).then(() => {
            console.log('[web] Auth processing complete, navigating');
            setIsAuthenticating(false);
            setLoading(false);
          }).catch(error => {
            console.error('[web] Error during auth processing:', error);
            setIsAuthenticating(false);
            setLoading(false);
            setError('Failed to process authentication: ' + error.message);
          });
        }
      };
    }
    
    // Clean up references on unmount
    return () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.spotifyConnectScreenInstance = null;
        window.navigateToSpotifyCrapped = null;
      }
    };
  }, [navigation]);

  // Check Spotify connection on component mount
  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  // Define the URL handler with useCallback to maintain reference stability
  const handleUrl = React.useCallback(async (event) => {
    const url = event.url;
    console.log('URL Event received:', url);
    
    // Check if this URL contains an access token (regardless of scheme)
    if ((url.includes('access_token=') || url.includes('spotifyclog://')) && isAuthenticating) {
      console.log('Processing authentication URL:', url);
      
      try {
        // For URLs that have a hash fragment with the token
        if (url.includes('#access_token=')) {
          console.log('URL contains hash fragment with token, extracting directly');
          
          // Extract token from hash fragment
          const accessTokenMatch = url.match(/#access_token=([^&]*)/);
          const expiresInMatch = url.match(/expires_in=([^&]*)/);
          
          if (accessTokenMatch && accessTokenMatch[1]) {
            const accessToken = accessTokenMatch[1];
            const expiresIn = expiresInMatch && expiresInMatch[1] ? expiresInMatch[1] : '3600';
            
            console.log(`Successfully extracted token from hash: ${accessToken.substring(0, 5)}...`);
            
            // Fetch user profile and save connection
            const userProfile = await fetchSpotifyProfile(accessToken);
            await saveSpotifyConnection(accessToken, expiresIn, userProfile);
            
            // Update UI state
            setIsConnected(true);
            setIsAuthenticating(false);
            setLoading(false);
            
            // Navigate to stats screen
            navigation.navigate('SpotifyCrapped');
            return;
          }
        }
        
        // For Android https:// URLs that should be redirected to our app scheme
        if (Platform.OS === 'android' && url.startsWith('https://callback')) {
          console.log('Detected https callback URL, converting to app scheme');
          
          // Extract the query/hash part
          let tokenPart = '';
          if (url.includes('#')) {
            tokenPart = url.split('#')[1];
            const processUrl = `spotifyclog://callback#${tokenPart}`;
            console.log('Converted URL:', processUrl);
            await processAuthResult(processUrl);
          } else if (url.includes('?')) {
            tokenPart = url.split('?')[1];
            const processUrl = `spotifyclog://callback?${tokenPart}`;
            console.log('Converted URL:', processUrl);
            await processAuthResult(processUrl);
          }
        } else {
          // Process using normal flow
          await processAuthResult(url);
        }
        
        setIsAuthenticating(false);
        setLoading(false);
      } catch (error) {
        console.error('Error processing auth URL:', error);
        setError('Authentication failed: ' + (error.message || 'Unknown error'));
        setIsAuthenticating(false);
        setLoading(false);
      }
    }
  }, [isAuthenticating, navigation, processAuthResult]);

  // Add the URL event handler in useEffect
  useEffect(() => {
    // Add the event listener
    const subscription = Linking.addEventListener('url', handleUrl);
    
    // Check if app was opened with a URL
    Linking.getInitialURL().then(async (initialUrl) => {
      if (initialUrl && initialUrl.includes('spotifyclog://') && isAuthenticating) {
        console.log('App opened with URL:', initialUrl);
        handleUrl({ url: initialUrl });
      }
    });
    
    // Clean up the event listener on component unmount
    return () => {
      subscription.remove();
    };
  }, [handleUrl]); // Include handleUrl in dependencies

  // Add a new useEffect to handle web redirects
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebRedirect = async () => {
        try {
          const url = window.location.href;
          
          // Check if we're returning from the callback page
          if (url.includes('spotify-connect')) {
            console.log(`[${Platform.OS}] Detected return from callback page`);
            
            // Try to get token from localStorage (set by our callback page)
            const storedAuthData = localStorage.getItem('spotify_auth_data');
            if (storedAuthData) {
              console.log(`[${Platform.OS}] Found auth data in localStorage`);
              
              try {
                // Parse the stored data
                const authData = JSON.parse(storedAuthData);
                
                // Create a result object similar to what WebBrowser would return
                const reconstructedUrl = `${window.location.origin}${window.location.pathname}#access_token=${authData.access_token}&expires_in=${authData.expires_in}`;
                const result = { type: 'success', url: reconstructedUrl };
                
                // Process the authentication result
                await processAuthResult(result);
                
                // Clear the stored data after processing
                localStorage.removeItem('spotify_auth_data');
                
                // Clean up the URL
                if (window.history && window.history.replaceState) {
                  window.history.replaceState({}, document.title, window.location.pathname);
                }
                
                return;
              } catch (error) {
                console.error(`[${Platform.OS}] Error parsing stored auth data:`, error);
              }
            } else {
              // Check if we already have a connection in Firestore
              await checkSpotifyConnection();
            }
          }
          
          // Check for auth=success parameter which indicates a successful redirect from our auth handler
          if (url.includes('auth=success')) {
            console.log(`[${Platform.OS}] Detected successful auth redirect`);
            
            // Try to get token from localStorage (set by our auth handler)
            const storedAuthData = localStorage.getItem('spotify_auth_data');
            if (storedAuthData) {
              console.log(`[${Platform.OS}] Found auth data in localStorage`);
              
              try {
                // Parse the stored data
                const authData = JSON.parse(storedAuthData);
                
                // Create a result object similar to what WebBrowser would return
                const reconstructedUrl = `${window.location.origin}${window.location.pathname}#access_token=${authData.access_token}&expires_in=${authData.expires_in}`;
                const result = { type: 'success', url: reconstructedUrl };
                
                // Process the authentication result
                await processAuthResult(result);
                
                // Clear the stored data after processing
                localStorage.removeItem('spotify_auth_data');
                
                // Clean up the URL
                if (window.history && window.history.replaceState) {
                  window.history.replaceState({}, document.title, window.location.pathname);
                }
                
                return;
              } catch (error) {
                console.error(`[${Platform.OS}] Error parsing stored auth data:`, error);
              }
            } else {
              console.warn(`[${Platform.OS}] Auth success parameter found but no data in localStorage`);
            }
          }
          
          // Check for auth=error parameter
          if (url.includes('auth=error')) {
            console.log(`[${Platform.OS}] Detected error redirect`);
            
            // Extract error message if available
            const urlObj = new URL(url);
            const errorMessage = urlObj.searchParams.get('message');
            
            if (errorMessage) {
              Alert.alert('Authentication Error', decodeURIComponent(errorMessage));
            } else {
              Alert.alert('Authentication Error', 'Failed to authenticate with Spotify');
            }
            
            // Clean up the URL
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            setIsAuthenticating(false);
            return;
          }
          
          // First check if we have a token in localStorage (from auth-handler.html)
          const storedAuthResponse = localStorage.getItem('spotify_auth_response');
          if (storedAuthResponse) {
            console.log(`[${Platform.OS}] Found stored auth response in localStorage`);
            
            // Create a URL with the hash to process
            const reconstructedUrl = `${window.location.origin}${window.location.pathname}#${storedAuthResponse}`;
            
            // Process the authentication result
            await processAuthResult({ type: 'success', url: reconstructedUrl });
            
            // Clear the stored response after processing
            localStorage.removeItem('spotify_auth_response');
            
            // Clean up the URL
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          
          return;
        }
        
          // Check if we're returning from a Spotify auth redirect with a token
          if (url.includes('access_token=')) {
            console.log(`[${Platform.OS}] Detected redirect with token in URL`);
            
            // Check if we were in the auth process
            const authInProgress = await AsyncStorage.getItem('spotify_auth_in_progress');
            if (authInProgress === 'true') {
              console.log(`[${Platform.OS}] Auth was in progress, processing token`);
              
              // Create a result object similar to what WebBrowser would return
              const result = { type: 'success', url };
              
              // Process the authentication result
              await processAuthResult(result);
            }
            
            // Clean up the URL to remove the token
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (error) {
          console.error(`[${Platform.OS}] Error handling web redirect:`, error);
        }
      };
      
      handleWebRedirect();
    }
  }, []);

  // Add the missing checkSpotifyConnection function
  const checkSpotifyConnection = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.log(`[${Platform.OS}] No user ID found, navigating to login`);
        navigation.navigate('Login');
        return;
      }

      console.log(`[${Platform.OS}] Checking Spotify connection for user ${userId}`);

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const spotifyConnection = userData.spotify?.connection;
        
        if (spotifyConnection?.accessToken) {
          // Check if token is expired
          const expirationTime = spotifyConnection.expirationTime;
          const isExpired = expirationTime && Date.now() > expirationTime;
          
          console.log(`[${Platform.OS}] Found Spotify connection for user ${userId}, Spotify user: ${spotifyConnection.spotifyUserId}`);
          console.log(`[${Platform.OS}] Token expires: ${new Date(expirationTime).toLocaleString()}, expired: ${isExpired}`);
          
          // Set UI state based on connection status
          setIsConnected(!isExpired);
          setNeedsReconnect(isExpired);
          setUserName(spotifyConnection.displayName || '');
          
          if (isExpired) {
            setError('Your Spotify connection has expired. Please reconnect.');
          }
        } else {
          console.log(`[${Platform.OS}] No Spotify connection found for user ${userId}`);
          setIsConnected(false);
        }
      } else {
        console.log(`[${Platform.OS}] User document not found for ${userId}`);
        setIsConnected(false);
      }
    } catch (error) {
      console.error(`[${Platform.OS}] Error checking Spotify connection:`, error);
      setError('Failed to check Spotify connection: ' + error.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
      setIsCheckingConnection(false);
    }
  };

  // Function to generate custom HTML that handles Spotify auth
  const generateSpotifyAuthHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Spotify Authentication</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #191414;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .container {
            text-align: center;
            padding: 20px;
          }
          .logo {
            width: 60px;
            height: 60px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 30px;
            color: #b3b3b3;
          }
          .button {
            background-color: #1DB954;
            color: white;
            border: none;
            border-radius: 30px;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            display: inline-block;
            text-decoration: none;
          }
          .spinner {
            display: none;
            width: 40px;
            height: 40px;
            margin: 20px auto;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #1DB954;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          #status {
            margin-top: 20px;
            color: #b3b3b3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt="Spotify Logo" class="logo">
          <h1>Connect with Spotify</h1>
          <p>Click the button below to authorize access to your Spotify account</p>
          <button id="loginButton" class="button">Authorize Spotify</button>
          <div id="spinner" class="spinner"></div>
          <div id="status"></div>
        </div>
        
        <script>
          // Spotify API credentials
          const CLIENT_ID = "${CLIENT_ID}";
          const REDIRECT_URI = "${REDIRECT_URI}";
          const SCOPES = "${SCOPES.join(' ')}";
          
          // Show loading spinner and status
          function showLoading(message) {
            document.getElementById('spinner').style.display = 'block';
            document.getElementById('status').textContent = message || 'Loading...';
            document.getElementById('loginButton').style.display = 'none';
          }
          
          // Handle authentication result
          function handleAuthCallback() {
            // Check if we have a token in the URL
            const hash = window.location.hash.substring(1);
            if (hash) {
              showLoading('Processing authentication...');
              
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const expiresIn = params.get('expires_in');
              
              if (accessToken) {
                console.log('Found access token in URL');
                
                // Send message to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SPOTIFY_AUTH_SUCCESS',
                    accessToken: accessToken,
                    expiresIn: expiresIn || '3600'
                  }));
                  
                  document.getElementById('status').textContent = 'Authentication successful! Redirecting...';
                  return true;
                } else {
                  document.getElementById('status').textContent = 'Error: Cannot communicate with the app.';
                  document.getElementById('loginButton').style.display = 'block';
                }
              }
            }
            
            return false;
          }
          
          // Authorize with Spotify
          function authorizeWithSpotify() {
            showLoading('Redirecting to Spotify...');
            
            // Create the authorization URL
            const authUrl = 'https://accounts.spotify.com/authorize' +
              '?response_type=token' +
              '&client_id=' + encodeURIComponent(CLIENT_ID) +
              '&scope=' + encodeURIComponent(SCOPES) +
              '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
              '&show_dialog=true';
            
            // Navigate to Spotify authorization
            window.location.href = authUrl;
          }
          
          // Add event listener to the login button
          document.getElementById('loginButton').addEventListener('click', authorizeWithSpotify);
          
          // Check if we already have a token in the URL
          if (!handleAuthCallback()) {
            document.getElementById('loginButton').style.display = 'block';
          }
        </script>
      </body>
      </html>
    `;
  };

  // Update the Spotify Connect function to use the new HTML approach
  const handleSpotifyConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAuthenticating(true);
      setNeedsReconnect(false);
      
      const redirectUri = getRedirectURI();
      console.log(`[${Platform.OS}] Starting Spotify connection with redirect URI:`, redirectUri);
      
      const scope = encodeURIComponent(SCOPES.join(' '));
      const state = encodeURIComponent(Date.now().toString());
      
      const newAuthUrl = `${SPOTIFY_AUTH_ENDPOINT}?` +
        `client_id=${encodeURIComponent(CLIENT_ID)}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scope}` +
        `&show_dialog=true` +
        `&state=${state}`;
      
      console.log(`[${Platform.OS}] Authorization URL (first 100 chars):`, newAuthUrl.substring(0, 100) + '...');
      
      await AsyncStorage.setItem('spotify_auth_in_progress', 'true');
      
      WebBrowser.maybeCompleteAuthSession();
      
      if (Platform.OS === 'android') {
        // For Android, use our custom HTML page that handles all auth in the WebView
        console.log('[android] Using custom HTML WebView for authentication');
        setAuthUrl('about:blank'); // Initialize with blank page
        setShowWebView(true);
      } else if (Platform.OS === 'web') {
        // Web specific approach
        const options = { windowFeatures: "width=600,height=700,resizable,scrollbars=yes,status=1" };
        console.log(`[${Platform.OS}] Opening popup with options:`, options);
        
        try {
          const popup = window.open(newAuthUrl, 'SpotifyAuth', options.windowFeatures);
          
          // Set up an interval to check when the popup is closed
          if (popup) {
            const checkPopupClosed = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkPopupClosed);
                console.log('[web] Auth popup was closed');
                
                // Check if we received a token via localStorage
                const storedAuthData = localStorage.getItem('spotify_auth_data');
                if (storedAuthData) {
                  console.log('[web] Found auth data in localStorage');
                  try {
                    const authData = JSON.parse(storedAuthData);
                    const reconstructedUrl = `${window.location.origin}#access_token=${authData.access_token}&expires_in=${authData.expires_in}`;
                    processAuthResult({ type: 'success', url: reconstructedUrl });
                    localStorage.removeItem('spotify_auth_data');
                  } catch (error) {
                    console.error('[web] Error processing stored auth data:', error);
                    setError('Failed to process authentication data');
                  }
                } else {
                  console.log('[web] No auth data found, user likely cancelled');
                  setError('Authentication was cancelled');
                }
                
                setIsAuthenticating(false);
                setLoading(false);
              }
            }, 500);
          } else {
            console.error('[web] Failed to open popup window - it may have been blocked');
            setError('Popup blocked. Please allow popups for this site.');
            setIsAuthenticating(false);
            setLoading(false);
          }
        } catch (webError) {
          console.error('[web] Error opening auth window:', webError);
          setError('Failed to open authentication window: ' + webError.message);
          setIsAuthenticating(false);
          setLoading(false);
        }
      } else {
        // iOS approach
        try {
          // Configure WebBrowser options for iOS
          const options = {
            preferredControlTintColor: '#1DB954',
            controlsColor: '#1DB954',
            barTintColor: '#191414'
          };
          
          console.log(`[ios] Opening WebBrowser with options:`, options);
          
          // Open auth session in WebBrowser
          const result = await WebBrowser.openAuthSessionAsync(
            newAuthUrl,
            redirectUri,
            options
          );
          
          console.log(`[ios] Auth session result:`, result);
          
          if (result.type === 'success' && result.url) {
            console.log(`[ios] Successful auth, processing result`);
            await processAuthResult(result);
          } else if (result.type === 'cancel') {
            console.log(`[ios] Auth cancelled by user`);
            setError('Authentication was cancelled');
          } else {
            console.log(`[ios] Auth failed:`, result);
            setError('Authentication failed. Please try again.');
          }
        } catch (error) {
          console.error(`[ios] Browser error:`, error);
          setError(`Authentication error: ${error.message || 'Unknown error'}`);
        } finally {
          setIsAuthenticating(false);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error(`[${Platform.OS}] Connection error:`, error);
      setError(`Failed to connect: ${error.message || 'Unknown error'}`);
      setIsAuthenticating(false);
      setLoading(false);
    }
  };

  // Update the navigation state handler
  const handleNavigationStateChange = React.useCallback(async (navState) => {
    const url = navState.url || navState;
    console.log(`[android] WebView navigating to:`, url);
    
    try {
      // Check if we're at the authorization page
      if (url.includes('accounts.spotify.com/authorize')) {
        console.log('[android] On Spotify authorization page');
        return;
      }

      // Extract access token from URL
      let accessToken = null;
      let expiresIn = null;

      // Try hash fragment first (handle both # and #/ cases)
      if (url.includes('#access_token=')) {
        const hashPart = url.split('#').pop().replace(/^\//, '');
        const params = new URLSearchParams(hashPart);
        accessToken = params.get('access_token');
        expiresIn = params.get('expires_in');
      } 
      // Then try query parameters
      else if (url.includes('?access_token=')) {
        const queryPart = url.split('?')[1];
        const params = new URLSearchParams(queryPart);
        accessToken = params.get('access_token');
        expiresIn = params.get('expires_in');
      }

      if (accessToken) {
        console.log('[android] Found access token, processing...');
        try {
          const userProfile = await fetchSpotifyProfile(accessToken);
          await saveSpotifyConnection(accessToken, expiresIn || '3600', userProfile);
          
          setIsConnected(true);
          setIsAuthenticating(false);
          setLoading(false);
          setShowWebView(false);
          
          // Navigate to the stats screen
          navigation.navigate('SpotifyCrapped');
        } catch (error) {
          console.error('[android] Error processing token:', error);
          setError('Failed to process authentication: ' + error.message);
          setShowWebView(false);
          setIsAuthenticating(false);
          setLoading(false);
        }
      }

      // Handle error cases
      if (url.includes('error=')) {
        console.error('[android] Authorization error:', url);
        setError('Failed to authenticate with Spotify. Please try again.');
        setShowWebView(false);
        setIsAuthenticating(false);
        setLoading(false);
      }
    } catch (error) {
      console.error(`[android] Error in navigation state change:`, error);
      setError(`Authentication error: ${error.message || 'Unknown error'}`);
      setShowWebView(false);
      setIsAuthenticating(false);
      setLoading(false);
    }
  }, [navigation, fetchSpotifyProfile, saveSpotifyConnection]);

  // Add handler for Android back button when WebView is open
  useEffect(() => {
    if (Platform.OS === 'android' && showWebView) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        setShowWebView(false);
        setIsAuthenticating(false);
        setLoading(false);
        return true;
      });
      
      return () => backHandler.remove();
    }
  }, [showWebView]);

  // Function to close the WebView
  const closeWebView = () => {
    setShowWebView(false);
    setIsAuthenticating(false);
    setLoading(false);
  };

  // Handle WebView errors
  const handleWebViewError = (error) => {
    console.error(`[android] WebView error:`, error);
    setError(`WebView error: ${error.description || 'Unknown error'}`);
    setShowWebView(false);
    setIsAuthenticating(false);
    setLoading(false);
  };

  // Render WebView for Android
  if (Platform.OS === 'android' && showWebView) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={closeWebView}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>Spotify Login</Text>
        </View>
        
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: generateSpotifyAuthHTML() }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log('[android] Received message from WebView:', data.type);
              
              if (data.type === 'SPOTIFY_AUTH_SUCCESS') {
                console.log('[android] Received auth token from WebView');
                const { accessToken, expiresIn } = data;
                
                fetchSpotifyProfile(accessToken)
                  .then(userProfile => {
                    console.log('[android] Successfully fetched profile');
                    return saveSpotifyConnection(accessToken, expiresIn, userProfile);
                  })
                  .then(() => {
                    console.log('[android] Connection saved, navigating to next screen');
                    setIsConnected(true);
                    setShowWebView(false);
                    setIsAuthenticating(false);
                    setLoading(false);
                    
                    setTimeout(() => {
                      navigation.navigate('SpotifyCrapped');
                    }, 100);
                  })
                  .catch(error => {
                    console.error('[android] Error processing token from WebView:', error);
                    setError('Authentication error: ' + error.message);
                    setShowWebView(false);
                    setIsAuthenticating(false);
                    setLoading(false);
                  });
              }
            } catch (error) {
              console.error('[android] Error parsing WebView message:', error);
            }
          }}
          onError={handleWebViewError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
          incognito={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#1DB954" />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
            <Text style={styles.loadingText}>Connecting to Spotify...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={[
              styles.content, 
              { paddingBottom: Math.max(insets.bottom + 100, 120) }
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEnabled={true}
            alwaysBounceVertical={true}
          >
            <View style={styles.header}>
              <Image
                source={require('../assets/spotify_logo.png')}
                style={styles.logo}
              />
              <Text style={styles.title}>Connect with Spotify</Text>
              <Text style={styles.subtitle}>
                Link your Spotify account to view and manage your listening history and playlists
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="history" size={20} color="#1DB954" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>View Listening History</Text>
                  <Text style={styles.infoDescription}>
                    Track your listening habits and discover patterns
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="bar-chart" size={20} color="#1DB954" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>See Your Stats</Text>
                  <Text style={styles.infoDescription}>
                    Analyze your top artists, tracks, and genres
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="list-ul" size={20} color="#1DB954" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Manage Playlists</Text>
                  <Text style={styles.infoDescription}>
                    Access and organize your playlists directly
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.connectButton} 
                onPress={handleSpotifyConnect}
              >
                <Text style={styles.connectButtonText}>Connect with Spotify</Text>
                <FontAwesome name="spotify" size={24} color="white" style={styles.buttonIcon} />
              </TouchableOpacity>
              
              {needsReconnect && (
                <TouchableOpacity 
                  style={styles.troubleshootButton} 
                  onPress={handleSpotifyConnect}
                >
                  <Text style={styles.troubleshootText}>Reconnect Spotify</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#191414',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#b3b3b3',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoContainer: {
    marginVertical: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoDescription: {
    color: '#b3b3b3',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 16,
  },
  connectButton: {
    backgroundColor: '#1DB954',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  troubleshootButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  troubleshootText: {
    color: '#1DB954',
    fontSize: 14,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  webViewHeader: {
    flexDirection: 'row',
    backgroundColor: '#191414',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 10,
    padding: 10,
  },
  closeButtonText: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webViewTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 20, 20, 0.8)',
  },
});

// Export the SpotifyConnectScreen component as default
export default SpotifyConnectScreen;