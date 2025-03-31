import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Simplified Card component
 * A basic container with styling that can optionally be touchable
 */
const Card = ({ 
  children, 
  style, 
  onPress, 
  hoverable = false, 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={[
        styles.card,
        hoverable && styles.hoverable,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  hoverable: {
    // No transform effects since we're simplifying
  },
});

export default Card; 