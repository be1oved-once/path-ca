// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  setPersistence, 
  browserLocalPersistence
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
setPersistence(auth, browserLocalPersistence);
const db = getFirestore(app);

// Setup Google Provider with DOB Scope
const googleProvider = new GoogleAuthProvider();
// Required scope for reading birthday
googleProvider.addScope('https://www.googleapis.com/auth/user.birthday.read'); 
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup
};
