/* =========================
   FIREBASE + XP
========================= */
import { auth, db } from "./firebase.js";
import {
  doc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { syncPublicLeaderboard } from "./common.js";
import { initDailyRobot, incrementDailyProgress } from "./daily-robot.js";

let currentUser = null;
let currentXP   = 0;
const xpEl      = document.getElementById("xpValue");

auth.onAuthStateChanged(user => {
  if (!user) {
    currentUser = null;
    currentXP   = 0;
    if (xpEl) xpEl.textContent = "00";
    return;
  }

  currentUser = user;
  validateStreakOnLogin(user).catch(console.error);
  initDailyRobot(user.uid);

  // 🔥 REAL-TIME XP SYNC
  onSnapshot(doc(db, "users", user.uid), snap => {
    if (!snap.exists()) return;
    const data = snap.data();
    currentXP  = data.xp || 0;
    if (xpEl) xpEl.textContent = String(currentXP).padStart(2, "0");
  });

  loadBookmarksOnce(user.uid);
  checkPausedSession(user.uid);
});

/* =========================
   DATA IMPORTS
========================= */
import { subjects }    from "./questions.js";
import { lawChapters } from "./questions-law.js";

/* =========================
   BUSINESS LAWS VIRTUAL SUBJECT
========================= */
const LAW_SUBJECT_NAME = "Business Laws";

/* =========================
   STATE
========================= */
let currentMode    = "mcq";
let currentSubject = null;
let currentChapter = null;

let baseQuestions  = [];
let wrongQuestions = [];
let bookmarkMap    = {};
let qIndex         = 0;
let round          = 1;
let marks          = 0;
let round1Completed = false;
let timer           = null;
let autoNextTimeout = null;
let timeLeft        = 45;
let answered        = false;

// Law-specific totals
let lawTotalMarks = 0;
let lawTotalXp    = 0;

let activeQuestions  = [];
let round1Snapshot   = [];
let quizActive       = false;
let penaltyRunning   = false;
let quizStartTime    = null;  // for scorecard

window.round1Snapshot = round1Snapshot;

/* =========================
   DOM REFS
========================= */
const subjectBtn   = document.getElementById("subjectBtn");
const chapterBtn   = document.getElementById("chapterBtn");
const subjectText  = document.getElementById("subjectText");
const chapterText  = document.getElementById("chapterText");
const subjectPopup = document.getElementById("subjectPopup");
const chapterPopup = document.getElementById("chapterPopup");

const startBtn = document.getElementById("startQuiz");
const resetBtn = document.getElementById("resetQuiz");

const quizArea   = document.getElementById("quizArea");
const qText      = document.getElementById("questionText");
const optionsBox = document.getElementById("optionsBox");
const timeEl     = document.getElementById("timeLeft");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const limitInput  = document.getElementById("questionLimit");
const limitWrap   = document.getElementById("questionLimitWrap");
const progressBar = document.getElementById("progressBar");
const roundLabel  = document.getElementById("roundLabel");
const marksBox    = document.getElementById("marksBox");
const marksValue  = document.getElementById("marksValue");

const lawAnswerEl       = document.getElementById("lawAnswer");
const lawKeywordsNeeded = document.getElementById("lawKeywordsNeeded");
const pageTitle         = document.getElementById("pageTitle");

/* =========================
   INITIAL SETUP
========================= */
limitInput.disabled = true;
resetBtn.disabled   = true;
prevBtn.disabled    = true;
nextBtn.disabled    = true;

const resultActions = document.querySelector(".result-actions");
if (resultActions) resultActions.classList.add("hidden");

/* =========================
   MODE SWITCH HELPER
========================= */
function setMode(mode) {
  currentMode = mode;
  quizArea.classList.remove("quiz-mode-mcq", "quiz-mode-law");
  quizArea.classList.add(mode === "law" ? "quiz-mode-law" : "quiz-mode-mcq");

  if (mode === "law") {
    pageTitle.innerHTML = "Law<span>'</span>Wise";
  } else {
    pageTitle.innerHTML = "Chapter<span>'</span>Wise";
  }

  if (limitWrap) limitWrap.style.display = mode === "law" ? "none" : "";
}

/* =========================
   STATE RESETS
========================= */
function resetMarksState() {
  marks           = 0;
  round1Completed = false;
  if (marksValue) marksValue.textContent = "0";
  if (marksBox)   marksBox.classList.add("hidden");
}

function closeAllPopups() {
  subjectPopup.classList.remove("show");
  chapterPopup.classList.remove("show");
}

function resetReviewState() {
  round1Snapshot        = [];
  window.round1Snapshot = [];
  const reviewContent   = document.getElementById("reviewContent");
  const reviewPanel     = document.getElementById("reviewPanel");
  if (reviewContent) reviewContent.innerHTML = "";
  if (reviewPanel)   reviewPanel.classList.add("hidden");
}

/* =========================
   SUBJECT POPUP
========================= */
subjectBtn.onclick = () => {
  resetMarksState();
  if (resultActions) resultActions.classList.add("hidden");
  closeAllPopups();

  subjectPopup.innerHTML = "";
  subjectPopup.classList.add("show");

  subjects.forEach(sub => {
    const b = document.createElement("button");
    b.textContent = sub.name;
    b.onclick = () => {
      currentSubject = sub;
      currentMode    = "mcq";
      setMode("mcq");

      subjectText.textContent = sub.name;
      currentChapter          = null;
      chapterText.textContent = "None Selected";
      chapterBtn.classList.remove("disabled");

      round1Snapshot        = [];
      window.round1Snapshot = [];
      round1Completed       = false;

      if (resultActions) resultActions.classList.add("hidden");
      closeAllPopups();
      resetMarksState();
      quizArea.classList.add("hidden");
    };
    subjectPopup.appendChild(b);
  });

  // Business Laws entry
  const lawBtn = document.createElement("button");
  lawBtn.textContent = LAW_SUBJECT_NAME;
  lawBtn.onclick = () => {
    currentSubject = { name: LAW_SUBJECT_NAME, chapters: lawChapters };
    currentMode    = "law";
    setMode("law");

    subjectText.textContent = LAW_SUBJECT_NAME;
    currentChapter          = null;
    chapterText.textContent = "None Selected";
    chapterBtn.classList.remove("disabled");

    round1Snapshot        = [];
    window.round1Snapshot = [];
    round1Completed       = false;

    if (resultActions) resultActions.classList.add("hidden");
    closeAllPopups();
    resetMarksState();
    quizArea.classList.add("hidden");
    _resetLawAnswerUI();
  };
  subjectPopup.appendChild(lawBtn);
};

/* =========================
   CHAPTER POPUP
========================= */
chapterBtn.onclick = () => {
  resetReviewState();
  round1Completed = false;
  if (resultActions) resultActions.classList.add("hidden");
  closeAllPopups();

  chapterPopup.innerHTML = "";
  chapterPopup.classList.add("show");

  currentSubject.chapters.forEach(ch => {
    const b = document.createElement("button");
    b.textContent = ch.name;
    b.onclick = () => {
      resetReviewState();
      round1Completed = false;
      if (resultActions) resultActions.classList.add("hidden");

      currentChapter          = ch;
      chapterText.textContent = ch.name;
      window.currentChapterName = ch.name;
      resetMarksState();
      quizArea.classList.add("hidden");

      if (currentMode === "mcq") limitInput.disabled = false;

      chapterPopup.classList.remove("show");
    };
    chapterPopup.appendChild(b);
  });
};

/* =========================
   START
========================= */
startBtn.onclick = () => {
  enablePenaltySystem();
  if (isViewportTooSmall()) showPenalty("small-viewport");

  quizActive = true;
  resetReviewState();
  if (resultActions) resultActions.classList.add("hidden");

  marks           = 0;
  round1Completed = false;
  if (marksBox)   marksBox.classList.add("hidden");
  if (marksValue) marksValue.textContent = "0";

  // Remove any stale scorecard
  const oldCard = document.getElementById("quizScorecard");
  if (oldCard) oldCard.remove();

  if (!currentSubject || !currentChapter) {
    alert("Select subject and chapter");
    return;
  }

  if (currentMode === "law") {
    _resetLawAnswerUI();
    lawAnswerEl.style.display   = "";
    lawAnswerEl.contentEditable = true;
    lawAnswerEl.classList.remove("readonly");
    lawKeywordsNeeded.style.display = "none";

    activeQuestions = currentChapter.questions.map(q => ({
      ...q,
      userAnswer: "",
      locked:     false,
      xpApplied:  false
    }));

    qIndex = 0;
    quizArea.classList.remove("hidden");
    resetBtn.disabled = false;
    prevBtn.disabled  = true;
    nextBtn.disabled  = true;

    renderLawQuestion();
  } else {
    const max   = currentChapter.questions.length;
    let limit   = parseInt(limitInput.value || max);
    limit = Math.max(1, Math.min(limit, max));
    limitInput.value = limit;

    let qs = [...currentChapter.questions];
    if (window.TIC_SETTINGS?.randomizeQuestions === true) {
      qs.sort(() => Math.random() - 0.5);
    }

    baseQuestions = qs.slice(0, limit).map(q => ({
      ...q,
      attempted:     false,
      everAttempted: false,
      correct:       false
    }));

    round         = 1;
    quizStartTime = Date.now();
    updateRoundLabel();
    startRound(baseQuestions);
    resetBtn.disabled = false;

    // Save paused session immediately on start
    _savePausedSession();
  }
};

/* =========================
   RESET
========================= */
resetBtn.onclick = () => {
  const table = document.querySelector(".question-table-wrap");
  if (table) table.remove();

  disablePenaltySystem();
  quizActive     = false;
  penaltyRunning = false;

  resetReviewState();
  round1Completed = false;

  if (resultActions) resultActions.classList.add("hidden");

  const oldCard = document.getElementById("quizScorecard");
  if (oldCard) oldCard.remove();

  marks                 = 0;
  round1Snapshot        = [];
  window.round1Snapshot = [];
  if (marksValue) marksValue.textContent = "0";
  if (marksBox)   marksBox.classList.add("hidden");

  quizArea.classList.add("hidden");

  subjectText.textContent = "None Selected";
  chapterText.textContent = "None Selected";
  chapterBtn.classList.add("disabled");

  currentSubject = null;
  currentChapter = null;
  currentMode    = "mcq";

  limitInput.disabled = true;
  if (limitWrap) limitWrap.style.display = "";
  resetBtn.disabled   = true;
  prevBtn.disabled    = true;
  nextBtn.disabled    = true;

  if (timeEl) timeEl.textContent = "--";

  setMode("mcq");
  _resetLawAnswerUI();
  _clearPausedSession();
};

/* =========================
   LAW UI HELPERS
========================= */
function _resetLawAnswerUI() {
  lawAnswerEl.innerHTML       = "";
  lawAnswerEl.style.display   = "";
  lawAnswerEl.contentEditable = "true";
  lawAnswerEl.classList.remove("readonly");
  lawKeywordsNeeded.innerHTML     = "";
  lawKeywordsNeeded.style.display = "none";
}

/* =========================
   XP LOCAL STORAGE HELPERS
========================= */
function getISTDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function xpKey(uid)          { return `xp_${uid}`; }
function getLocalXP(uid)     { return parseInt(localStorage.getItem(xpKey(uid))) || 0; }
function setLocalXP(uid, xp) { localStorage.setItem(xpKey(uid), xp); }

/* =========================
   QUESTION TRACKER
========================= */
function initTracker(count) {
  const tracker = document.getElementById("questionTracker");
  if (!tracker) return;
  tracker.innerHTML = "";
  tracker.classList.remove("hidden");
  for (let i = 0; i < count; i++) {
    const box = document.createElement("div");
    box.className   = "tracker-box";
    box.textContent = i + 1;
    box.id          = `tbox-${i}`;
    tracker.appendChild(box);
  }
}

function updateTracker(index, isCorrect) {
  let box;
  if (round === 1) {
    box = document.getElementById(`tbox-${index}`);
  } else {
    const row = document.getElementById(`tracker-retry-${round}`);
    if (row) box = row.children[index];
  }
  if (!box) return;
  box.classList.remove("t-correct", "t-wrong");
  box.classList.add(isCorrect ? "t-correct" : "t-wrong");
}

function resetTracker() {
  const tracker = document.getElementById("questionTracker");
  if (tracker) tracker.classList.add("hidden");
}

function appendRetryTracker(count) {
  const tracker = document.getElementById("questionTracker");
  if (!tracker) return;

  const divider = document.createElement("div");
  divider.className   = "tracker-divider";
  divider.textContent = `Retry Round ${round - 1}`;
  tracker.appendChild(divider);

  const row = document.createElement("div");
  row.className = "tracker-retry-row";
  row.id        = `tracker-retry-${round}`;

  for (let i = 0; i < count; i++) {
    const box = document.createElement("div");
    box.className          = "tracker-box";
    box.dataset.retryRound = round;
    box.dataset.retryIndex = i;
    box.textContent        = i + 1;
    row.appendChild(box);
  }

  tracker.appendChild(row);
}

/* =========================
   MCQ ROUND CONTROL
========================= */
function startRound(list) {
  activeQuestions = list;
  qIndex          = 0;
  quizArea.classList.remove("hidden");

  if (round === 1) initTracker(list.length);
  else             appendRetryTracker(list.length);

  renderQuestion();
}

/* =========================
   TIMER (MCQ only)
========================= */
function startTimer() {
  clearInterval(timer);

  const settings = window.TIC_SETTINGS || {};
  timeLeft = Number(settings.questionTime || 45);
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) { clearInterval(timer); autoNext(); }
  }, 1000);
}

