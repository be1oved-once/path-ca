/* ============================================================
   bookmark-logic.js  —  PathCA Bookmarks Page
   Features:
   - Loads bookmarks from Firestore
   - Renders hero stats (total, subjects, chapters)
   - Filter chips by subject
   - Card list with remove button + options preview
   - Practice overlay (quiz, result, review)
   - URL hash  #directpractice  auto-opens overlay
   - Hash kept in URL while overlay is open
   ============================================================ */

import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ── State ── */
let currentUser  = null;
let allBookmarks = [];          // flat array of bookmark objects
let filtered     = [];          // currently shown subset
let activeFilter = "all";

/* ── Practice state ── */
let practiceQ    = [];          // questions being practiced
let pIndex       = 0;
let pAnswered    = false;
let pTimer       = null;
let pTimeLeft    = 45;
let pMarks       = 0;
let pCorrect     = 0;
let pWrong       = 0;
let pRound       = 1;           // 1 = normal, 2 = retry-wrong
let pSnapshot    = [];          // copy after round 1 finishes

/* ── DOM ── */
const bmLoader       = document.getElementById("bmLoader");
const bmEmpty        = document.getElementById("bmEmpty");
const bmList         = document.getElementById("bmList");
const filterBar      = document.getElementById("filterBar");
const heroTotalCount = document.getElementById("heroTotalCount");
const heroSubCount   = document.getElementById("heroSubjectCount");
const heroCHCount    = document.getElementById("heroChapterCount");
const heroStartBtn   = document.getElementById("heroStartBtn");

const bmOverlay  = document.getElementById("bmOverlay");
const ovCloseBtn = document.getElementById("ovCloseBtn");
const ovBody     = document.getElementById("ovBody");
const ovNav      = document.getElementById("ovNav");

const quizScreen   = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const reviewScreen = document.getElementById("reviewScreen");

const ovQNum    = document.getElementById("ovQNum");
const ovBadges  = document.getElementById("ovBadges");
const ovTimer   = document.getElementById("ovTimer");
const ovQText   = document.getElementById("ovQText");
const ovOptions = document.getElementById("ovOptions");
const ovProgress= document.getElementById("ovProgress");
const ovCounter = document.getElementById("ovCounter");

const ovPrev = document.getElementById("ovPrev");
const ovNext = document.getElementById("ovNext");

const resCorrect = document.getElementById("resCorrect");
const resWrong   = document.getElementById("resWrong");
const resMarks   = document.getElementById("resMarks");
const resultTitle= document.getElementById("resultTitle");
const resultMsg  = document.getElementById("resultMsg");
const resultTrophy= document.getElementById("resultTrophy");

const reviewBtn      = document.getElementById("reviewBtn");
const retryWrongBtn  = document.getElementById("retryWrongBtn");

/* ============================================================
   AUTH
============================================================ */
auth.onAuthStateChanged(async user => {
  if (!user) {
    bmLoader.classList.add("hidden");
    bmEmpty.classList.remove("hidden");
    return;
  }
  currentUser = user;
  await loadBookmarks();

  // Auto-open overlay if #directpractice in URL
  if (location.hash === "#directpractice" && allBookmarks.length > 0) {
    openOverlay();
  }
});

/* ============================================================
   LOAD FROM FIRESTORE
============================================================ */
async function loadBookmarks() {
  bmLoader.classList.remove("hidden");
  bmEmpty.classList.add("hidden");
  bmList.innerHTML = "";

  try {
    const snap = await getDocs(
      collection(db, "users", currentUser.uid, "bookmarks")
    );

    allBookmarks = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.question && data.options && typeof data.correctIndex === "number") {
        allBookmarks.push({ id: d.id, ...data });
      }
    });

    bmLoader.classList.add("hidden");

    if (allBookmarks.length === 0) {
      bmEmpty.classList.remove("hidden");
      updateHeroStats();
      return;
    }

    updateHeroStats();
    buildFilterChips();
    applyFilter("all");

  } catch (err) {
    console.error("❌ Bookmark load failed", err);
    bmLoader.classList.add("hidden");
    bmEmpty.classList.remove("hidden");
  }
}

/* ============================================================
   HERO STATS
============================================================ */
function updateHeroStats() {
  const subjects = new Set(allBookmarks.map(b => b.subject).filter(Boolean));
  const chapters = new Set(allBookmarks.map(b => b.chapter).filter(Boolean));

  heroTotalCount.textContent = allBookmarks.length;
  heroSubCount.textContent   = subjects.size || "—";
  heroCHCount.textContent    = chapters.size || "—";
}

