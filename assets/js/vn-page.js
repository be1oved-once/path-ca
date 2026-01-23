/* =========================
   VN SONG DATA
========================= */

const VN_SONGS = [
  {
    title: "Unknown",
    caption: "Unknown",
    singer: "Unknown",
    instaText: "Get Her Instagram",
    audio: "assets/audio/chapter3.mp3"
  },
  {
    title: "Raabta",
    caption: "Raabta...",
    singer: "Aman",
    instaText: "Get His Instagram",
    audio: "assets/audio/chapter1.mp3"
  },
  {
    title: "Tum Hi Ho",
    caption: "Tum Hi Ho...",
    singer: "Neha",
    instaText: "Get Her Instagram",
    audio: "assets/audio/song2.mp3"
  }
];
const vnList = document.getElementById("vnList");

VN_SONGS.forEach(song => {
  const card = document.createElement("div");
  card.className = "vn-card";
  card.dataset.audio = song.audio;

  card.innerHTML = `
    <div class="vn-collapsed">
      <div class="vn-left">
<div class="vn-wave">
  <span></span><span></span><span></span>
</div>
      </div>
      <div class="vn-info">
        <h4>${song.title}</h4>
        <span class="vn-sub">Tap to listen</span>
      </div>
      <div class="vn-arrow">
        <i class="fa-solid fa-chevron-down"></i>
      </div>
    </div>

    <div class="vn-expanded">
      <div class="vn-player">
        <button class="vn-play-btn">
          <i class="fa-solid fa-play"></i>
        </button>

        <div class="vn-progress">
          <div class="vn-progress-bar">
            <div class="vn-progress-fill"></div>
            <div class="vn-progress-handle"></div>
          </div>
          <div class="vn-time">00:00 / 00:00</div>
        </div>
      </div>

      <div class="vn-caption">
        ${song.caption}
        <br>
        <span>– By ${song.singer}</span>
      </div>

<button class="vn-cta">
  <span>${song.instaText} </span>
  <i class="fa-brands fa-instagram"></i>
</button>
    </div>
  `;

  vnList.appendChild(card);
});


document.querySelectorAll(".vn-card").forEach(card => {

  const header = card.querySelector(".vn-collapsed");
  const playBtn = card.querySelector(".vn-play-btn");
  const playIcon = playBtn?.querySelector("i");

  const progressFill = card.querySelector(".vn-progress-fill");
  const progressHandle = card.querySelector(".vn-progress-handle");
  const timeText = card.querySelector(".vn-time");

  // ✅ If any essential element missing → skip this card
  if (!header || !playBtn || !progressFill || !progressHandle || !timeText) {
    console.warn("VN Card skipped due to missing elements", card);
    return;
  }

  // ✅ If audio path missing → skip
  const audioSrc = card.dataset.audio;
  if (!audioSrc) {
    console.warn("VN Card missing data-audio", card);
    return;
  }

  // Create audio only as metadata loader
// --- Create metadata-only audio ---
let audio = new Audio();
audio.preload = "metadata";
audio.src = audioSrc;
card.audioInstance = audio;

// Show duration when metadata loads
audio.addEventListener("loadedmetadata", () => {
  timeText.textContent = "00:00 / " + formatTime(audio.duration);

  // 🔥 Stop further buffering without calling pause()
  audio.preload = "none";
});
  /* =====================
     EXPAND / COLLAPSE
  ====================== */
  header.addEventListener("click", () => {

    // close others
    document.querySelectorAll(".vn-card.active").forEach(open => {
      if (open !== card) {
        open.classList.remove("active");
        const a = open.audioInstance;
        if (a) {
          a.pause();
          a.currentTime = 0;
        }
        open.querySelector(".vn-play-btn i").className =
          "fa-solid fa-play";
      }
    });

    card.classList.toggle("active");
  });

  /* =====================
     PLAY / PAUSE
  ====================== */
  playBtn.addEventListener("click", e => {
    e.stopPropagation();

    // stop others
    document.querySelectorAll(".vn-card").forEach(c => {
      if (c !== card) {
        const a = c.audioInstance;
        if (a) {
          a.pause();
          a.currentTime = 0;
          c.querySelector(".vn-play-btn i").className =
            "fa-solid fa-play";
        }
      }
    });

    if (audio.paused) {

  // 🔥 Reattach source only when user plays
  if (!audio.src) {
    audio.src = audioSrc;
    audio.load();
  }

  audio.play();
  playIcon.className = "fa-solid fa-pause";
}
else {
      audio.pause();
      playIcon.className = "fa-solid fa-play";
    }
  });

let rafId = null;

function updateProgressSmooth() {
  if (!audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;

  progressFill.style.width = percent + "%";
  progressHandle.style.left = percent + "%";

  timeText.textContent =
    formatTime(audio.currentTime) +
    " / " +
    formatTime(audio.duration);

  // keep animating while playing
  if (!audio.paused) {
    rafId = requestAnimationFrame(updateProgressSmooth);
  }
}

/* Start smooth animation when audio plays */
audio.addEventListener("play", () => {
  cancelAnimationFrame(rafId);
  updateProgressSmooth();
});

/* Stop animation when paused */
audio.addEventListener("pause", () => {
  cancelAnimationFrame(rafId);
});

  /* =====================
     DRAG TO SEEK
  ====================== */
  let dragging = false;

  progressHandle.addEventListener("touchstart", () => dragging = true);
  progressHandle.addEventListener("mousedown", () => dragging = true);

  document.addEventListener("touchend", () => dragging = false);
  document.addEventListener("mouseup", () => dragging = false);

  document.addEventListener("touchmove", seek);
  document.addEventListener("mousemove", seek);

  function seek(e) {
    if (!dragging || !audio.duration) return;

    const bar = progressFill.parentElement;
    const rect = bar.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    let percent = Math.max(0, Math.min(1, x / rect.width));

    progressFill.style.width = (percent * 100) + "%";
    progressHandle.style.left = (percent * 100) + "%";

    audio.currentTime = percent * audio.duration;
  }

  /* =====================
     RESET ON END
  ====================== */
  audio.addEventListener("ended", () => {
    playIcon.className = "fa-solid fa-play";
    progressFill.style.width = "0%";
    progressHandle.style.left = "0%";
  });
});

/* =====================
   FORMAT TIME
===================== */
function formatTime(sec) {
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, "0") +
         ":" +
         String(s).padStart(2, "0");
}
/* =========================
   SUBSCRIPTION POPUP LOGIC
========================= */

const subModal = document.getElementById("subModal");
const subClose = document.getElementById("subClose");

// Open popup on every Instagram button
document.addEventListener("click", e => {
  if (!e.target.closest(".vn-cta")) return;
  subModal.classList.add("show");
  document.body.style.overflow = "hidden";
});

// Close popup
subClose.addEventListener("click", () => {
  subModal.classList.remove("show");
  document.body.style.overflow = "";
});

// Close when clicking outside card
subModal.addEventListener("click", e => {
  if (e.target === subModal) {
    subModal.classList.remove("show");
    document.body.style.overflow = "";
  }
});