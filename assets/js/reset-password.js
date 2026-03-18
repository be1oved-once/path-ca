import {
  sendPasswordResetEmail,
  confirmPasswordReset
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { auth } from "./firebase.js";

/* =========================
   URL PARAMS
========================= */
const params = new URLSearchParams(window.location.search);
const oobCode = params.get("oobCode");

/* =========================
   ELEMENTS
========================= */
const requestBox = document.getElementById("requestBox");
const confirmBox = document.getElementById("confirmBox");

const resetMsg = document.getElementById("resetMsg");
const confirmMsg = document.getElementById("confirmMsg");

/* =========================
   MODE SWITCH
========================= */
if (oobCode) {
  console.log("🔐 Reset mode detected (oobCode found)");
  requestBox.classList.add("hidden");
  confirmBox.classList.remove("hidden");
}

/* =========================
   SEND RESET EMAIL
========================= */
document.getElementById("sendResetBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("resetEmail").value.trim();
  if (!email) return;

  resetMsg.textContent = "Sending reset link…";
  console.log("📨 Sending reset email to:", email);

  try {
await sendPasswordResetEmail(auth, email, {
  url: "https://pathca.vercel.app/reset-password.html",
  handleCodeInApp: true
});

console.log("✅ Reset email sent");

    console.log("✅ Reset email accepted by Firebase");
    resetMsg.textContent =
      "Password reset link sent. If not received, wait 1–2 minutes.";

  } catch (error) {
    console.error("❌ Reset email failed:", error.code, error.message);
    resetMsg.textContent =
      error.message.replace(":", "") || "Failed to send reset link";
  }
});

/* =========================
   🔐 CONFIRM PASSWORD RESET
   ⬇️⬇️⬇️ PASTE HERE ⬇️⬇️⬇️
========================= */
document.getElementById("confirmResetBtn")?.addEventListener("click", async () => {
  const pass1 = document.getElementById("newPassword").value;
  const pass2 = document.getElementById("confirmPassword").value;

  if (pass1.length < 8) {
    confirmMsg.textContent = "Password must be at least 8 characters";
    console.warn("⚠️ Weak password");
    return;
  }

  if (pass1 !== pass2) {
    confirmMsg.textContent = "Passwords do not match";
    console.warn("⚠️ Passwords mismatch");
    return;
  }

  console.log("🔁 Confirming password reset with oobCode:", oobCode);
  confirmMsg.textContent = "Resetting password…";

  try {
    await confirmPasswordReset(auth, oobCode, pass1);

    console.log("✅ Password reset SUCCESS");
    confirmMsg.textContent = "Password reset successful. Redirecting…";

    setTimeout(() => {
      window.location.href = "/index.html";
    }, 2000);

  } catch (error) {
    console.error("❌ Password reset CONFIRM FAILED");
    console.error("Code:", error.code);
    console.error("Message:", error.message);

    confirmMsg.textContent =
      error.message.replace(":", "") || "Reset failed";
  }
});