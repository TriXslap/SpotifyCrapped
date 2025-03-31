// Import React and useState hook for managing component state
import React, { useState, useEffect } from 'react';

// Import required React Native components
import { 
  View, // Container component
  StyleSheet, // For creating styles
  TextInput, // Text input field component
  TouchableOpacity, // Touchable button component
  ScrollView, // Scrollable container
  Alert, // For showing alert messages
  ActivityIndicator, // Loading spinner
  Dimensions, // To get device dimensions
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  StatusBar,
  Text as RNText
} from 'react-native';

// Import LinearGradient for background gradient effect
import { LinearGradient } from 'expo-linear-gradient';

// Import Firebase authentication and database instances
import { auth, db } from '../firebase/config';

// Import Firebase authentication method
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Import Firestore database methods
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

// Import IconSet for icons
import IconSet from '../components/IconSet';

// Import colors, spacing, borderRadius, typography, and shadows from theme
import { colors, spacing, borderRadius, typography, shadows } from '../src/theme';

// Import custom components
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';

// Import useSafeAreaInsets
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get device dimensions for responsive design
const { width, height } = Dimensions.get('window');

console.log('[DEBUG] LoginScreen is being loaded - testing typography issue');

// Simple version of LoginScreen without custom components
const SimpleLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  // Function to handle login with either email or username
  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', identifier);
      
      // Check if the identifier is an email by looking for @ symbol
      const isEmail = identifier.includes('@');
      
      if (isEmail) {
        // If it's an email, try to sign in directly
        await signInWithEmailAndPassword(auth, identifier, password);
        console.log('Login successful with email');
      } else {
        // If it's a username, we need to find the corresponding email first
        console.log('Treating identifier as username');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', identifier));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('No user found with this username');
        }
        
        // Get the user's email from the query result
        const userDoc = querySnapshot.docs[0];
        const userEmail = userDoc.data().email;
        
        // Now sign in with the email
        await signInWithEmailAndPassword(auth, userEmail, password);
        console.log('Login successful with username');
      }
      
      // Login success, no need to navigate as the AuthStateListener in App.js will handle it
    } catch (error) {
      console.error('Login error:', error.message);
      
      let errorMessage;
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email or username';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Try again later.';
          break;
        default:
          errorMessage = error.message || 'Failed to login. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#121212' }}
        contentContainerStyle={{ 
          padding: 20,
          paddingTop: insets.top + 10, // Add proper top padding based on safe area
          paddingBottom: insets.bottom + 20 // Add proper bottom padding
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={{ 
            position: 'absolute',
            top: insets.top + 20,
            left: 20,
            zIndex: 10,
            padding: 8 // Increase touch target size
          }}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RNText style={{ color: 'white', fontSize: 16 }}>Back</RNText>
        </TouchableOpacity>
        
        <RNText style={{ 
          color: 'white', 
          fontSize: 28, 
          marginTop: 40, // Add space for the back button
          marginBottom: 30, 
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Log In
        </RNText>
        
        {error ? (
          <View style={{ 
            backgroundColor: 'rgba(255, 0, 0, 0.1)', 
            padding: 10, 
            borderRadius: 8, 
            marginBottom: 20 
          }}>
            <RNText style={{ color: '#FF5252' }}>{error}</RNText>
          </View>
        ) : null}
        
        <View style={{ marginBottom: 20 }}>
          <RNText style={{ color: '#B3B3B3', fontSize: 14, marginBottom: 8 }}>Email or Username</RNText>
          <TextInput
            style={{
              backgroundColor: '#2A2A2A',
              borderRadius: 8,
              padding: 15,
              color: 'white',
            }}
            placeholder="Enter your email or username"
            placeholderTextColor="#707070"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>
        
        <View style={{ marginBottom: 30 }}>
          <RNText style={{ color: '#B3B3B3', fontSize: 14, marginBottom: 8 }}>Password</RNText>
          <View style={{
            backgroundColor: '#2A2A2A',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <TextInput
              style={{
                flex: 1,
                padding: 15,
                color: 'white',
              }}
              placeholder="Enter your password"
              placeholderTextColor="#707070"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={{ padding: 15 }}
              onPress={toggleSecureEntry}
              disabled={isLoading}
            >
              <RNText style={{ color: '#1DB954' }}>
                {secureTextEntry ? 'Show' : 'Hide'}
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#1DB954', 
            paddingVertical: 15,
            borderRadius: 30,
            alignItems: 'center',
            marginBottom: 20,
            opacity: isLoading ? 0.7 : 1,
          }}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <RNText style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Log In</RNText>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity>
          <RNText style={{ color: '#1DB954', fontSize: 14, textAlign: 'center' }}>
            Forgot password?
          </RNText>
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40 }}>
          <RNText style={{ color: '#B3B3B3', fontSize: 14 }}>
            Don't have an account?
          </RNText>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <RNText style={{ color: '#1DB954', fontSize: 14, marginLeft: 5 }}>
              Sign Up
            </RNText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Export the simple version
const LoginScreen = SimpleLoginScreen;

export default LoginScreen;