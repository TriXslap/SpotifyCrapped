/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp();

exports.exchangeSpotifyToken = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { code } = data;
  const userId = context.auth.uid;
  
  try {
    // Exchange code for tokens
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'exp://192.168.1.123:8081/--/spotify-auth-callback', // Your redirect URI
        client_id: '17594e5c0e4b4d1b8655932668bf64d4',
        client_secret: 'your-client-secret' // Safely stored in Firebase
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Store tokens in Firestore
    await admin.firestore().collection('users').doc(userId).set({
      spotify: {
        access_token,
        refresh_token,
        token_expiry: Date.now() + expires_in * 1000,
        isConnected: true,
        connectedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });
    
    // Get user profile
    const profileResponse = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    // Update user profile in Firestore
    await admin.firestore().collection('users').doc(userId).set({
      spotify: {
        userName: profileResponse.data.display_name,
        email: profileResponse.data.email
      }
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Spotify token exchange error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to exchange token');
  }
});

exports.refreshSpotifyToken = functions.https.onCall(async (data, context) => {
  // Similar implementation for refreshing tokens
  // ...
});
