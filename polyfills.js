// Import the v4 function from uuid package
import { v4 as uuidv4 } from 'uuid';

// Add uuidv4 to the global scope
if (typeof global !== 'undefined') {
  // For React Native
  if (!global.uuidv4) {
    global.uuidv4 = uuidv4;
  }
}

if (typeof window !== 'undefined') {
  // For web
  if (!window.uuidv4) {
    window.uuidv4 = uuidv4;
  }
}

// Patch expo-modules-core if needed
try {
  const expoModulesCore = require('expo-modules-core');
  if (expoModulesCore && !expoModulesCore.uuidv4) {
    expoModulesCore.uuidv4 = uuidv4;
  }
} catch (e) {
  console.warn('Could not patch expo-modules-core:', e);
}

export default uuidv4; 