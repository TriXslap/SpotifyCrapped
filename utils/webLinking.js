// A simplified version of expo-linking for web platforms
// This avoids the dependency issues with uuidv4

// Event listeners for URL changes
const listeners = [];

// Create a URL with the app's scheme
export function createURL(path, queryParams = {}) {
  // For web, we'll just use the current origin
  const origin = window.location.origin;
  
  // Format the path (ensure it starts with /)
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Build query string if there are query params
  let queryString = '';
  if (Object.keys(queryParams).length > 0) {
    queryString = '?' + Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }
  
  return `${origin}${formattedPath}${queryString}`;
}

// Get the initial URL that opened the app
export async function getInitialURL() {
  return window.location.href;
}

// Parse the URL into components
export function parse(url) {
  try {
    const parsedUrl = new URL(url);
    
    return {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      queryParams: Object.fromEntries(new URLSearchParams(parsedUrl.search))
    };
  } catch (e) {
    console.error('Failed to parse URL:', e);
    return { path: '', queryParams: {} };
  }
}

// Add a listener for URL changes
export function addEventListener(type, handler) {
  if (type !== 'url') return { remove: () => {} };
  
  listeners.push(handler);
  
  // Return an object with a remove method
  return {
    remove: () => {
      const index = listeners.indexOf(handler);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  };
}

// Open a URL
export async function openURL(url) {
  window.location.href = url;
  return true;
}

// Handle hash changes for SPA navigation
window.addEventListener('hashchange', () => {
  const url = window.location.href;
  listeners.forEach(listener => listener({ url }));
});

// Handle popstate events for history API navigation
window.addEventListener('popstate', () => {
  const url = window.location.href;
  listeners.forEach(listener => listener({ url }));
});

export default {
  createURL,
  getInitialURL,
  parse,
  addEventListener,
  openURL
}; 