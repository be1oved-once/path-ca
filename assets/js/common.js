import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { auth, db, googleProvider, GoogleAuthProvider, signInWithCredential } from "./firebase.js";

/* ======================
   ⚡ AUTH CACHE LAYER
   Used ONLY for instant UI hints (show avatar, etc.)
   Never used to gate Firestore calls.
====================== */

const AUTH_CACHE_KEY = "auth_user_v1";

function saveAuthCache(user) {
  if (!user) {
    localStorage.setItem(AUTH_CACHE_KEY, "null");
    return;
  }
  localStorage.setItem(
    AUTH_CACHE_KEY,
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    })
  );
}

function getAuthCache() {
  const raw = localStorage.getItem(AUTH_CACHE_KEY);
  if (!raw) return undefined;
  if (raw === "null") return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/* ⚡ INSTANT BOOT — for UI hints only, does NOT dispatch authReady.
   Real authReady is only dispatched after the Firebase token is confirmed. */
window.__authUser = getAuthCache() ?? null;
window.__authReady = false; // stays false until real Firebase auth resolves

/* ======================
   ADMIN EMAILS (single source of truth)
====================== */
const ADMIN_EMAILS = [
  "nicknow20@gmail.com",
  "saurabhjoshionly@gmail.com",
  "contact.globalratings@gmail.com"
];

/* ======================
   PAGE READY HELPER
====================== */
function onPageReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
  document.addEventListener("turbo:load", fn);
}

/* ======================
   GOOGLE ONE TAP
====================== */
function initGoogleOneTap() {
  if (!window.google?.accounts?.id) return;

  google.accounts.id.initialize({
    client_id: "985041243177-p67v3a0m2g5coo8qmb0einj49n58trsl.apps.googleusercontent.com",
    callback: async (response) => {
      try {
        const credential = GoogleAuthProvider.credential(response.credential);
        console.log("Attempting Firebase Sign-in via One Tap...");
        const result = await signInWithCredential(auth, credential);
        await ensureUserProfile(result.user);
        console.log("✅ One Tap sign-in success:", result.user.email);
      } catch (error) {
        console.error("❌ One Tap Error:", error.code, error);
        if (error.code === "auth/account-exists-with-different-credential") {
          alert("You have already signed up with a different method (like Email/Password).");
        }
      }
    },
    use_fedcm_for_prompt: true,
    auto_select: false,
    cancel_on_tap_outside: true,
    context: "signin"
  });

  if (!auth.currentUser) {
    google.accounts.id.prompt();
  }
}

/* ======================
   SYNC PUBLIC LEADERBOARD
====================== */
export async function syncPublicLeaderboard(uid) {
  if (!uid) return;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const u = snap.data();
  const weekly = u.weeklyXp || {};
  let sum = 0;
  Object.values(weekly).forEach(v => { sum += Number(v || 0); });
  await setDoc(
    doc(db, "publicLeaderboard", uid),
    { name: u.username || "User", gender: u.gender || "", dob: u.dob || "", pfp: u.pfp || "", xp: sum },
    { merge: true }
  );
}

/* ======================
   SIDEBAR / OVERLAY
====================== */
const sidebar  = document.getElementById("rightSidebar");
const menuBtn  = document.getElementById("menuBtn");
const overlay  = document.getElementById("overlay");
let startX = 0, dragging = false;

function lockScroll(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

function toggleSidebar(open) {
  sidebar.classList.toggle("open", open);
  menuBtn.classList.toggle("active", open);
  overlay.classList.toggle("show", open);
  lockScroll(open);
}

if (menuBtn && sidebar && overlay) {
  menuBtn.addEventListener("click", () => toggleSidebar(!sidebar.classList.contains("open")));
  overlay.addEventListener("click", () => toggleSidebar(false));
}

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  dragging = startX > window.innerWidth * 0.9;
});
document.addEventListener("touchend", e => {
  if (!dragging) return;
  const diff = startX - e.changedTouches[0].clientX;
  dragging = false;
  if (diff > 50) toggleSidebar(true);
});

/* ======================
   THEME
====================== */
function applyTheme(mode) {
  const isDark = mode === "dark";
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("quizta-theme", mode);
  document.querySelectorAll("#themeBtn i").forEach(icon => {
    icon.classList.toggle("fa-moon", isDark);
    icon.classList.toggle("fa-sun", !isDark);
  });
  document.querySelectorAll("#themeToggle").forEach(sw => sw.classList.toggle("active", isDark));
  document.dispatchEvent(new Event("themeChanged"));
}

document.addEventListener("click", e => {
  if (e.target.closest("#themeBtn")) applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
  if (e.target.closest("#themeToggle")) applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
});
applyTheme(localStorage.getItem("quizta-theme") || "light");

/* ======================
   LEFT SIDEBAR (NOTIFICATIONS TOGGLE)
====================== */
const leftSidebar  = document.getElementById("leftSidebar");
const leftStrip    = document.getElementById("leftStrip");
const leftOverlay  = document.getElementById("leftOverlay");
let touchStartX = 0, touchEndX = 0, leftOpen = false;

function toggleLeft(force) {
  leftOpen = typeof force === "boolean" ? force : !leftOpen;
  leftSidebar?.classList.toggle("open", leftOpen);
  leftOverlay?.classList.toggle("show", leftOpen);
  lockScroll(leftOpen);
}

leftStrip?.addEventListener("click", () => toggleLeft());
leftOverlay?.addEventListener("click", () => toggleLeft(false));

document.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; });
document.addEventListener("touchend", e => {
  if (sidebar?.classList.contains("open")) return;
  touchEndX = e.changedTouches[0].clientX;
  const diff = touchEndX - touchStartX;
  if (!leftOpen && touchStartX <= window.innerWidth * 0.1 && diff > 60) { toggleLeft(true); return; }
  if (leftOpen && diff < -60) toggleLeft(false);
});

