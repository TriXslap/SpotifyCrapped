import React from 'react';
import { 
  TouchableOpacity, 
  Text as RNText, // Use React Native's Text directly
  StyleSheet, 
  ActivityIndicator, 
  View 
} from 'react-native';
import IconSet from './IconSet';
import { colors, spacing, borderRadius } from '../src/theme';

console.log('[DEBUG] Button.js is being loaded');

/**
 * Custom Button component with various style variants
 */
const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, text, outline
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  console.log('[DEBUG] Button component rendering', { title, variant, size });

  // Determine styles based on variant and size
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style,
  ];

  // Render loading indicator when isLoading is true
  if (isLoading) {
    return (
      <TouchableOpacity 
        style={buttonStyles} 
        disabled={true}
        {...props}
      >
        <ActivityIndicator 
          color={variant === 'primary' ? colors.text.primary : colors.primary} 
          size="small"
        />
      </TouchableOpacity>
    );
  }

  // Determine text color based on variant
  let textColor;
  switch (variant) {
    case 'primary':
      textColor = colors.text.primary;
      break;
    case 'secondary':
    case 'outline':
    case 'text':
      textColor = colors.primary;
      break;
    default:
      textColor = colors.text.primary;
  }

  // Determine text size based on button size
  let fontSize;
  switch (size) {
    case 'small':
      fontSize = 14;
      break;
    case 'medium':
      fontSize = 16;
      break;
    case 'large':
      fontSize = 18;
      break;
    default:
      fontSize = 16;
  }

  const textStyles = {
    color: textColor,
    fontSize: fontSize,
    fontWeight: '600',
    textAlign: 'center',
    ...textStyle
  };

  return (
    <TouchableOpacity
      style={[buttonStyles, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || isLoading}
      {...props}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator
            color={variant === 'primary' ? '#FFFFFF' : '#1ED760'}
            size="small"
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <IconSet 
                name={icon} 
                size={size === 'small' ? 16 : size === 'medium' ? 18 : 22}
                color={variant === 'primary' ? colors.text.primary : colors.primary}
                style={styles.leftIcon} 
              />
            )}
            
            <RNText style={[
              textStyles,
              styles[`text_${size}`],
              textStyle
            ]}>
              {title}
            </RNText>
            
            {icon && iconPosition === 'right' && (
              <IconSet 
                name={icon} 
                size={size === 'small' ? 16 : size === 'medium' ? 18 : 22}
                color={variant === 'primary' ? colors.text.primary : colors.primary}
                style={styles.rightIcon} 
              />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.round,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.background.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  
  // Sizes
  smallSize: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minWidth: 80,
  },
  mediumSize: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minWidth: 120,
  },
  largeSize: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 160,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: colors.text.tertiary,
    borderColor: colors.text.tertiary,
    opacity: 0.5,
  },
  
  // Icon styles
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
});

export default Button; 