function updateTimer() {
  if (!timeEl) return;
  timeEl.textContent = String(timeLeft).padStart(2, "0");
  timeEl.classList.toggle("danger", timeLeft <= 5);
}

function clearTimer() { clearInterval(timer); }

/* =========================
   QUESTION ID
========================= */
function getQuestionId(q) {
  return btoa(
    encodeURIComponent(q.text || q.question || "")
      .replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode("0x" + p1))
  ).replace(/=/g, "");
}

/* =========================
   BOOKMARKS
========================= */
async function loadBookmarksOnce(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "bookmarks"));
    const local = {};
    snap.forEach(d => {
      local[d.id]       = d.data();
      bookmarkMap[d.id] = true;
    });
    setLocalBookmarks(uid, local);
  } catch(e) { console.error("❌ Bookmark load failed", e); }
}

function bookmarkKey(uid)       { return `bookmarks_${uid}`; }
function getLocalBookmarks(uid) {
  try { return JSON.parse(localStorage.getItem(bookmarkKey(uid))) || {}; }
  catch { return {}; }
}
function setLocalBookmarks(uid, data) {
  localStorage.setItem(bookmarkKey(uid), JSON.stringify(data));
}

function saveBookmark(q) {
  if (!currentUser) return;
  const id    = getQuestionId(q);
  const local = getLocalBookmarks(currentUser.uid);
  local[id] = {
    subject:      currentSubject?.name || "",
    chapter:      currentChapter?.name || "",
    question:     q.text,
    options:      q.options,
    correctIndex: q.correctIndex,
    savedAt:      Date.now()
  };
  setLocalBookmarks(currentUser.uid, local);
  bookmarkMap[id] = true;

  setDoc(
    doc(db, "users", currentUser.uid, "bookmarks", id),
    local[id]
  ).catch(err => console.error("❌ Bookmark Firebase sync failed", err));
}

