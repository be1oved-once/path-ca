// Firebase v9 (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
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

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});