import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

function today() {
  return new Date().toISOString().slice(0, 10);
}

auth.onAuthStateChanged(async user => {
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const defaults = {
    streak: 0,
    lastActiveDate: "",
    bestXpDay: 0,
    totalAttempts: 0,
    pageVisits: 0,
    dailyXp: 0,
    dailyXpDate: today()
  };

  if (!snap.exists()) {
    // 🆕 New user → create doc with defaults
    await setDoc(ref, defaults);
    return;
  }

  const data = snap.data();
  const updates = {};

  // 🔍 Add missing fields only
  Object.keys(defaults).forEach(key => {
    if (!(key in data)) {
      updates[key] = defaults[key];
    }
  });

  // 🔄 Reset daily XP if date changed
  if (data.dailyXpDate && data.dailyXpDate !== today()) {
    updates.dailyXp = 0;
    updates.dailyXpDate = today();
  }

  if (Object.keys(updates).length > 0) {
    await setDoc(ref, updates, { merge: true });
  }
});