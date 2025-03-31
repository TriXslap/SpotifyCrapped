import React, { useEffect, useState, useRef, Component } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './screens/WelcomeScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import SpotifyConnectScreen from './screens/SpotifyConnectScreen';
import SpotifyCrappedScreen from './screens/SpotifyCrappedScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase/config';
import { Platform, View, StyleSheet, StatusBar, Text as RNText, LogBox, TouchableOpacity } from 'react-native';
import BottomPlayer from './components/BottomPlayer';
import { colors } from './src/theme';
import * as Notifications from 'expo-notifications';

// Add more debug logs at the top of the file
console.log('[DEBUG] App.js is being loaded - starting application');

// Add more debug logs for navigation at the top of the file
console.log('[DEBUG] App.js is being loaded - starting application');

const onNavigationStateChange = (state) => {
  if (state && state.routes) {
    const currentRoute = state.routes[state.index];
    console.log('[DEBUG NAVIGATION] Current route:', currentRoute?.name);
    console.log('[DEBUG NAVIGATION] Full state:', JSON.stringify(state, null, 2));
  }
};

// Use platform-specific linking
let Linking;
if (Platform.OS === 'web') {
  // Use our custom web linking implementation for web
  Linking = require('./utils/webLinking').default;
  console.log('[web] Using custom web linking implementation');
} else {
  // Use expo-linking for native platforms
  Linking = require('expo-linking');
  console.log(`[${Platform.OS}] Using expo-linking`);
}

const Stack = createNativeStackNavigator();

// Configure linking
const prefix = Linking.createURL('/');
const linking = {
  prefixes: [
    prefix, 
    'spotifyclog://', 
    'https://wrappedclone.firebaseapp.com'
  ],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      Signup: 'signup',
      ProfileScreen: 'profile',
      SpotifyConnect: 'spotify-connect',
      SpotifyCrapped: 'spotify-data'
    }
  }
};

console.log(`[${Platform.OS}] App initialized with linking prefix:`, prefix);

// Set up custom error handler
const originalGlobalHandler = ErrorUtils.getGlobalHandler();
if (originalGlobalHandler) {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Log the error details
    console.log('[GLOBAL ERROR]', error.message);
    console.log('[GLOBAL ERROR] Stack:', error.stack);
    
    // Call original handler
    originalGlobalHandler(error, isFatal);
  });
}

// Create a custom navigation theme that doesn't rely on typography
const CustomDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    primary: '#1DB954',
    background: '#121212',
    card: '#121212',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
    notification: '#FF4136',
  },
};

// Log an explicit check of the typography object
try {
  console.log('[DEBUG CHECK] Checking typography in theme:');
  const { typography } = require('./src/theme');
  console.log('[DEBUG CHECK] typography:', JSON.stringify(typography, null, 2));
  console.log('[DEBUG CHECK] typography.weight:', typography.weight);
  console.log('[DEBUG CHECK] typography.size:', typography.size);
  console.log('[DEBUG CHECK] typography.lineHeight:', typography.lineHeight);
} catch (e) {
  console.log('[DEBUG CHECK] Error checking typography:', e.message);
}

