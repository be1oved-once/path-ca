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
let autoNextTimeout = null;
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
   CACHE HELPERS
============================================================ */
const CACHE_VERSION = "v1";

function bmCacheKey(uid) {
  return `bm_cache_${uid}_${CACHE_VERSION}`;
}

function getCachedBookmarks(uid) {
  try {
    const raw = localStorage.getItem(bmCacheKey(uid));
    if (!raw) return null;
    return JSON.parse(raw); // { hash, bookmarks[], savedAt }
  } catch { return null; }
}

function setCachedBookmarks(uid, bookmarks) {
  const hash = bookmarks.map(b => b.id).sort().join(",");
  localStorage.setItem(bmCacheKey(uid), JSON.stringify({
    hash,
    bookmarks,
    savedAt: Date.now()
  }));
}

function hashBookmarks(bookmarks) {
  return bookmarks.map(b => b.id).sort().join(",");
}
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
  const cached = getCachedBookmarks(currentUser.uid);
  
  if (cached && cached.bookmarks.length > 0) {
    // ✅ Instant render from cache — zero Firebase reads
    allBookmarks = cached.bookmarks;
    updateHeroStats();
    buildFilterChips();
    applyFilter("all");
    bmLoader.classList.add("hidden");
    
    // 🔄 Background sync — only updates if something changed
    syncBookmarksInBackground(cached.hash);
  } else {
    // 🔄 First load — show skeleton, then fetch
    showSkeletonLoader();
    await fetchAndRenderFromFirestore();
  }
}

async function syncBookmarksInBackground(cachedHash) {
  try {
    const snap = await getDocs(
      collection(db, "users", currentUser.uid, "bookmarks")
    );
    
    const fresh = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.question && data.options && typeof data.correctIndex === "number") {
        fresh.push({ id: d.id, ...data });
      }
    });
    
    const freshHash = hashBookmarks(fresh);
    
    if (freshHash === cachedHash) return; // ✅ No change — skip re-render, save reads
    
    // Something changed — update cache and re-render silently
    setCachedBookmarks(currentUser.uid, fresh);
    allBookmarks = fresh;
    updateHeroStats();
    buildFilterChips();
    applyFilter(activeFilter); // preserve current filter
    
  } catch (err) {
    console.warn("⚠️ Background sync failed (using cache)", err);
  }
}

async function fetchAndRenderFromFirestore() {
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
    
    hideSkeletonLoader();
    
    if (allBookmarks.length === 0) {
      bmEmpty.classList.remove("hidden");
      updateHeroStats();
      return;
    }
    
    // ✅ Persist to cache for next visit
    setCachedBookmarks(currentUser.uid, allBookmarks);
    
    updateHeroStats();
    buildFilterChips();
    applyFilter("all");
    
  } catch (err) {
    console.error("❌ Bookmark load failed", err);
    hideSkeletonLoader();
    bmEmpty.classList.remove("hidden");
  }
}
function showSkeletonLoader() {
  bmLoader.classList.add("hidden"); // hide spinner if any
  bmEmpty.classList.add("hidden");
  bmList.innerHTML = `
    <div class="bm-skeleton-wrap">
      ${Array(5).fill(0).map(() => `
        <div class="bm-skeleton-card">
          <div class="bm-sk-row">
            <div class="bm-sk-circle"></div>
            <div class="bm-sk-lines">
              <div class="bm-sk-line wide"></div>
              <div class="bm-sk-line short"></div>
            </div>
          </div>
          <div class="bm-sk-line full"></div>
          <div class="bm-sk-line mid"></div>
        </div>
      `).join("")}
    </div>
  `;
}

function hideSkeletonLoader() {
  const skWrap = bmList.querySelector(".bm-skeleton-wrap");
  if (skWrap) skWrap.remove();
  bmLoader.classList.add("hidden");
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
  cardEl.style.transition = "opacity 0.25s, transform 0.25s";
  cardEl.style.opacity = "0";
  cardEl.style.transform = "translateX(20px)";
  setTimeout(() => cardEl.remove(), 260);
  
  allBookmarks = allBookmarks.filter(b => b.id !== bm.id);
  filtered = filtered.filter(b => b.id !== bm.id);
  
  // ✅ Update cache instantly so next load is still fast
  setCachedBookmarks(currentUser.uid, allBookmarks);
  
  updateHeroStats();
  buildFilterChips();
  if (allBookmarks.length === 0) bmEmpty.classList.remove("hidden");
  
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
  ovQText.textContent = `${pIndex + 1}. ${q.text}`;

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
    autoNextTimeout = setTimeout(() => {
  practiceNext();
}, 900);
  } else {
    autoNextTimeout = setTimeout(() => {
  practiceNext();
}, 2500);
  }
}