/* ======================
   AUTH MODAL
====================== */
const authModal  = document.getElementById("authModal");
const authClose  = document.getElementById("authClose");
const switchAuth = document.getElementById("switchAuth");
const authTitle  = document.getElementById("authTitle");
const loginForm  = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const switchText = document.getElementById("switchText");

function openAuth(mode = "login") {
  authModal.classList.add("show");
  document.body.style.overflow = "hidden";
  document.getElementById("loginError").textContent = "";
  document.getElementById("signupError").textContent = "";
  if (mode === "signup") {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    authTitle.textContent = "Sign Up";
    switchText.textContent = "Already have an account?";
    switchAuth.textContent = "Login";
  } else {
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    authTitle.textContent = "Login";
    switchText.textContent = "Not have an account?";
    switchAuth.textContent = "Sign Up";
  }
}

function closeAuth() {
  authModal.classList.remove("show");
  document.body.style.overflow = "auto";
}

authClose?.addEventListener("click", closeAuth);
authModal.onclick = e => { if (e.target === authModal) closeAuth(); };

switchAuth?.addEventListener("click", () => {
  const isLogin = !loginForm.classList.contains("hidden");
  document.getElementById("loginError").textContent = "";
  document.getElementById("signupError").textContent = "";
  loginForm.classList.toggle("hidden");
  signupForm.classList.toggle("hidden");
  authTitle.textContent = isLogin ? "Sign Up" : "Login";
  switchAuth.textContent = isLogin ? "Login" : "Sign Up";
  switchText.textContent = isLogin ? "Already have an account?" : "Not have an account?";
});

/* ======================
   PASSWORD HELPERS
====================== */
function validatePassword(pass) {
  return (
    pass.length >= 8 &&
    /[A-Z]/.test(pass) &&
    /[a-z]/.test(pass) &&
    /[0-9]/.test(pass) &&
    /[^A-Za-z0-9]/.test(pass)
  );
}

function normalizeUsername(raw) {
  if (!raw) return "user";
  return raw.toLowerCase().trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^[_-]+/, "")
    .slice(0, 20) || "user";
}

/* ======================
   USERNAME → EMAIL RESOLVER
====================== */
async function getEmailFromUsername(usernameOrEmail) {
  if (usernameOrEmail.includes("@")) return usernameOrEmail.toLowerCase();
  const ref = doc(db, "usernames", usernameOrEmail.toLowerCase());
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Username not found");
  return snap.data().email;
}

/* ======================
   LOGIN
====================== */
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const errorBox = document.getElementById("loginError");
    const btn = loginForm.querySelector(".primary-btn");
    const usernameOrEmail = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    errorBox.textContent = "";
    
    // Loading state
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Logging in...</span>`;
    btn.style.opacity = "0.8";
    
    try {
      const email = await getEmailFromUsername(usernameOrEmail);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      if (!user.emailVerified) {
        await auth.signOut();
        errorBox.textContent = "Please verify your email before login.";
        return;
      }
      closeAuth();
    } catch (err) {
  console.error("AUTH ERROR CODE:", err.code, err.message); // temp debug line
  const code = err.code || "";
  let msg;
  if (err.message?.includes("Username not found")) {
    msg = "No account found with that username or email.";
  } else if (err.message?.includes("Account misconfigured")) {
    msg = "Account issue detected. Please login with your email instead.";
  } else if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("invalid-password")
  ) {
    msg = "Incorrect username or password.";
  } else if (code.includes("user-not-found")) {
    msg = "No account found with that email.";
  } else if (code.includes("missing-email")) {
    msg = "Could not find email for this account. Try logging in with your email directly.";
  } else if (code.includes("too-many-requests")) {
    msg = "Too many failed attempts. Please wait a few minutes and try again.";
  } else if (code.includes("user-disabled")) {
    msg = "This account has been disabled.";
  } else if (code.includes("network-request-failed")) {
    msg = "Network error. Check your connection and try again.";
  } else if (code.includes("invalid-email")) {
    msg = "Invalid email format.";
  } else {
    msg = `Login failed. Please try again.`;
  }
  errorBox.textContent = msg;
} finally {
      btn.disabled = false;
      btn.innerHTML = "Login";
      btn.style.opacity = "";
    }
  });
}

/* ======================
   SIGNUP
====================== */
if (signupForm) {
  signupForm.addEventListener("submit", async e => {
    e.preventDefault();
    const errorBox = document.getElementById("signupError");
    const btn = signupForm.querySelector(".primary-btn");
    const username = document.getElementById("signupUsername").value.trim().toLowerCase();
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const email = signupEmail.value.trim().toLowerCase();
    const password = signupPassword.value;
    errorBox.textContent = "";

    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Creating account...</span>`;
    btn.style.opacity = "0.8";

    try {
      const unameRef = doc(db, "usernames", username);
      const unameSnap = await getDoc(unameRef);
      if (unameSnap.exists()) { errorBox.textContent = "Username already taken"; return; }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      localStorage.setItem("signup_email", email);
      localStorage.setItem("signup_password", password);

      await setDoc(doc(db, "usernames", username), { uid: user.uid, email });
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid, username, email, createdAt: serverTimestamp(), xp: 0
      });
      await setDoc(doc(db, "publicLeaderboard", user.uid), { name: username, xp: 0 });
      await sendEmailVerification(user);
      closeAuth();
    } catch (err) {
      console.error(err);
      errorBox.textContent = err.message || "Signup failed";
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Sign Up";
      btn.style.opacity = "";
    }
  });
}

if (window.location.hash === "#login") {
  setTimeout(() => { if (typeof openAuth === "function") openAuth("login"); }, 300);
}

/* ======================
   GOOGLE DOB FETCH
====================== */
async function fetchGoogleDOB(accessToken) {
  try {
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=birthdays",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    if (data.birthdays?.length > 0) {
      const b = data.birthdays[0].date;
      return `${b.year}-${String(b.month).padStart(2,"0")}-${String(b.day).padStart(2,"0")}`;
    }
  } catch (err) { console.warn("Could not fetch DOB from Google:", err); }
  return "";
}

