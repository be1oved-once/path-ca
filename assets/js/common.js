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
onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { auth, db, googleProvider } from "./firebase.js";
import {
signInWithCredential,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
if (window.__AUTH_LISTENER_ATTACHED__) {
  console.warn("Auth listener already attached — skipping duplicate");
} else {
  window.__AUTH_LISTENER_ATTACHED__ = true;
}

/* =========================
   FAST USER CACHE SYSTEM
========================= */

const USER_CACHE_KEY = "pathca_user_cache_v1";
const USER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function readUserCache() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // expired?
    if (Date.now() - parsed.ts > USER_CACHE_TTL) {
      localStorage.removeItem(USER_CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeUserCache(data) {
  try {
    localStorage.setItem(
      USER_CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        data
      })
    );
  } catch {}
}

function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY);
}

/* expose globally */
window.__readUserCache = readUserCache;
window.__writeUserCache = writeUserCache;
window.__clearUserCache = clearUserCache;

function initGoogleOneTap() {
if (!window.google?.accounts?.id) return;

google.accounts.id.initialize({
client_id: "985041243177-p67v3a0m2g5coo8qmb0einj49n58trsl.apps.googleusercontent.com", // SAME AS FIREBASE
callback: async (response) => {
try {
const credential = GoogleAuthProvider.credential(
response.credential
);

await signInWithCredential(auth, credential);    

    console.log("✅ One Tap login success");    
  } catch (err) {    
    console.error("❌ One Tap sign-in failed:", err);    
  }    
},

use_fedcm_for_prompt: true,   // 🔥 REQUIRED
auto_select: false,
cancel_on_tap_outside: true,
context: "signin"
});

google.accounts.id.prompt();
}
export async function syncPublicLeaderboard(uid) {
  if (!uid) return;

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const u = snap.data();
  const weekly = u.weeklyXp || {};

  let sum = 0;
  Object.values(weekly).forEach(v => {
    sum += Number(v || 0);
  });

  await setDoc(
    doc(db, "publicLeaderboard", uid),
    {
      name: u.username || "User",
      gender: u.gender || "",
      dob: u.dob || "",
      pfp: u.pfp || "",
      xp: sum
    },
    { merge: true }
  );
}

const sidebar = document.getElementById("rightSidebar");
const menuBtn = document.getElementById("menuBtn");
const overlay = document.getElementById("overlay");

let startX = 0;
let currentX = 0;
let dragging = false;

/* Lock scroll */
function lockScroll(lock) {
document.body.style.overflow = lock ? "hidden" : "";
}

/* Toggle Sidebar */
function toggleSidebar(open) {
sidebar.classList.toggle("open", open);
menuBtn.classList.toggle("active", open);
overlay.classList.toggle("show", open);
lockScroll(open);
}

/* Menu click */
if (menuBtn && sidebar && overlay) {
menuBtn.addEventListener("click", () => {
toggleSidebar(!sidebar.classList.contains("open"));
});

overlay.addEventListener("click", () => toggleSidebar(false));
}

/* Overlay click */

/* Smooth swipe physics */
document.addEventListener("touchstart", e => {
startX = e.touches[0].clientX;
dragging = startX > window.innerWidth * 0.9; // 👈 only right edge
});

document.addEventListener("touchend", e => {
if (!dragging) return;

const endX = e.changedTouches[0].clientX;
const diff = startX - endX;
dragging = false;

if (diff > 50) toggleSidebar(true);
});

function applyTheme(mode) {
const isDark = mode === "dark";

document.body.classList.toggle("dark", isDark);
localStorage.setItem("quizta-theme", mode);

// Header icon
document.querySelectorAll("#themeBtn i").forEach(icon => {
icon.classList.toggle("fa-moon", isDark);
icon.classList.toggle("fa-sun", !isDark);
});

// Sidebar switch
document.querySelectorAll("#themeToggle").forEach(sw => {
sw.classList.toggle("active", isDark);
});
document.dispatchEvent(new Event("themeChanged"));
}

// Load theme on start
document.addEventListener("click", e => {
// Header icon click
if (e.target.closest("#themeBtn")) {
const isDark = document.body.classList.contains("dark");
applyTheme(isDark ? "light" : "dark");
}

// Sidebar switch click
if (e.target.closest("#themeToggle")) {
const isDark = document.body.classList.contains("dark");
applyTheme(isDark ? "light" : "dark");
}
});
applyTheme(localStorage.getItem("quizta-theme") || "light");


function updateLogoTheme(){
  const logo = document.getElementById("siteLogo");
  if(!logo) return;

  if(document.body.classList.contains("dark")){
    logo.src = "/assets/favicon/logoDark.png";
  } else {
    logo.src = "/assets/favicon/logo.png";
  }
}

// Run on load
window.addEventListener("DOMContentLoaded", updateLogoTheme);

// Run whenever theme toggles
document.addEventListener("themeChanged", updateLogoTheme);
/* =========================
NOTIFICATIONS TOGGLE (SAFE)
========================= */
const leftSidebar = document.getElementById("leftSidebar");
const leftStrip = document.getElementById("leftStrip");
const leftOverlay = document.getElementById("leftOverlay");

let touchStartX = 0;
let touchEndX = 0;
let leftOpen = false;

/* Toggle left sidebar */
function toggleLeft(force) {
leftOpen = typeof force === "boolean" ? force : !leftOpen;
leftSidebar.classList.toggle("open", leftOpen);
leftOverlay.classList.toggle("show", leftOpen);
lockScroll(leftOpen);
}

/* Click strip */
if (leftStrip) {
leftStrip.addEventListener("click", () => {
toggleLeft();
});
}

if (leftOverlay) {
leftOverlay.addEventListener("click", () => {
toggleLeft(false);
});
}

