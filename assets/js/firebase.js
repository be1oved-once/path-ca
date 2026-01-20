// Firebase v9 (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBsAlOnk7Q79GPDRCpfU0bzFez01Y1ENnE",
    authDomain: "beforexam-app.firebaseapp.com",
    projectId: "beforexam-app",
    storageBucket: "beforexam-app.firebasestorage.app",
    messagingSenderId: "17479597538",
    appId: "1:17479597538:web:c81818cc9eff2d6ed60dbb"
  };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});