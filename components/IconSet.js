import React from 'react';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../src/theme';

/**
 * Icon component that selects the appropriate icon library based on the iconSet prop
 * This helps avoid issues with missing icon names in specific icon sets
 */
const IconSet = ({
  name,
  size = 24,
  color = colors.text.primary,
  style,
  iconSet = 'ionicons', // 'ionicons', 'fontAwesome', 'material'
}) => {
  // Map common icon names across different providers
  const getIconName = (name, set) => {
    const iconMap = {
      'spotify': {
        ionicons: 'musical-note',
        fontAwesome: 'spotify',
        material: 'music-note',
      },
      // Add other icon mappings as needed
    };

    // If we have a mapping for this icon, use it, otherwise just use the passed name
    if (iconMap[name] && iconMap[name][set]) {
      return iconMap[name][set];
    }
    
    return name;
  };
  
  // Render the appropriate icon component based on iconSet
  switch (iconSet) {
    case 'fontAwesome':
      return (
        <FontAwesome
          name={getIconName(name, 'fontAwesome')}
          size={size}
          color={color}
          style={style}
        />
      );
    case 'material':
      return (
        <MaterialIcons
          name={getIconName(name, 'material')}
          size={size}
          color={color}
          style={style}
        />
      );
    case 'ionicons':
    default:
      return (
        <Ionicons
          name={getIconName(name, 'ionicons')}
          size={size}
          color={color}
          style={style}
        />
      );
  }
};

export default IconSet; 