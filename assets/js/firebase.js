// Firebase v9 (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider, // Class used for creating credentials
  signInWithCredential
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA-L4mYrqpZjgrNqu_oEJG8ejPajXLHqZE",
    authDomain: "path-ca.firebaseapp.com",
    projectId: "path-ca",
    storageBucket: "path-ca.firebasestorage.app",
    messagingSenderId: "985041243177",
    appId: "1:985041243177:web:47a335e1cbb75509b4e038"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Setup Google Provider for Popup Login
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Export everything needed by common.js
export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  GoogleAuthProvider, // Exporting the CLASS so One Tap can use .credential()
  signInWithCredential 
};