/* Global swipe handler */
document.addEventListener("touchstart", e => {
touchStartX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
if (sidebar?.classList.contains("open")) return;
touchEndX = e.changedTouches[0].clientX;
const diff = touchEndX - touchStartX;

/* ---- OPEN: swipe left → right from left edge ---- */
if (
!leftOpen &&
touchStartX <= window.innerWidth * 0.1 &&
diff > 60
) {
toggleLeft(true);
return;
}

/* ---- CLOSE: swipe right → left anywhere ---- */
if (
leftOpen &&
diff < -60
) {
toggleLeft(false);
}
});

const authModal = document.getElementById("authModal");
const authClose = document.getElementById("authClose");
const switchAuth = document.getElementById("switchAuth");
const authTitle = document.getElementById("authTitle");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const switchText = document.getElementById("switchText");

function openAuth(mode = "login") {
authModal.classList.add("show");
document.body.style.overflow = "hidden";

// reset errors
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
authModal.onclick = e => {
if (e.target === authModal) closeAuth();
};

switchAuth?.addEventListener("click", () => {
const isLogin = !loginForm.classList.contains("hidden");
document.getElementById("loginError").textContent = "";
document.getElementById("signupError").textContent = "";
loginForm.classList.toggle("hidden");
signupForm.classList.toggle("hidden");

authTitle.textContent = isLogin ? "Sign Up" : "Login";
switchAuth.textContent = isLogin ? "Login" : "Sign Up";
switchText.textContent = isLogin
? "Already have an account?"
: "Not have an account?";
});

const authError = document.getElementById("authError");

/* ---------- Password rules ---------- */
function validatePassword(pass) {
return (
pass.length >= 8 &&
/[A-Z]/.test(pass) &&
/[a-z]/.test(pass) &&
/[0-9]/.test(pass) &&
/[^A-Za-z0-9]/.test(pass)
);
}

/* ---------- LOGIN ---------- */
/* ---------- LOGIN ---------- */
if (loginForm) {
loginForm.addEventListener("submit", async e => {
  e.preventDefault();

  const errorBox = document.getElementById("loginError");
  const email = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // 🚫 Stop login if not verified
    if (!user.emailVerified) {
      await auth.signOut();
      errorBox.textContent = "Please verify your email before login.";
      return;
    }

    closeAuth();

  } catch (err) {
    errorBox.textContent = err.message.replace("Firebase:", "");
  }
});
}
/* ---------- SIGNUP ---------- */
/* ---------- SIGNUP ---------- */
if (signupForm) {
signupForm.addEventListener("submit", async e => {
  e.preventDefault();

  const errorBox = document.getElementById("signupError");

  const username = signupUsername.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;

  try {
    // Create Auth user
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // Send verification email
    await sendEmailVerification(user, {
      url: "https://pathca.vercel.app/signup-verified.html"
    });

    console.log("📩 Verification email sent");

    // 🔒 Immediately sign out
    await auth.signOut();

    closeAuth();

    // Redirect to info page
    window.location.href = "/signup-verified.html";

  } catch (err) {
    console.error("❌ Signup failed:", err);
    errorBox.textContent = err.message.replace("Firebase:", "");
  }
});
}

if (window.location.hash === "#login") {
setTimeout(() => {
if (typeof openAuth === "function") {
openAuth("login");
}
}, 300);
}
async function ensureUserProfile(user) {
if (!user) return;

const userRef = doc(db, "users", user.uid);
const snap = await getDoc(userRef);

const username =
user.displayName ||
user.email?.split("@")[0] ||
"Student";

if (!snap.exists() || !snap.data().username) {
await setDoc(
userRef,
{
uid: user.uid,
username,
email: user.email || "",
provider: user.providerData[0]?.providerId || "password",
createdAt: serverTimestamp(),
xp: 0,
isPremium: false, // ⭐ IMPORTANT
bookmarks: [],
settings: {
theme: localStorage.getItem("quizta-theme") || "light"
}
},
{ merge: true }
);
}
}

document.addEventListener("click", e => {
if (!e.target.classList.contains("toggle-pass")) return;

const input = e.target.previousElementSibling;
if (!input) return;

if (input.type === "password") {
input.type = "text";
e.target.classList.replace("fa-eye", "fa-eye-slash");
} else {
input.type = "password";
e.target.classList.replace("fa-eye-slash", "fa-eye");
}
});
const googleBtn = document.querySelector(".google-btn");

if (googleBtn) {
googleBtn.addEventListener("click", async () => {
try {
await signInWithPopup(auth, googleProvider);
closeAuth();
} catch (err) {
alert(err.message);
}
});
}
/* ======================
   GLOBAL AUTH READY SYSTEM
====================== */

window.__authReady = false;
window.__authUser = null;