/* ======================
   ENSURE USER PROFILE
====================== */
async function ensureUserProfile(user, credential = null) {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    if (user.emailVerified && !data.emailVerified) {
      await setDoc(userRef, { emailVerified: true }, { merge: true });
      if (data.username) {
        await setDoc(doc(db, "usernames", data.username.toLowerCase()), { verified: true }, { merge: true });
      }
    }
    return;
  }

  let finalUsername = "";
  let googleDOB = "";
  const isGoogleUser = user.providerData?.[0]?.providerId === "google.com";

  if (isGoogleUser) {
    const base = normalizeUsername(user.displayName || user.email?.split("@")[0] || "user");
    finalUsername = base;
    const unameSnap = await getDoc(doc(db, "usernames", finalUsername));
    if (unameSnap.exists()) finalUsername = `${base}_${Math.floor(Math.random() * 1000)}`;

    await setDoc(doc(db, "usernames", finalUsername.toLowerCase()), {
      uid: user.uid, email: user.email, username: finalUsername,
      createdAt: serverTimestamp(), verified: true
    });
    if (credential?.accessToken) googleDOB = await fetchGoogleDOB(credential.accessToken);
  } else {
    finalUsername = user.displayName || user.email?.split("@")[0] || "user";
  }

  const profileData = {
    uid: user.uid, username: finalUsername, email: user.email || "",
    dob: googleDOB, provider: user.providerData?.[0]?.providerId || "password",
    displayName: user.displayName || "", pfp: user.photoURL || "",
    createdAt: serverTimestamp(), xp: 0, isPremium: false,
    emailVerified: user.emailVerified || false
  };

  await setDoc(userRef, profileData);
  await setDoc(doc(db, "publicLeaderboard", user.uid), { name: finalUsername, dob: googleDOB, xp: 0 });
}

/* ======================
   PASSWORD TOGGLE
====================== */
document.addEventListener("click", e => {
  if (!e.target.classList.contains("toggle-pass")) return;
  const input = e.target.previousElementSibling;
  if (!input) return;
  if (input.type === "password") { input.type = "text"; e.target.classList.replace("fa-eye", "fa-eye-slash"); }
  else { input.type = "password"; e.target.classList.replace("fa-eye-slash", "fa-eye"); }
});

/* ======================
   GOOGLE SIGN-IN BUTTON
====================== */
const googleBtn = document.querySelector(".google-btn");
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    try {
      googleBtn.disabled = true;
      googleBtn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Opening Google...</span>`;
      const result = await signInWithPopup(auth, googleProvider);
      googleBtn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Signing in...</span>`;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      await ensureUserProfile(result.user, credential);
      closeAuth();
      window.location.reload();
    } catch (err) {
      console.error("Google Auth Error:", err);
      alert("Auth Error: " + err.message);
    } finally {
      googleBtn.disabled = false;
      googleBtn.innerHTML = `<i class="fa-brands fa-google"></i> Continue with Google`;
    }
  });
}

