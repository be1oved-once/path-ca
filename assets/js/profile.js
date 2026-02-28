import { auth, db } from "./firebase.js";
import { cacheUsername } from "./insight-engine.js";
import { doc, getDoc, setDoc, updateDoc } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { syncPublicLeaderboard } from "./common.js";
/* Elements */
const usernameEl = document.getElementById("username");
const dobEl = document.getElementById("dob");
const genderBtn = document.getElementById("genderBtn");
const genderText = document.getElementById("genderText");
const genderPopup = document.getElementById("genderPopup");
const saveBtn = document.getElementById("saveProfile");
const editBtn = document.getElementById("editProfile");
const msg = document.getElementById("profileMsg");
const joinedDateEl = document.getElementById("joinedDate");
// ===== PROFILE PIC ELEMENTS =====
const pfpCircle = document.getElementById("pfpCircle");
const pfpImage = document.getElementById("pfpImage");
const pfpPopup = document.getElementById("pfpPopup");
// ===== MASTER GRID AVATAR BUILDER =====

// ===== FINAL MULTI MASTER AVATAR BUILDER =====
const shareActions = document.querySelector(".profile-share-actions");

// hide initially
if (shareActions) shareActions.style.display = "none";

const masterImages = [
  "/assets/images/avatar-master.png",
  "/assets/images/avatar-master2.png",
  "/assets/images/avatar-master3.png",
  "/assets/images/avatar-master4.png",
  "/assets/images/avatar-master5.png"
];

const rows = 4;
const cols = 4;
const OUT = 200;

let selectedPfp = "";
let selectedGender = "";
let editMode = false;
/* ===== PREMIUM TEST FLAG ===== */
/* ===== PREMIUM TEST FLAG (PERSISTENT) ===== */

// load from localStorage so reload doesn't reset
window.forcePremiumPreview =
  localStorage.getItem("forcePremiumPreview") === "true";
function isPremiumActive(){
  return (
    window.forcePremiumPreview === true ||
    window.isPremiumUser === true
  );
}

/* ===== LIVE PREMIUM APPLIER ===== */
window.applyPremiumUI = function(){
  const card = document.querySelector(".profile-card");
  const strip = document.querySelector(".pfp-strip");

  if (!card || !strip) return;

  if (isPremiumActive()){
    card.classList.add("premium-card");
    strip.classList.add("premium-strip");
  } else {
    card.classList.remove("premium-card");
    strip.classList.remove("premium-strip");
  }
};
/* ===== PREMIUM LIVE SYNC ===== */
window.addEventListener("premiumStatusReady", () => {
  window.applyPremiumUI?.();
});

function buildAvatars() {
  pfpPopup.innerHTML = "";

  // ---- Upload Slot First ----
  const uploadSlot = document.createElement("div");
  uploadSlot.className = "pfp-upload-slot";
  uploadSlot.innerHTML = `
    <span>+</span>
    <input type="file" id="pfpFileInput" accept="image/*" hidden>
  `;
  pfpPopup.appendChild(uploadSlot);

  const fileInput = uploadSlot.querySelector("#pfpFileInput");

  uploadSlot.onclick = () => {
    if (!editMode) return;
    fileInput.click();
  };

  fileInput.onchange = e => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size)/2;
        const sy = (img.height - size)/2;

        const canvas = document.createElement("canvas");
        canvas.width = OUT;
        canvas.height = OUT;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, size, size, 0, 0, OUT, OUT);

        const dataURL = canvas.toDataURL("image/png");
        selectedPfp = dataURL;
        pfpImage.src = dataURL;
pfpPopup.classList.remove("show");

// ✅ Update strip color
setTimeout(() => window.updateStripColor(), 50);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ---- Load Master Images ----
  masterImages.forEach(src => {
    const img = new Image();
    img.onload = () => {

      const cellW = img.width / cols;
      const cellH = img.height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

          const size = Math.min(cellW, cellH) * 0.86;
          const sx = c * cellW + (cellW - size)/2;
          const sy = r * cellH + (cellH - size)/2;

          const canvas = document.createElement("canvas");
          canvas.width = OUT;
          canvas.height = OUT;
          const ctx = canvas.getContext("2d");

          ctx.drawImage(img, sx, sy, size, size, 0, 0, OUT, OUT);

          const dataURL = canvas.toDataURL("image/png");

          const avatar = document.createElement("img");
          avatar.src = dataURL;

          avatar.onclick = () => {
  selectedPfp = dataURL;
  pfpImage.src = dataURL;
  pfpPopup.classList.remove("show");

  // ✅ Update strip color after image change
  setTimeout(() => window.updateStripColor(), 50);
};

          pfpPopup.appendChild(avatar);
        }
      }
    };
    img.src = src;
  });
}

