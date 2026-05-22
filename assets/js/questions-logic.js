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
  if (!currentUser || round1Completed) return;
  round1Completed        = true;
  round1Snapshot         = activeQuestions.map(q => ({ ...q }));
  window.round1Snapshot  = round1Snapshot;

  const wrongOnly    = round1Snapshot.filter(q => !q.correct);
  const correctCount = round1Snapshot.filter(q => q.correct).length;
  const total        = round1Snapshot.length;

  // Fire and forget — no corrections collection (removed per requirements)
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
  if (pct >= 90) return { label: "Outstanding! 🏆", color: "#22c55e", bar: "#22c55e" };
  if (pct >= 75) return { label: "Excellent! 🎉",   color: "#16a34a", bar: "#4ade80" };
  if (pct >= 60) return { label: "Good Job! 👍",     color: "#f59e0b", bar: "#fbbf24" };
  if (pct >= 40) return { label: "Keep Trying! 💪",  color: "#f97316", bar: "#fb923c" };
  return           { label: "Needs Work 📚",          color: "#ef4444", bar: "#f87171" };
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
      <div class="sc-badge" style="color:${perf.color}">${perf.label}</div>
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
          <span class="sc-stat-val">${total}</span>
          <span class="sc-stat-key">Questions</span>
        </div>
        <div class="sc-stat">
          <span class="sc-stat-val" style="color:#22c55e">${correct}</span>
          <span class="sc-stat-key">Correct</span>
        </div>
        <div class="sc-stat">
          <span class="sc-stat-val" style="color:#ef4444">${wrong}</span>
          <span class="sc-stat-key">Wrong</span>
        </div>
        <div class="sc-stat">
          <span class="sc-stat-val" style="color:#6c63ff">${marks.toFixed(2)}</span>
          <span class="sc-stat-key">Score</span>
        </div>
        <div class="sc-stat sc-stat-full">
          <span class="sc-stat-val">⏱ ${formatTime(totalTime)}</span>
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
        🔁 Retry Round
      </button>
    </div>
  `;

  // Insert ABOVE divider (before Review + PDF buttons)
  const divider = quizArea.querySelector(".quiz-divider");
  if (divider) quizArea.insertBefore(card, divider);
  else         quizArea.prepend(card);

  // Retry button
  document.getElementById("scRetryBtn").onclick = () => {
    card.remove();
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
   SCORECARD SHARE (Canvas → Web Share API)
========================= */
async function _shareScorecard(platform, data) {
  const { correct, total, accuracy, marks, totalTime, subject, chapter } = data;
  const wrong  = total - correct;
  const perf   = getPerformanceLabel(accuracy);
  const isDark = document.body.classList.contains("dark");

  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  const grd = ctx.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, isDark ? "#0f172a" : "#f8f7ff");
  grd.addColorStop(1, isDark ? "#1e1b4b" : "#ede9fe");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Decorative circles
  ctx.beginPath(); ctx.arc(W * 0.85, H * 0.12, 260, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(108,99,255,0.10)"; ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.15, H * 0.88, 200, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(139,92,246,0.08)"; ctx.fill();

  // Card
  const cx = 90, cy = 320, cw = W - 180, ch = H - 480;
  ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 60;
  ctx.fillStyle   = isDark ? "rgba(30,27,75,0.95)" : "#ffffff";
  _roundRect(ctx, cx, cy, cw, ch, 60);
  ctx.shadowBlur = 0;

  // Branding
  ctx.font = "bold 52px Poppins, sans-serif";
  ctx.fillStyle = "#6c63ff"; ctx.textAlign = "center";
  ctx.fillText("PathCA", W / 2, 200);
  ctx.font = "36px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#a5b4fc" : "#7c6fd4";
  ctx.fillText("CA Foundation Practice", W / 2, 260);

  // Subject / chapter
  ctx.font = "bold 42px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#e5e7eb" : "#1c1c1c";
  ctx.fillText(subject, W / 2, cy + 90);
  ctx.font = "34px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
  ctx.fillText(chapter, W / 2, cy + 148);

  // Accuracy ring
  const ringX = W / 2, ringY = cy + 360, ringR = 170;
  ctx.lineWidth = 22;
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
  ctx.beginPath(); ctx.arc(ringX, ringY, ringR, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = perf.bar;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(ringX, ringY, ringR, -Math.PI / 2, -Math.PI / 2 + (accuracy / 100) * Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.font = "bold 110px Poppins, sans-serif";
  ctx.fillStyle = perf.bar; ctx.textAlign = "center";
  ctx.fillText(accuracy + "%", ringX, ringY + 28);
  ctx.font = "34px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
  ctx.fillText("Accuracy", ringX, ringY + 80);

  // Performance label
  ctx.font = "bold 52px Poppins, sans-serif";
  ctx.fillStyle = perf.color;
  ctx.fillText(perf.label, W / 2, cy + 600);

  // Stats row
  const statsY = cy + 720, colW = cw / 4, startX = cx;
  [
    { val: total,            key: "Questions", color: isDark ? "#e5e7eb" : "#1c1c1c" },
    { val: correct,          key: "Correct",   color: "#22c55e" },
    { val: wrong,            key: "Wrong",     color: "#ef4444" },
    { val: marks.toFixed(1), key: "Score",     color: "#6c63ff" }
  ].forEach((s, i) => {
    const sx = startX + colW * i + colW / 2;
    ctx.font = "bold 58px Poppins, sans-serif";
    ctx.fillStyle = s.color; ctx.textAlign = "center";
    ctx.fillText(String(s.val), sx, statsY);
    ctx.font = "30px Poppins, sans-serif";
    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
    ctx.fillText(s.key, sx, statsY + 50);
  });

  ctx.font = "bold 44px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#e5e7eb" : "#1c1c1c"; ctx.textAlign = "center";
  ctx.fillText("⏱ " + formatTime(totalTime), W / 2, statsY + 140);

  ctx.font = "32px Poppins, sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillText("pathca.vercel.app", W / 2, H - 120);

  canvas.toBlob(async blob => {
    if (!blob) return;
    const file = new File([blob], "pathca-scorecard.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My CA Foundation Result — PathCA",
          text:  `I scored ${accuracy}% (${correct}/${total}) on ${subject} ${chapter}! Practice on pathca.vercel.app`
        });
        return;
      } catch(e) { if (e.name !== "AbortError") console.warn("Share failed", e); }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url; a.download = "pathca-scorecard.png"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, "image/png");
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath(); ctx.fill();
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
      <div class="resume-icon">⏸️</div>
      <div class="resume-body">
        <div class="resume-title">You have a paused practice</div>
        <div class="resume-sub">${state.subjectName} — ${state.chapterName}</div>
        <div class="resume-sub">Question ${(state.qIndex || 0) + 1} · Round ${state.round || 1}</div>
      </div>
      <div class="resume-btns">
        <button class="resume-btn-resume"  id="resumeBtn">▶ Resume</button>
        <button class="resume-btn-restart" id="restartBtn">↺ Restart</button>
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