/* ======================================================
   🔑 CORE AUTH STATE LISTENER
   Fixed:
   1. Google users no longer signed out for emailVerified=false
      (Google always provides verified accounts via their own flow)
   2. authReady only dispatched ONCE, after getIdToken(true) confirms
      the token is valid and token.email is populated for Firestore rules
   3. No early authReady dispatch from localStorage cache
====================================================== */
onAuthStateChanged(auth, async user => {

  // ⚡ Update cache for UI hints (avatar, name) only
  saveAuthCache(user);

  // ─────────────────────────────────────────────
  // USER LOGGED OUT
  // ─────────────────────────────────────────────
  if (!user) {
    window.currentUser   = null;
    window.__authUser    = null;
    window.__authReady   = true;
    document.dispatchEvent(new Event("authReady"));

    document.querySelectorAll(".auth-login").forEach(b => b.style.display = "flex");
    document.querySelectorAll(".auth-signup").forEach(b => b.style.display = "flex");
    document.querySelectorAll(".auth-logout").forEach(b => b.style.display = "none");
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");

    const lock = document.getElementById("loginLockOverlay");
    if (lock) lock.style.display = "flex";

    const profileWrap = document.querySelector(".profile-wrap");
    if (profileWrap) profileWrap.classList.add("locked");

    initGoogleOneTap();
    console.log("User logged out");
    return;
  }

  // ─────────────────────────────────────────────
  // EMAIL/PASSWORD USERS: require verification
  // Google users are ALWAYS considered verified — never sign them out here.
  // ─────────────────────────────────────────────
  const isGoogleUser = user.providerData?.[0]?.providerId === "google.com";

  if (!isGoogleUser && !user.emailVerified) {
    await auth.signOut();

    document.querySelectorAll(".auth-login").forEach(b => b.style.display = "flex");
    document.querySelectorAll(".auth-signup").forEach(b => b.style.display = "flex");
    document.querySelectorAll(".auth-logout").forEach(b => b.style.display = "none");

    const lock = document.getElementById("loginLockOverlay");
    if (lock) lock.style.display = "flex";

    if (!location.pathname.includes("signup-verified.html")) {
      window.location.replace("/signup-verified.html");
    }
    return;
  }

  // ─────────────────────────────────────────────
  // FORCE TOKEN REFRESH
  // This ensures request.auth.token.email is populated in Firestore rules.
  // Without this, the first request after login can fail with Permission Denied
  // because the ID token hasn't propagated yet.
  // ─────────────────────────────────────────────
  try {
    await user.getIdToken(true);
  } catch (err) {
    console.warn("Token refresh failed — proceeding anyway:", err);
  }

  // ─────────────────────────────────────────────
  // TOKEN IS READY — safe to expose auth state
  // ─────────────────────────────────────────────
  window.currentUser = user;
  window.__authUser  = user;
  window.__authReady = true;
  document.dispatchEvent(new Event("authReady")); // ← fired exactly ONCE, token confirmed

  // ─────────────────────────────────────────────
  // UI STATE
  // ─────────────────────────────────────────────
  document.querySelectorAll(".auth-login").forEach(b => b.style.display = "none");
  document.querySelectorAll(".auth-signup").forEach(b => b.style.display = "none");
  document.querySelectorAll(".auth-logout").forEach(b => b.style.display = "inline-flex");

  const lock = document.getElementById("loginLockOverlay");
  if (lock) lock.style.display = "none";

  // ─────────────────────────────────────────────
  // ADMIN SIDEBAR ITEMS
  // ─────────────────────────────────────────────
  const isAdmin = ADMIN_EMAILS.includes(user.email);
  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = isAdmin ? "block" : "none";
  });

  // ─────────────────────────────────────────────
  // DESKTOP PROFILE POPUP
  // ─────────────────────────────────────────────
  const profileBtn  = document.getElementById("profileBtn");
  const profilePopup = document.getElementById("profilePopup");
  const lockPopup   = document.getElementById("profileLockPopup");
  const profileWrap = document.querySelector(".profile-wrap");

  if (profileBtn && profileWrap && window.innerWidth >= 768) {
    profileWrap.classList.toggle("locked", !user);
    profileBtn.replaceWith(profileBtn.cloneNode(true));
    const newProfileBtn = document.getElementById("profileBtn");
    newProfileBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (!user) {
        if (profilePopup) profilePopup.style.display = "none";
        if (lockPopup) lockPopup.style.display = "block";
        return;
      }
      if (lockPopup) lockPopup.style.display = "none";
      if (!profilePopup) return;
      profilePopup.style.maxHeight
        ? (profilePopup.style.maxHeight = null)
        : (profilePopup.style.maxHeight = profilePopup.scrollHeight + "px");
    });
    document.addEventListener("click", () => { if (lockPopup) lockPopup.style.display = "none"; });
  }

  // ─────────────────────────────────────────────
  // NOTIFICATIONS SNAPSHOT
  // ─────────────────────────────────────────────
  const notifyBtn  = document.getElementById("notifyBtn");
  const notifyPanel = document.getElementById("notifyPanel");
  const notifyList = document.getElementById("notifyList");
  const notifyDots = document.querySelectorAll(".notify-dot");

  if (notifyBtn && notifyPanel && notifyList) {
    const userEmail = user.email?.toLowerCase() || null;
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));

    onSnapshot(q, snap => {
      notifyList.innerHTML = "";
      let newestVisibleTime = 0;
      const lastSeen = getLastSeenNotify();
      let hasVisible = false;

      snap.forEach(docSnap => {
        const data = docSnap.data();
        const created = data.createdAt?.toMillis?.() || 0;
        const isGlobal = data.target === "global";
        const isForUser = data.target === "user" && userEmail && data.email === userEmail;
        if (!isGlobal && !isForUser) return;
        hasVisible = true;
        if (created > newestVisibleTime) newestVisibleTime = created;
        const item = document.createElement("div");
        item.className = "notify-item";
        item.innerHTML = `<p class="notify-text">${data.message}</p><small class="notify-time">${formatTime(data.createdAt)}</small>`;
        notifyList.appendChild(item);
      });

      if (!hasVisible) notifyList.innerHTML = "<div class='notify-item'>No notifications</div>";

      if (newestVisibleTime > lastSeen) {
        notifyDots.forEach(dot => dot.style.display = "inline-block");
      } else {
        notifyDots.forEach(dot => dot.style.display = "none");
      }
    });
  }

  // ─────────────────────────────────────────────
  // PROFILE & PREMIUM
  // ─────────────────────────────────────────────
  await ensureUserProfile(user);
  await loadUserProfile(user.uid);

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data() || {};
    const isPremium = data.isPremium === true;
    window.isPremiumUser = isPremium;
    document.body.classList.toggle("user-premium", isPremium);
    window.dispatchEvent(new Event("premiumStatusReady"));
  } catch (e) { console.warn("Premium check failed"); }

  // ─────────────────────────────────────────────
  // LEADERBOARD INIT
  // ─────────────────────────────────────────────
  const lbRef  = doc(db, "publicLeaderboard", user.uid);
  const lbSnap = await getDoc(lbRef);
  if (!lbSnap.exists()) {
    await setDoc(lbRef, { name: user.displayName || "User", gender: "", dob: "", xp: 0 });
  }
});

/* ======================
   LOGOUT
====================== */
window.openAuth  = openAuth;
window.closeAuth = closeAuth;

document.addEventListener("click", async e => {
  if (!e.target.classList.contains("auth-logout")) return;
  try {
    await auth.signOut();
    if (typeof openAuth === "function") openAuth();
  } catch (err) { console.error("Logout failed:", err); }
});

/* ======================
   LOAD USER PROFILE (logging)
====================== */
async function loadUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return;
    const data = snap.data();
    console.log("User logged in:", { uid, username: data.username, email: data.email });
  } catch (err) { console.error("Profile sync failed:", err); }
}

/* ======================
   SETTINGS MODAL
====================== */
const settingsModal = document.getElementById("settingsModal");
const settingsClose = document.getElementById("settingsClose");