/* ============================================================
   FILTER CHIPS
============================================================ */
function buildFilterChips() {
  // Remove old subject chips (keep "All")
  [...filterBar.querySelectorAll("[data-filter]:not([data-filter='all'])")]
    .forEach(c => c.remove());

  const subjects = [...new Set(allBookmarks.map(b => b.subject).filter(Boolean))];

  subjects.forEach(sub => {
    const chip = document.createElement("button");
    chip.className = "bm-filter-chip";
    chip.dataset.filter = sub;
    chip.textContent = sub;
    chip.onclick = () => applyFilter(sub);
    filterBar.appendChild(chip);
  });

  filterBar.querySelector("[data-filter='all']").onclick = () => applyFilter("all");
}

function applyFilter(filter) {
  activeFilter = filter;

  // Update active chip
  filterBar.querySelectorAll(".bm-filter-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.filter === filter);
  });

  filtered = filter === "all"
    ? [...allBookmarks]
    : allBookmarks.filter(b => b.subject === filter);

  renderList(filtered);
}

/* ============================================================
   RENDER CARD LIST
============================================================ */
const LETTERS = ["A", "B", "C", "D", "E"];

function renderList(list) {
  bmList.innerHTML = "";

  if (list.length === 0) {
    bmEmpty.classList.remove("hidden");
    return;
  }
  bmEmpty.classList.add("hidden");

  list.forEach((bm, idx) => {
    const card = document.createElement("div");
    card.className = "bm-card";
    card.style.animationDelay = `${Math.min(idx, 6) * 0.05}s`;

    // Meta row
    const meta = document.createElement("div");
    meta.className = "bm-card-meta";

    const tags = document.createElement("div");
    tags.className = "bm-card-tags";
    if (bm.subject) tags.innerHTML += `<span class="bm-tag subject">${escHtml(bm.subject)}</span>`;
    if (bm.chapter) tags.innerHTML += `<span class="bm-tag chapter">${escHtml(bm.chapter)}</span>`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "bm-card-remove";
    removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    removeBtn.title = "Remove bookmark";
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeBookmark(bm, card);
    };

    meta.appendChild(tags);
    meta.appendChild(removeBtn);

    // Question
    const qEl = document.createElement("div");
    qEl.className = "bm-card-q";
    qEl.textContent = bm.question;

    // Options
    const optsEl = document.createElement("div");
    optsEl.className = "bm-card-options";
    (bm.options || []).forEach((opt, i) => {
      const row = document.createElement("div");
      row.className = "bm-option" + (i === bm.correctIndex ? " correct" : "");
      row.innerHTML = `<span class="bm-option-label">${LETTERS[i]}</span>${escHtml(opt)}`;
      optsEl.appendChild(row);
    });

    card.appendChild(meta);
    card.appendChild(qEl);
    card.appendChild(optsEl);
    bmList.appendChild(card);
  });
}

/* ============================================================
   REMOVE BOOKMARK
============================================================ */
async function removeBookmark(bm, cardEl) {
  // Instant UI
  cardEl.style.transition = "opacity 0.25s, transform 0.25s";
  cardEl.style.opacity = "0";
  cardEl.style.transform = "translateX(20px)";

  setTimeout(() => cardEl.remove(), 260);

  allBookmarks = allBookmarks.filter(b => b.id !== bm.id);
  filtered     = filtered.filter(b => b.id !== bm.id);
  updateHeroStats();
  buildFilterChips();

  if (allBookmarks.length === 0) bmEmpty.classList.remove("hidden");

  // Firebase in background
  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "bookmarks", bm.id));
  } catch (err) {
    console.error("❌ Remove bookmark failed", err);
  }
}

/* ============================================================
   HERO START BUTTON
============================================================ */
heroStartBtn.onclick = () => {
  if (allBookmarks.length === 0) return;
  openOverlay();
};

/* ============================================================
   OVERLAY OPEN / CLOSE
============================================================ */
function openOverlay() {
  // Start practice with currently-filtered list (or all if no filter)
  const qs = (activeFilter === "all" ? allBookmarks : filtered)
    .map(bm => ({
      text:         bm.question,
      options:      bm.options,
      correctIndex: bm.correctIndex,
      subject:      bm.subject || "",
      chapter:      bm.chapter || "",
      attempted:    false,
      correct:      false,
      selectedIdx:  -1
    }));

  if (qs.length === 0) return;

  startPractice(qs);
  bmOverlay.classList.add("open");
  document.body.classList.add("bm-overlay-open");

  // Set URL hash
  history.replaceState(null, "", "#directpractice");
}

