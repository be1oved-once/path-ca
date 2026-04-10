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
let currentXP = 0;
const xpEl = document.getElementById("xpValue");

auth.onAuthStateChanged(user => {
  if (!user) {
    currentUser = null;
    currentXP = 0;
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
    currentXP = data.xp || 0;
    if (xpEl) xpEl.textContent = String(currentXP).padStart(2, "0");
  });

  loadBookmarksOnce(user.uid);
});

/* =========================
   DATA IMPORTS
========================= */
import { subjects } from "./questions.js";
import { lawChapters } from "./questions-law.js";

/* =========================
   BUSINESS LAWS VIRTUAL SUBJECT
   Injected into the subjects popup at runtime.
   Uses lawChapters from questions-law.js as its chapter bank.
========================= */
const LAW_SUBJECT_NAME = "Business Laws";

/* =========================
   STATE
========================= */
let currentMode = "mcq";          // "mcq" | "law"  — set when subject is chosen
let currentSubject = null;
let currentChapter = null;

let baseQuestions  = [];
let wrongQuestions = [];

let qIndex = 0;
let round  = 1;
let marks  = 0;
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

const quizArea    = document.getElementById("quizArea");
const qText       = document.getElementById("questionText");
const optionsBox  = document.getElementById("optionsBox");
const timeEl      = document.getElementById("timeLeft");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const limitInput    = document.getElementById("questionLimit");
const limitWrap     = document.getElementById("questionLimitWrap");
const progressBar   = document.getElementById("progressBar");
const roundLabel    = document.getElementById("roundLabel");
const marksBox      = document.getElementById("marksBox");
const marksValue    = document.getElementById("marksValue");

const lawAnswerEl       = document.getElementById("lawAnswer");
const lawKeywordsNeeded = document.getElementById("lawKeywordsNeeded");

const pageTitle = document.getElementById("pageTitle");

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
   Sets the visual mode of the quiz area (MCQ ↔ Law)
   without requiring a page reload or a toggle button.
========================= */
function setMode(mode) {
  currentMode = mode;

  // Swap CSS class on quizArea — pure CSS hides/shows the right blocks
  quizArea.classList.remove("quiz-mode-mcq", "quiz-mode-law");
  quizArea.classList.add(mode === "law" ? "quiz-mode-law" : "quiz-mode-mcq");

  // Page title
  if (mode === "law") {
    pageTitle.innerHTML = "Law<span>'</span>Wise";
  } else {
    pageTitle.innerHTML = "Chapter<span>'</span>Wise";
  }

  // Question limit: irrelevant for law (all questions always used)
  if (limitWrap) limitWrap.style.display = mode === "law" ? "none" : "";
}

/* =========================
   MARKS / REVIEW STATE RESETS
========================= */
function resetMarksState() {
  marks = 0;
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

  const reviewContent = document.getElementById("reviewContent");
  const reviewPanel   = document.getElementById("reviewPanel");
  if (reviewContent) reviewContent.innerHTML = "";
  if (reviewPanel)   reviewPanel.classList.add("hidden");
}