// Build once
buildAvatars();
// Open popup only in edit mode
pfpCircle.onclick = () => {
  if (!editMode) return;
  pfpPopup.classList.toggle("show");
};

// Close if clicking outside
document.addEventListener("click", e => {
  if (!pfpCircle.contains(e.target) && !pfpPopup.contains(e.target)) {
    pfpPopup.classList.remove("show");
  }
});

/* DOB restriction */
const today = new Date();
const minYear = today.getFullYear() - 17;
dobEl.max = `${minYear}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

/* Gender popup */
genderBtn.onclick = () => {
  if (!editMode) return;
  genderPopup.classList.toggle("show");
};

genderPopup.querySelectorAll("button").forEach(btn => {
  btn.onclick = () => {
    selectedGender = btn.dataset.val;
    genderText.textContent = selectedGender;
    genderPopup.classList.remove("show");
  };
});

/* Outside click */
document.addEventListener("click", e => {
  if (!genderBtn.contains(e.target) && !genderPopup.contains(e.target)) {
    genderPopup.classList.remove("show");
  }
});
/* =========================
   DOB SHEET SYSTEM
========================= */

const dobBtn = document.getElementById("dobBtn");
const dobSheet = document.getElementById("dobSheet");
const dobClose = document.getElementById("dobClose");
const dobDone = document.getElementById("dobDone");

const dayWheel = document.getElementById("dayWheel");
const monthWheel = document.getElementById("monthWheel");
const yearWheel = document.getElementById("yearWheel");

let selDay = 1;
let selMonth = 1;
let selYear = 2000;

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

function buildInfiniteWheel(container, baseValues, onSelect) {
  container.innerHTML = "";

  // 🔥 repeat values for infinite illusion
  const LOOP = 20;
  const values = [];

  for (let i = 0; i < LOOP; i++) {
    values.push(...baseValues);
  }

  values.forEach(val => {
    const div = document.createElement("div");
    div.className = "wheel-item";
    div.textContent = val;
    container.appendChild(div);
  });

  const ITEM_HEIGHT = 44;

  // 🔥 start from middle (important for infinite feel)
  requestAnimationFrame(() => {
    const midIndex = Math.floor(values.length / 2);
    container.scrollTop = midIndex * ITEM_HEIGHT;
  });

  // 🔥 scroll detection
  container.addEventListener("scroll", () => {
    const center = container.scrollTop + container.clientHeight / 2;
    const items = container.querySelectorAll(".wheel-item");

    let closest = null;
    let closestDist = Infinity;

    items.forEach(item => {
      const itemCenter = item.offsetTop + item.offsetHeight / 2;
      const dist = Math.abs(center - itemCenter);

      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    });

    items.forEach(i => i.classList.remove("active"));

    if (closest) {
      closest.classList.add("active");
      onSelect(closest.textContent);
    }

    // 🔥 infinite loop correction
    const maxScroll = container.scrollHeight;
    const threshold = ITEM_HEIGHT * baseValues.length;

    if (container.scrollTop < threshold) {
      container.scrollTop += threshold * 10;
    } else if (container.scrollTop > maxScroll - threshold) {
      container.scrollTop -= threshold * 10;
    }
  });
}
function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function initDobWheels() {
  const MONTHS = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const YEARS = [];
  const now = new Date();
  const maxYear = now.getFullYear() - 17;

  for (let y = maxYear; y >= 1970; y--) {
    YEARS.push(y);
  }

  let selDay = 1;
  let selMonth = 1;
  let selYear = maxYear;

  function rebuildDays() {
    const maxDays = getDaysInMonth(selMonth, selYear);
    const days = Array.from({ length: maxDays }, (_, i) => i + 1);

    buildInfiniteWheel(dayWheel, days, v => {
      selDay = Number(v);
    });
  }

  // 🔥 build month wheel
  buildInfiniteWheel(monthWheel, MONTHS, v => {
    selMonth = MONTHS.indexOf(v) + 1;
    rebuildDays(); // ⭐ dynamic update
  });

  // 🔥 build year wheel
  buildInfiniteWheel(yearWheel, YEARS, v => {
    selYear = Number(v);
    rebuildDays(); // ⭐ dynamic update
  });

  // initial days
  rebuildDays();

  // DONE button
  dobDone.onclick = () => {
    const mm = String(selMonth).padStart(2, "0");
    const dd = String(selDay).padStart(2, "0");

    dobEl.value = `${selYear}-${mm}-${dd}`;
    dobBtn.textContent = `${dd}-${mm}-${selYear}`;
    dobSheet.classList.remove("show");
  };
}

/* ===== OPEN ===== */
dobBtn?.addEventListener("click", () => {
  if (!editMode) return;

  dobSheet.classList.add("show");

  if (!dayWheel.hasChildNodes()) {
    initDobWheels();
  }
});

/* ===== CLOSE ===== */
dobClose?.addEventListener("click", () => {
  dobSheet.classList.remove("show");
});

/* ===== DONE ===== */
dobDone?.addEventListener("click", () => {
  const mm = String(selMonth).padStart(2, "0");
  const dd = String(selDay).padStart(2, "0");

  // 🔥 store ISO format
  dobEl.value = `${selYear}-${mm}-${dd}`;

  // 🔥 update button text
  dobBtn.textContent = `${dd}-${mm}-${selYear}`;

  dobSheet.classList.remove("show");
});
/* Load profile */
function getProfileKey(uid) {
  return `profile_${uid}`;
}

function loadProfileFromLocal(uid) {
  const raw = localStorage.getItem(getProfileKey(uid));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveProfileToLocal(uid, data) {
  localStorage.setItem(
    getProfileKey(uid),
    JSON.stringify({
      ...data,
      updatedAt: Date.now()
    })
  );
}
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.replace("/index.html#login");
    return;
  }

  // If email not verified → always go verify page
  if (!user.emailVerified) {
    window.location.replace("/signup-verified.html");
    return;
  }

  // ✅ Only verified users reach here
  
  if (!user) {
    // Clear UI
    usernameEl.value = "";
    dobEl.value = "";
    genderText.textContent = "Select Gender";
    selectedGender = "";
    return;
  }

  const uid = user.uid;

  /* 1️⃣ FAST LOAD FROM LOCALSTORAGE */
  const cached = loadProfileFromLocal(uid);
  if (cached && cached.pfp) {
  selectedPfp = cached.pfp;
  pfpImage.src = cached.pfp;
}
  if (cached) {
    usernameEl.value = cached.username || "";
    dobEl.value = cached.dob || "";
    if(cached.dob){
  const [yy, mm, dd] = cached.dob.split("-");
  document.getElementById("dobBtn").textContent = `${dd}-${mm}-${yy}`;
}
    selectedGender = cached.gender || "";
    if (selectedGender) genderText.textContent = selectedGender;
  }

  /* 2️⃣ BACKGROUND SYNC FROM FIRESTORE */
  const ref = doc(db, "users", uid);
const snap = await getDoc(ref);

if (!snap.exists()) {
  // No profile doc yet → just show empty form
  document.getElementById("profileSkeleton").style.display = "none";
  document.getElementById("profileContent").style.display = "block";
  return;
}
const profileStrengthFill = document.getElementById("profileStrengthFill");
const profileStrengthText = document.getElementById("profileStrengthText");
const studyStreakValue = document.getElementById("studyStreakValue");
const data = snap.data();
/* ===== LOAD STUDY STREAK ===== */
try {
  const lbRef = doc(db, "users", uid);
  const lbSnap = await getDoc(lbRef);

  if (lbSnap.exists()) {
    const lbData = lbSnap.data();

    if (studyStreakValue) {
      studyStreakValue.textContent = lbData.streak ?? 0;
    }
  } else {
    if (studyStreakValue) studyStreakValue.textContent = 0;
  }
} catch (e) {
  console.warn("Streak load failed", e);
  if (studyStreakValue) studyStreakValue.textContent = 0;
}
/* ===== PROFILE STRENGTH ===== */
const strength = calculateProfileStrength(data);

if (profileStrengthFill) {
  profileStrengthFill.style.width = strength + "%";
}

if (profileStrengthText) {
  profileStrengthText.textContent = `${strength}% complete`;
}
/* ===== JOINED DATE ===== */
if (data.createdAt?.toDate && joinedDateEl) {
  const d = data.createdAt.toDate();

  const formatted =
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  joinedDateEl.textContent = `Joined: ${formatted}`;
} else if (joinedDateEl) {
  joinedDateEl.textContent = "Joined: —";
}
// ===== LOAD PROFILE PICTURE =====
// ===== LOAD PROFILE PICTURE =====
selectedPfp = data.pfp || "";

if (selectedPfp) {
  pfpImage.src = selectedPfp;
  if (window.updateStripColor) window.updateStripColor();
} else {
  // 🔥 Assign random avatar ONCE
  const randomPfp = await getRandomGridAvatar();
  selectedPfp = randomPfp;
  pfpImage.src = randomPfp;

  // Save silently (no UI interrupt)
  await updateDoc(doc(db, "users", uid), {
    pfp: randomPfp
  });

  await setDoc(
    doc(db, "publicLeaderboard", uid),
    { pfp: randomPfp },
    { merge: true }
  );

  saveProfileToLocal(uid, { pfp: randomPfp });
}

  // Update UI (in case Firestore is newer)
  usernameEl.value = data.username || "";
  cacheUsername(usernameEl.value);
  dobEl.value = data.dob || "";
  if(data.dob){
  // data.dob format = "YYYY-MM-DD"
  const [yy, mm, dd] = data.dob.split("-");
  document.getElementById("dobBtn").textContent = `${dd}-${mm}-${yy}`;
}
  selectedGender = data.gender || "";
  if (selectedGender) genderText.textContent = selectedGender;

  // Sync localStorage
  saveProfileToLocal(uid, {
    username: data.username || "",
    dob: data.dob || "",
    gender: data.gender || ""
  });
  
  // ===== Hide skeleton, show real content =====
  

document.getElementById("profileSkeleton").style.display = "none";
document.getElementById("profileContent").style.display = "block";
// show share/download after profile ready
if (shareActions) shareActions.style.display = "flex";
setTimeout(() => window.applyPremiumUI?.(), 0);
await syncPublicLeaderboard(uid);
});


/* Edit mode */
function setEditMode(state) {
  editMode = state;
  window.profileEditMode = state;
  usernameEl.readOnly = !state;
  dobEl.readOnly = !state;
genderBtn.classList.toggle("readonly", !state);
  saveBtn.style.display = state ? "block" : "none";
  editBtn.style.display = state ? "none" : "inline-flex";
}

setEditMode(false);

editBtn.onclick = () => setEditMode(true);

/* Save */
saveBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  if (!usernameEl.value || !dobEl.value || !selectedGender) {
    msg.textContent = "Please fill all fields";
    msg.style.color = "#ef4444";
    return;
  }

  const payload = {
  username: usernameEl.value.trim(),
  dob: dobEl.value,
  gender: selectedGender,
  pfp: selectedPfp || null,
  profileCompleted: true
};

// Update main user profile
await updateDoc(doc(db, "users", user.uid), payload);
cacheUsername(payload.username);

// 🔥 ALSO update public leaderboard profile data
await setDoc(
  doc(db, "publicLeaderboard", user.uid),
  {
    name: payload.username,
    dob: payload.dob,
    gender: payload.gender,
    pfp: payload.pfp || ""
  },
  { merge: true }
);

/* 🔥 Sync localStorage instantly */
saveProfileToLocal(user.uid, payload);

  msg.textContent = "Profile saved successfully";
  msg.style.color = "#22c55e";
  setEditMode(false);
  setTimeout(() => {
  window.location.replace("/index.html");
}, 500);
};
function calculateProfileStrength(data) {
  let score = 0;

  if (data.username) score += 25;
  if (data.dob) score += 25;
  if (data.gender) score += 25;
  if (data.pfp) score += 25;

  return score;
}

function getRandomGridAvatar() {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const cellW = img.width / cols;
      const cellH = img.height / rows;

      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      const size = Math.min(cellW, cellH) * 0.86;
      const sx = c * cellW + (cellW - size) / 2;
      const sy = r * cellH + (cellH - size) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, sx, sy, size, size, 0, 0, OUT, OUT);

      resolve(canvas.toDataURL("image/png"));
    };
    img.src = masterImages[Math.floor(Math.random() * masterImages.length)];
  });
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