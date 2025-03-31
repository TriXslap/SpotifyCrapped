import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text as RNText, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconSet from './IconSet';

/**
 * Simplified Header component for screens
 * Includes support for back button, title, and custom right action
 */
const Header = ({
  title,
  subtitle,
  onBackPress,
  rightComponent,
  transparent = false,
  style,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        transparent ? styles.transparentBackground : styles.solidBackground,
        style,
      ]}
    >
      <StatusBar 
        barStyle="light-content" 
        translucent={transparent}
        backgroundColor={transparent ? 'transparent' : '#121212'}
      />
      
      <View style={styles.content}>
        {onBackPress && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBackPress}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <IconSet name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <RNText style={styles.title} numberOfLines={1}>
            {title}
          </RNText>
          
          {subtitle && (
            <RNText style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </RNText>
          )}
        </View>
        
        {rightComponent && (
          <View style={styles.rightComponent}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  solidBackground: {
    backgroundColor: '#121212',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  backButton: {
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  rightComponent: {
    marginLeft: 8,
  }
});

export default Header; 