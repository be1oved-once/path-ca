import {
  sendEmailVerification,
  applyActionCode,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { auth } from "./firebase.js";

/* =========================
   UI ELEMENTS
========================= */
const msg = document.getElementById("verifyMsg");
const resendBtn = document.getElementById("resendBtn");

/* =========================
   URL PARAMS
========================= */
const params = new URLSearchParams(window.location.search);
const oobCode = params.get("oobCode");

/* =========================
   VERIFY EMAIL WITH CODE
========================= */
async function verifyEmailWithCode(code) {
  try {
    await applyActionCode(auth, code);

    console.log("✅ Email verified via link");

    // Update UI to verified state
    document.querySelector("h1").textContent = "Email verified! 🤗";

    document.querySelector(".verify-desc").textContent =
      "Your email address has been successfully verified.";

    document.querySelector(".hint-box p").textContent =
      "You’ll be redirected to login in a moment.";

    msg.textContent = "Redirecting…";

    resendBtn.style.display = "none";

    setTimeout(() => {
      window.location.href = "/index.html#login";
    }, 4000);

  } catch (error) {
    console.error("❌ Verification failed", error.code, error.message);
    msg.textContent =
      "Verification link expired or invalid. Please resend.";
  }
}

/* =========================
   RESEND FUNCTION
========================= */
async function resendVerification(user) {
  try {
    await sendEmailVerification(user, {
      url: "https://pathca.vercel.app/signup-verified.html"
    });

    msg.textContent =
      "Verification email sent again. Check inbox or spam.";

    msg.style.color = "#22c55e";

  } catch (error) {
    console.error("❌ Resend failed", error.code, error.message);
    msg.textContent =
      "Failed to resend verification. Try again.";
    msg.style.color = "#ef4444";
  }
}

/* =========================
   INITIAL PAGE LOGIC
========================= */
if (oobCode) {
  // User clicked email verification link
  verifyEmailWithCode(oobCode);
} else {
  // Normal waiting page after signup
  msg.textContent =
    "Verification email sent. Please check your inbox.";
}

/* =========================
   RESEND BUTTON CLICK
========================= */
resendBtn.addEventListener("click", async () => {

  let user = auth.currentUser;

  // ✅ If still logged in → resend directly
  if (user) {
    msg.textContent = "Sending verification email…";
    resendVerification(user);
    return;
  }

  // 🔐 If session expired → re-login once
  const email = prompt("Enter your signup email:");
  const password = prompt("Enter your password:");

  if (!email || !password) return;

  try {
    msg.textContent = "Re-authenticating…";

    const cred = await signInWithEmailAndPassword(auth, email, password);
    user = cred.user;

    msg.textContent = "Sending verification email…";
    resendVerification(user);

  } catch {
    msg.textContent = "Login failed. Check email/password.";
    msg.style.color = "#ef4444";
  }
});