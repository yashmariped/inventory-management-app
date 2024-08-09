// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration using original data
const firebaseConfig = {
  apiKey: "AIzaSyBDSFZboWLRM-yWA1JdTP4BKSj-TA3nbKo",
  authDomain: "inventory-management-app-f9a58.firebaseapp.com",
  projectId: "inventory-management-app-f9a58",
  storageBucket: "inventory-management-app-f9a58.appspot.com",
  messagingSenderId: "648857069333",
  appId: "1:648857069333:web:ac10b440ba004016592b1c",
  measurementId: "G-3M8K965E92"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const firestore = getFirestore(app);
const storage = getStorage(app);

export { firestore, storage };