// ErrorBoundary component definition
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    console.log('[DEBUG] ErrorBoundary initialized');
  }

  static getDerivedStateFromError(error) {
    console.log('[DEBUG] ErrorBoundary caught an error:', error.message);
    // Check if the error is a navigation error
    if (error.message && error.message.includes('The action')) {
      console.log('[DEBUG] Navigation error detected:', error.message);
    }
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('[DEBUG] Error details:', error);
    console.error('[DEBUG] Error info:', errorInfo);
    // Log specifically navigation errors
    if (error.message && error.message.includes('navigate')) {
      console.error('[DEBUG] Navigation error details:');
      console.error('[DEBUG] Message:', error.message);
      console.error('[DEBUG] Stack:', error.stack);
    }
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error.toString();
      console.log('[DEBUG] Rendering error UI with message:', errorMessage);
      
      // Render fallback UI
      return (
        <View style={errorStyles.errorContainer}>
          <RNText style={errorStyles.errorTitle}>Something went wrong!</RNText>
          <RNText style={errorStyles.errorMessage}>
            {errorMessage}
          </RNText>
          <RNText style={errorStyles.errorDetail}>
            Please restart the app or try resetting to the welcome screen.
          </RNText>
          
          {/* Add a button to try to go to Welcome screen */}
          <TouchableOpacity 
            style={errorStyles.resetButton}
            onPress={() => {
              console.log('[DEBUG] Attempting to reset app');
              this.setState({ hasError: false });
              // Use the resetApp function passed as prop
              if (this.props.resetApp) {
                this.props.resetApp();
              } else if (this.props.navigationRef && this.props.navigationRef.current) {
                try {
                  // Fallback to direct navigation
                  this.props.navigationRef.current.navigate('Welcome');
                  console.log('[DEBUG] Successfully called navigate to Welcome');
                } catch (e) {
                  console.error('[DEBUG] Failed to navigate:', e.message);
                }
              } else {
                console.log('[DEBUG] No navigation options available for reset');
              }
            }}
          >
            <RNText style={errorStyles.resetButtonText}>
              Reset Application
            </RNText>
          </TouchableOpacity>
        </View>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

// Add styles for the error screen
const errorStyles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorTitle: {
    color: '#E53935',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#B3B3B3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  resetButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const App = () => {
  console.log('[DEBUG] Rendering App component');
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [initialUrl, setInitialUrl] = useState(null);
  const [showNavBar, setShowNavBar] = useState(false);
  const navigationRef = useRef(null);
  const [currentRoute, setCurrentRoute] = useState('ProfileScreen');
  
  // Add a new reset handler
  const resetApp = () => {
    console.log('[DEBUG] Resetting app state');
    if (navigationRef.current) {
      try {
        const route = !user ? 'Welcome' : 'ProfileScreen';
        console.log('[DEBUG] Navigating to reset route:', route);
        navigationRef.current.navigate(route);
      } catch (e) {
        console.error('[DEBUG] Navigation error during reset:', e.message);
      }
    }
  };

  // Authentication state change listener
  useEffect(() => {
    console.log('[DEBUG] Setting up auth state listener');
    
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      console.log('[DEBUG] Auth state changed:', authUser ? 'User is signed in' : 'No user');
      
      if (authUser) {
        // User is signed in
        setUser(authUser);
        
        // Ensure navbar shows for authenticated users
        setShowNavBar(true);
      } else {
        // User is signed out
        setUser(null);
        setShowNavBar(false);
      }
      
      if (initializing) {
        setInitializing(false);
      }
    });
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);
  
  // Check for deep links
  useEffect(() => {
    console.log('[DEBUG] Setting up deep link handler');
    
    const getInitialUrl = async () => {
      try {
        // Get the initial URL
        const url = await Linking.getInitialURL();
        console.log('[DEBUG] Initial deep link URL:', url);
        setInitialUrl(url);
      } catch (e) {
        console.error('[DEBUG] Error getting initial URL:', e);
      }
    };
    
    const handleDeepLink = (event) => {
      console.log('[DEBUG] Deep link received:', event.url);
      setInitialUrl(event.url);
    };
    
    getInitialUrl();
    
    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      // Clean up the event listener
      subscription.remove();
    };
  }, []);

  // Update the onStateChange handler to track current route
  const handleNavigationStateChange = (state) => {
    if (state && state.routes) {
      const currentRouteName = state.routes[state.index]?.name;
      console.log('[DEBUG NAVIGATION] Current route:', currentRouteName);
      console.log('[DEBUG NAVIGATION] Full state:', JSON.stringify(state, null, 2));
      
      if (currentRouteName) {
        setCurrentRoute(currentRouteName);
      }
    }
  };

  // Add notification response listener for handling notification taps
  useEffect(() => {
    // Try-catch block for notification listeners to prevent app crashes
    try {
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        // Handle received notification while app is in foreground
        console.log('[NOTIFICATION] Received in foreground:', notification);
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        try {
          const { notification } = response;
          const data = notification.request.content.data;
          console.log('[NOTIFICATION] Response received:', data);
          
          // Navigate based on notification type
          if (data && data.type) {
            if (navigationRef.current && user) {
              // If user is logged in, navigate to the SpotifyCrapped screen
              // This ensures user sees their stats when they tap the notification
              navigationRef.current.navigate('SpotifyCrapped');
            }
          }
        } catch (err) {
          // Just log the error but don't crash the app
          console.error('[NOTIFICATION] Error handling notification response:', err);
        }
      });

      // Clean up listeners on unmount
      return () => {
        try {
          Notifications.removeNotificationSubscription(notificationListener);
          Notifications.removeNotificationSubscription(responseListener);
        } catch (err) {
          console.error('[NOTIFICATION] Error removing notification subscriptions:', err);
        }
      };
    } catch (err) {
      // Catch any errors with notification setup
      console.error('[NOTIFICATION] Error setting up notification listeners:', err);
      // Return empty cleanup function
      return () => {};
    }
  }, [user]);

  if (initializing) {
    console.log('[DEBUG] App is still initializing');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <RNText style={{ color: 'white', fontSize: 16 }}>Loading...</RNText>
      </View>
    );
  }

  console.log('[DEBUG] App initialization complete, rendering navigation');
  
  return (
    <ErrorBoundary resetApp={resetApp} navigationRef={navigationRef}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <NavigationContainer 
          ref={navigationRef}
          theme={CustomDarkTheme}
          linking={linking}
          onStateChange={handleNavigationStateChange}
          fallback={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
              <RNText style={{ color: 'white', fontSize: 16 }}>Loading...</RNText>
            </View>
          }
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#121212' },
              presentation: 'card',
              gestureEnabled: true,
              animationEnabled: true,
              cardOverlayEnabled: true,
              cardStyle: { backgroundColor: '#121212' }
            }}
            detachInactiveScreens={true}
          >
            {user ? (
              <>
                <Stack.Screen 
                  name="ProfileScreen" 
                  component={ProfileScreen}
                  options={{
                    gestureEnabled: false // Prevent swipe back as it's the root screen
                  }} 
                />
                <Stack.Screen 
                  name="SpotifyConnect" 
                  component={SpotifyConnectScreen}
                  options={{
                    animationEnabled: true,
                    gestureEnabled: true
                  }}
                />
                <Stack.Screen 
                  name="SpotifyCrapped" 
                  component={SpotifyCrappedScreen}
                  options={{
                    animationEnabled: true,
                    gestureEnabled: true
                  }}
                />
              </>
            ) : (
              <>
                <Stack.Screen 
                  name="Welcome" 
                  component={WelcomeScreen}
                  options={{
                    gestureEnabled: false // Prevent swipe back as it's the root screen
                  }}
                />
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen}
                  options={{
                    animationEnabled: true,
                    gestureEnabled: true
                  }}
                />
                <Stack.Screen 
                  name="Signup" 
                  component={SignupScreen}
                  options={{
                    animationEnabled: true,
                    gestureEnabled: true
                  }}
                />
              </>
            )}
          </Stack.Navigator>
          
          {/* Show BottomPlayer only when user is logged in */}
          {showNavBar && user && (
            <BottomPlayer 
              currentRouteName={currentRoute}
            />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  }
});

export default App;