function openSettings() {
  settingsModal.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeSettings() {
  settingsModal.classList.remove("show");
  document.body.style.overflow = "auto";
}

settingsClose?.addEventListener("click", closeSettings);
settingsModal?.addEventListener("click", e => { if (e.target.classList.contains("settings-modal")) closeSettings(); });
document.querySelector(".settings-box")?.addEventListener("click", e => e.stopPropagation());
window.openSettings = openSettings;

/* ======================
   PROFILE POPUP
====================== */
const profileBtnGlobal  = document.getElementById("profileBtn");
const profilePopupGlobal = document.getElementById("profilePopup");
const notifyPanelGlobal  = document.getElementById("notifyPanel");

profileBtnGlobal?.addEventListener("click", e => {
  e.stopPropagation();
  if (notifyPanelGlobal?.classList.contains("show")) notifyPanelGlobal.classList.remove("show");
  if (profilePopupGlobal.style.maxHeight) closeProfilePopup();
  else openProfilePopup();
});

function openProfilePopup() {
  if (!profilePopupGlobal) return;
  profilePopupGlobal.style.maxHeight = profilePopupGlobal.scrollHeight + "px";
}
function closeProfilePopup() {
  if (!profilePopupGlobal) return;
  profilePopupGlobal.style.maxHeight = null;
}

document.addEventListener("click", () => closeProfilePopup());

/* ======================
   NOTIFICATIONS (GLOBAL UI)
====================== */
const notifyBtnG   = document.getElementById("notifyBtn");
const notifyPanelG = document.getElementById("notifyPanel");
const notifyListG  = document.getElementById("notifyList");
const notifyCloseG = document.getElementById("notifyClose");
const notifyDotsG  = document.querySelectorAll(".notify-dot");

if (notifyBtnG && notifyPanelG && notifyListG) {
  notifyBtnG.addEventListener("click", e => {
    e.stopPropagation();
    closeProfilePopup();
    notifyPanelG.classList.toggle("show");
    setLastSeenNotify(Date.now());
    notifyDotsG.forEach(dot => dot.style.display = "none");
  });

  notifyCloseG?.addEventListener("click", () => notifyPanelG.classList.remove("show"));

  document.addEventListener("click", e => {
    if (notifyPanelG.classList.contains("show") && !notifyPanelG.contains(e.target) && !notifyBtnG.contains(e.target)) {
      notifyPanelG.classList.remove("show");
    }
  });

  const notifyBtnMobile = document.getElementById("notifyBtnMobile");
  notifyBtnMobile?.addEventListener("click", e => {
    e.stopPropagation();
    notifyPanelG.classList.toggle("show");
    setLastSeenNotify(Date.now());
    notifyDotsG.forEach(dot => dot.style.display = "none");
  });
}

function getLastSeenNotify() { return parseInt(localStorage.getItem("lastSeenNotify") || "0"); }
function setLastSeenNotify(ts) { localStorage.setItem("lastSeenNotify", ts); }

function formatTime(ts) {
  if (!ts) return "";
  const date = ts.toDate();
  const diffMs = Date.now() - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return diffHr === 1 ? "1 hr ago" : `${diffHr} hr ago`;
  return diffDay === 1 ? "1 day ago" : `${diffDay} days ago`;
}

/* ======================
   VN FEEDBACK MODAL
====================== */
const vnFeedbackLink = document.getElementById("vnFeedbackLink");
const vnModal  = document.getElementById("vnFeedbackModal");
const vnCancel = document.getElementById("vnCancel");
const vnSend   = document.getElementById("vnSend");

vnFeedbackLink?.addEventListener("click", () => vnModal.classList.add("show"));
vnCancel?.addEventListener("click", () => vnModal.classList.remove("show"));

vnSend?.addEventListener("click", async () => {
  const name    = document.getElementById("vnName").value.trim();
  const message = document.getElementById("vnMessage").value.trim();
  const errorBox = document.getElementById("vnError");
  if (!message) { errorBox.textContent = "Please write a message."; return; }
  vnSend.textContent = "Sending...";
  errorBox.textContent = "";
  try {
    const res = await fetch("/api/voice-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Anonymous", message })
    });
    if (!res.ok) throw new Error();
    vnModal.classList.remove("show");
    document.getElementById("vnMessage").value = "";
    document.getElementById("vnName").value = "";
    vnSend.textContent = "Send";
    alert("Thanks! Feedback sent 💙");
  } catch (e) {
    errorBox.textContent = "Failed to send. Try again.";
    vnSend.textContent = "Send";
  }
});

/* ======================
   TEMP TEST LIVE DOT
====================== */
const TEMP_TEST_REF = doc(db, "tempTests", "current");
let _tempTestExpiresMs = null;

onSnapshot(TEMP_TEST_REF, snap => {
  injectTempTestItem();
  if (!snap.exists()) { setTempTestDot(false); return; }
  const data = snap.data();
  if (data.expiresAt) {
    const expMs = data.expiresAt.toDate().getTime();
    if (Date.now() >= expMs) { setTempTestDot(false); return; }
  }
  if (data.status === "live") {
    _tempTestExpiresMs = data.expiresAt ? data.expiresAt.toDate().getTime() : null;
    setTempTestDot(true);
  } else {
    _tempTestExpiresMs = null;
    setTempTestDot(false);
  }
});

function setTempTestDot(show) {
  const dot = document.querySelector(".temp-test-dot");
  if (!dot) return;
  dot.style.display = show ? "inline-block" : "none";
}

setInterval(() => {
  if (!_tempTestExpiresMs) return;
  if (Date.now() >= _tempTestExpiresMs) { setTempTestDot(false); _tempTestExpiresMs = null; }
}, 30000);

/* ======================
   PWA SERVICE WORKER
====================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered");
      reg.update();
    } catch (err) { console.error("❌ SW failed", err); }
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!document.documentElement.hasAttribute("data-turbo-preview")) window.location.reload();
  });
}

/* ======================
   PWA INSTALL BANNER
====================== */
let installPrompt = null, installTimer = null;

function initPWAInstall() {
  const banner     = document.getElementById("installBanner");
  const installBtn = document.getElementById("installBtn");
  const closeBtn   = document.getElementById("installClose");
  if (!banner || !installBtn || !closeBtn) { console.warn("❌ PWA banner elements missing"); return; }

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    installPrompt = e;
    installTimer = setTimeout(() => {
      if (!localStorage.getItem("pwaDismissed")) { banner.classList.remove("hidden"); banner.classList.add("pwa-attention"); }
    }, 10000);
  });

  installBtn.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    hide();
  });

  closeBtn.addEventListener("click", () => { localStorage.setItem("pwaDismissed", "1"); hide(); });

  function hide() { banner.classList.add("hidden"); banner.classList.remove("pwa-attention"); if (installTimer) clearTimeout(installTimer); }
}