/* ============================================================
   NAV
============================================================ */
ovNext.onclick = () => {
  clearInterval(pTimer);
  clearTimeout(autoNextTimeout);
  practiceNext();
};

ovPrev.onclick = () => {
  clearTimeout(autoNextTimeout);

  if (pIndex > 0) {
    pIndex--;
    renderPracticeQuestion();
  }
};

function practiceNext() {
  clearTimeout(autoNextTimeout);
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
  pSnapshot = practiceQ.map(q => ({ ...q }));

  showScreen("result");
  ovNav.classList.add("hidden");
  ovProgress.style.width = "100%";

  const total    = practiceQ.length;
  const accuracy = total ? Math.round((pCorrect / total) * 100) : 0;

  // SVG icons instead of emojis
  const icons = {
    perfect: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <circle cx="32" cy="32" r="30" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
      <path d="M32 14 L36.5 26H50L39.5 33.5L43.5 46L32 38.5L20.5 46L24.5 33.5L14 26H27.5Z" fill="#f59e0b"/>
    </svg>`,
    great: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <circle cx="32" cy="32" r="30" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/>
      <path d="M20 33 L28 41 L44 23" stroke="#16a34a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    keep: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <circle cx="32" cy="32" r="30" fill="#ede9fe" stroke="#8b5cf6" stroke-width="2"/>
      <path d="M32 20 V34 M32 42 V44" stroke="#7c3aed" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    revise: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
      <circle cx="32" cy="32" r="30" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
      <path d="M20 20 L44 44 M44 20 L20 44" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  };

  if (accuracy === 100) {
    resultTrophy.innerHTML  = icons.perfect;
    resultTitle.textContent = "Perfect Score!";
    resultMsg.textContent   = `You nailed all ${total} questions. Your preparation is elite.`;
  } else if (accuracy >= 70) {
    resultTrophy.innerHTML  = icons.great;
    resultTitle.textContent = "Great Job!";
    resultMsg.textContent   = `${accuracy}% accuracy — you're on the right track. Review the ones you missed.`;
  } else if (accuracy >= 40) {
    resultTrophy.innerHTML  = icons.keep;
    resultTitle.textContent = "Keep Going!";
    resultMsg.textContent   = `${accuracy}% accuracy. Revise the wrong ones and try again.`;
  } else {
    resultTrophy.innerHTML  = icons.revise;
    resultTitle.textContent = "Needs More Revision";
    resultMsg.textContent   = `${accuracy}% accuracy. Retry the wrong ones and they'll stick.`;
  }

  resCorrect.textContent = pCorrect;
  resWrong.textContent   = pWrong;
  resMarks.textContent   = pMarks.toFixed(2);

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

/* ============================================================
   PDF EXPORT
============================================================ */
document.getElementById("exportPdfBtn").onclick = () => exportReviewPDF(pSnapshot);

function exportReviewPDF(snapshot) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;
  const LETTERS = ["A", "B", "C", "D", "E"];
  
  function checkPage(needed = 20) {
    if (y + needed > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
  }
  
  // Header
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, pageW, 54, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("PathCA — Bookmarks Practice Review", margin, 34);
  
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(date, pageW - margin, 34, { align: "right" });
  
  y = 80;
  
  // Score summary bar
  const correct = snapshot.filter(q => q.correct).length;
  const wrong = snapshot.length - correct;
  const marks = (correct - wrong * 0.25).toFixed(2);
  
  pdf.setFillColor(245, 244, 241);
  pdf.roundedRect(margin, y, maxW, 44, 8, 8, "F");
  
  pdf.setTextColor(79, 70, 229);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(`Correct: ${correct}`, margin + 16, y + 17);
  pdf.text(`Wrong: ${wrong}`, margin + 110, y + 17);
  pdf.text(`Marks: ${marks}`, margin + 190, y + 17);
  pdf.text(`Total: ${snapshot.length}`, margin + 270, y + 17);
  const acc = Math.round((correct / snapshot.length) * 100);
  pdf.text(`Accuracy: ${acc}%`, margin + 350, y + 17);
  
  // Progress bar
  pdf.setFillColor(226, 232, 240);
  pdf.roundedRect(margin + 16, y + 26, maxW - 32, 7, 3, 3, "F");
  pdf.setFillColor(79, 70, 229);
  pdf.roundedRect(margin + 16, y + 26, (maxW - 32) * acc / 100, 7, 3, 3, "F");
  
  y += 60;
  
  // Questions
  snapshot.forEach((q, i) => {
    checkPage(60);
    
    // Question number + status pill
    const isCorrect = q.correct;
    const pillColor = isCorrect ? [220, 252, 231] : [254, 226, 226];
    const pillText = isCorrect ? "Correct" : "Incorrect";
    const pillTC = isCorrect ? [22, 101, 52] : [185, 28, 28];
    
    // Q number label
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 120);
    pdf.text(`Q${i + 1}`, margin, y + 10);
    
    // Status pill
    const pillX = margin + 22;
    pdf.setFillColor(...pillColor);
    pdf.roundedRect(pillX, y, 52, 14, 4, 4, "F");
    pdf.setTextColor(...pillTC);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text(pillText, pillX + 26, y + 9.5, { align: "center" });
    
    y += 20;
    checkPage(40);
    
    // Question text
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(20, 20, 30);
    const qLines = pdf.splitTextToSize(`${i + 1}. ${q.text}`, maxW);
    checkPage(qLines.length * 16 + 10);
    pdf.text(qLines, margin, y);
    y += qLines.length * 16 + 8;
    
    // Options
    q.options.forEach((opt, oi) => {
      checkPage(26);
      
      const isOCorrect = oi === q.correctIndex;
      const isOSelected = oi === q.selectedIdx;
      const isOWrong = isOSelected && !isOCorrect;
      
      // Row background
      if (isOCorrect) pdf.setFillColor(220, 252, 231);
      else if (isOWrong) pdf.setFillColor(254, 226, 226);
      else pdf.setFillColor(250, 249, 247);
      
      const optLines = pdf.splitTextToSize(`${LETTERS[oi]}. ${opt}`, maxW - 30);
      const rowH = Math.max(22, optLines.length * 14 + 10);
      checkPage(rowH + 4);
      pdf.roundedRect(margin, y, maxW, rowH, 5, 5, "F");
      
      // Option text
      if (isOCorrect) pdf.setTextColor(22, 101, 52);
      else if (isOWrong) pdf.setTextColor(185, 28, 28);
      else pdf.setTextColor(60, 60, 70);
      
      pdf.setFont("helvetica", isOCorrect ? "bold" : "normal");
      pdf.setFontSize(10.5);
      pdf.text(optLines, margin + 10, y + 14);
      
      // Correct/Wrong label at right
      if (isOCorrect) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(22, 101, 52);
        pdf.text("Correct", pageW - margin - 6, y + 14, { align: "right" });
      }
      if (isOWrong) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(185, 28, 28);
        pdf.text("Your choice", pageW - margin - 6, y + 14, { align: "right" });
      }
      
      y += rowH + 5;
    });
    
    // Divider
    pdf.setDrawColor(230, 227, 220);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 4, pageW - margin, y + 4);
    y += 16;
  });
  
  // Footer on each page
  const pageCount = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 170);
    pdf.text(`PathCA Practice Review  •  Page ${p} of ${pageCount}`, pageW / 2, pageH - 20, { align: "center" });
  }
  
  pdf.save(`PathCA_Review_${date.replace(/ /g, "_")}.pdf`);
}

function buildReviewScreen(snapshot) {
  reviewScreen.innerHTML = "";

  snapshot.forEach((q, i) => {
    const card = document.createElement("div");
    card.className = "bm-review-card";

    let statusText = "";
let statusClass = "";

if (q.correct) {
  statusText = "Correct";
  statusClass = "correct";
} else {
  statusText = "Incorrect";
  statusClass = "wrong";
}

card.innerHTML = `
  <div class="bm-review-qnum">
    Question ${i + 1}
    <span class="bm-review-status ${statusClass}">
      ${statusText}
    </span>
  </div>

  <div class="bm-review-qtext">
    ${escHtml(q.text)}
  </div>

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
  <span>
    ${LETTERS[oi]}. ${escHtml(opt)}
    ${isCorrect ? '<span style="font-size:12px;font-weight:600;"> (Correct)</span>' : ""}
    ${isWrong ? '<span style="font-size:12px;font-weight:600;"> (Your Choice)</span>' : ""}
  </span>
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