window.waitForAuthReady = function () {
  return new Promise(resolve => {
    if (window.__authReady) {
      resolve(window.__authUser);
      return;
    }

    document.addEventListener(
      "authReady",
      () => resolve(window.__authUser),
      { once: true }
    );
  });
};
onAuthStateChanged(auth, async user => {

  const loginBtns  = document.querySelectorAll(".auth-login");
  const signupBtns = document.querySelectorAll(".auth-signup");
  const logoutBtns = document.querySelectorAll(".auth-logout");
  const lock       = document.getElementById("loginLockOverlay");

  /* ======================
     USER LOGGED OUT
  ====================== */
  if (!user) {
    window.currentUser = null;
window.__authUser = null;
window.__authReady = true;
document.dispatchEvent(new Event("authReady"));

    loginBtns.forEach(btn => btn.style.display = "flex");
    signupBtns.forEach(btn => btn.style.display = "flex");
    logoutBtns.forEach(btn => btn.style.display = "none");

    if (lock) lock.style.display = "flex";

    initGoogleOneTap();
    console.log("User logged out");
    return;
  }

  /* ======================
     USER LOGGED IN BUT NOT VERIFIED
  ====================== */
  if (!user.emailVerified) {

    // Force logout unverified user
    await auth.signOut();
    window.currentUser = null;

    loginBtns.forEach(btn => btn.style.display = "flex");
    signupBtns.forEach(btn => btn.style.display = "flex");
    logoutBtns.forEach(btn => btn.style.display = "none");

    if (lock) lock.style.display = "flex";

    // Redirect to verification info page
    if (!location.pathname.includes("signup-verified.html")) {
      window.location.replace("/signup-verified.html");
    }

    return;
  }


  /* ======================
     VERIFIED USER
  ====================== */
/* ======================
   INSTANT CACHE HYDRATION
====================== */

const cached = window.__readUserCache?.();

if (cached && cached.uid === user.uid) {
  // ⭐ instant premium paint
  if (cached.isPremium) {
    document.body.classList.add("user-premium");
    window.isPremiumUser = true;
  } else {
    document.body.classList.remove("user-premium");
    window.isPremiumUser = false;
  }

  // optional future use
  window.__userMetricsCache = cached.metrics || null;
}

  window.currentUser = user;

// ⭐ mark auth ready globally
window.__authUser = user;
window.__authReady = true;
document.dispatchEvent(new Event("authReady"));

  loginBtns.forEach(btn => btn.style.display = "none");
  signupBtns.forEach(btn => btn.style.display = "none");
  logoutBtns.forEach(btn => btn.style.display = "inline-flex");

  if (lock) lock.style.display = "none";

  /* --- Create Firestore user doc if first verified login --- */
  await ensureUserProfile(user);

  /* --- Load user profile data --- */
  loadUserProfile(user.uid);
/* ======================
   PREMIUM STATUS CHECK
====================== */

/* ======================
   PREMIUM + CACHE SYNC
====================== */

try {
  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data() || {};

  const isPremium = data.isPremium === true;

  window.isPremiumUser = isPremium;

  if (isPremium) {
    document.body.classList.add("user-premium");
  } else {
    document.body.classList.remove("user-premium");
  }

  // ⭐ WRITE CACHE (VERY IMPORTANT)
  window.__writeUserCache?.({
    uid: user.uid,
    isPremium,
    metrics: {
      streak: data.streak || 0,
      totalAttempts: data.totalAttempts || 0,
      bestXpDay: data.bestXpDay || 0,
      pageVisits: data.pageVisits || 0
    }
  });

  window.dispatchEvent(new Event("premiumStatusReady"));

} catch (e) {
  console.warn("Premium check failed");
}
  /* ======================
     PROFILE COMPLETION REDIRECT
  ====================== */
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
  }

  /* ======================
     PUBLIC LEADERBOARD DOC
  ====================== */
  const lbRef = doc(db, "publicLeaderboard", user.uid);
  const lbSnap = await getDoc(lbRef);

  if (!lbSnap.exists()) {
    await setDoc(lbRef, {
      name: user.displayName || "User",
      gender: "",
      dob: "",
      xp: 0
    });
  }

});

window.openAuth = openAuth;
window.closeAuth = closeAuth;
document.addEventListener("click", async e => {
if (!e.target.classList.contains("auth-logout")) return;

try {
await auth.signOut();
window.__clearUserCache?.();
// open existing auth popup again    
if (typeof openAuth === "function") {    
  openAuth();    
}

} catch (err) {
console.error("Logout failed:", err);
}
});

async function loadUserProfile(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return;

    const data = snap.data();

    console.log(
      "User logged in:",
      {
        uid,
        username: data.username,
        email: data.email
      }
    );

  } catch (err) {
    console.error("Profile sync failed:", err);
  }
}

const settingsModal = document.getElementById("settingsModal");
const settingsClose = document.getElementById("settingsClose");
/* =========================
   VN FEEDBACK MODAL
========================= */
const vnFeedbackLink = document.getElementById("vnFeedbackLink");
const vnModal = document.getElementById("vnFeedbackModal");
const vnCancel = document.getElementById("vnCancel");
const vnSend = document.getElementById("vnSend");

vnFeedbackLink?.addEventListener("click", () => {
  vnModal.classList.add("show");
});

vnCancel?.addEventListener("click", () => {
  vnModal.classList.remove("show");
});

