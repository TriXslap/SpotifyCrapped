// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyALuVtMDUYYFPq__gvBfT95Ik_TCHaoVzw",
    authDomain: "wrappedclone.firebaseapp.com",
    projectId: "wrappedclone",
    storageBucket: "wrappedclone.firebasestorage.app",
    messagingSenderId: "884067344492",
    appId: "1:884067344492:web:5da57ed5f59c479d243849"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
let auth;
if (Platform.OS === 'web') {
    // Use browser persistence for web
    auth = initializeAuth(app, {
        persistence: browserLocalPersistence
    });
    console.log('[WEB] Initialized Firebase Auth with browser persistence');
} else {
    // Use AsyncStorage persistence for React Native
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('[MOBILE] Initialized Firebase Auth with React Native persistence');
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize services
export const storage = getStorage(app);

export { auth, db };
export default app;