function closeOverlay() {
  bmOverlay.classList.remove("open");
  document.body.classList.remove("bm-overlay-open");
  clearInterval(pTimer);

  // Remove hash
  history.replaceState(null, "", location.pathname);
}

ovCloseBtn.onclick = closeOverlay;

// Back button / hash change
window.addEventListener("hashchange", () => {
  if (location.hash !== "#directpractice" && bmOverlay.classList.contains("open")) {
    closeOverlay();
  }
});

/* ============================================================
   START PRACTICE
============================================================ */
function startPractice(questions) {
  practiceQ  = questions;
  pIndex     = 0;
  pMarks     = 0;
  pCorrect   = 0;
  pWrong     = 0;
  pRound     = 1;
  pSnapshot  = [];

  showScreen("quiz");
  renderPracticeQuestion();
}

/* ============================================================
   RENDER PRACTICE QUESTION
============================================================ */
function renderPracticeQuestion() {
  clearInterval(pTimer);
  pAnswered = false;

  const q   = practiceQ[pIndex];
  const tot = practiceQ.length;

  // Header counts
  ovQNum.textContent = `Question ${pIndex + 1} of ${tot}`;
  ovCounter.textContent = `${pIndex + 1} / ${tot}`;

  // Progress bar
  ovProgress.style.width = ((pIndex + 1) / tot * 100) + "%";

  // Subject / chapter badges
  ovBadges.innerHTML = "";
  if (q.subject) ovBadges.innerHTML += `<span class="bm-tag subject">${escHtml(q.subject)}</span>`;
  if (q.chapter) ovBadges.innerHTML += `<span class="bm-tag chapter">${escHtml(q.chapter)}</span>`;

  // Question text
  ovQText.textContent = q.text;

  // Options
  ovOptions.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "bm-ov-option";
    btn.innerHTML = `<span class="bm-ov-option-letter">${LETTERS[i]}</span><span>${escHtml(opt)}</span>`;
    btn.disabled  = q.attempted;

    if (q.attempted) {
      if (i === q.correctIndex)   btn.classList.add("correct");
      if (i === q.selectedIdx && i !== q.correctIndex) btn.classList.add("wrong");
    }

    btn.onclick = () => handlePracticeAnswer(btn, i);
    ovOptions.appendChild(btn);
  });

  // Nav
  ovPrev.disabled = pIndex === 0;
  ovNext.disabled = !q.attempted;

  // Timer (reset each question)
  startPracticeTimer();

  // Scroll to top
  ovBody.scrollTop = 0;
}

/* ============================================================
   TIMER
============================================================ */
function startPracticeTimer() {
  clearInterval(pTimer);
  pTimeLeft = 45;
  updateTimerUI();

  pTimer = setInterval(() => {
    pTimeLeft--;
    updateTimerUI();
    if (pTimeLeft <= 0) {
      clearInterval(pTimer);
      timeUpAutoNext();
    }
  }, 1000);
}

function updateTimerUI() {
  ovTimer.textContent = String(pTimeLeft).padStart(2, "0");
  ovTimer.classList.toggle("danger", pTimeLeft <= 5);
}

function timeUpAutoNext() {
  const q = practiceQ[pIndex];
  q.attempted   = true;
  q.correct     = false;
  q.selectedIdx = -1;
  pWrong++;
  pMarks -= 0.25;
  ovNext.disabled = false;
  // Show correct answer visually
  [...ovOptions.children].forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIndex) btn.classList.add("correct");
  });
  setTimeout(() => practiceNext(), 1500);
}

/* ============================================================
   ANSWER HANDLER
============================================================ */
function handlePracticeAnswer(btn, idx) {
  if (pAnswered) return;
  pAnswered = true;
  clearInterval(pTimer);

  const q = practiceQ[pIndex];
  q.attempted   = true;
  q.selectedIdx = idx;

  [...ovOptions.children].forEach(b => (b.disabled = true));

  if (idx === q.correctIndex) {
    btn.classList.add("correct");
    btn.querySelector(".bm-ov-option-letter").style.background = "var(--sage)";
    q.correct = true;
    pCorrect++;
    pMarks += 1;
  } else {
    btn.classList.add("wrong");
    ovOptions.children[q.correctIndex].classList.add("correct");
    q.correct = false;
    pWrong++;
    pMarks -= 0.25;
  }

  ovNext.disabled = false;

  // Auto-advance after correct
  if (q.correct) {
    setTimeout(() => practiceNext(), 900);
  } else {
    setTimeout(() => practiceNext(), 2500);
  }
}

/* ============================================================
   NAV
============================================================ */
ovNext.onclick = () => {
  clearInterval(pTimer);
  practiceNext();
};

