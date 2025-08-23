
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  "projectId": "yrdly-coyig",
  "appId": "1:166095077947:web:2f5285213610bbd893521e",
  "storageBucket": "yrdly-coyig.firebasestorage.app",
  "apiKey": "AIzaSyCOE_L6g9c3J6jhcajVzNkC4flEao4Av2I",
  "authDomain": "yrdly-coyig.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "166095077947"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export { app, auth, db, storage, functions, googleProvider, appleProvider };