vnSend?.addEventListener("click", async () => {
  const name = document.getElementById("vnName").value.trim();
  const message = document.getElementById("vnMessage").value.trim();
  const errorBox = document.getElementById("vnError");

  if (!message) {
    errorBox.textContent = "Please write a message.";
    return;
  }

  vnSend.textContent = "Sending...";
  errorBox.textContent = "";

  try {
    const res = await fetch("/api/voice-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "Anonymous",
        message: message
      })
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

/* Open settings (Settings page OR icon later) */
function openSettings() {
settingsModal.classList.add("show");
document.body.style.overflow = "hidden";
}

function closeSettings() {
settingsModal.classList.remove("show");
document.body.style.overflow = "auto";
}

settingsClose?.addEventListener("click", closeSettings);

settingsModal?.addEventListener("click", e => {
if (e.target.classList.contains("settings-modal")) {
closeSettings();
}
});
document
.querySelector(".settings-box")
?.addEventListener("click", e => e.stopPropagation());

/* Toggle UI only */

/* expose globally */
window.openSettings = openSettings;

const profileBtn = document.getElementById("profileBtn");
const profilePopup = document.getElementById("profilePopup");

profileBtn?.addEventListener("click", e => {
e.stopPropagation();

// 🔥 CLOSE notification panel if open
if (notifyPanel?.classList.contains("show")) {
notifyPanel.classList.remove("show");
}

if (profilePopup.style.maxHeight) {
closeProfilePopup();
} else {
openProfilePopup();
}
});

function openProfilePopup() {
if (!profilePopup) return;
profilePopup.style.maxHeight = profilePopup.scrollHeight + "px";
}

function closeProfilePopup() {
if (!profilePopup) return;
profilePopup.style.maxHeight = null;
}

document.addEventListener("click", () => {
closeProfilePopup();
});
/* =========================
DESKTOP PROFILE LOCK
========================= /
/ =========================
DESKTOP PROFILE HARD LOCK
========================= */
onAuthStateChanged(auth, user => {
const profileBtn = document.getElementById("profileBtn");
const profilePopup = document.getElementById("profilePopup");
const lockPopup = document.getElementById("profileLockPopup");
const profileWrap = document.querySelector(".profile-wrap");

if (!profileBtn || !profileWrap) return;

// Desktop only
if (window.innerWidth < 768) return;

// Mark locked state
profileWrap.classList.toggle("locked", !user);

// REMOVE previous click handlers safely
profileBtn.replaceWith(profileBtn.cloneNode(true));
const newProfileBtn = document.getElementById("profileBtn");

newProfileBtn.addEventListener("click", e => {
e.stopPropagation();

// 🚫 USER NOT LOGGED IN    
if (!user) {    
  profilePopup.style.maxHeight = null; // FORCE CLOSE    
  lockPopup.style.display = "block";    
  return;    
}    

// ✅ USER LOGGED IN → normal behavior    
lockPopup.style.display = "none";    
profilePopup.style.maxHeight    
  ? (profilePopup.style.maxHeight = null)    
  : (profilePopup.style.maxHeight =    
      profilePopup.scrollHeight + "px");

});

// Click outside closes lock popup
document.addEventListener("click", () => {
lockPopup.style.display = "none";
});

});
/* =========================
NOTIFICATIONS (GLOBAL)
========================= */

/* =========================
NOTIFICATIONS (GLOBAL)
========================= */
const notifyBtn = document.getElementById("notifyBtn");
const notifyPanel = document.getElementById("notifyPanel");
const notifyList = document.getElementById("notifyList");
const notifyClose = document.getElementById("notifyClose");
const notifyDots = document.querySelectorAll(".notify-dot");

if (notifyBtn && notifyPanel && notifyList) {

/* Toggle panel */
notifyBtn?.addEventListener("click", e => {
e.stopPropagation();

// 🔥 CLOSE profile popup if open
closeProfilePopup();

notifyPanel.classList.toggle("show");
setLastSeenNotify(Date.now());
notifyDots.forEach(dot => (dot.style.display = "none"));
});

/* Close button */
notifyClose?.addEventListener("click", () => {
notifyPanel.classList.remove("show");
});

/* Click outside closes */
document.addEventListener("click", e => {
if (
notifyPanel.classList.contains("show") &&
!notifyPanel.contains(e.target) &&
!notifyBtn.contains(e.target)
) {
notifyPanel.classList.remove("show");
}
});

const notifyBtnMobile = document.getElementById("notifyBtnMobile");

notifyBtnMobile?.addEventListener("click", e => {
e.stopPropagation();

notifyPanel.classList.toggle("show");

// 🔥 SAME behavior as desktop
setLastSeenNotify(Date.now());
notifyDots.forEach(dot => (dot.style.display = "none"));
});

onAuthStateChanged(auth, user => {

  const notifyBtn = document.getElementById("notifyBtn");
  const notifyPanel = document.getElementById("notifyPanel");
  const notifyList = document.getElementById("notifyList");
  const notifyDots = document.querySelectorAll(".notify-dot");

  if (!notifyBtn || !notifyPanel || !notifyList) return;

  const userEmail = user?.email?.toLowerCase() || null;

  /* 🔥 Filtered Query */
  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, snap => {

    notifyList.innerHTML = "";

let newestVisibleTime = 0;
const lastSeen = getLastSeenNotify();
let hasVisible = false;

snap.forEach(docSnap => {
  const data = docSnap.data();
  const created = data.createdAt?.toMillis?.() || 0;

  // 🔒 FILTER RULES
  const isGlobal = data.target === "global";
  const isForUser =
    data.target === "user" &&
    userEmail &&
    data.email === userEmail;

  if (!isGlobal && !isForUser) return; // skip hidden

  hasVisible = true;

  // ✅ Track newest only among visible ones
  if (created > newestVisibleTime) newestVisibleTime = created;

  const item = document.createElement("div");
  item.className = "notify-item";
  item.innerHTML = `
    <p class="notify-text">${data.message}</p>
    <small class="notify-time">${formatTime(data.createdAt)}</small>
  `;
  notifyList.appendChild(item);
});

// Empty state
if (!hasVisible) {
  notifyList.innerHTML =
    "<div class='notify-item'>No notifications</div>";
}

// 🔔 Dot now reacts only to visible notifications
if (newestVisibleTime > lastSeen) {
  notifyDots.forEach(dot => (dot.style.display = "inline-block"));
} else {
  notifyDots.forEach(dot => (dot.style.display = "none"));
}
  });
});

}
function getLastSeenNotify() {
return parseInt(localStorage.getItem("lastSeenNotify") || "0");
}

function setLastSeenNotify(ts) {
localStorage.setItem("lastSeenNotify", ts);
}
function formatTime(ts) {
if (!ts) return "";

const date = ts.toDate();
const now = new Date();

const diffMin = Math.floor((now - date) / 60000);

if (diffMin < 1) return "Just now";
if (diffMin < 60) return `${diffMin} min ago`;
const diffHr = Math.floor(diffMin / 60);
if (diffMin < 24) return `${diffHr} hr ago`;
return date.toLocaleDateString("en-IN", {
day: "numeric",
month: "short"
});
}
/* =========================
ADMIN SIDEBAR VISIBILITY
========================= */
const ADMIN_EMAILS = [
"nicknow20@gmail.com",
"saurabhjoshionly@gmail.com",
"contact.globalratings@gmail.com"
];

onAuthStateChanged(auth, user => {
const adminItems = document.querySelectorAll(".admin-only");
if (!adminItems.length) return;

const isAdmin =
user && ADMIN_EMAILS.includes(user.email);

adminItems.forEach(el => {
el.style.display = isAdmin ? "block" : "none";
});

});

const TEMP_TEST_REF = doc(db, "tempTests", "current");

onSnapshot(TEMP_TEST_REF, snap => {

  // Always ensure menu item exists
  injectTempTestItem();

  // No test → hide dot
  if (!snap.exists()) {
    setTempTestDot(false);
    return;
  }

  const data = snap.data();

  // Live test → show dot
  if (data.status === "live") {
    setTempTestDot(true);
  } else {
    setTempTestDot(false);
  }
});
function setTempTestDot(show) {
  const dot = document.querySelector(".temp-test-dot");
  if (!dot) return;
  dot.style.display = show ? "inline-block" : "none";
}

/* =========================
PWA SERVICE WORKER
========================= */
if ("serviceWorker" in navigator) {
window.addEventListener("load", async () => {
try {
const reg = await navigator.serviceWorker.register("/sw.js");
console.log("Service Worker registered");

// 🔄 Force update check    
  reg.update();    
} catch (err) {    
  console.error("❌ SW failed", err);    
}

});
navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

/* =========================
PWA INSTALL LOGIC
========================= */
let installPrompt = null;
let installTimer = null;

function initPWAInstall() {
const banner = document.getElementById("installBanner");
const installBtn = document.getElementById("installBtn");
const closeBtn = document.getElementById("installClose");

if (!banner || !installBtn || !closeBtn) {
console.warn("❌ PWA banner elements missing");
return;
}

window.addEventListener("beforeinstallprompt", e => {
e.preventDefault();
installPrompt = e;

installTimer = setTimeout(() => {
      if (!localStorage.getItem("pwaDismissed")) {
        banner.classList.remove("hidden");
        banner.classList.add("pwa-attention");
      }
    }, 10000); // ⏱ 10 seconds
  });

  installBtn.addEventListener("click", async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    await installPrompt.userChoice;

    installPrompt = null;
    hide();
  });

  closeBtn.addEventListener("click", () => {
    localStorage.setItem("pwaDismissed", "1");
    hide();
  });

  function hide() {
    banner.classList.add("hidden");
    banner.classList.remove("pwa-attention");
    if (installTimer) clearTimeout(installTimer);
  }
}

/* ✅ SAFE AUTO INIT */
document.addEventListener("DOMContentLoaded", initPWAInstall);

// ===== Resources dropdown toggle =====
const resourcesToggle = document.getElementById("resourcesToggle");
const resourcesMenu = document.getElementById("resourcesMenu");

if (resourcesToggle && resourcesMenu) {
  resourcesToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    resourcesMenu.classList.toggle("open");
  });

  // Close if clicking outside
  document.addEventListener("click", () => {
    resourcesMenu.classList.remove("open");
  });

  resourcesMenu.addEventListener("click", e => {
    e.stopPropagation();
  });
}

