import React from 'react';
import { 
  View, 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  StatusBar,
  Animated,
  SafeAreaView,
  Platform,
  Text as RNText
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../src/theme';
import Text from '../components/Text';
import Button from '../components/Button';
import IconSet from '../components/IconSet';

// Get screen dimensions for responsive layout
const { width, height } = Dimensions.get('window');

console.log('[DEBUG] WelcomeScreen is being loaded - testing typography issue');

// Simple version of WelcomeScreen without custom components
const SimpleWelcomeScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 }}>
      <RNText style={{ color: 'white', fontSize: 32, marginBottom: 20, textAlign: 'center' }}>
        SpotifyClog
      </RNText>
      
      <RNText style={{ color: '#B3B3B3', fontSize: 16, marginBottom: 40, textAlign: 'center' }}>
        Your personalized music insights, anytime and anywhere
      </RNText>
      
      <TouchableOpacity 
        style={{ 
          backgroundColor: '#1DB954', 
          paddingVertical: 15, 
          paddingHorizontal: 30, 
          borderRadius: 30,
          width: '100%',
          marginBottom: 20
        }}
        onPress={() => navigation.navigate('Signup')}
      >
        <RNText style={{ color: 'white', fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>
          Get Started
        </RNText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('Login')}
      >
        <RNText style={{ color: '#1DB954', fontSize: 14, textAlign: 'center' }}>
          Already have an account? Log In
        </RNText>
      </TouchableOpacity>
    </View>
  );
};

// Export the simple version
const WelcomeScreen = SimpleWelcomeScreen;

export default WelcomeScreen; 