onPageReady(initPWAInstall);

/* ======================
   RESOURCES DROPDOWN
====================== */
const resourcesToggle = document.getElementById("resourcesToggle");
const resourcesMenu   = document.getElementById("resourcesMenu");

if (resourcesToggle && resourcesMenu) {
  resourcesToggle.addEventListener("click", e => { e.stopPropagation(); resourcesMenu.classList.toggle("open"); });
  document.addEventListener("click", () => resourcesMenu.classList.remove("open"));
  resourcesMenu.addEventListener("click", e => e.stopPropagation());
}

/* ======================
   HOW TO USE SYSTEM
====================== */
const HOW_TO_ALLOWED_PAGES = ["chapters","mtp-rtp","business-laws","performance","leaderboard"];

function isHowToAllowedPage() {
  const path = location.pathname.toLowerCase();
  return HOW_TO_ALLOWED_PAGES.some(p => path.includes(p));
}

const howToBtn     = document.getElementById("howToBtn");
const howToOverlay = document.getElementById("howToOverlay");
const howToClose   = document.getElementById("howToClose");
const howToContent = document.getElementById("howToContent");
const howToTitle   = document.getElementById("howToTitle");

if (howToBtn && howToOverlay && isHowToAllowedPage()) {
  howToBtn.style.display = "flex";
  howToBtn.addEventListener("click", () => { injectHowToContent(); howToOverlay.classList.remove("hidden"); document.body.style.overflow = "hidden"; });
  howToClose.addEventListener("click", closeHowTo);
  howToOverlay.addEventListener("click", e => { if (e.target === howToOverlay) closeHowTo(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeHowTo(); });
} else if (howToBtn) {
  howToBtn.style.display = "none";
}

function closeHowTo() { howToOverlay.classList.add("hidden"); document.body.style.overflow = ""; }

function injectHowToContent() {
  const page = location.pathname;
  let title = "How to Use", html = "";

  if (page.includes("chapters")) {
    title = "How to Use – Chapter Wise Practice";
    html = `<h3>Chapter Wise Practice on PathCA</h3><p>This section allows you to practice individual chapters from <strong>Quantitative Aptitude</strong> and <strong>Business Economics</strong>. The questions are curated from multiple trusted academic sources and exam-oriented materials to help you strengthen conceptual clarity and problem-solving skills.</p><h3>How to Start a Quiz</h3><p>To begin practicing, first select the subject from the <strong>Subject</strong> option. Once the subject is selected, choose the required chapter from the <strong>Chapter</strong> option. After making both selections, click on <strong>Start</strong> to begin the quiz.</p><h3>Custom Quiz Settings</h3><p>You can customize your practice experience using the <strong>Settings</strong> panel available on the right sidebar. From there, you can enable or disable option shuffling, question shuffling, and adjust the timer duration for each question according to your preference.</p><h3>Scoring, XP & Review</h3><p>Each correct answer awards you <strong>5 XP points</strong>, which contribute to your overall progress and leaderboard ranking. After completing the quiz, you can review your attempted questions and also download a PDF of the attempted quiz for revision.</p>`;
  } else if (page.includes("mtp-rtp")) {
    title = "How to Use – RTP/MTP'Wise";
    html = `<h3>MTP & RTP Practice on PathCA</h3><p>This section allows you to practice <strong>Revision Test Papers (RTP)</strong> and <strong>Mock Test Papers (MTP)</strong> for <strong>Quantitative Aptitude</strong> and <strong>Business Economics</strong>. These papers are updated regularly as new ICAI sets are released, ensuring your preparation stays exam-relevant.</p><h3>How to Start Practicing</h3><p>To begin, first select the required subject from the <strong>Subject</strong> option. Once the subject is selected, choose the desired RTP or MTP attempt from the <strong>Attempt</strong> option. After completing both selections, click on <strong>Start</strong> to begin your practice session.</p><h3>Scoring, XP & Performance</h3><p>Each correct answer awards you <strong>5 XP points</strong>, which contribute to your overall progress and leaderboard ranking. After completing the quiz, you can review your answers and <strong>save the attempted questions as a PDF</strong> for future revision.</p>`;
  } else if (page.includes("profile")) {
    title = "How to Use – Profile";
    html = `<ul><li>Edit username, DOB and gender</li><li>Select or upload a profile picture</li><li>Save profile to reflect on leaderboard</li></ul>`;
  } else if (page.includes("business-laws")) {
    title = "How to Use – Law'Wise practice";
    html = `<h3>Business Laws Practice on PathCA</h3><p>This section allows you to practice descriptive and theory-based questions from the <strong>Business Laws</strong> subject. The practice is designed to help you develop proper legal writing skills and improve answer presentation for examinations. Your answers are evaluated using keyword analysis and content length to ensure conceptual accuracy.</p><h3>How Evaluation Works</h3><p>The system analyzes your answer by checking the <strong>keywords used</strong> and the <strong>overall length and relevance</strong> of your response. Based on this analysis, marks and XP are awarded automatically. The maximum marks for a single answer are <strong>4 marks</strong>, and the maximum XP you can earn per answer is <strong>10 XP points</strong>.</p><h3>How to Start Practicing</h3><p>To begin, select the required chapter or unit from the <strong>Chapter</strong> option. Once the chapter is selected, click on <strong>Start</strong> to begin practicing. There is no time limit for Business Laws answers, allowing you to write freely and focus on answer quality.</p><h3>Review and Answer Analysis</h3><p>After completing the practice, you can review all your answers. During review, the keywords that you successfully used in your answer will be highlighted. Below each answer, a separate section displays the <strong>expected keywords</strong> and shows how many of them you included in your response. You can also <strong>save your attempted answers as a PDF</strong> for future revision.</p>`;
  } else if (page.includes("performance")) {
    title = "Understand – Performance";
    html = `<h3>Performance Dashboard on PathCA</h3><p>The Performance page provides a complete overview of your learning progress on PathCA. This section is available only to logged-in users and is designed to help you understand your consistency, accuracy, and improvement trend over time.</p><h3>Key Performance Statistics</h3><p>At the top of the page, you will see four key statistic boxes that summarize your activity, including metrics such as streak, total attempts, and overall engagement. These indicators help you quickly assess how consistently you are practicing.</p><h3>Weekly Performance Graph</h3><p>Below the summary statistics, a performance graph displays your weekly progress. This graph visually represents your total XP earned during the week and helps you track fluctuations in performance across different days.</p><h3>Period-Based Analyzer</h3><p>The analyzer section allows you to evaluate your performance over a selected time period of up to one month. It aggregates your activity data to provide meaningful insights into your study pattern within the chosen duration.</p><h3>Attempt Distribution and Trend</h3><p>This section shows a detailed breakdown of your total attempts across Chapters, RTPs, and MTPs for the selected period. It also indicates whether your performance trend is improving or declining, helping you identify areas that need more focus.</p><h3>AI-Based Performance Insight</h3><p>At the bottom of the page, the Period Insight section uses AI-driven analysis to generate personalized feedback on your performance. These insights are tailored to your activity data and are intended to guide you on how to improve accuracy, consistency, and overall exam readiness.</p>`;
  } else if (page.includes("leaderboard")) {
    title = "Understand – Leaderboard";
    html = `<h3>Weekly Leaderboard on PathCA</h3><p>The Leaderboard displays the top performers based on <strong>weekly XP earned</strong>. It helps you compare your preparation consistency with other students and motivates you to practice regularly. The leaderboard resets automatically every week.</p><h3>How Ranking Works</h3><p>Rankings are calculated using the total XP earned during the current week from Chapters, RTPs, MTPs, and other practice activities. Only users who have earned a minimum of <strong>5 XP</strong> in the current week are shown on the leaderboard. If you do not see your name, continue practicing to earn XP and your profile will appear automatically.</p><h3>Viewing User Details</h3><p>You can tap or click on any user card in the leaderboard to view additional profile details. This includes the user's name, date of birth, gender, and profile picture, if the user has provided these details.</p><h3>Profile Picture and Missing Details</h3><p>If a profile picture is not visible for a user, it usually means the user has not updated their profile yet. To ensure your own profile picture appears correctly, visit the <strong>Profile</strong> page and upload or select a picture. Similarly, if details such as gender or date of birth are missing, it indicates that the user has not completed those fields so far.</p><h3>Purpose of the Leaderboard</h3><p>The leaderboard is designed to encourage healthy competition and consistent practice. Focus on improving your accuracy and maintaining daily activity rather than only chasing ranks, as consistent effort naturally leads to better performance and higher XP.</p>`;
  } else if (page === "/" || page.includes("index")) {
    title = "Welcome to PathCA";
    html = `<h3>Welcome to PathCA</h3><p>PathCA is an exam-focused practice platform designed specifically for CA Foundation students. The platform helps you practice concept-wise questions, track performance, and improve exam readiness through structured practice and analytics.</p><h3>Demo Mode</h3><p>The Demo option allows you to try the PathCA practice experience without creating an account. By clicking on Demo, you can attempt sample questions to understand how the system works, including question navigation, answer selection, and result evaluation.</p><h3>Register and Get Started</h3><p>Clicking on Register opens the registration window where you can create your PathCA account. Registration enables access to full features such as XP tracking, leaderboard participation, performance analytics, and personalized insights.</p><h3>Platform Features</h3><p>The features section below highlights the core capabilities of PathCA, including chapter-wise practice, RTP and MTP simulations, performance tracking, and AI-powered insights. These features are designed to help you practice efficiently and prepare confidently for the CA Foundation examination.</p>`;
  } else {
    html = `<p>Use the navigation menu to explore PathCA. Practice daily to earn XP and improve ranking.</p>`;
  }

  howToTitle.textContent = title;
  howToContent.innerHTML = html;
}

/* ======================
   LUCIDE ICONS
====================== */
if (window.lucide) {
  window.lucide?.createIcons();
} else {
  document.addEventListener("DOMContentLoaded", () => { if (window.lucide) lucide.createIcons(); });
}

/* ======================
   SUBSCRIPTION / PAYMENT MODAL
====================== */
onPageReady(() => {
  const subOverlay  = document.getElementById("subOverlay");
  const subModal    = document.getElementById("subModal");
  const closeSub    = document.getElementById("closeSub");
  const subscribeBtn = document.getElementById("subscribeBtn");
  const qrBox       = document.getElementById("qrBox");
  const uploadBtn   = document.getElementById("uploadPaymentBtn");
  const fileInput   = document.getElementById("paymentFileInput");
  const previewBox  = document.getElementById("uploadPreview");
  const previewImg  = document.getElementById("previewImg");
  const fileNameText = document.getElementById("fileNameText");
  const finalSubmitBtn = document.getElementById("finalSubmitBtn");
  const imagePreviewOverlay = document.getElementById("imagePreviewOverlay");
  const imagePreviewFull    = document.getElementById("imgPreviewFull");
  const imagePreviewClose   = document.getElementById("imgPreviewClose");

  let compressedBlob = null;

  window.openSubscription = function(triggerBtn) {
    if (!subOverlay || !subModal || !triggerBtn) return;
    const rect = triggerBtn.getBoundingClientRect();
    subOverlay.classList.remove("hidden");
    subOverlay.classList.add("show");
    subModal.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;
    document.body.style.overflow = "hidden";
  };

  closeSub?.addEventListener("click", () => {
    subOverlay?.classList.remove("show");
    subOverlay?.classList.add("hidden");
    document.body.style.overflow = "";
  });

  subscribeBtn?.addEventListener("click", () => {
    const qrImg = qrBox?.querySelector("img");
    if (qrImg) qrImg.style.display = "block";
    if (!qrBox) return;
    const isOpen = qrBox.classList.contains("show");
    if (isOpen) {
      qrBox.classList.remove("show");
      subscribeBtn.textContent = "Subscribe Now";
      document.querySelector(".qr-note")?.classList.remove("hidden");
      uploadBtn?.classList.remove("hidden");
      qrBox?.querySelector("img")?.classList.remove("hidden");
      previewBox?.classList.add("hidden");
      finalSubmitBtn?.classList.add("hidden");
      if (fileInput) fileInput.value = "";
    } else {
      qrBox.classList.add("show");
      subscribeBtn.textContent = "Fall Back";
    }
  });

  uploadBtn?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { fileInput.value = ""; return; }
    try {
      document.querySelector(".qr-note")?.classList.add("hidden");
      uploadBtn?.classList.add("hidden");
      const qrImg = qrBox?.querySelector("img");
      if (qrImg) qrImg.style.display = "none";
      qrBox?.querySelector("img")?.classList.add("hidden");
      const previewURL = URL.createObjectURL(file);
      if (previewImg) previewImg.src = previewURL;
      previewBox?.classList.remove("hidden");
      if (fileNameText) fileNameText.textContent = file.name;
      finalSubmitBtn?.classList.remove("hidden");
      const img = new Image();
      img.onload = async () => {
        try { compressedBlob = await compressImage(img); console.log("📦 Compressed size:", compressedBlob?.size); }
        catch (err) { console.warn("Compression skipped:", err); compressedBlob = null; }
      };
      img.onerror = () => { console.warn("Image load failed"); compressedBlob = null; };
      img.src = previewURL;
    } catch (err) { console.error("❌ File preview failed:", err); }
  });

  previewImg?.addEventListener("click", () => {
    if (!previewImg?.src || !imagePreviewOverlay || !imagePreviewFull) return;
    imagePreviewFull.src = previewImg.src;
    imagePreviewOverlay.classList.remove("hidden");
  });

  imagePreviewClose?.addEventListener("click", () => imagePreviewOverlay?.classList.add("hidden"));
  imagePreviewOverlay?.addEventListener("click", e => { if (e.target === imagePreviewOverlay) imagePreviewOverlay.classList.add("hidden"); });

  async function compressImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    const TARGET = 100 * 1024;
    let width = img.width, height = img.height;
    const scale = Math.min(1200 / width, 1);
    width = Math.round(width * scale); height = Math.round(height * scale);
    canvas.width = Math.max(1, width); canvas.height = Math.max(1, height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let quality = 0.9, blob;
    do { blob = await canvasToBlob(canvas, quality); quality -= 0.07; } while (blob && blob.size > TARGET && quality > 0.35);
    while (blob && blob.size > TARGET && canvas.width > 400) {
      canvas.width = Math.round(canvas.width * 0.85); canvas.height = Math.round(canvas.height * 0.85);
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      quality = 0.85;
      do { blob = await canvasToBlob(canvas, quality); quality -= 0.07; } while (blob && blob.size > TARGET && quality > 0.4);
    }
    return blob;
  }

  function canvasToBlob(canvas, quality) {
    return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
  }

  const CLOUD_NAME = "dhjjtjbur";
  const PAYMENT_UPLOAD_PRESET = "PaymentsScreenshots";

  finalSubmitBtn?.addEventListener("click", async () => {
    try {
      const user = window.currentUser;
      if (!user) { window.requireLoginToast?.(); return; }
      const uid = user.uid, email = user.email || "";
      if (!previewImg?.src) { console.log("❌ No image to submit"); return; }
      finalSubmitBtn.textContent = "Submitting...";
      let username = "unknown";
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) username = snap.data().username || "unknown";
      } catch (e) { console.warn("Username fetch failed"); }

      let waitCount = 0;
      while (!compressedBlob && waitCount < 10) { await new Promise(r => setTimeout(r, 200)); waitCount++; }

      let fileToUpload;
      if (compressedBlob) {
        console.log("✅ Using compressed image");
        fileToUpload = new File([compressedBlob], `payment_${Date.now()}.jpg`, { type: "image/jpeg" });
      } else {
        console.warn("⚠️ Compression not ready — using original");
        const blob = await fetch(previewImg.src).then(r => r.blob());
        fileToUpload = new File([blob], `payment_${Date.now()}.jpg`, { type: "image/jpeg" });
      }

      const imgURL = await uploadPaymentImage(fileToUpload, username, email);
      await addDoc(collection(db, "paymentProofs"), {
        uid, username, email, screenshot: imgURL, status: "pending", createdAt: serverTimestamp()
      });
      finalSubmitBtn.textContent = "Submitted!";
    } catch (err) {
      console.error("❌ Upload failed:", err);
      finalSubmitBtn.textContent = "Failed";
    }
  });

  async function uploadPaymentImage(file, username, email) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", PAYMENT_UPLOAD_PRESET);
    form.append("folder", "Payments");
    const cleanUser  = username.replace(/\s+/g, "_");
    const cleanEmail = email.replace(/[@.]/g, "_");
    form.append("public_id", `${cleanUser}_${cleanEmail}_${Date.now()}`);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
    const data = await res.json();
    if (!data.secure_url) throw new Error("Cloudinary upload failed");
    return data.secure_url;
  }
});

/* ======================
   LOCALHOST HTML ROUTING FIX
====================== */
(function () {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!isLocal) return;
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    let href = a.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (/\.(html|php|js|css|png|jpg|jpeg|svg|webp)$/i.test(href)) return;
    e.preventDefault();
    window.location.href = href.replace(/\/$/, "") + ".html";
  });
})();
function replaceBigDash(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.includes("—")) {
      node.nodeValue = node.nodeValue.replace(/—/g, "-");
    }
  }
}

/* Run on page load */
document.addEventListener("DOMContentLoaded", () => {
  replaceBigDash();
});