function removeBookmark(q) {
  if (!currentUser) return;
  const id    = getQuestionId(q);
  const local = getLocalBookmarks(currentUser.uid);
  delete local[id];
  setLocalBookmarks(currentUser.uid, local);
  delete bookmarkMap[id];

  deleteDoc(
    doc(db, "users", currentUser.uid, "bookmarks", id)
  ).catch(err => console.error("❌ Bookmark remove Firebase sync failed", err));
}

/* =========================
   MCQ RENDER
========================= */
function cleanQuestionText(text) {
  return text.replace(/^(\(\d+\)|\d+\.|\d+\)|\s)+/g, "").trim();
}

function updateRoundLabel() {
  if (!roundLabel) return;
  roundLabel.textContent = round === 1 ? "Practice" : "Retrying Round";
}

function normalizeOption(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function classifyOption(text) {
  const t = normalizeOption(text);
  if (/both\s+[a-d]\s+and\s+[a-d]/.test(t))    return "both";
  if (/either\s+[a-d]\s+or\s+[a-d]/.test(t))   return "either";
  if (/neither\s+[a-d]\s+nor\s+[a-d]/.test(t)) return "neither";
  if (t.includes("none of the above") || t.includes("none of these")) return "none";
  if (t.includes("all of the above") || t.includes("all the above") ||
      t.includes("all of these")     || t.includes("are all of the above")) return "all";
  if (t.includes("can't say") || t.includes("cannot say")) return "cant";
  return "normal";
}

function renderTable(tableData) {
  const wrap = document.createElement("div");
  wrap.className = "question-table-wrap";
  if (tableData.caption) {
    const cap = document.createElement("div");
    cap.className   = "question-table-caption";
    cap.textContent = tableData.caption;
    wrap.appendChild(cap);
  }
  const table = document.createElement("table");
  table.className = "question-table";
  const rows = tableData.rows || [];
  const hasRowHeads = rows.some(r => r.rowHead && r.rowHead.toString().trim() !== "");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  if (hasRowHeads) { const c = document.createElement("th"); headRow.appendChild(c); }
  tableData.headers.forEach(h => {
    const th = document.createElement("th"); th.textContent = h; headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  const limit = tableData.collapsible ? tableData.maxVisibleRows || rows.length : rows.length;
  rows.forEach((rowObj, i) => {
    const tr = document.createElement("tr");
    if (tableData.collapsible && i >= limit) tr.classList.add("table-hidden-row");
    if (hasRowHeads) {
      const th = document.createElement("th");
      th.scope = "row"; th.textContent = rowObj.rowHead || ""; tr.appendChild(th);
    }
    rowObj.data.forEach(cell => {
      const td = document.createElement("td"); td.textContent = cell; tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function renderDiagram(svgString) {
  const wrap = document.createElement("div");
  wrap.className = "diagram-wrap";
  wrap.innerHTML = svgString;
  const svg = wrap.querySelector("svg");
  if (svg) svg.classList.add("eco-diagram");
  return wrap;
}

function reorderOptionsByRules(options) {
  if (options.length !== 4) return options;
  const mapped   = options.map((text, i) => ({ text, originalIndex: i, type: classifyOption(text) }));
  const normals  = mapped.filter(o => o.type === "normal");
  const both     = mapped.filter(o => o.type === "both" || o.type === "either");
  const none     = mapped.filter(o => o.type === "none" || o.type === "neither" || o.type === "cant");
  const all      = mapped.filter(o => o.type === "all");
  if (normals.length === 3) {
    if (both.length === 1 && none.length === 1) return [...normals, both[0], none[0]];
    if (both.length === 1) return [...normals, both[0]];
    if (none.length === 1) return [...normals, none[0]];
    if (all.length  === 1) return [...normals, all[0]];
  }
  return mapped;
}

function renderQuestion() {
  clearTimeout(autoNextTimeout);
  autoNextTimeout = null;
  clearTimer();
  answered = false;

  const q = activeQuestions[qIndex];

  qText.innerHTML = `${qIndex + 1}. ${q.text}`;

  // Bookmark button
  const star = document.createElement("i");
  star.className = "bookmark-btn fa-regular fa-star";
  if (currentUser) {
    const local = getLocalBookmarks(currentUser.uid);
    q.bookmarked = !!local[getQuestionId(q)];
  }
  if (q.bookmarked) { star.classList.remove("fa-regular"); star.classList.add("fa-solid", "active"); }
  const qid = getQuestionId(q);
  star.onclick = () => {
    q.bookmarked = !q.bookmarked;
    if (q.bookmarked) {
      star.classList.replace("fa-regular", "fa-solid");
      star.classList.add("active");
      saveBookmark(q);
      bookmarkMap[qid] = true;
    } else {
      star.classList.replace("fa-solid", "fa-regular");
      star.classList.remove("active");
      removeBookmark(q);
      delete bookmarkMap[qid];
    }
  };
  qText.appendChild(star);

  progressBar.style.width = ((qIndex + 1) / activeQuestions.length) * 100 + "%";
  optionsBox.innerHTML = "";

  const oldTable   = document.querySelector(".question-table-wrap");
  const oldDiagram = document.querySelector(".diagram-wrap");
  if (oldTable)   oldTable.remove();
  if (oldDiagram) oldDiagram.remove();

  if (q.type === "table"   && q.table)      qText.after(renderTable(q.table));
  if (q.type === "diagram" && q.diagramSvg) qText.after(renderDiagram(q.diagramSvg));

  if (!q._optionOrder) {
    let ordered = reorderOptionsByRules(q.options);
    if (window.TIC_SETTINGS?.randomizeOptions === true) {
      const normalPart  = ordered.filter(o => o.type === "normal");
      const specialPart = ordered.filter(o => o.type !== "normal");
      normalPart.sort(() => Math.random() - 0.5);
      ordered = [...normalPart, ...specialPart];
    }
    q._optionOrder       = ordered;
    q._correctIndexInUI  = q._optionOrder.findIndex(o => o.originalIndex === q.correctIndex);
  }

  q._optionOrder.forEach((optObj, uiIndex) => {
    const btn    = document.createElement("button");
    const prefix = window.TIC_SETTINGS?.showABCD === true ? String.fromCharCode(65 + uiIndex) + ". " : "";
    btn.textContent   = prefix + optObj.text;
    btn.dataset.index = uiIndex;
    btn.disabled      = q.attempted;

    if (q.attempted) {
      if (uiIndex === q._correctIndexInUI) btn.classList.add("correct");
      if (q._selectedIndex === uiIndex && q._selectedIndex !== q._correctIndexInUI) btn.classList.add("wrong");
    }

    btn.onclick = () => handleAnswer(btn, uiIndex);
    optionsBox.appendChild(btn);
  });

  prevBtn.disabled = qIndex === 0;
  nextBtn.disabled = !q.attempted;

  if (!q.attempted && window.TIC_SETTINGS?.questionTimer === true) {
    startTimer();
  } else {
    clearTimer();
    if (timeEl) timeEl.textContent = "--";
  }
}

/* =========================
   MCQ ANSWER HANDLER
========================= */
async function handleAnswer(btn, uiIndex) {
  if (answered) return;
  answered = true;
  clearTimer();

  if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }

  const q          = activeQuestions[qIndex];
  q.attempted      = true;
  q._selectedIndex = uiIndex;

  [...optionsBox.children].forEach(b => (b.disabled = true));

  const isCorrect = uiIndex === q._correctIndexInUI;

  if (isCorrect) {
    btn.classList.add("correct");
    q.correct = true;
    updateTracker(qIndex, true);
    if (round === 1) marks += 1;

    if (currentUser) {
      updateDoc(doc(db, "users", currentUser.uid), { xp: increment(5) }).catch(console.error);
      showXpGain(5);
      recordQuestionAttempt(5).catch(console.error);
      syncPublicLeaderboard(currentUser.uid);
      updateBestXpIfNeeded().catch(console.error);
    }

    setTimeout(() => { nextBtn.disabled = false; }, 300);
    if (window.TIC_SETTINGS?.autoSkip) autoNextTimeout = setTimeout(next, 300);

  } else {
    btn.classList.add("wrong");
    [...optionsBox.children].forEach((b, i) => {
      if (i === q._correctIndexInUI) b.classList.add("correct");
    });
    q.correct = false;
    updateTracker(qIndex, false);
    if (round === 1) marks -= 0.25;
    nextBtn.disabled = false;
    if (currentUser) recordQuestionAttempt(0).catch(console.error);
    if (window.TIC_SETTINGS?.autoSkip) autoNextTimeout = setTimeout(next, 3000);
  }

  // Save paused session after each answer
  _savePausedSession();

  if (round === 1 && !round1Completed && qIndex === activeQuestions.length - 1) {
    _triggerEarlySave();
  }
}

function _triggerEarlySave() {
  if (!currentUser) return;

  const snapshot = activeQuestions.map(q => ({ ...q }));
  const correctCount = snapshot.filter(q => q.correct).length;
  const total = snapshot.length;

  // Only save early.
  // DO NOT mark round complete here.
  _saveChapterAll({ correctCount, total }).catch(e =>
    console.error("❌ Early save failed", e)
  );
}

/* =========================
   MCQ TIME UP
========================= */
function autoNext() {
  clearTimeout(autoNextTimeout);
  autoNextTimeout = null;
  const q   = activeQuestions[qIndex];
  q.attempted = true;
  q.correct   = false;
  next();
}

/* =========================
   MCQ NAVIGATION
========================= */
function next() {
  nextBtn.disabled = false;
  if (qIndex < activeQuestions.length - 1) {
    qIndex++;
    renderQuestion();
  } else {
    finishRound();
  }
}

prevBtn.onclick = () => {
  if (currentMode === "law") {
    if (qIndex === 0) return;
    qIndex--;
    renderLawQuestion();
  } else {
    if (qIndex > 0) { qIndex--; renderQuestion(); }
  }
};

nextBtn.onclick = () => {
  if (currentMode === "law") {
    _lawNextHandler();
  } else {
    if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
    next();
  }
};

/* =========================
   MCQ FINISH ROUND
========================= */
async function finishRound() {
  if (currentMode === "law") return;

  const table = document.querySelector(".question-table-wrap");
  if (table) table.remove();

  disablePenaltySystem();
  quizActive     = false;
  penaltyRunning = false;

  if (!round1Completed) {
    round1Completed       = true;
    round1Snapshot        = activeQuestions.map(q => ({ ...q }));
    window.round1Snapshot = round1Snapshot;

    const correctCount = round1Snapshot.filter(q => q.correct).length;
    const total        = round1Snapshot.length;
    const totalTime    = quizStartTime ? Math.round((Date.now() - quizStartTime) / 1000) : 0;

    // Show scorecard FIRST (blocks auto-retry, user clicks Retry themselves)
    showScorecard({
      correct:  correctCount,
      total,
      marks,
      totalTime,
      subject:  currentSubject?.name || "",
      chapter:  currentChapter?.name || ""
    });

    if (resultActions) resultActions.classList.remove("hidden");

    // Save to Firebase — no corrections, just stats + summary
    if (currentUser) {
      _saveChapterAll({ correctCount, total }).catch(e =>
        console.error("❌ Chapter save pipeline failed", e)
      );
    }

    _clearPausedSession();
    return; // wait for user to press Retry from scorecard
  }

  wrongQuestions = activeQuestions.filter(q => !q.correct);

  if (wrongQuestions.length > 0) {
    round++;
    updateRoundLabel();
    startRound(wrongQuestions.map(q => ({ ...q, attempted: false, _optionOrder: null })));
  } else {
    if (qText)       qText.textContent       = "सब सही कर दिए! 🤗 मार्क्स नीचे दिए हैं!";
    if (optionsBox)  optionsBox.innerHTML    = "";
    if (progressBar) progressBar.style.width = "100%";
    if (prevBtn)     prevBtn.disabled        = true;
    if (nextBtn)     nextBtn.disabled        = true;
    if (resetBtn)    resetBtn.disabled       = true;
    clearTimer();
    if (timeEl) timeEl.textContent = "--";
    _clearPausedSession();
  }
}

/* =========================
   CONSOLIDATED FIREBASE SAVE
   No corrections. No wrong-answer collection. Only stats + summary.
========================= */
async function _saveChapterAll({ correctCount, total }) {
  if (!currentUser) return;

  // 1. Detailed chapter stats (only when enough questions)
  try {
    if (round1Snapshot.length >= 1) {
      await addDoc(collection(db, "users", currentUser.uid, "chapterStats"), {
        userId:         currentUser.uid,
        date:           getISTDate(),
        subject:        currentSubject?.name || "",
        chapter:        currentChapter?.name || "",
        totalQuestions: total,
        correct:        correctCount,
        wrong:          total - correctCount,
        marks,
        rounds:         round,
        accuracy:       total ? Math.round((correctCount / total) * 100) : 0,
        createdAt:      serverTimestamp()
      });
    }
  } catch(e) { console.error("❌ chapterStats save failed", e); }

  // 2. Attempt summary
  try {
    await addDoc(collection(db, "users", currentUser.uid, "attempts"), {
      type:      "CHAPTER",
      subject:   currentSubject?.name || "",
      chapter:   currentChapter?.name || "",
      correct:   correctCount,
      total,
      score:     total ? Math.round((correctCount / total) * 100) : 0,
      xpEarned:  correctCount * 5,
      createdAt: serverTimestamp(),
      date:      getISTDate()
    });
  } catch(e) { console.error("❌ attempt summary save failed", e); }

  // Corrections collection REMOVED — not saved anymore
}

/* =========================
   SCORECARD
========================= */
function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getPerformanceLabel(pct) {
  if (pct >= 90) {
    return {
      label: "Outstanding",
      color: "#22c55e",
      bar: "#22c55e",
      icon: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"
          fill="currentColor"/>
        </svg>
      `
    };
  }
  
  if (pct >= 75) {
    return {
      label: "Excellent",
      color: "#16a34a",
      bar: "#4ade80",
      icon: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M20 7L9 18L4 13"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"/>
        </svg>
      `
    };
  }
  
  if (pct >= 60) {
    return {
      label: "Good Job",
      color: "#f59e0b",
      bar: "#fbbf24",
      icon: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 21C16.97 21 21 16.97 21 12S16.97 3 12 3 3 7.03 3 12s4.03 9 9 9Z"
          stroke="currentColor"
          stroke-width="2"/>
          <path d="M8 13L10.5 15.5L16 10"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"/>
        </svg>
      `
    };
  }
  
  if (pct >= 40) {
    return {
      label: "Keep Trying",
      color: "#f97316",
      bar: "#fb923c",
      icon: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 6V12L16 16"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="9"
          stroke="currentColor"
          stroke-width="2"/>
        </svg>
      `
    };
  }
  
  return {
    label: "Needs Work",
    color: "#ef4444",
    bar: "#f87171",
    icon: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 8V12"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"/>
        <circle cx="12" cy="16" r="1"
        fill="currentColor"/>
        <circle cx="12" cy="12" r="9"
        stroke="currentColor"
        stroke-width="2"/>
      </svg>
    `
  };
}

function showScorecard({ correct, total, marks, totalTime, subject, chapter }) {
  const old = document.getElementById("quizScorecard");
  if (old) old.remove();

  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const wrong    = total - correct;
  const perf     = getPerformanceLabel(accuracy);
  const isDark   = document.body.classList.contains("dark");

  const card = document.createElement("div");
  card.id        = "quizScorecard";
  card.className = "quiz-scorecard";

  card.innerHTML = `
    <div class="sc-inner">
      <div class="sc-badge" style="color:${perf.color}">
  <span class="sc-badge-icon">${perf.icon}</span>
  <span>${perf.label}</span>
</div>
      <div class="sc-title">${subject} — ${chapter}</div>

      <div class="sc-ring-wrap">
        <svg class="sc-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none"
            stroke="${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}"
            stroke-width="10"/>
          <circle cx="60" cy="60" r="50" fill="none"
            stroke="${perf.bar}"
            stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="${2 * Math.PI * 50}"
            stroke-dashoffset="${2 * Math.PI * 50 * (1 - accuracy / 100)}"
            class="sc-ring-fill"
            transform="rotate(-90 60 60)"/>
        </svg>
        <div class="sc-ring-text">
          <span class="sc-pct" style="color:${perf.bar}">${accuracy}%</span>
          <span class="sc-pct-label">Accuracy</span>
        </div>
      </div>

      <div class="sc-stats-grid">

  <div class="sc-stat">
    <div class="sc-stat-icon sc-blue">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 11L12 14L22 4"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"/>
        <path d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="sc-stat-val">${total}</span>
    <span class="sc-stat-key">Questions</span>
  </div>

  <div class="sc-stat">
    <div class="sc-stat-icon sc-green">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17L4 12"
        stroke="currentColor"
        stroke-width="2.8"
        stroke-linecap="round"
        stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="sc-stat-val" style="color:#22c55e">${correct}</span>
    <span class="sc-stat-key">Correct</span>
  </div>

  <div class="sc-stat">
    <div class="sc-stat-icon sc-red">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18"
        stroke="currentColor"
        stroke-width="2.8"
        stroke-linecap="round"/>
        <path d="M6 6L18 18"
        stroke="currentColor"
        stroke-width="2.8"
        stroke-linecap="round"/>
      </svg>
    </div>
    <span class="sc-stat-val" style="color:#ef4444">${wrong}</span>
    <span class="sc-stat-key">Wrong</span>
  </div>

  <div class="sc-stat">
    <div class="sc-stat-icon sc-purple">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14.9 8.6L22 9.3L16.7 14L18.3 21L12 17.5L5.7 21L7.3 14L2 9.3L9.1 8.6L12 2Z"
        fill="currentColor"/>
      </svg>
    </div>
    <span class="sc-stat-val" style="color:#6c63ff">${Number(marks || 0).toFixed(2)}</span>
    <span class="sc-stat-key">Score</span>
  </div>

  <div class="sc-stat sc-stat-full">
    <div class="sc-stat-icon sc-time">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9"
        stroke="currentColor"
        stroke-width="2.4"/>
        <path d="M12 7V12L15 15"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"/>
      </svg>
    </div>

    <span class="sc-stat-val">
      ${formatTime(totalTime)}
    </span>

    <span class="sc-stat-key">Time Taken</span>
  </div>

</div>

      <div class="sc-share-row">
        <button class="sc-share-btn sc-wa" id="scShareWA">
          <i class="fa-brands fa-whatsapp"></i> WhatsApp Story
        </button>
        <button class="sc-share-btn sc-ig" id="scShareIG">
          <i class="fa-brands fa-instagram"></i> Instagram Story
        </button>
      </div>

      <button class="sc-retry-btn" id="scRetryBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.75"/>
        </svg>
        Retry Round
      </button>
    </div>
  `;

  // Insert ABOVE divider (before Review + PDF buttons)
  const divider = quizArea.querySelector(".quiz-divider");
  if (divider) quizArea.insertBefore(card, divider);
  else         quizArea.prepend(card);

  // Retry button
  document.getElementById("scRetryBtn").onclick = () => {
    wrongQuestions = round1Snapshot.filter(q => !q.correct);
    if (wrongQuestions.length > 0) {
      round++;
      updateRoundLabel();
      quizActive    = true;
      quizStartTime = Date.now();
      if (resultActions) resultActions.classList.add("hidden");
      enablePenaltySystem();
      startRound(wrongQuestions.map(q => ({ ...q, attempted: false, _optionOrder: null })));
    } else {
      if (qText)      qText.textContent      = "सब सही कर दिए! 🤗";
      if (optionsBox) optionsBox.innerHTML   = "";
    }
  };

  document.getElementById("scShareWA").onclick = () =>
    _shareScorecard("whatsapp", { correct, total, accuracy, marks, totalTime, subject, chapter });
  document.getElementById("scShareIG").onclick = () =>
    _shareScorecard("instagram", { correct, total, accuracy, marks, totalTime, subject, chapter });
}
/* =========================
   DROP-IN REPLACEMENT
   Paste this into BOTH files:
   • questions-logic-rtp.js  (replace _shareScorecard + add helpers)
   • questions-logic.js      (same)

   Also in showScorecard() HTML, change the share button onclick to:
     document.getElementById("scShareWA").onclick = () =>
       _shareScorecard("whatsapp", { correct, total, accuracy, marks, totalTime, subject, chapter: attempt });
     document.getElementById("scShareIG").onclick = () =>
       _shareScorecard("instagram", { correct, total, accuracy, marks, totalTime, subject, chapter: attempt });

   And fix marks.toFixed crash in showScorecard HTML:
     ${Number(marks || 0).toFixed(2)}
========================= */

/* ── Helpers ─────────────────────────────────────────────── */

function _truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function _showShareToast(platform) {
  const old = document.getElementById("_scToast");
  if (old) old.remove();
  const t = document.createElement("div");
  t.id = "_scToast";
  t.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:#1e1b4b;color:#fff;padding:13px 22px;border-radius:14px;
    font-size:14px;z-index:99999;text-align:center;max-width:300px;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);line-height:1.5;
    font-family:sans-serif;pointer-events:none;
  `;
  const app = platform === "whatsapp" ? "WhatsApp" : "Instagram";
  t.innerHTML = `Image saved! Open from gallery and share to <b>${app}</b> 📤`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);       ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);   ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);       ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
  ctx.lineTo(x, y + r);           ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
  ctx.fill();
}

/* ── Main share function ─────────────────────────────────── */

async function _shareScorecard(platform, data) {
  const { correct, total, accuracy, totalTime, subject } = data;
  // chapter key differs between the two files — handle both
  const chapter = data.chapter || data.attempt || "";
  // Guard marks against undefined/NaN always
  const marks   = Number(data.marks || 0);
  const wrong   = total - correct;
  const perf    = getPerformanceLabel(accuracy);
  const isDark  = document.body.classList.contains("dark");

  /* ── Button loading state ── */
  const btnId    = platform === "whatsapp" ? "scShareWA" : "scShareIG";
  const btn      = document.getElementById(btnId);
  const origHTML = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled  = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Preparing…`;
  }

  /* ── Step 1: Ensure Poppins is loaded ──────────────────────
     The page already imports Poppins via <link> in <head>.
     We just wait for document.fonts.ready to confirm it's active.
     Then force canvas to use it by "touching" it in DOM first.
  ─────────────────────────────────────────────────────────── */
  await document.fonts.ready;

  // If Poppins somehow isn't loaded yet, try fetching it
  if (![...document.fonts].some(f => f.family === "Poppins" && f.status === "loaded")) {
    try {
      const f400 = new FontFace("Poppins",
        "url(https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.woff2)",
        { weight: "400" });
      const f700 = new FontFace("Poppins",
        "url(https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2)",
        { weight: "700" });
      const [r400, r700] = await Promise.allSettled([f400.load(), f700.load()]);
      if (r400.status === "fulfilled") document.fonts.add(r400.value);
      if (r700.status === "fulfilled") document.fonts.add(r700.value);
      await document.fonts.ready;
    } catch (e) {
      console.warn("Poppins fallback load failed", e);
    }
  }

  // DOM probe: force browser to activate font for canvas
  const probe = document.createElement("div");
  probe.style.cssText = `
    font-family:'Poppins',sans-serif;font-weight:700;font-size:72px;
    position:absolute;left:-9999px;top:-9999px;visibility:hidden;
    white-space:nowrap;
  `;
  probe.textContent = "PathCA 0123456789%";
  document.body.appendChild(probe);
  // One frame to let browser paint it
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  probe.remove();

  /* ── Step 2: Draw canvas ────────────────────────────────── */
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Font helper — matches what's used on the web page
  const F = (size, bold = false) =>
    `${bold ? "700" : "400"} ${size}px 'Poppins', sans-serif`;

  /* Background */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  if (isDark) {
    bg.addColorStop(0,   "#0f0c29");
    bg.addColorStop(0.5, "#111827");
    bg.addColorStop(1,   "#1e1b4b");
  } else {
    bg.addColorStop(0,   "#f8f7ff");
    bg.addColorStop(0.5, "#eef2ff");
    bg.addColorStop(1,   "#e0e7ff");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* Decorative blobs */
  const drawBlob = (x, y, r, color) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  drawBlob(W * 0.87, H * 0.10, 280, "rgba(108,99,255,0.13)");
  drawBlob(W * 0.13, H * 0.88, 230, "rgba(139,92,246,0.11)");
  drawBlob(W * 0.50, H * 0.50, 180, "rgba(99,102,241,0.05)");

  /* White card */
  const PAD = 64;
  const cardX = PAD, cardY = 140, cardW = W - PAD * 2, cardH = H - 280;
  ctx.shadowColor   = "rgba(0,0,0,0.14)";
  ctx.shadowBlur    = 70;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle     = isDark ? "rgba(15,12,41,0.94)" : "rgba(255,255,255,0.96)";
  _roundRect(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.textAlign = "center";

  /* ── Branding ── */
  ctx.font      = F(64, true);
  ctx.fillStyle = "#6c63ff";
  ctx.fillText("PathCA", W / 2, 252);

  ctx.font      = F(30);
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.55)" : "rgba(17,24,39,0.52)";
  ctx.fillText("CA Foundation Practice", W / 2, 304);

  /* ── Divider line ── */
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(108,99,255,0.15)";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, 330); ctx.lineTo(cardX + cardW - 60, 330);
  ctx.stroke();

  /* ── Subject + Chapter ── */
  ctx.font      = F(44, true);
  ctx.fillStyle = isDark ? "#f3f4f6" : "#111827";
  ctx.fillText(_truncate(subject || "Practice Test", 24), W / 2, 420);

  ctx.font      = F(30);
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.50)" : "rgba(17,24,39,0.48)";
  ctx.fillText(_truncate(chapter, 30), W / 2, 468);

  /* ── Accuracy Ring ── */
  const rX = W / 2, rY = 770, rR = 162;

  // Track
  ctx.lineWidth   = 24;
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";
  ctx.beginPath(); ctx.arc(rX, rY, rR, 0, Math.PI * 2); ctx.stroke();

  // Glow
  ctx.shadowColor = perf.bar; ctx.shadowBlur = 32;

  // Progress
  ctx.strokeStyle = perf.bar;
  ctx.lineCap     = "round";
  ctx.beginPath();
  ctx.arc(rX, rY, rR, -Math.PI / 2,
    -Math.PI / 2 + (accuracy / 100) * Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur  = 0;
  ctx.lineCap     = "butt";

  // Percentage
  ctx.font      = F(104, true);
  ctx.fillStyle = perf.bar;
  ctx.fillText(`${accuracy}%`, rX, rY + 30);

  ctx.font      = F(30);
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.48)" : "rgba(17,24,39,0.46)";
  ctx.fillText("Accuracy", rX, rY + 84);

  /* ── Performance label ── */
  ctx.font      = F(52, true);
  ctx.fillStyle = perf.bar;
  ctx.fillText(perf.label, W / 2, 1060);

  /* ── Stats Cards (2×2 grid) ── */
  const statsData = [
    { label: "Questions", value: String(total),          color: "#3b82f6" },
    { label: "Correct",   value: String(correct),        color: "#22c55e" },
    { label: "Wrong",     value: String(wrong),          color: "#ef4444" },
    { label: "Score",     value: marks.toFixed(1),       color: "#8b5cf6" },
  ];

  const scW = 400, scH = 160;
  const scGap = 30;
  const scStartX = (W - (scW * 2 + scGap)) / 2;
  const scStartY = 1130;

  statsData.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx  = scStartX + col * (scW + scGap);
    const sy  = scStartY + row * (scH + scGap);

    // Card bg
    ctx.fillStyle = isDark
      ? "rgba(255,255,255,0.05)"
      : col === 0 ? "rgba(59,130,246,0.06)" : "rgba(34,197,94,0.06)";
    if (i === 2) ctx.fillStyle = isDark ? "rgba(255,255,255,0.05)" : "rgba(239,68,68,0.06)";
    if (i === 3) ctx.fillStyle = isDark ? "rgba(255,255,255,0.05)" : "rgba(139,92,246,0.06)";
    _roundRect(ctx, sx, sy, scW, scH, 28);

    // Value
    ctx.font      = F(62, true);
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, sx + scW / 2, sy + 76);

    // Label
    ctx.font      = F(26);
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.52)" : "rgba(17,24,39,0.54)";
    ctx.fillText(s.label, sx + scW / 2, sy + 120);
  });

  /* ── Time Taken ── */
  ctx.font      = F(38, true);
  ctx.fillStyle = isDark ? "#d1d5db" : "#374151";
  ctx.fillText("⏱  " + formatTime(totalTime), W / 2, scStartY + 2 * (scH + scGap) + 60);

  /* ── Footer ── */
  ctx.font      = F(26);
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.25)";
  ctx.fillText("pathca.vercel.app", W / 2, H - 80);

  /* ── Restore button ── */
  if (btn) { btn.disabled = false; btn.innerHTML = origHTML; }

  /* ── Step 3: Export + Share ─────────────────────────────── */
  canvas.toBlob(async blob => {
    if (!blob) { console.error("Canvas toBlob failed"); return; }

    const file    = new File([blob], "pathca-scorecard.png", { type: "image/png" });
    const blobUrl = URL.createObjectURL(blob);

    // Native Web Share (Android Chrome + iOS Safari)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My PathCA Score",
          text:  `I scored ${accuracy}% on ${subject} (${chapter}) — PathCA`,
        });
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        return;
      } catch (e) {
        if (e.name === "AbortError") {
          URL.revokeObjectURL(blobUrl);
          return; // user cancelled — don't download
        }
        // Other error — fall through to download
        console.warn("Web Share failed:", e);
      }
    }

    // Fallback: download + toast
    _showShareToast(platform);
    const a = document.createElement("a");
    a.href = blobUrl; a.download = "pathca-scorecard.png"; a.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

  }, "image/png");
}


// ── Helper: load a single font and add to document ───────────
async function _loadFont(family, url, descriptors = {}) {
  try {
    const f = new FontFace(family, `url(${url})`, descriptors);
    const loaded = await f.load();
    document.fonts.add(loaded);
    return true;
  } catch (e) {
    console.warn(`Font load failed: ${url}`, e);
    return false;
  }
}

/* =========================
   RESUME SYSTEM
========================= */
function _pausedKey(uid) { return `paused_ch_${uid}`; }

function _savePausedSession() {
  if (!currentUser || !currentSubject || !currentChapter) return;
  if (currentMode === "law") return; // Law mode doesn't need resume
  try {
    const state = {
      subjectName:     currentSubject.name,
      chapterName:     currentChapter.name,
      round,
      qIndex,
      marks,
      round1Completed,
      activeQuestions: JSON.parse(JSON.stringify(activeQuestions)),
      round1Snapshot:  JSON.parse(JSON.stringify(round1Snapshot)),
      quizStartTime,
      savedAt:         Date.now()
    };
    localStorage.setItem(_pausedKey(currentUser.uid), JSON.stringify(state));
  } catch(e) { console.error("❌ Paused session save failed", e); }
}

function _clearPausedSession() {
  if (!currentUser) return;
  localStorage.removeItem(_pausedKey(currentUser.uid));
}

function checkPausedSession(uid) {
  try {
    const raw = localStorage.getItem(_pausedKey(uid));
    if (!raw) return;
    const state = JSON.parse(raw);
    // Ignore sessions older than 3 days
    if (Date.now() - (state.savedAt || 0) > 3 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(_pausedKey(uid));
      return;
    }
    _showResumePrompt(state);
  } catch(e) { console.error("❌ Paused session check failed", e); }
}

function _showResumePrompt(state) {
  if (quizActive) return;

  const old = document.getElementById("resumeBanner");
  if (old) old.remove();

  const banner = document.createElement("div");
  banner.id        = "resumeBanner";
  banner.className = "resume-banner";
  banner.innerHTML = `
    <div class="resume-banner-inner">
<div class="resume-icon">
  <i class="fa-solid fa-circle-pause"></i>
</div>
      <div class="resume-body">
        <div class="resume-title">You have a paused practice</div>
        <div class="resume-sub">${state.subjectName} — ${state.chapterName}</div>
        <div class="resume-sub">Question ${(state.qIndex || 0) + 1} · Round ${state.round || 1}</div>
      </div>
      <div class="resume-btns">
        <button class="resume-btn-resume"  id="resumeBtn"><i class="fa-solid fa-play"></i>Resume</button>
        <button class="resume-btn-restart" id="restartBtn"><i class="fa-solid fa-rotate-right"></i>Restart</button>
      </div>
    </div>
  `;

  const setupEl = document.querySelector(".quiz-setup");
  if (setupEl) setupEl.parentNode.insertBefore(banner, setupEl);
  else document.querySelector("main.practice-page")?.prepend(banner);

  document.getElementById("resumeBtn").onclick = () => {
    banner.remove();
    _resumeSession(state);
  };
  document.getElementById("restartBtn").onclick = () => {
    _clearPausedSession();
    banner.remove();
  };
}

function _resumeSession(state) {
  // Find subject object
  const subjectObj = subjects.find(s => s.name === state.subjectName);
  if (!subjectObj) return;
  const chapterObj = subjectObj.chapters.find(c => c.name === state.chapterName);
  if (!chapterObj) return;

  currentSubject = subjectObj;
  currentChapter = chapterObj;
  currentMode    = "mcq";
  setMode("mcq");

  subjectText.textContent = subjectObj.name;
  chapterText.textContent = chapterObj.name;
  window.currentChapterName = chapterObj.name;

  chapterBtn.classList.remove("disabled");
  limitInput.disabled = false;
  resetBtn.disabled   = false;

  round           = state.round;
  marks           = state.marks;
  round1Completed = state.round1Completed;
  round1Snapshot  = state.round1Snapshot || [];
  window.round1Snapshot = round1Snapshot;
  quizStartTime   = state.quizStartTime || Date.now();
  activeQuestions = state.activeQuestions || [];
  qIndex          = state.qIndex || 0;
  quizActive      = true;

  updateRoundLabel();
  if (resultActions) resultActions.classList.add("hidden");
  quizArea.classList.remove("hidden");

  if (round > 1) appendRetryTracker(activeQuestions.length);
  else           initTracker(activeQuestions.length);

  enablePenaltySystem();
  renderQuestion();
}

/* =========================
   FIREBASE: recordQuestionAttempt
========================= */
async function recordQuestionAttempt(xpGained) {
  if (!currentUser) return;
  incrementDailyProgress(currentUser.uid);

  const ref  = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data  = snap.data();
  const today = getISTDate();

  let updates = {
    totalAttempts:           increment(1),
    dailyXp:                 increment(xpGained),
    dailyXpDate:             today,
    [`weeklyXp.${today}`]:   increment(xpGained)
  };

  if (data.lastActiveDate !== today) {
    let newStreak = 1;
    if (data.lastActiveDate) {
      const diff = (new Date(today) - new Date(data.lastActiveDate)) / 86400000;
      if (diff === 1) newStreak = (data.streak || 0) + 1;
    }
    updates.streak                 = newStreak;
    updates.lastActiveDate         = today;
    updates.dailyXp                = xpGained;
    updates[`weeklyXp.${today}`]   = xpGained;
  }

  const day = new Date().getDay();
  if (day === 1 && data.lastActiveDate !== today) updates.weeklyXp = {};

  await updateDoc(ref, updates);

  // Sync leaderboard
  const freshSnap = await getDoc(ref);
  if (freshSnap.exists()) {
    const u      = freshSnap.data();
    const weekly = u.weeklyXp || {};
    let sum      = 0;
    Object.values(weekly).forEach(v => (sum += Number(v || 0)));
    await setDoc(doc(db, "publicLeaderboard", currentUser.uid), {
      name:    u.username || "User",
      gender:  u.gender   || "",
      dob:     u.dob      || "",
      xp:      sum,
      weekKey: getWeekKey()
    }).catch(console.error);
  }
}

async function updateBestXpIfNeeded() {
  if (!currentUser) return;
  const ref  = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if ((data.dailyXp || 0) > (data.bestXpDay || 0)) {
    await updateDoc(ref, { bestXpDay: data.dailyXp });
  }
}

async function validateStreakOnLogin(user) {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data  = snap.data();
  const today = getISTDate();
  const last  = data.lastActiveDate;
  if (!last) return;
  const diff = (new Date(today) - new Date(last)) / 86400000;
  if (diff > 1 && (data.streak || 0) !== 0) {
    await updateDoc(ref, { streak: 0 });
  }
}

function getWeekKey() {
  const now      = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const year     = now.getFullYear();
  const firstJan = new Date(year, 0, 1);
  const days     = Math.floor((now - firstJan) / 86400000);
  const week     = Math.ceil((days + firstJan.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

/* =========================
   PENALTY SYSTEM
========================= */
const penaltyOverlay = document.getElementById("penaltyOverlay");
const penaltyTimeEl  = document.getElementById("penaltyTime");
let penaltyTimer     = null;
let penaltySeconds   = 45;
let quizStarted      = false;

function enablePenaltySystem()  { quizStarted = true; }
function disablePenaltySystem() { quizStarted = false; hidePenalty(); }

function showPenalty(reason = "") {
  if (!quizStarted || penaltyRunning) return;
  if (!penaltyOverlay || !penaltyTimeEl) return;
  penaltyRunning  = true;
  penaltySeconds  = 45;
  penaltyTimeEl.textContent = penaltySeconds;
  document.body.classList.add("penalty-lock");
  penaltyOverlay.classList.remove("hidden");
  triggerPenaltyVibration();
  clearInterval(penaltyTimer);
  penaltyTimer = setInterval(() => {
    penaltySeconds--;
    penaltyTimeEl.textContent = penaltySeconds;
    if (penaltySeconds <= 0) hidePenalty();
  }, 1000);
}

function hidePenalty() {
  clearInterval(penaltyTimer);
  penaltyTimer   = null;
  penaltyRunning = false;
  if (!penaltyOverlay) return;
  penaltyOverlay.classList.add("hidden");
  document.body.classList.remove("penalty-lock");
}

function triggerPenaltyVibration() {
  if (!navigator.vibrate) return;
  navigator.vibrate([120, 80, 120, 80, 200]);
}

function isViewportTooSmall() {
  return window.innerWidth < 360 || window.innerHeight < 520;
}

document.addEventListener("visibilitychange", () => { if (document.hidden) showPenalty("tab-switch"); });
window.addEventListener("blur",   () => showPenalty("blur"));
window.addEventListener("resize", () => { if (!quizStarted) return; if (isViewportTooSmall()) showPenalty("resize-small"); });
window.addEventListener("beforeunload", e => { if (quizStarted) { e.preventDefault(); e.returnValue = ""; } });

/* =========================
   XP FLOAT ANIMATION
========================= */
function showXpGain(amount) {
  const xpBox = document.querySelector(".xp-box");
  if (!xpBox) return;
  const float = document.createElement("div");
  float.className   = "xp-float";
  float.textContent = `+${amount}`;
  xpBox.appendChild(float);
  setTimeout(() => float.remove(), 1200);
}

/* =========================
   KEYBOARD SHORTCUTS
========================= */
document.addEventListener("keydown", e => {
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || document.activeElement.contentEditable === "true") return;
  if (!quizActive) return;
  const key = e.key.toLowerCase();
  if (key === "n" && !nextBtn.disabled) nextBtn.click();
  if (key === "p" && !prevBtn.disabled) prevBtn.click();
});

document.addEventListener("keydown", e => {
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return;
  if (e.code !== "Space") return;
  e.preventDefault();
  const activeCard = document.querySelector(".vn-card.active");
  if (!activeCard) return;
  const audio   = activeCard.audioInstance;
  const playBtn = activeCard.querySelector(".vn-play-btn");
  const playIcon = playBtn?.querySelector("i");
  if (!audio) return;
  if (audio.paused) {
    document.querySelectorAll(".vn-card").forEach(c => {
      if (c !== activeCard && c.audioInstance) {
        c.audioInstance.pause(); c.audioInstance.currentTime = 0;
        const ic = c.querySelector(".vn-play-btn i");
        if (ic) ic.className = "fa-solid fa-play";
      }
    });
    audio.play();
    if (playIcon) playIcon.className = "fa-solid fa-pause";
  } else {
    audio.pause();
    if (playIcon) playIcon.className = "fa-solid fa-play";
  }
});

/* =========================
   BOOKMARKS-ONLY QUIZ START
========================= */
window.__startQuizWithQuestions = function (questions, meta = {}) {
  baseQuestions = questions.map(q => ({ ...q, attempted: false, everAttempted: false, correct: false }));
  round           = 1;
  marks           = 0;
  round1Completed = false;
  wrongQuestions  = [];
  subjectText.textContent = meta.subject || "Bookmarks";
  chapterText.textContent = meta.chapter || "Saved Questions";
  quizArea.classList.remove("hidden");
  updateRoundLabel();
  startRound(baseQuestions);
};

/* =========================
   LAW: RENDER QUESTION
========================= */
function renderLawQuestion() {
  if (!activeQuestions.length) return;

  const q = activeQuestions[qIndex];
  qText.textContent = `${qIndex + 1}. ${q.question}`;

  progressBar.style.width = ((qIndex + 1) / activeQuestions.length) * 100 + "%";

  if (q.locked) {
    lawAnswerEl.innerHTML = q.userAnswer;
  } else {
    lawAnswerEl.innerHTML = "";
  }
  lawAnswerEl.style.whiteSpace = "pre-wrap";
  lawAnswerEl.contentEditable  = !q.locked;
  lawAnswerEl.classList.toggle("readonly", q.locked);

  const box = lawKeywordsNeeded;
  box.innerHTML = "";

  if (q.locked) {
    box.style.display = "flex";
    q.keywords.forEach(k => {
      const used = q.userAnswer ? new RegExp(`\\b${k}\\b`, "i").test(q.userAnswer) : false;
      const span = document.createElement("span");
      span.className   = "law-keyword" + (used ? " used" : "");
      span.textContent = k;
      box.appendChild(span);
    });
  } else {
    box.style.display = "none";
  }

  prevBtn.disabled = qIndex === 0;
  nextBtn.disabled = !q.locked && lawAnswerEl.innerText.trim().length === 0;
}

lawAnswerEl.addEventListener("input", () => {
  if (currentMode !== "law") return;
  const q = activeQuestions[qIndex];
  if (q && !q.locked) {
    nextBtn.disabled = lawAnswerEl.innerText.trim().length === 0;
  }
});

/* =========================
   LAW: NEXT HANDLER
========================= */
function _lawNextHandler() {
  const q = activeQuestions[qIndex];

  let rawText = lawAnswerEl.innerText;
  rawText = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n/g, "<br>");

  let html = rawText;
  q.keywords.forEach(k => {
    const r = new RegExp(`\\b(${k})\\b`, "gi");
    html    = html.replace(r, `<span class="keyword-hit">$1</span>`);
  });

  q.userAnswer = html;
  q.locked     = true;

  const evalResult = evaluateLawAnswer({ userAnswerHTML: html, keywords: q.keywords });
  q.eval = evalResult;

  lawAnswerEl.innerHTML = html;
  lawAnswerEl.setAttribute("contenteditable", "false");
  nextBtn.disabled = true;

  const isLast = qIndex === activeQuestions.length - 1;
  if (isLast) finishLawTest();
  else { qIndex++; renderLawQuestion(); }

  if (currentUser && evalResult.xp > 0 && !q.xpApplied) {
    q.xpApplied = true;
    updateDoc(doc(db, "users", currentUser.uid), { xp: increment(evalResult.xp) })
      .then(() => recordQuestionAttempt(evalResult.xp))
      .then(() => updateBestXpIfNeeded())
      .then(() => syncPublicLeaderboard(currentUser.uid))
      .catch(e => console.error("❌ Law XP save failed", e));
  }
}

/* =========================
   LAW: FINISH
========================= */
function finishLawTest() {
  if (qText)   qText.textContent = "सारे Attempt कर दिए! 🤗";

  if (lawAnswerEl)       lawAnswerEl.style.display       = "none";
  if (lawKeywordsNeeded) lawKeywordsNeeded.style.display = "none";

  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;

  window.activeQuestions    = activeQuestions.map(q => ({ ...q }));
  window.round1Snapshot     = activeQuestions.map(q => ({ ...q, attempted: true }));
  window.currentChapterName = currentChapter?.name || "";

  lawTotalMarks = 0;
  lawTotalXp    = 0;
  activeQuestions.forEach(q => {
    if (q.eval) { lawTotalMarks += q.eval.marks; lawTotalXp += q.eval.xp; }
  });
  lawTotalMarks = Math.round(lawTotalMarks * 2) / 2;

  if (marksValue) marksValue.textContent = lawTotalMarks.toFixed(1);
  if (marksBox)   marksBox.classList.remove("hidden");
  if (resultActions) resultActions.classList.remove("hidden");
}

/* =========================
   LAW: EVALUATE ANSWER
========================= */
function evaluateLawAnswer({ userAnswerHTML, keywords }) {
  const text = userAnswerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .trim();

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  let used = 0;
  keywords.forEach(k => {
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${safe}\\b`, "i").test(text)) used++;
  });

  const totalKeywords  = keywords.length;
  const keywordPercent = totalKeywords === 0 ? 0 : (used / totalKeywords) * 100;

  let xp = 0;
  if      (keywordPercent >= 100) xp = 10;
  else if (keywordPercent >= 80)  xp = 8;
  else if (keywordPercent >= 40)  xp = 4;
  else if (keywordPercent >= 20)  xp = 2;

  let marks = (keywordPercent / 100) * 4;
  if (wordCount < 100)   marks = Math.min(marks, 1);
  else if (wordCount >= 200) marks = Math.min(marks, 4);
  if (marks < 1) marks = 1;
  marks = Math.round(marks * 2) / 2;

  return { wordCount, keywordsUsed: used, totalKeywords, keywordPercent: Math.round(keywordPercent), marks, xp };
}
window.evaluateLawAnswer = evaluateLawAnswer;

/* =========================
   EXPOSE for common-logic.js
========================= */
window.__getQuizMode = () => currentMode;

/* =========================
   POPUP CLOSE ON OUTSIDE CLICK
========================= */
document.addEventListener("click", e => {
  if (
    !subjectBtn.contains(e.target)   &&
    !chapterBtn.contains(e.target)   &&
    !subjectPopup.contains(e.target) &&
    !chapterPopup.contains(e.target)
  ) {
    closeAllPopups();
  }
});
