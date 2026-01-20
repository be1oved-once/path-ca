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

function initGoogleOneTap() {
if (!window.google?.accounts?.id) return;

google.accounts.id.initialize({
client_id: "17479597538-v0arppvqpf198bubbtd93i5roimuu5dr.apps.googleusercontent.com", // SAME AS FIREBASE
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
      url: "https://beforexam.vercel.app/signup-verified.html"
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

  window.currentUser = user;

  loginBtns.forEach(btn => btn.style.display = "none");
  signupBtns.forEach(btn => btn.style.display = "none");
  logoutBtns.forEach(btn => btn.style.display = "inline-flex");

  if (lock) lock.style.display = "none";

  /* --- Create Firestore user doc if first verified login --- */
  await ensureUserProfile(user);

  /* --- Load user profile data --- */
  loadUserProfile(user.uid);

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

/* 🔥 REAL-TIME FETCH */
const q = query(
collection(db, "notifications"),
orderBy("createdAt", "desc")
);

onSnapshot(q, snap => {
notifyList.innerHTML = "";

if (snap.empty) {
notifyList.innerHTML =
"<div class='notify-item'>No notifications</div>";
return;
}

let newestTime = 0;
const lastSeen = getLastSeenNotify();

snap.forEach(docSnap => {
const data = docSnap.data();

const created =    
  data.createdAt?.toMillis?.() || 0;    

if (created > newestTime) {    
  newestTime = created;    
}    

const item = document.createElement("div");

item.className = "notify-item";

item.innerHTML = `

  <p class="notify-text">${data.message}</p>    
  <small class="notify-time">${formatTime(data.createdAt)}</small>    
`;    notifyList.appendChild(item);

});

// 🔔 SHOW DOT ONLY IF NEW NOTIFICATION ARRIVED
if (newestTime > lastSeen) {
notifyDots.forEach(dot => (dot.style.display = "inline-block"));
}
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
"saurabhjoshionly@gmail.com"
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