ovPrev.onclick = () => {
  if (pIndex > 0) {
    pIndex--;
    renderPracticeQuestion();
  }
};

function practiceNext() {
  if (pIndex < practiceQ.length - 1) {
    pIndex++;
    renderPracticeQuestion();
  } else {
    finishPractice();
  }
}

/* ============================================================
   FINISH
============================================================ */
function finishPractice() {
  clearInterval(pTimer);

  // Snapshot for review
  pSnapshot = practiceQ.map(q => ({ ...q }));

  showScreen("result");
  ovNav.classList.add("hidden");
  ovProgress.style.width = "100%";

  const total    = practiceQ.length;
  const accuracy = total ? Math.round((pCorrect / total) * 100) : 0;

  // Trophy + title based on score
  if (accuracy === 100) {
    resultTrophy.textContent = "🏆";
    resultTitle.textContent  = "Perfect Score!";
    resultMsg.textContent    = `You nailed all ${total} questions. Your preparation is elite.`;
  } else if (accuracy >= 70) {
    resultTrophy.textContent = "🎉";
    resultTitle.textContent  = "Great Job!";
    resultMsg.textContent    = `${accuracy}% accuracy — you're on the right track. Review the ones you missed.`;
  } else if (accuracy >= 40) {
    resultTrophy.textContent = "💪";
    resultTitle.textContent  = "Keep Going!";
    resultMsg.textContent    = `${accuracy}% accuracy. Revise the wrong ones and try again — you've got this.`;
  } else {
    resultTrophy.textContent = "📚";
    resultTitle.textContent  = "Needs More Revision";
    resultMsg.textContent    = `${accuracy}% accuracy. Don't worry — retry the wrong ones and they'll stick.`;
  }

  resCorrect.textContent = pCorrect;
  resWrong.textContent   = pWrong;
  resMarks.textContent   = pMarks.toFixed(2);

  // Hide retry-wrong if no wrong answers
  const wrongOnes = pSnapshot.filter(q => !q.correct);
  retryWrongBtn.style.display = wrongOnes.length > 0 ? "" : "none";
}

/* ============================================================
   REVIEW
============================================================ */
reviewBtn.onclick = () => {
  buildReviewScreen(pSnapshot);
  showScreen("review");
  ovNav.classList.add("hidden");
};

function buildReviewScreen(snapshot) {
  reviewScreen.innerHTML = "";

  snapshot.forEach((q, i) => {
    const card = document.createElement("div");
    card.className = "bm-review-card";

    const status = q.correct ? "✅" : (q.selectedIdx === -1 ? "⏱" : "❌");

    card.innerHTML = `
      <div class="bm-review-qnum">${status} Question ${i + 1}</div>
      <div class="bm-review-qtext">${escHtml(q.text)}</div>
      <div class="bm-review-options" id="rv-opts-${i}"></div>
    `;

    reviewScreen.appendChild(card);

    const optsEl = card.querySelector(`#rv-opts-${i}`);
    q.options.forEach((opt, oi) => {
      const row = document.createElement("div");
      const isCorrect  = oi === q.correctIndex;
      const isSelected = oi === q.selectedIdx;
      const isWrong    = isSelected && !isCorrect;

      row.className = "bm-review-option" +
        (isCorrect ? " correct" : "") +
        (isWrong   ? " wrong"   : "");

      row.innerHTML = `
        <span class="bm-review-option-dot"></span>
        <span>${LETTERS[oi]}. ${escHtml(opt)}</span>
        ${isCorrect  ? '<span style="margin-left:auto;font-size:11px;color:var(--sage);">✓ Correct</span>' : ""}
        ${isWrong    ? '<span style="margin-left:auto;font-size:11px;color:var(--rust);">✗ Your pick</span>' : ""}
      `;
      optsEl.appendChild(row);
    });
  });
}

/* ============================================================
   RETRY WRONG
============================================================ */
retryWrongBtn.onclick = () => {
  const wrongOnes = pSnapshot
    .filter(q => !q.correct)
    .map(q => ({
      ...q,
      attempted:   false,
      correct:     false,
      selectedIdx: -1
    }));

  if (wrongOnes.length === 0) return;

  pRound = 2;
  showScreen("quiz");
  ovNav.classList.remove("hidden");
  startPractice(wrongOnes);
};

/* ============================================================
   SCREEN SWITCHER
============================================================ */
function showScreen(name) {
  quizScreen.style.display   = name === "quiz"   ? "" : "none";
  resultScreen.classList.toggle("show", name === "result");
  reviewScreen.classList.toggle("show", name === "review");

  if (name === "quiz") ovNav.classList.remove("hidden");
}

/* ============================================================
   UTIL
============================================================ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