/* =========================
   HOW TO USE – PAGE GUARD
========================= */

const HOW_TO_ALLOWED_PAGES = [
  "index",
  "chapters",
  "mtp-rtp",
  "business-laws",
  "performance",
  "leaderboard"
];

function isHowToAllowedPage() {
  const path = location.pathname.toLowerCase();
  return HOW_TO_ALLOWED_PAGES.some(p => path.includes(p));
}

/* =========================
   HOW TO USE – COMMON SYSTEM
========================= */

const howToBtn = document.getElementById("howToBtn");
const howToOverlay = document.getElementById("howToOverlay");
const howToClose = document.getElementById("howToClose");
const howToContent = document.getElementById("howToContent");
const howToTitle = document.getElementById("howToTitle");

if (howToBtn && howToOverlay && isHowToAllowedPage()) {

  // ✅ show ONLY when allowed
  howToBtn.style.display = "flex";

  howToBtn.addEventListener("click", () => {
    injectHowToContent();
    howToOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  });

  howToClose.addEventListener("click", closeHowTo);

  howToOverlay.addEventListener("click", e => {
    if (e.target === howToOverlay) closeHowTo();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeHowTo();
  });

} else if (howToBtn) {
  // 🚫 hide button on all other pages
  howToBtn.style.display = "none";
}

