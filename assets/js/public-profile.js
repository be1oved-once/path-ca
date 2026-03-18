import { db } from "./firebase.js";
import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
/* Elements */
const usernameEl = document.getElementById("username");
const dobEl = document.getElementById("dob");
const genderText = document.getElementById("genderText");
const joinedDateEl = document.getElementById("joinedDate");
const pfpImage = document.getElementById("pfpImage");
// ===== MASTER GRID AVATAR BUILDER =====
async function loadPublicProfile() {
  const path = window.location.pathname;
  
  // Robust way to get the username from /u/username
  const segments = path.split('/').filter(segment => segment.length > 0);
  // If path is /u/nicknow, segments will be ["u", "nicknow"]
  const username = segments[segments.indexOf('u') + 1];

  if (!username) {
    console.error("No username found in URL");
    return;
  }

  console.log("Fetching profile for:", username);

  // Reference the publicUsers collection
  const userRef = doc(db, "publicUsers", username.toLowerCase());
  try {
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      if (usernameEl) usernameEl.value = "User not found";
      return;
    }

    const data = snap.data();

    // Fill the UI fields
    if (usernameEl) usernameEl.value = data.username || "";
    if (dobEl) dobEl.value = data.dob || "";

    if (data.dob) {
      const [yy, mm, dd] = data.dob.split("-");
      const btn = document.getElementById("dobBtn");
      if (btn) btn.textContent = `${dd}-${mm}-${yy}`;
    }

    if (genderText) genderText.textContent = data.gender || "—";

    const selectedPfp = data.pfp || "";
    if (selectedPfp && pfpImage) {
      pfpImage.src = selectedPfp;
    }
    
    // Add any other data mapping here...
  } catch (error) {
    console.error("Error loading public profile:", error);
  }
}

// ===== FINAL MULTI MASTER AVATAR BUILDER =====
const shareActions = document.querySelector(".profile-share-actions");

// hide initially
if (shareActions) shareActions.style.display = "none";

function calculateProfileStrength(data) {
  let score = 0;

  if (data.username) score += 25;
  if (data.dob) score += 25;
  if (data.gender) score += 25;
  if (data.pfp) score += 25;

  return score;
}

function getHtmlToImage() {
  if (window.htmlToImage) return window.htmlToImage;
  if (typeof htmlToImage !== "undefined") return htmlToImage;
  throw new Error("html-to-image library not loaded");
}

async function generateProfileImage() {
  const card = document.querySelector(".profile-card");
  if (!card) throw new Error("Profile card not found");

  const htmlToImage = getHtmlToImage();

  // ✅ wait for fonts
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await new Promise(r => requestAnimationFrame(r));

  /* ===============================
     🔥 TRUE HIGH-RES SETTINGS
  =============================== */

  const rect = card.getBoundingClientRect();

  // 🎯 target 4K width (safe scaling)
  const TARGET_WIDTH = 720; // crisp mobile share
  const scale = Math.min(4, TARGET_WIDTH / rect.width);

  const dataUrl = await htmlToImage.toPng(card, {
    cacheBust: true,

    // 🚀 MAIN QUALITY BOOST
    pixelRatio: scale * (window.devicePixelRatio || 1),

    backgroundColor: null,

    // ✅ font clarity
    skipFonts: false,
    fontEmbedCSS: true,
    preferredFontFormat: "woff2",

    // ✅ prevent blur
    canvasWidth: rect.width * scale,
    canvasHeight: rect.height * scale,

    style: {
      transform: "scale(1)",
      transformOrigin: "top left"
    }
  });

  return dataUrl;
}

const downloadBtn = document.getElementById("downloadProfileBtn");

downloadBtn?.addEventListener("click", async () => {
  try {
    downloadBtn.textContent = "Downloading...";
    downloadBtn.disabled = true;

    const dataUrl = await generateProfileImage();

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "PathCA_Profile.png";
    a.click();

    downloadBtn.textContent = "Started";

    setTimeout(() => {
      downloadBtn.textContent = " Download";
      downloadBtn.disabled = false;
    }, 2000);

  } catch (err) {
    console.error(err);
    downloadBtn.textContent = "Failed";
    downloadBtn.disabled = false;
  }
});

const shareBtn = document.getElementById("shareProfileBtn");

shareBtn?.addEventListener("click", async () => {
  try {
    shareBtn.textContent = "Preparing...";
    shareBtn.disabled = true;

    const dataUrl = await generateProfileImage();

    // convert to blob
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "PathCA_Profile.png", {
      type: "image/png"
    });

    // ✅ If mobile supports direct share
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "My PathCA Profile"
      });

    } else {
      // fallback → WhatsApp web
      const text = encodeURIComponent(
        "Check my PathCA profile 🚀"
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }

    shareBtn.textContent = "Shared";

    setTimeout(() => {
      shareBtn.textContent = "Share";
      shareBtn.disabled = false;
    }, 2000);

  } catch (err) {
    console.error(err);
    shareBtn.textContent = "Failed";
    shareBtn.disabled = false;
  }
});
window.addEventListener("DOMContentLoaded", loadPublicProfile);