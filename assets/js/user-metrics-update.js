import { auth, db } from "./firebase.js";
import {
  doc,
  updateDoc,
  increment,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* -----------------------------
   CALLED WHEN QUESTION ATTEMPTED
------------------------------ */
export async function recordQuestionAttempt(xpEarned = 0) {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const todayStr = today();

  const updates = {
    totalAttempts: increment(1),
    dailyXp: increment(xpEarned)
  };

  // 🔥 Streak logic (only once per day)
  if (data.lastActiveDate !== todayStr) {
    let newStreak = 1;

    if (data.lastActiveDate) {
      const diff =
        (new Date(todayStr) - new Date(data.lastActiveDate)) /
        (1000 * 60 * 60 * 24);
      newStreak = diff === 1 ? (data.streak || 0) + 1 : 1;
    }

    updates.streak = newStreak;
    updates.lastActiveDate = todayStr;
  }

  await updateDoc(ref, updates);
}

/* -----------------------------
   CALLED AFTER XP UPDATE
------------------------------ */
export async function updateBestXpIfNeeded() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const { dailyXp = 0, bestXpDay = 0 } = snap.data();

  if (dailyXp > bestXpDay) {
    await updateDoc(ref, {
      bestXpDay: dailyXp
    });
  }
}