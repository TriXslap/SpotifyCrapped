import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// Cache for storing extracted colors to avoid recalculating
const colorCache = new Map();

// Maximum cache size to prevent memory issues
const MAX_CACHE_SIZE = 100;

// Track if we're in debug mode
const DEBUG = false;

// Safe console log that only logs in debug mode
const debugLog = (message, data) => {
  if (DEBUG) {
    console.log(message, data);
  }
};

/**
 * Clears the color cache to force fresh color extraction
 */
export const clearColorCache = () => {
  if (DEBUG) console.log('Clearing color cache');
  colorCache.clear();
};

/**
 * Simple color extraction utility that returns basic colors from images
 * @param {string} imageUrl - The URL of the image to extract colors from
 * @param {number} numColors - Number of colors to extract (default: 2)
 * @returns {Promise<string[]>} - Array of hex color codes
 */
export const extractColorsFromImage = async (imageUrl, numColors = 2) => {
  try {
    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      return getDefaultGradientColors().slice(0, numColors);
    }
    
    // Check if colors for this URL are already cached
    if (colorCache.has(imageUrl)) {
      return colorCache.get(imageUrl).slice(0, numColors);
    }

    // If cache is getting too large, remove oldest entries
    if (colorCache.size > MAX_CACHE_SIZE) {
      const keysToDelete = Array.from(colorCache.keys()).slice(0, 20);
      keysToDelete.forEach(key => colorCache.delete(key));
    }

    // Generate colors based on the imageUrl string
    // This is a simple hash-based approach, no actual image processing
    const hash = simpleHash(imageUrl);
    
    // Generate colors based on the hash
    const color1 = generateColorFromHash(hash, 0);
    const color2 = generateColorFromHash(hash, 1);
    
    const colors = [color1, color2];
    
    // Store colors in cache
    colorCache.set(imageUrl, colors);
    
    return colors;
  } catch (error) {
    // Silent fail and return default colors
    return getDefaultGradientColors().slice(0, numColors);
  }
};

/**
 * Generate a color from a hash value
 * @param {number} hash - The hash value to use
 * @param {number} index - Index to create variation
 * @returns {string} - Hex color code
 */
function generateColorFromHash(hash, index) {
  try {
    // Create a more vibrant color using HSL
    // Hue: 0-360, Saturation: 70-100%, Lightness: 40-60%
    const hue = Math.abs((hash * (index + 1) * 123) % 360);
    const saturation = 70 + Math.abs((hash * (index + 2) * 77) % 30);
    const lightness = 40 + Math.abs((hash * (index + 3) * 31) % 20);
    
    return hslToHex(hue, saturation, lightness);
  } catch (error) {
    // Fallback in case of any calculation errors
    const fallbackColors = ['#1DB954', '#191414', '#535353', '#121212'];
    return fallbackColors[index % fallbackColors.length];
  }
}

/**
 * Convert HSL to Hex
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - Hex color code
 */
function hslToHex(h, s, l) {
  try {
    s /= 100;
    l /= 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch (error) {
    // Fallback in case of any calculation errors
    return '#1DB954';
  }
}

/**
 * Simple hash function to generate a numeric value from a string
 */
function simpleHash(str) {
  try {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash || 123456789); // Ensure we don't return 0
  } catch (error) {
    return 123456789; // Fixed fallback if hashing fails
  }
}

/**
 * Get default gradient colors for fallback
 * @returns {string[]} Array of hex color strings
 */
export const getDefaultGradientColors = () => {
  return ['#121212', '#1DB954', '#535353', '#191414'];
}; 