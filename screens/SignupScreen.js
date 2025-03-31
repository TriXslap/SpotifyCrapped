// Import required React and React Native components
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Keyboard,
  Text as RNText
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { colors, spacing, borderRadius, typography, shadows } from '../src/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import Card from '../components/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get device dimensions for responsive design
const { width, height } = Dimensions.get('window');

console.log('[DEBUG] SignupScreen is being loaded - testing typography issue');

// Simple version of SignupScreen without custom components
const SimpleSignupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const toggleConfirmSecureEntry = () => {
    setConfirmSecureTextEntry(!confirmSecureTextEntry);
  };

  // Function to handle user signup
  const handleSignup = async () => {
    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting to create user with email:', email);
      
      // Check if username already exists
      const usersRef = collection(db, 'users');
      const usernameQuery = query(usersRef, where('username', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        throw new Error('Username already taken');
      }
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created successfully:', user.uid);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('User document created successfully');
      
      // Signup success, the AuthStateListener in App.js will handle navigation
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage;
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        default:
          errorMessage = error.message || 'Failed to sign up. Please try again.';
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
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 20
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={{ 
            position: 'absolute',
            top: insets.top + 20,
            left: 20,
            zIndex: 10,
            padding: 8
          }}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RNText style={{ color: 'white', fontSize: 16 }}>Back</RNText>
        </TouchableOpacity>
        
        <RNText style={{ 
          color: 'white', 
          fontSize: 28, 
          marginTop: 40,
          marginBottom: 30, 
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Create Account
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
          <RNText style={{ color: '#B3B3B3', fontSize: 14, marginBottom: 8 }}>Username</RNText>
          <TextInput
            style={{
              backgroundColor: '#2A2A2A',
              borderRadius: 8,
              padding: 15,
              color: 'white',
            }}
            placeholder="Choose a username"
            placeholderTextColor="#707070"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <RNText style={{ color: '#B3B3B3', fontSize: 14, marginBottom: 8 }}>Email</RNText>
          <TextInput
            style={{
              backgroundColor: '#2A2A2A',
              borderRadius: 8,
              padding: 15,
              color: 'white',
            }}
            placeholder="Enter your email"
            placeholderTextColor="#707070"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>
        
        <View style={{ marginBottom: 20 }}>
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
              placeholder="Create a password"
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
        
        <View style={{ marginBottom: 30 }}>
          <RNText style={{ color: '#B3B3B3', fontSize: 14, marginBottom: 8 }}>Confirm Password</RNText>
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
              placeholder="Confirm your password"
              placeholderTextColor="#707070"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={confirmSecureTextEntry}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={{ padding: 15 }}
              onPress={toggleConfirmSecureEntry}
              disabled={isLoading}
            >
              <RNText style={{ color: '#1DB954' }}>
                {confirmSecureTextEntry ? 'Show' : 'Hide'}
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
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <RNText style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Sign Up</RNText>
          )}
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
          <RNText style={{ color: '#B3B3B3', fontSize: 14 }}>
            Already have an account?
          </RNText>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <RNText style={{ color: '#1DB954', fontSize: 14, marginLeft: 5 }}>
              Log In
            </RNText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Export the simple version
const SignupScreen = SimpleSignupScreen;

export default SignupScreen;