function closeHowTo() {
  howToOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

/* =========================
   PAGE-WISE CONTENT
========================= */

function injectHowToContent() {
  const page = location.pathname;
  let title = "How to Use";
  let html = "";

  if (page.includes("chapters")) {
  title = "How to Use – Chapter Wise Practice";

  html = `
    <h3>Chapter Wise Practice on PathCA</h3>
    <p>
      This section allows you to practice individual chapters from
      <strong>Quantitative Aptitude</strong> and <strong>Business Economics</strong>.
      The questions are curated from multiple trusted academic sources and
      exam-oriented materials to help you strengthen conceptual clarity
      and problem-solving skills.
    </p>

    <h3>How to Start a Quiz</h3>
    <p>
      To begin practicing, first select the subject from the
      <strong>Subject</strong> option. Once the subject is selected,
      choose the required chapter from the <strong>Chapter</strong> option.
      After making both selections, click on <strong>Start</strong> to begin the quiz.
    </p>

    <h3>Custom Quiz Settings</h3>
    <p>
      You can customize your practice experience using the
      <strong>Settings</strong> panel available on the right sidebar.
      From there, you can enable or disable option shuffling,
      question shuffling, and adjust the timer duration for each question
      according to your preference.
    </p>

    <h3>Scoring, XP & Review</h3>
    <p>
      Each correct answer awards you <strong>5 XP points</strong>,
      which contribute to your overall progress and leaderboard ranking.
      After completing the quiz, you can review your attempted questions
      and also download a PDF of the attempted quiz for revision.
    </p>
  `;
}

  else if (page.includes("mtp-rtp")) {
title = "How to Use – RTP/MTP'Wise";
  html = `
    <h3>MTP & RTP Practice on PathCA</h3>
    <p>
      This section allows you to practice <strong>Revision Test Papers (RTP)</strong> and
      <strong>Mock Test Papers (MTP)</strong> for
      <strong>Quantitative Aptitude</strong> and
      <strong>Business Economics</strong>.
      These papers are updated regularly as new ICAI sets are released,
      ensuring your preparation stays exam-relevant.
    </p>

    <h3>How to Start Practicing</h3>
    <p>
      To begin, first select the required subject from the
      <strong>Subject</strong> option.
      Once the subject is selected, choose the desired RTP or MTP attempt
      from the <strong>Attempt</strong> option.
      After completing both selections, click on <strong>Start</strong>
      to begin your practice session.
    </p>

    <h3>Scoring, XP & Performance</h3>
    <p>
      Each correct answer awards you <strong>5 XP points</strong>,
      which contribute to your overall progress and leaderboard ranking.
      After completing the quiz, you can review your answers and
      <strong>save the attempted questions as a PDF</strong>
      for future revision.
    </p>
  `;
}

  else if (page.includes("profile")) {
    title = "How to Use – Profile";
    html = `
      <ul>
        <li>Edit username, DOB and gender</li>
        <li>Select or upload a profile picture</li>
        <li>Save profile to reflect on leaderboard</li>
      </ul>
    `;
  }

  else if (page.includes("business-laws")) {
  title = "How to Use – Law'Wise practice";
  html = `
    <h3>Business Laws Practice on PathCA</h3>
    <p>
      This section allows you to practice descriptive and theory-based
      questions from the <strong>Business Laws</strong> subject.
      The practice is designed to help you develop proper legal writing
      skills and improve answer presentation for examinations.
      Your answers are evaluated using keyword analysis and content length
      to ensure conceptual accuracy.
    </p>

    <h3>How Evaluation Works</h3>
    <p>
      The system analyzes your answer by checking the
      <strong>keywords used</strong> and the
      <strong>overall length and relevance</strong> of your response.
      Based on this analysis, marks and XP are awarded automatically.
      The maximum marks for a single answer are <strong>4 marks</strong>,
      and the maximum XP you can earn per answer is <strong>10 XP points</strong>.
    </p>

    <h3>How to Start Practicing</h3>
    <p>
      To begin, select the required chapter or unit from the
      <strong>Chapter</strong> option.
      Once the chapter is selected, click on <strong>Start</strong>
      to begin practicing.
      There is no time limit for Business Laws answers, allowing you to
      write freely and focus on answer quality.
    </p>

    <h3>Review and Answer Analysis</h3>
    <p>
      After completing the practice, you can review all your answers.
      During review, the keywords that you successfully used in your answer
      will be highlighted.
      Below each answer, a separate section displays the
      <strong>expected keywords</strong> and shows how many of them
      you included in your response.
      You can also <strong>save your attempted answers as a PDF</strong>
      for future revision.
    </p>
  `;
}
else if (page.includes("performance")) {
title = "Understand – Performance";
  html = `
    <h3>Performance Dashboard on PathCA</h3>
    <p>
      The Performance page provides a complete overview of your learning
      progress on PathCA. This section is available only to logged-in users
      and is designed to help you understand your consistency, accuracy,
      and improvement trend over time.
    </p>

    <h3>Key Performance Statistics</h3>
    <p>
      At the top of the page, you will see four key statistic boxes that
      summarize your activity, including metrics such as streak,
      total attempts, and overall engagement. These indicators help you
      quickly assess how consistently you are practicing.
    </p>

    <h3>Weekly Performance Graph</h3>
    <p>
      Below the summary statistics, a performance graph displays your
      weekly progress. This graph visually represents your total XP earned
      during the week and helps you track fluctuations in performance
      across different days.
    </p>

    <h3>Period-Based Analyzer</h3>
    <p>
      The analyzer section allows you to evaluate your performance over a
      selected time period of up to one month. It aggregates your activity
      data to provide meaningful insights into your study pattern within
      the chosen duration.
    </p>

    <h3>Attempt Distribution and Trend</h3>
    <p>
      This section shows a detailed breakdown of your total attempts across
      Chapters, RTPs, and MTPs for the selected period. It also indicates
      whether your performance trend is improving or declining, helping
      you identify areas that need more focus.
    </p>

    <h3>AI-Based Performance Insight</h3>
    <p>
      At the bottom of the page, the Period Insight section uses AI-driven
      analysis to generate personalized feedback on your performance.
      These insights are tailored to your activity data and are intended
      to guide you on how to improve accuracy, consistency, and overall
      exam readiness.
    </p>
  `;
}
else if (page.includes("leaderboard")) {
  title = "Understand – Leaderboard";

  html = `
    <h3>Weekly Leaderboard on PathCA</h3>
    <p>
      The Leaderboard displays the top performers based on
      <strong>weekly XP earned</strong>.
      It helps you compare your preparation consistency with other students
      and motivates you to practice regularly.
      The leaderboard resets automatically every week.
    </p>

    <h3>How Ranking Works</h3>
    <p>
      Rankings are calculated using the total XP earned during the current
      week from Chapters, RTPs, MTPs, and other practice activities.
      Only users who have earned a minimum of
      <strong>5 XP</strong> in the current week are shown on the leaderboard.
      If you do not see your name, continue practicing to earn XP and
      your profile will appear automatically.
    </p>

    <h3>Viewing User Details</h3>
    <p>
      You can tap or click on any user card in the leaderboard to view
      additional profile details.
      This includes the user’s name, date of birth, gender, and profile picture,
      if the user has provided these details.
    </p>

    <h3>Profile Picture and Missing Details</h3>
    <p>
      If a profile picture is not visible for a user, it usually means
      the user has not updated their profile yet.
      To ensure your own profile picture appears correctly,
      visit the <strong>Profile</strong> page and upload or select a picture.
      Similarly, if details such as gender or date of birth are missing,
      it indicates that the user has not completed those fields so far.
    </p>

    <h3>Purpose of the Leaderboard</h3>
    <p>
      The leaderboard is designed to encourage healthy competition
      and consistent practice.
      Focus on improving your accuracy and maintaining daily activity
      rather than only chasing ranks, as consistent effort naturally
      leads to better performance and higher XP.
    </p>
  `;
}
else if (page === "/" || page.includes("index")) {
title = "Welcome to PathCA";
  html = `
    <h3>Welcome to PathCA</h3>
    <p>
      PathCA is an exam-focused practice platform designed specifically
      for CA Foundation students. The platform helps you practice
      concept-wise questions, track performance, and improve exam
      readiness through structured practice and analytics.
    </p>

    <h3>Demo Mode</h3>
    <p>
      The Demo option allows you to try the PathCA practice experience
      without creating an account. By clicking on Demo, you can attempt
      sample questions to understand how the system works, including
      question navigation, answer selection, and result evaluation.
    </p>

    <h3>Register and Get Started</h3>
    <p>
      Clicking on Register opens the registration window where you can
      create your PathCA account. Registration enables access to full
      features such as XP tracking, leaderboard participation,
      performance analytics, and personalized insights.
    </p>

    <h3>Platform Features</h3>
    <p>
      The features section below highlights the core capabilities of
      PathCA, including chapter-wise practice, RTP and MTP simulations,
      performance tracking, and AI-powered insights. These features are
      designed to help you practice efficiently and prepare confidently
      for the CA Foundation examination.
    </p>
  `;
}

  else {
    html = `
      <p>
        Use the navigation menu to explore PathCA.
        Practice daily to earn XP and improve ranking.
      </p>
    `;
  }

  howToTitle.textContent = title;
  howToContent.innerHTML = html;
}

/* =========================
   LUCIDE INIT SAFE
========================= */
if (window.lucide) {
  lucide.createIcons();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) lucide.createIcons();
  });
}

