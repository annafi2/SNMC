// Firebase SDK Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyUB9HJv8hTSMuD7yZRz6bozlC7XlncMU",
  authDomain: "snmc-9ae93.firebaseapp.com",
  projectId: "snmc-9ae93",
  storageBucket: "snmc-9ae93.firebasestorage.app",
  messagingSenderId: "51658729638",
  appId: "1:51658729638:web:032ab5b9873ab288046c67",
  measurementId: "G-C2256K4D9V"
};

// Initialize Firebase App
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global service shortcuts
window.auth = firebase.auth();
window.db = firebase.firestore();
