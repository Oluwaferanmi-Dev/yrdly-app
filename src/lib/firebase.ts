import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "yrdly-coyig",
  appId: "1:166095077947:web:2f5285213610bbd893521e",
  storageBucket: "yrdly-coyig.appspot.com",
  apiKey: "AIzaSyCOE_L6g9c3J6jhcajVzNkC4flEao4Av2I",
  authDomain: "yrdly-coyig.firebaseapp.com",
  messagingSenderId: "166095077947"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