document.addEventListener("DOMContentLoaded", () => {

/* ================= BASE ELEMENTS ================= */

const subOverlay = document.getElementById("subOverlay");
const subModal = document.getElementById("subModal");
const closeSub = document.getElementById("closeSub");
const subscribeBtn = document.getElementById("subscribeBtn");
const qrBox = document.getElementById("qrBox");

const uploadBtn = document.getElementById("uploadPaymentBtn");
const fileInput = document.getElementById("paymentFileInput");

const previewBox = document.getElementById("uploadPreview");
const previewImg = document.getElementById("previewImg");
const fileNameText = document.getElementById("fileNameText");
const finalSubmitBtn = document.getElementById("finalSubmitBtn");

const imagePreviewOverlay = document.getElementById("imagePreviewOverlay");
const imagePreviewFull = document.getElementById("imgPreviewFull");
const imagePreviewClose = document.getElementById("imgPreviewClose");

let originalImage = null;
let compressedBlob = null; // ⭐ VERY IMPORTANT
/* ================= OPEN SUBSCRIPTION ================= */

window.openSubscription = function(triggerBtn){
  if (!subOverlay || !subModal || !triggerBtn) return;

  const rect = triggerBtn.getBoundingClientRect();

  subOverlay.classList.remove("hidden");
  subOverlay.classList.add("show");

  subModal.style.transformOrigin =
    `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`;

  document.body.style.overflow = "hidden";
};

/* ================= CLOSE SUBSCRIPTION ================= */

closeSub?.addEventListener("click", () => {
  subOverlay?.classList.remove("show");
  subOverlay?.classList.add("hidden");
  document.body.style.overflow = "";
});

/* ================= QR TOGGLE ================= */

subscribeBtn?.addEventListener("click", () => {
  // 🔁 restore QR if reopened
const qrImg = qrBox?.querySelector("img");
if (qrImg) qrImg.style.display = "block";
  if (!qrBox) return;

  const isOpen = qrBox.classList.contains("show");

  if (isOpen) {
    // ===== CLOSE =====
    qrBox.classList.remove("show");
    subscribeBtn.textContent = "Subscribe Now";

    // 🔥 RESET UI
    document.querySelector(".qr-note")?.classList.remove("hidden");
    uploadBtn?.classList.remove("hidden");
    qrBox?.querySelector("img")?.classList.remove("hidden");
    previewBox?.classList.add("hidden");
    finalSubmitBtn?.classList.add("hidden");

    if (fileInput) fileInput.value = "";

  } else {
    // ===== OPEN =====
    qrBox.classList.add("show");
    subscribeBtn.textContent = "Fall Back";
  }
});

/* ================= OPEN FILE PICKER ================= */

uploadBtn?.addEventListener("click", () => {
  fileInput?.click();
});

/* ================= FILE SELECT (SAFE VERSION) ================= */

fileInput?.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  // 🔒 allow images only
  if (!file.type.startsWith("image/")) {
    fileInput.value = "";
    return;
  }

  try {
    // =========================
    // UI STATE SWITCH
    // =========================

    // hide note + upload button
    document.querySelector(".qr-note")?.classList.add("hidden");
    uploadBtn?.classList.add("hidden");
    // 🔥 HIDE QR IMAGE ALSO
const qrImg = qrBox?.querySelector("img");
if (qrImg) {
  qrImg.style.display = "none";
}
// 🔥 hide QR image after upload
qrBox?.querySelector("img")?.classList.add("hidden");
    // =========================
    // PREVIEW (safe)
    // =========================

    const previewURL = URL.createObjectURL(file);

    if (previewImg) previewImg.src = previewURL;
    previewBox?.classList.remove("hidden");

    // filename below preview
    if (fileNameText) fileNameText.textContent = file.name;

    // show final submit button
    finalSubmitBtn?.classList.remove("hidden");

    // =========================
    // BACKGROUND COMPRESSION (safe)
    // =========================
const img = new Image();

img.onload = async () => {
  try {
    compressedBlob = await compressImage(img); // ⭐ REAL compression
    console.log("📦 Compressed size:", compressedBlob?.size);
  } catch (err) {
    console.warn("Compression skipped:", err);
    compressedBlob = null;
  }
};

img.onerror = () => {
  console.warn("Image load failed");
  compressedBlob = null;
};

img.src = previewURL;

  } catch (err) {
    console.error("❌ File preview failed:", err);
  }
});