/* =========================
   SUBJECT POPUP
   Renders all regular subjects PLUS "Business Laws" at the bottom.
========================= */
subjectBtn.onclick = () => {
  resetMarksState();
  if (resultActions) resultActions.classList.add("hidden");
  closeAllPopups();

  subjectPopup.innerHTML = "";
  subjectPopup.classList.add("show");

  // Regular subjects (Maths, Economics, etc.)
  subjects.forEach(sub => {
    const b = document.createElement("button");
    b.textContent = sub.name;
    b.onclick = () => {
      currentSubject = sub;
      currentMode    = "mcq";
      setMode("mcq");

      subjectText.textContent = sub.name;
      currentChapter = null;
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

  // ⚖️ Business Laws — special entry at bottom
  const lawBtn = document.createElement("button");
  lawBtn.textContent = LAW_SUBJECT_NAME;
  lawBtn.onclick = () => {
    // Virtual subject object matching the shape expected by chapter popup
    currentSubject = { name: LAW_SUBJECT_NAME, chapters: lawChapters };
    currentMode    = "law";
    setMode("law");

    subjectText.textContent = LAW_SUBJECT_NAME;
    currentChapter = null;
    chapterText.textContent = "None Selected";
    chapterBtn.classList.remove("disabled");

    round1Snapshot        = [];
    window.round1Snapshot = [];
    round1Completed       = false;

    if (resultActions) resultActions.classList.add("hidden");
    closeAllPopups();
    resetMarksState();
    quizArea.classList.add("hidden");

    // Law answer cleanup
    _resetLawAnswerUI();
  };
  subjectPopup.appendChild(lawBtn);
};

/* =========================
   CHAPTER POPUP
   Works for both MCQ subjects and Business Laws.
   Law chapters come from lawChapters (questions-law.js).
========================= */
chapterBtn.onclick = () => {
  resetReviewState();
  round1Completed = false;
  if (resultActions) resultActions.classList.add("hidden");
  closeAllPopups();

  chapterPopup.innerHTML = "";
  chapterPopup.classList.add("show");

  // currentSubject.chapters works for both MCQ subjects and the virtual law subject
  currentSubject.chapters.forEach(ch => {
    const b = document.createElement("button");
    b.textContent = ch.name;
    b.onclick = () => {
      resetReviewState();
      round1Completed = false;
      if (resultActions) resultActions.classList.add("hidden");

      currentChapter = ch;
      chapterText.textContent = ch.name;
      window.currentChapterName = ch.name;
      resetMarksState();
      quizArea.classList.add("hidden");

      if (currentMode === "mcq") {
        limitInput.disabled = false;
      }

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

  marks = 0;
  round1Completed = false;
  if (marksBox)   marksBox.classList.add("hidden");
  if (marksValue) marksValue.textContent = "0";

  if (!currentSubject || !currentChapter) {
    alert("Select subject and chapter");
    return;
  }

  if (currentMode === "law") {
    // ── LAW START ──
    _resetLawAnswerUI();
    lawAnswerEl.style.display  = "";
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
    // ── MCQ START ──
    const max   = currentChapter.questions.length;
    let limit   = parseInt(limitInput.value || max);
    limit = Math.max(1, Math.min(limit, max));
    limitInput.value = limit;

    let qs = [...currentChapter.questions];
    if (window.TIC_SETTINGS.randomizeQuestions === true) {
      qs.sort(() => Math.random() - 0.5);
    }

    baseQuestions = qs.slice(0, limit).map(q => ({
      ...q,
      attempted:     false,
      everAttempted: false,
      correct:       false
    }));

    round = 1;
    updateRoundLabel();
    startRound(baseQuestions);
    resetBtn.disabled = false;
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

  // Reset to MCQ mode visually (title + CSS classes)
  setMode("mcq");

  // Full law UI cleanup — restores display styles set by finishLawTest
  _resetLawAnswerUI();
};

/* =========================
   LAW UI HELPERS
========================= */
function _resetLawAnswerUI() {
  lawAnswerEl.innerHTML       = "";
  lawAnswerEl.style.display   = "";        // ← restore from finishLawTest's display:none
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

function xpKey(uid)         { return `xp_${uid}`; }
function getLocalXP(uid)    { return parseInt(localStorage.getItem(xpKey(uid))) || 0; }
function setLocalXP(uid, xp){ localStorage.setItem(xpKey(uid), xp); }

/* =========================
   MCQ ROUND CONTROL
========================= */
function startRound(list) {
  activeQuestions = list;
  qIndex = 0;
  quizArea.classList.remove("hidden");
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
    if (timeLeft <= 0) {
      clearInterval(timer);
      autoNext();
    }
  }, 1000);
}

function updateTimer() {
  if (!timeEl) return;
  timeEl.textContent = String(timeLeft).padStart(2, "0");
  timeEl.classList.toggle("danger", timeLeft <= 5);
}

function clearTimer() {
  clearInterval(timer);
}

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
  const snap = await getDocs(collection(db, "users", uid, "bookmarks"));
  const local = {};
  snap.forEach(doc => { local[doc.id] = doc.data(); });
  setLocalBookmarks(uid, local);
}

function bookmarkKey(uid)         { return `bookmarks_${uid}`; }
function getLocalBookmarks(uid)   {
  try { return JSON.parse(localStorage.getItem(bookmarkKey(uid))) || {}; }
  catch { return {}; }
}
function setLocalBookmarks(uid, data) {
  localStorage.setItem(bookmarkKey(uid), JSON.stringify(data));
}

async function saveBookmark(q) {
  if (!currentUser) return;
  const id    = getQuestionId(q);
  const local = getLocalBookmarks(currentUser.uid);
  local[id]   = { question: q.text, options: q.options, correctIndex: q.correctIndex };
  setLocalBookmarks(currentUser.uid, local);
  await setDoc(doc(db, "users", currentUser.uid, "bookmarks", id), {
    subject: currentSubject?.name || "",
    chapter: currentChapter?.name || "",
    question: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    savedAt: Date.now()
  });
}

async function removeBookmark(q) {
  if (!currentUser) return;
  const id    = getQuestionId(q);
  const local = getLocalBookmarks(currentUser.uid);
  delete local[id];
  setLocalBookmarks(currentUser.uid, local);
  await deleteDoc(doc(db, "users", currentUser.uid, "bookmarks", id));
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
  if (t.includes("all of the above")  || t.includes("all the above") ||
      t.includes("all of these")      || t.includes("are all of the above")) return "all";
  if (t.includes("can't say") || t.includes("cannot say")) return "cant";
  return "normal";
}

function renderTable(tableData) {
  const wrap = document.createElement("div");
  wrap.className = "question-table-wrap";
  if (tableData.caption) {
    const cap = document.createElement("div");
    cap.className = "question-table-caption";
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
  const mapped  = options.map((text, i) => ({ text, originalIndex: i, type: classifyOption(text) }));
  const normals = mapped.filter(o => o.type === "normal");
  const both    = mapped.filter(o => o.type === "both" || o.type === "either");
  const none    = mapped.filter(o => o.type === "none" || o.type === "neither" || o.type === "cant");
  const all     = mapped.filter(o => o.type === "all");
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
  star.onclick = async () => {
    q.bookmarked = !q.bookmarked;
    if (q.bookmarked) {
      star.classList.remove("fa-regular"); star.classList.add("fa-solid", "active");
      await saveBookmark(q);
    } else {
      star.classList.remove("fa-solid", "active"); star.classList.add("fa-regular");
      await removeBookmark(q);
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
    if (window.TIC_SETTINGS.randomizeOptions === true) {
      const normalPart  = ordered.filter(o => o.type === "normal");
      const specialPart = ordered.filter(o => o.type !== "normal");
      normalPart.sort(() => Math.random() - 0.5);
      ordered = [...normalPart, ...specialPart];
    }
    q._optionOrder = ordered;
    q._correctIndexInUI = q._optionOrder.findIndex(o => o.originalIndex === q.correctIndex);
  }

  q._optionOrder.forEach((optObj, uiIndex) => {
    const btn    = document.createElement("button");
    const prefix = window.TIC_SETTINGS.showABCD === true ? String.fromCharCode(65 + uiIndex) + ". " : "";
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

  if (!q.attempted && window.TIC_SETTINGS.questionTimer === true) {
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

  const q = activeQuestions[qIndex];
  q.attempted      = true;
  q._selectedIndex = uiIndex;

  [...optionsBox.children].forEach(b => (b.disabled = true));

  const isCorrect = uiIndex === q._correctIndexInUI;

  if (isCorrect) {
    btn.classList.add("correct");
    q.correct = true;
    if (round === 1) marks += 1;

    if (currentUser) {
      updateDoc(doc(db, "users", currentUser.uid), { xp: increment(5) });
      showXpGain(5);
      recordQuestionAttempt(5).catch(console.error);
      syncPublicLeaderboard(currentUser.uid);
      updateBestXpIfNeeded();
    }

    setTimeout(() => { nextBtn.disabled = false; }, 300);
    if (window.TIC_SETTINGS.autoSkip) autoNextTimeout = setTimeout(next, 300);

  } else {
    btn.classList.add("wrong");
    [...optionsBox.children].forEach((b, i) => { if (i === q._correctIndexInUI) b.classList.add("correct"); });
    q.correct = false;
    if (round === 1) marks -= 0.25;
    nextBtn.disabled = false;
    if (currentUser) recordQuestionAttempt(0).catch(console.error);
    if (window.TIC_SETTINGS.autoSkip) autoNextTimeout = setTimeout(next, 3000);
  }

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

  const statsPromise   = saveChapterDetailedStats();
  const summaryPromise = recordAttemptSummary({
    type: "CHAPTER", subject: currentSubject?.name || "", chapter: currentChapter?.name || "",
    correct: correctCount, total, xpEarned: correctCount * 5
  });
  const correctionsPromise = (async () => {
    try {
      const colRef = collection(db, "users", currentUser.uid, "corrections");
      const old    = await getDocs(colRef);
      const batch  = writeBatch(db);
      old.forEach(d => batch.delete(d.ref));
      wrongOnly.forEach(q => {
        batch.set(doc(colRef), { text: q.text, options: q.options, correctAnswer: q.options[q.correctIndex], createdAt: Date.now() });
      });
      await batch.commit();
    } catch(e) { console.error("❌ Early corrections save failed", e); }
  })();

  Promise.all([statsPromise, summaryPromise, correctionsPromise])
    .catch(e => console.error("❌ Early parallel save error", e));
}

/* =========================
   MCQ TIME UP
========================= */
function autoNext() {
  clearTimeout(autoNextTimeout);
  autoNextTimeout = null;
  const q = activeQuestions[qIndex];
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
  // Guard: finishRound is MCQ-only; if mode switched mid-quiz, bail
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

    if (marksValue) marksValue.textContent = marks.toFixed(2);
    if (marksBox)   marksBox.classList.remove("hidden");
    if (resultActions) resultActions.classList.remove("hidden");

    if (currentUser) {
      const wrongOnly    = round1Snapshot.filter(q => !q.correct);
      const correctCount = round1Snapshot.filter(q => q.correct).length;
      const total        = round1Snapshot.length;

      const statsPromise   = saveChapterDetailedStats();
      const summaryPromise = recordAttemptSummary({
        type: "CHAPTER", subject: currentSubject?.name || "", chapter: currentChapter?.name || "",
        correct: correctCount, total, xpEarned: correctCount * 5
      });
      const correctionsPromise = (async () => {
        try {
          const colRef = collection(db, "users", currentUser.uid, "corrections");
          const old    = await getDocs(colRef);
          const batch  = writeBatch(db);
          old.forEach(d => batch.delete(d.ref));
          wrongOnly.forEach(q => {
            batch.set(doc(colRef), { text: q.text, options: q.options, correctAnswer: q.options[q.correctIndex], createdAt: Date.now() });
          });
          await batch.commit();
        } catch(e) { console.error("❌ Corrections save failed", e); }
      })();

      Promise.all([statsPromise, summaryPromise, correctionsPromise])
        .catch(e => console.error("❌ Parallel save error", e));
    }
  }

  wrongQuestions = activeQuestions.filter(q => !q.correct);

  if (wrongQuestions.length > 0) {
    round++;
    updateRoundLabel();
    startRound(wrongQuestions.map(q => ({ ...q, attempted: false })));
  } else {
    if (qText)       qText.textContent       = "सब सही कर दिए! 🤗 मार्क्स नीचे दिए हैं!";
    if (optionsBox)  optionsBox.innerHTML    = "";
    if (progressBar) progressBar.style.width = "100%";
    if (prevBtn)     prevBtn.disabled        = true;
    if (nextBtn)     nextBtn.disabled        = true;
    if (resetBtn)    resetBtn.disabled       = true;
    clearTimer();
    if (timeEl) timeEl.textContent = "--";
  }
}

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
      span.className = "law-keyword" + (used ? " used" : "");
      span.textContent = k;
      box.appendChild(span);
    });
  } else {
    box.style.display = "none";
  }

  prevBtn.disabled = qIndex === 0;
  nextBtn.disabled = !q.locked && lawAnswerEl.innerText.trim().length === 0;
}

/* Live-enable Next as user types */
lawAnswerEl.addEventListener("input", () => {
  if (currentMode !== "law") return;
  const q = activeQuestions[qIndex];
  if (q && !q.locked) {
    nextBtn.disabled = lawAnswerEl.innerText.trim().length === 0;
  }
});

/* =========================
   LAW: NEXT HANDLER
   UI updates happen INSTANTLY — Firebase saves fire-and-forget in background.
========================= */
function _lawNextHandler() {
  const q = activeQuestions[qIndex];

  // 1️⃣ Grab raw text synchronously
  let rawText = lawAnswerEl.innerText;
  rawText = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n/g, "<br>");

  // 2️⃣ Keyword highlight
  let html = rawText;
  q.keywords.forEach(k => {
    const r = new RegExp(`\\b(${k})\\b`, "gi");
    html = html.replace(r, `<span class="keyword-hit">$1</span>`);
  });

  // 3️⃣ Save state synchronously
  q.userAnswer = html;
  q.locked     = true;

  const evalResult = evaluateLawAnswer({ userAnswerHTML: html, keywords: q.keywords });
  q.eval = evalResult;

  // 4️⃣ Update DOM instantly — no await before this
  lawAnswerEl.innerHTML = html;
  lawAnswerEl.setAttribute("contenteditable", "false");

  // 5️⃣ Disable next btn instantly to prevent double-tap
  nextBtn.disabled = true;

  // 6️⃣ Move to next question or finish — instant, no delay
  const isLast = qIndex === activeQuestions.length - 1;
  if (isLast) {
    finishLawTest();
  } else {
    qIndex++;
    renderLawQuestion();
  }

  // 7️⃣ Firebase saves — completely fire-and-forget, never block UI
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
  if (qText)    qText.textContent = "सारे Attempt कर दिए! 🤗";

  // Hide law-specific inputs
  if (lawAnswerEl)        lawAnswerEl.style.display       = "none";
  if (lawKeywordsNeeded)  lawKeywordsNeeded.style.display = "none";

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

  const totalKeywords   = keywords.length;
  const keywordPercent  = totalKeywords === 0 ? 0 : (used / totalKeywords) * 100;

  let xp = 0;
  if      (keywordPercent >= 100) xp = 10;
  else if (keywordPercent >= 80)  xp = 8;
  else if (keywordPercent >= 40)  xp = 4;
  else if (keywordPercent >= 20)  xp = 2;

  let marks = (keywordPercent / 100) * 4;
  if (wordCount < 100)  marks = Math.min(marks, 1);
  else if (wordCount >= 200) marks = Math.min(marks, 4);
  if (marks < 1) marks = 1;
  marks = Math.round(marks * 2) / 2;

  return { wordCount, keywordsUsed: used, totalKeywords, keywordPercent: Math.round(keywordPercent), marks, xp };
}
window.evaluateLawAnswer = evaluateLawAnswer;

/* =========================
   EXPOSE currentMode for common-logic.js
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
    totalAttempts: increment(1),
    dailyXp:       increment(xpGained),
    dailyXpDate:   today,
    [`weeklyXp.${today}`]: increment(xpGained)
  };

  if (data.lastActiveDate !== today) {
    let newStreak = 1;
    if (data.lastActiveDate) {
      const diff = (new Date(today) - new Date(data.lastActiveDate)) / 86400000;
      if (diff === 1) newStreak = (data.streak || 0) + 1;
    }
    updates.streak         = newStreak;
    updates.lastActiveDate = today;
    updates.dailyXp        = xpGained;
    updates[`weeklyXp.${today}`] = xpGained;
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
    Object.values(weekly).forEach(v => sum += Number(v || 0));

    await setDoc(doc(db, "publicLeaderboard", currentUser.uid), {
      name:    u.username || "User",
      gender:  u.gender   || "",
      dob:     u.dob      || "",
      xp:      sum,
      weekKey: getWeekKey()
    });
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

async function recordAttemptSummary(data) {
  if (!currentUser) return;
  try {
    await addDoc(collection(db, "users", currentUser.uid, "attempts"), {
      type:      data.type,
      subject:   data.subject   || "",
      chapter:   data.chapter   || "",
      correct:   data.correct   || 0,
      total:     data.total     || 0,
      score:     data.total ? Math.round((data.correct / data.total) * 100) : 0,
      xpEarned:  data.xpEarned  || 0,
      createdAt: serverTimestamp(),
      date:      new Date().toISOString().slice(0, 10)
    });
  } catch(e) { console.error("❌ Attempt summary failed", e); }
}

async function saveChapterDetailedStats() {
  if (!currentUser) return;
  if (!round1Snapshot || round1Snapshot.length < 30) return;

  const correct = round1Snapshot.filter(q => q.correct).length;
  const total   = round1Snapshot.length;

  await addDoc(collection(db, "users", currentUser.uid, "chapterStats"), {
    userId:         currentUser.uid,
    date:           new Date().toISOString().slice(0, 10),
    subject:        currentSubject?.name || "",
    chapter:        currentChapter?.name || "",
    totalQuestions: total,
    correct,
    wrong:          total - correct,
    marks,
    rounds:         round,
    accuracy:       Math.round((correct / total) * 100),
    createdAt:      serverTimestamp()
  });
}

function getWeekKey() {
  const now     = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const year    = now.getFullYear();
  const firstJan = new Date(year, 0, 1);
  const days    = Math.floor((now - firstJan) / 86400000);
  const week    = Math.ceil((days + firstJan.getDay() + 1) / 7);
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
  penaltyRunning   = true;
  penaltySeconds   = 45;
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
window.addEventListener("blur", () => showPenalty("blur"));
window.addEventListener("resize", () => { if (!quizStarted) return; if (isViewportTooSmall()) showPenalty("resize-small"); });
window.addEventListener("beforeunload", e => { if (quizStarted) { e.preventDefault(); e.returnValue = ""; } });

/* =========================
   XP FLOAT ANIMATION
========================= */
function showXpGain(amount) {
  const xpBox = document.querySelector(".xp-box");
  if (!xpBox) return;
  const float = document.createElement("div");
  float.className  = "xp-float";
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
   CONTROLLED QUIZ START (Bookmarks etc.)
========================= */
window.__startQuizWithQuestions = function (questions, meta = {}) {
  baseQuestions = questions.map(q => ({ ...q, attempted: false, everAttempted: false, correct: false }));
  round             = 1;
  marks             = 0;
  round1Completed   = false;
  wrongQuestions    = [];
  subjectText.textContent = meta.subject || "Bookmarks";
  chapterText.textContent = meta.chapter || "Saved Questions";
  quizArea.classList.remove("hidden");
  updateRoundLabel();
  startRound(baseQuestions);
};