/* ================= THUMBNAIL → FULL PREVIEW ================= */

previewImg?.addEventListener("click", () => {
  if (!previewImg?.src) return;
  if (!imagePreviewOverlay || !imagePreviewFull) return;

  imagePreviewFull.src = previewImg.src;
  imagePreviewOverlay.classList.remove("hidden");
});

/* ================= CLOSE FULL PREVIEW ================= */

imagePreviewClose?.addEventListener("click", () => {
  imagePreviewOverlay?.classList.add("hidden");
});

imagePreviewOverlay?.addEventListener("click", (e) => {
  if (e.target === imagePreviewOverlay) {
    imagePreviewOverlay.classList.add("hidden");
  }
});
/* ================= IMAGE COMPRESSION (TARGET ~100KB) ================= */

async function compressImage(img){
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas not supported");

  const TARGET = 100 * 1024; // 🎯 100 KB target

  let width = img.width;
  let height = img.height;

  // initial scale limit
  const maxW = 1200;
  const scale = Math.min(maxW / width, 1);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = 0.9;
  let blob;

  // 🔥 step 1: reduce quality
  do {
    blob = await canvasToBlob(canvas, quality);
    quality -= 0.07;
  } while (blob && blob.size > TARGET && quality > 0.35);

  // 🔥 step 2 (IMPORTANT): if still big → reduce resolution
  while (blob && blob.size > TARGET && canvas.width > 400) {
    canvas.width = Math.round(canvas.width * 0.85);
    canvas.height = Math.round(canvas.height * 0.85);

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    quality = 0.85;

    do {
      blob = await canvasToBlob(canvas, quality);
      quality -= 0.07;
    } while (blob && blob.size > TARGET && quality > 0.4);
  }

  return blob;
}

/* helper */
function canvasToBlob(canvas, quality){
  return new Promise(resolve =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
}
/* ================= FINAL SUBMIT ================= */
const CLOUD_NAME = "dhjjtjbur";
const PAYMENT_UPLOAD_PRESET = "PaymentsScreenshots";
finalSubmitBtn?.addEventListener("click", async () => {

  try {
    const user = window.currentUser;
    if (!user) {
      requireLoginToast?.();
      return;
    }

    const uid = user.uid;
    const email = user.email || "";

    if (!previewImg?.src) {
      console.log("❌ No image to submit");
      return;
    }

    finalSubmitBtn.textContent = "Submitting...";

    // ✅ get username
    let username = "unknown";
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        username = snap.data().username || "unknown";
      }
    } catch (e) {
      console.warn("Username fetch failed");
    }

// ⭐ wait if compression still running
if (!compressedBlob) {
  console.log("⏳ Waiting for compression...");
  await new Promise(r => setTimeout(r, 500));
}

let fileToUpload;
// ⭐ SMART wait for compression (max 2s)
let waitCount = 0;
while (!compressedBlob && waitCount < 10) {
  console.log("⏳ Waiting for compression...");
  await new Promise(r => setTimeout(r, 200));
  waitCount++;
}

if (compressedBlob) {
  console.log("✅ Using compressed image");
  fileToUpload = new File(
    [compressedBlob],
    `payment_${Date.now()}.jpg`,
    { type: "image/jpeg" }
  );
} else {
  console.warn("⚠️ Compression not ready — using original");
  const blob = await fetch(previewImg.src).then(r => r.blob());
  fileToUpload = new File(
    [blob],
    `payment_${Date.now()}.jpg`,
    { type: "image/jpeg" }
  );
}

    // ✅ upload to Cloudinary
    const imgURL = await uploadPaymentImage(fileToUpload, username, email);

    // ✅ save to Firestore (NO source field)
    await addDoc(collection(db, "paymentProofs"), {
      uid,
      username,
      email,
      screenshot: imgURL,
      status: "pending",
      createdAt: serverTimestamp()
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

  // ✅ FORCE folder = Payments
  form.append("folder", "Payments");

  // clean filename
  const cleanUser = username.replace(/\s+/g, "_");
  const cleanEmail = email.replace(/[@.]/g, "_");

  form.append(
    "public_id",
    `${cleanUser}_${cleanEmail}_${Date.now()}`
  );

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: form
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return data.secure_url;
}
});