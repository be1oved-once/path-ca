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
  serverTimestamp
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
initDailyRobot(user.uid);

  // 🔥 REAL-TIME XP SYNC
  onSnapshot(doc(db, "users", user.uid), snap => {
    if (!snap.exists()) return;

    const data = snap.data();
    currentXP = data.xp || 0;

    if (xpEl) {
      xpEl.textContent = String(currentXP).padStart(2, "0");
    }
  });

  // 🔹 Load bookmarks once (fine as is)
  loadBookmarksOnce(user.uid);
});

/* =========================
   DATA
========================= */
import { subjects } from "./questions.js";

let currentSubject = null;
let currentChapter = null;

let baseQuestions = [];     // original limited list

let wrongQuestions = [];    // retry pool

let qIndex = 0;
let round = 1;
let marks = 0;
let round1Completed = false;
let timer = null;
let autoNextTimeout = null;
let timeLeft = 45; // SAFE FALLBACK ONLY
let answered = false;

let activeQuestions = [];
let round1Snapshot = [];
let quizActive = false;
let penaltyRunning = false;

// 🔥 expose globally
window.round1Snapshot = round1Snapshot;
/* =========================
   DOM
========================= */
const subjectBtn = document.getElementById("subjectBtn");
const chapterBtn = document.getElementById("chapterBtn");
const subjectText = document.getElementById("subjectText");
const chapterText = document.getElementById("chapterText");
const subjectPopup = document.getElementById("subjectPopup");
const chapterPopup = document.getElementById("chapterPopup");

const startBtn = document.getElementById("startQuiz");
const resetBtn = document.getElementById("resetQuiz");

const quizArea = document.getElementById("quizArea");
const qText = document.getElementById("questionText");
const optionsBox = document.getElementById("optionsBox");
const timeEl = document.getElementById("timeLeft");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const limitInput = document.getElementById("questionLimit");
const progressBar = document.getElementById("progressBar");

const roundLabel = document.getElementById("roundLabel");
const marksBox = document.getElementById("marksBox");
const marksValue = document.getElementById("marksValue");
/* =========================
   INITIAL STATE (PAGE LOAD)
========================= */
limitInput.disabled = true;
resetBtn.disabled = true;
prevBtn.disabled = true;
nextBtn.disabled = true;

const resultActions = document.querySelector(".result-actions");
if (resultActions) resultActions.classList.add("hidden");
/* =========================
   SUBJECT POPUP
========================= */
function resetMarksState() {
  marks = 0;
  round1Completed = false;

  if (marksValue) marksValue.textContent = "0";
  if (marksBox) marksBox.classList.add("hidden");
}
function closeAllPopups() {
  subjectPopup.classList.remove("show");
  chapterPopup.classList.remove("show");
}

function resetReviewState() {
  round1Snapshot = [];
  window.round1Snapshot = [];

  const reviewContent = document.getElementById("reviewContent");
  const reviewPanel = document.getElementById("reviewPanel");

  if (reviewContent) reviewContent.innerHTML = "";
  if (reviewPanel) reviewPanel.classList.add("hidden");
}

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
      subjectText.textContent = sub.name;

      currentChapter = null;
      chapterText.textContent = "None Selected";
      chapterBtn.classList.remove("disabled");

round1Snapshot = [];
window.round1Snapshot = [];
round1Completed = false;

if (resultActions) resultActions.classList.add("hidden");

      closeAllPopups();
      resetMarksState();
quizArea.classList.add("hidden"); // optional but clean
    };
    subjectPopup.appendChild(b);
  });
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
  currentChapter = ch;
  chapterText.textContent = ch.name;
  window.currentChapterName = ch.name;
  window.currentChapterName = "";
  resetMarksState();
  quizArea.classList.add("hidden");
  
  // ✅ Enable question limit AFTER chapter chosen
  limitInput.disabled = false;
  
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

if (isViewportTooSmall()) {
  showPenalty("small-viewport");
}
  quizActive = true;   
  resetReviewState();
  if (resultActions) resultActions.classList.add("hidden");
  // 🔒 Hide marks when starting a new quiz
marks = 0;
round1Completed = false;
if (marksBox) marksBox.classList.add("hidden");
if (marksValue) marksValue.textContent = "0";
  if (!currentSubject || !currentChapter) {
    alert("Select subject and chapter");
    return;
  }

  const max = currentChapter.questions.length;
  let limit = parseInt(limitInput.value || max);
  limit = Math.max(1, Math.min(limit, max));
  limitInput.value = limit;

  let qs = [...currentChapter.questions];

if (window.TIC_SETTINGS.randomizeQuestions === true) {
  qs.sort(() => Math.random() - 0.5);
}

baseQuestions = qs.slice(0, limit).map(q => ({
  ...q,
  attempted: false,
  everAttempted: false,
  correct: false
}));

  round = 1;
  updateRoundLabel();
  startRound(baseQuestions);
  resetBtn.disabled = false;
};

/* =========================
   RESET
========================= */
resetBtn.onclick = () => {
  const table = document.querySelector(".question-table-wrap");
  if (table) table.remove();

  disablePenaltySystem();
  quizActive = false;
  penaltyRunning = false;
resetReviewState();
round1Completed = false;

// ❌ Hide review / pdf buttons
if (resultActions) resultActions.classList.add("hidden");
  marks = 0;
round1Completed = false;
round1Snapshot = [];
window.round1Snapshot = [];
marksValue.textContent = "0";
marksBox.classList.add("hidden");
  quizArea.classList.add("hidden");

  subjectText.textContent = "None Selected";
  chapterText.textContent = "None Selected";

  currentSubject = null;
  currentChapter = null;

  limitInput.disabled = true;
  resetBtn.disabled = true;

  prevBtn.disabled = true;
  nextBtn.disabled = true;

  // ⏱ reset timer view
  timeEl.textContent = "--";
};

/* =========================
   XP LOCAL STORAGE HELPERS


========================= */

function getLocalDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function xpKey(uid) {
  return `xp_${uid}`;
}

function getLocalXP(uid) {
  return parseInt(localStorage.getItem(xpKey(uid))) || 0;
}

function setLocalXP(uid, xp) {
  localStorage.setItem(xpKey(uid), xp);
}
/* =========================
   ROUND CONTROL
========================= */
function startRound(list) {
  activeQuestions = list;
  qIndex = 0;
  quizArea.classList.remove("hidden");
  renderQuestion();
}

/* =========================
   TIMER
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
  timeEl.textContent = String(timeLeft).padStart(2, "0");
  timeEl.classList.toggle("danger", timeLeft <= 5);
}

function clearTimer() {
  clearInterval(timer);
}
function getQuestionId(q) {
  return btoa(
    encodeURIComponent(q.text)
      .replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode("0x" + p1)
      )
  ).replace(/=/g, "");
}

async function loadBookmarksOnce(uid) {
  const snap = await getDocs(
    collection(db, "users", uid, "bookmarks")
  );

  const local = {};
  snap.forEach(doc => {
    local[doc.id] = doc.data();
  });

  setLocalBookmarks(uid, local);
}

function bookmarkKey(uid) {
  return `bookmarks_${uid}`;
}

function getLocalBookmarks(uid) {
  try {
    return JSON.parse(localStorage.getItem(bookmarkKey(uid))) || {};
  } catch {
    return {};
  }
}

function setLocalBookmarks(uid, data) {
  localStorage.setItem(bookmarkKey(uid), JSON.stringify(data));
}
async function saveBookmark(q) {
  if (!currentUser) return;

  const id = getQuestionId(q);

  // 🔹 Local first (instant)
  const local = getLocalBookmarks(currentUser.uid);
  local[id] = {
    question: q.text,
    options: q.options,
    correctIndex: q.correctIndex
  };
  setLocalBookmarks(currentUser.uid, local);

  // 🔹 Firebase
  await setDoc(
    doc(db, "users", currentUser.uid, "bookmarks", id),
    {
      subject: currentSubject?.name || "",
      chapter: currentChapter?.name || "",
      question: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      savedAt: Date.now()
    }
  );
}

async function removeBookmark(q) {
  if (!currentUser) return;

  const id = getQuestionId(q);

  // 🔹 Local
  const local = getLocalBookmarks(currentUser.uid);
  delete local[id];
  setLocalBookmarks(currentUser.uid, local);

  // 🔹 Firebase
  await deleteDoc(
    doc(db, "users", currentUser.uid, "bookmarks", id)
  );
}

/* =========================
   RENDER
========================= */
function cleanQuestionText(text) {
  return text.replace(/^(\(\d+\)|\d+\.|\d+\)|\s)+/g, "").trim();
}
function updateRoundLabel() {
  if (!roundLabel) return;

  if (round === 1) {
    roundLabel.textContent = "Practice";
  } else {
    roundLabel.textContent = "Retrying Round";
  }
}

function normalizeOption(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function classifyOption(text) {
  const t = normalizeOption(text);

  if (/both\s+[a-d]\s+and\s+[a-d]/.test(t)) return "both";
  if (/either\s+[a-d]\s+or\s+[a-d]/.test(t)) return "either";
  if (/neither\s+[a-d]\s+nor\s+[a-d]/.test(t)) return "neither";

  if (
    t.includes("none of the above") ||
    t.includes("none of these")
  ) return "none";

  if (
    t.includes("all of the above") ||
    t.includes("all the above") ||
    t.includes("all of these") ||
    t.includes("are all of the above")
  ) return "all";

  if (
    t.includes("can't say") ||
    t.includes("cannot say")
  ) return "cant";

  return "normal";
}

function renderTable(tableData) {
  const wrap = document.createElement("div");
  wrap.className = "question-table-wrap";

  /* ===== CAPTION ===== */
  if (tableData.caption) {
    const cap = document.createElement("div");
    cap.className = "question-table-caption";
    cap.textContent = tableData.caption;
    wrap.appendChild(cap);
  }

  const table = document.createElement("table");
  table.className = "question-table";

  /* ===== THEAD ===== */
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  // 🔥 EMPTY CORNER CELL FOR ROW HEADINGS
  const corner = document.createElement("th");
  corner.textContent = "";
  headRow.appendChild(corner);

  tableData.headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  /* ===== TBODY ===== */
  const tbody = document.createElement("tbody");

  const rows = tableData.rows || [];
  const limit = tableData.collapsible
    ? tableData.maxVisibleRows || rows.length
    : rows.length;

  rows.forEach((rowObj, i) => {
    const tr = document.createElement("tr");

    if (tableData.collapsible && i >= limit) {
      tr.classList.add("table-hidden-row");
    }

    // 🔥 ROW HEADING
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = rowObj.rowHead || "";
    tr.appendChild(th);

    // DATA CELLS
    rowObj.data.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);

  return wrap;
}

function reorderOptionsByRules(options) {
  if (options.length !== 4) return options;

  const mapped = options.map((text, i) => ({
    text,
    originalIndex: i,
    type: classifyOption(text)
  }));

  const normals = mapped.filter(o => o.type === "normal");
  const both = mapped.filter(o => o.type === "both" || o.type === "either");
  const none = mapped.filter(o =>
    o.type === "none" || o.type === "neither" || o.type === "cant"
  );
  const all = mapped.filter(o => o.type === "all");

  // Apply rules ONLY when 3 normals exist
  if (normals.length === 3) {
    if (both.length === 1 && none.length === 1) {
      return [...normals, both[0], none[0]];
    }

    if (both.length === 1) {
      return [...normals, both[0]];
    }

    if (none.length === 1) {
      return [...normals, none[0]];
    }

    if (all.length === 1) {
      return [...normals, all[0]];
    }
  }

  return mapped;
}

/* =========================
   DIAGRAM RENDERER
========================= */
function renderDiagram(svgString) {
  const wrap = document.createElement("div");
  wrap.className = "diagram-wrap";

  wrap.innerHTML = svgString;

  const svg = wrap.querySelector("svg");
  if (svg) {
    svg.classList.add("eco-diagram");
  }

  return wrap;
}

function renderQuestion() {
  clearTimeout(autoNextTimeout);
  autoNextTimeout = null;
  clearTimer();
  answered = false;

  const q = activeQuestions[qIndex];

  qText.innerHTML = `${qIndex + 1}. ${q.text}`;

  /* ⭐ BOOKMARK BUTTON */
/* ⭐ BOOKMARK BUTTON (Font Awesome) */
const star = document.createElement("i");
star.className = "bookmark-btn fa-regular fa-star";

if (currentUser) {
  const local = getLocalBookmarks(currentUser.uid);
  q.bookmarked = !!local[getQuestionId(q)];
}

if (q.bookmarked) {
  star.classList.remove("fa-regular");
  star.classList.add("fa-solid", "active");
}

star.onclick = async () => {
  q.bookmarked = !q.bookmarked;

  if (q.bookmarked) {
    star.classList.remove("fa-regular");
    star.classList.add("fa-solid", "active");
    await saveBookmark(q);
  } else {
    star.classList.remove("fa-solid", "active");
    star.classList.add("fa-regular");
    await removeBookmark(q);
  }
};

qText.appendChild(star);

  progressBar.style.width =
    ((qIndex + 1) / activeQuestions.length) * 100 + "%";

  optionsBox.innerHTML = "";

// 🔥 REMOVE old table or diagram if exists
const oldTable = document.querySelector(".question-table-wrap");
if (oldTable) oldTable.remove();

const oldDiagram = document.querySelector(".diagram-wrap");
if (oldDiagram) oldDiagram.remove();

// 🔥 INSERT TABLE (below question text, above options)
if (q.type === "table" && q.table) {
  const tableEl = renderTable(q.table);
  qText.after(tableEl);
}
// 🔥 INSERT DIAGRAM (below question text)
if (q.type === "diagram" && q.diagramSvg) {
  const diagramEl = renderDiagram(q.diagramSvg);
  qText.after(diagramEl);
}

if (!q._optionOrder) {
  let ordered = reorderOptionsByRules(q.options);

  // optional randomize only NORMAL options
  if (window.TIC_SETTINGS.randomizeOptions === true) {
    const normalPart = ordered.filter(o => o.type === "normal");
    const specialPart = ordered.filter(o => o.type !== "normal");

    normalPart.sort(() => Math.random() - 0.5);
    ordered = [...normalPart, ...specialPart];
  }

  q._optionOrder = ordered;

  q._correctIndexInUI = q._optionOrder.findIndex(
    o => o.originalIndex === q.correctIndex
  );
}

let options = q._optionOrder;

q._optionOrder.forEach((optObj, uiIndex) => {
  const btn = document.createElement("button");

  const prefix =
    window.TIC_SETTINGS.showABCD === true
      ? String.fromCharCode(65 + uiIndex) + ". "
      : "";

  btn.textContent = prefix + optObj.text;
  btn.dataset.index = uiIndex;
  btn.disabled = q.attempted;

  // ✅ re-highlight when coming back
  if (q.attempted) {
    if (uiIndex === q._correctIndexInUI) {
      btn.classList.add("correct");
    }
    if (q._selectedIndex === uiIndex && q._selectedIndex !== q._correctIndexInUI) {
      btn.classList.add("wrong");
    }
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
  timeEl.textContent = "--";
}
}

/* =========================
   ANSWER
========================= */
async function handleAnswer(btn, uiIndex) {
  if (answered) return;
  answered = true;
  clearTimer();

  if (autoNextTimeout) {
    clearTimeout(autoNextTimeout);
    autoNextTimeout = null;
  }

  const q = activeQuestions[qIndex];
  q.attempted = true;
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

    // ✅ FAST ENABLE (300ms)
    setTimeout(() => {
      nextBtn.disabled = false;
    }, 300);

    if (window.TIC_SETTINGS.autoSkip) {
      autoNextTimeout = setTimeout(next, 300);
    }

  } else {
    // ❌ WRONG → INSTANT
    btn.classList.add("wrong");

    [...optionsBox.children].forEach((b, i) => {
      if (i === q._correctIndexInUI) b.classList.add("correct");
    });

    q.correct = false;
    if (round === 1) marks -= 0.25;

    nextBtn.disabled = false; // ⚡ INSTANT

    if (currentUser) {
      recordQuestionAttempt(0).catch(console.error);
    }

    if (window.TIC_SETTINGS.autoSkip) {
      autoNextTimeout = setTimeout(next, 3000);
    }
  }
}

/* =========================
   TIME UP → NEXT
========================= */
function autoNext() {
  clearTimeout(autoNextTimeout);
autoNextTimeout = null;
  const q = activeQuestions[qIndex];
  q.attempted = true;
  q.correct = false;
  next();
}

/* =========================
   NAV
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
  if (qIndex > 0) {
    qIndex--;
    renderQuestion();
  }
};

nextBtn.onclick = () => {
  if (autoNextTimeout) {
    clearTimeout(autoNextTimeout);
    autoNextTimeout = null;
  }
  next();
};

/* ==FINISH ROUND==== */
async function finishRound() {
  // 🔥 REMOVE TABLE
  const table = document.querySelector(".question-table-wrap");
  if (table) table.remove();

  disablePenaltySystem();
  quizActive = false;
  penaltyRunning = false;

console.log("🔴 Quiz finished → Penalty system OFF");
if (!round1Completed) {
  round1Completed = true;

  // 📸 Freeze round-1 snapshot
  round1Snapshot = activeQuestions.map(q => ({ ...q }));
  window.round1Snapshot = round1Snapshot;

  // ✅ SAVE DETAILED STATS (ONLY HERE)
  await saveChapterDetailedStats();

  // ✅ SAVE CORRECTIONS (WRONG QUESTIONS)
  if (currentUser) {
    const wrongOnly = round1Snapshot.filter(q => !q.correct);

    const colRef = collection(db, "users", currentUser.uid, "corrections");

    // Clear old corrections
    const old = await getDocs(colRef);
    old.forEach(d => deleteDoc(d.ref));

    // Save new ones
    for (const q of wrongOnly) {
      await addDoc(colRef, {
        text: q.text,
        options: q.options,
        correctAnswer: q.options[q.correctIndex],
        createdAt: Date.now()
      });
    }

    console.log("✅ Corrections saved:", wrongOnly.length);
  }

  // 🎯 UI
  marksValue.textContent = marks.toFixed(2);
  marksBox.classList.remove("hidden");
  resultActions?.classList.remove("hidden");

  // 🔥 SAVE ATTEMPT SUMMARY
  recordAttemptSummary({
    type: "CHAPTER",
    subject: currentSubject?.name || "",
    chapter: currentChapter?.name || "",
    correct: round1Snapshot.filter(q => q.correct).length,
    total: round1Snapshot.length,
    xpEarned: round1Snapshot.filter(q => q.correct).length * 5
  });
}
  wrongQuestions = activeQuestions.filter(q => !q.correct);

  if (wrongQuestions.length > 0) {
    round++;

updateRoundLabel();

const retrySet = wrongQuestions.map(q => ({
  ...q,
  attempted: false
}));

startRound(retrySet);
  } else {
  qText.textContent = "सब सही कर दिए! 🤗 मार्क्स नीच दिए है!";
  optionsBox.innerHTML = "";
  progressBar.style.width = "100%";
  
  // ❌ Disable navigation
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  
  // ❌ Disable reset again
  resetBtn.disabled = true;
  
  // ⏱ Remove timer
  clearTimer();
  timeEl.textContent = "--";
}
}
document.addEventListener("click", e => {
  if (
    !subjectBtn.contains(e.target) &&
    !chapterBtn.contains(e.target) &&
    !subjectPopup.contains(e.target) &&
    !chapterPopup.contains(e.target)
  ) {
    closeAllPopups();
  }
});
function slideToggle(popup, open) {
  if (!popup) return;

  if (open) {
    popup.classList.add("show");
    popup.style.maxHeight = popup.scrollHeight + "px";
  } else {
    popup.style.maxHeight = null;
    popup.classList.remove("show");
  }
}

async function recordQuestionAttempt(xpGained) {
  if (!currentUser) return;
incrementDailyProgress(currentUser.uid);
  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const today = getLocalDate();
  let updates = {
    totalAttempts: increment(1),
    dailyXp: increment(xpGained),
    dailyXpDate: today,

    // ✅ PER-DAY XP STORAGE (WEEK SAFE)
    [`weeklyXp.${today}`]: increment(xpGained)
  };

  /* =========================
     STREAK LOGIC
  ========================= */
  if (data.lastActiveDate !== today) {
    let streak = data.streak || 0;

    if (data.lastActiveDate) {
      const diff =
        (new Date(today) - new Date(data.lastActiveDate)) /
        (1000 * 60 * 60 * 24);

      streak = diff === 1 ? streak + 1 : 1;
    } else {
      streak = 1;
    }

    updates.streak = streak;
    updates.lastActiveDate = today;

    // 🔥 RESET daily XP ONLY ON NEW DAY
    updates.dailyXp = xpGained;

    // 🔥 RESET weekly day XP ONLY ON NEW DAY
    updates[`weeklyXp.${today}`] = xpGained;
  }

// 🧹 RESET weeklyXp on Monday
const day = new Date().getDay(); // 0 = Sunday, 1 = Monday
if (day === 1 && data.lastActiveDate !== today) {
  updates.weeklyXp = {}; // fresh week
}

  await updateDoc(ref, updates);
  // ===== UPDATE PUBLIC WEEKLY LEADERBOARD =====
const freshSnap = await getDoc(ref);
if (freshSnap.exists()) {
  const u = freshSnap.data();
  const weekly = u.weeklyXp || {};

  let sum = 0;
  Object.values(weekly).forEach(v => sum += Number(v || 0));

const weekKey = getWeekKey();

await setDoc(doc(db, "publicLeaderboard", currentUser.uid), {
  name: u.username || "User",
  gender: u.gender || "",
  dob: u.dob || "",
  xp: sum,
  weekKey: weekKey
});
}
}

async function updateBestXpIfNeeded() {
  if (!currentUser) return;

  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const dailyXp = data.dailyXp || 0;
  const bestXpDay = data.bestXpDay || 0;

  if (dailyXp > bestXpDay) {
    await updateDoc(ref, {
      bestXpDay: dailyXp
    });
  }
}


// 🔓 EXPOSE CONTROLLED QUIZ START (for bookmarks / special modes)
window.__startQuizWithQuestions = function (questions, meta = {}) {
  baseQuestions = questions.map(q => ({
    ...q,
    attempted: false,
    everAttempted: false,
    correct: false
  }));

  round = 1;
  marks = 0;
  round1Completed = false;
  wrongQuestions = [];

  subjectText.textContent = meta.subject || "Bookmarks";
  chapterText.textContent = meta.chapter || "Saved Questions";

  quizArea.classList.remove("hidden");
  updateRoundLabel();
  startRound(baseQuestions);
};


async function recordAttemptSummary(data) {
  if (!currentUser) return;

  try {
    await addDoc(
      collection(db, "users", currentUser.uid, "attempts"),
      {
        type: data.type,                 // CHAPTER / RTP / MTP
        subject: data.subject || "",
        chapter: data.chapter || "",
        correct: data.correct || 0,
        total: data.total || 0,
        score: data.total
          ? Math.round((data.correct / data.total) * 100)
          : 0,
        xpEarned: data.xpEarned || 0,
        createdAt: serverTimestamp(),
        date: new Date().toISOString().slice(0, 10)
      }
    );

    console.log("✅ Attempt summary saved");
  } catch (e) {
    console.error("❌ Attempt summary failed", e);
  }
}

const penaltyOverlay = document.getElementById("penaltyOverlay");
const penaltyTimeEl = document.getElementById("penaltyTime");

let penaltyTimer = null;
let penaltySeconds = 45;
let quizStarted = false;

/* ===== PUBLIC CONTROLS ===== */
function enablePenaltySystem() {
  quizStarted = true;
}

function disablePenaltySystem() {
  quizStarted = false;
  hidePenalty();
}

/* ===== CORE ===== */
function showPenalty(reason = "") {
  if (!quizStarted || penaltyRunning) return;

  penaltyRunning = true;
  penaltySeconds = 45;
  penaltyTimeEl.textContent = penaltySeconds;

  document.body.classList.add("penalty-lock");
  penaltyOverlay.classList.remove("hidden");
triggerPenaltyVibration();

  clearInterval(penaltyTimer);
  penaltyTimer = setInterval(() => {
    penaltySeconds--;
    penaltyTimeEl.textContent = penaltySeconds;

    if (penaltySeconds <= 0) {
      hidePenalty();
    }
  }, 1000);
}

function hidePenalty() {
  clearInterval(penaltyTimer);
  penaltyTimer = null;
  penaltyRunning = false;

  penaltyOverlay.classList.add("hidden");
  document.body.classList.remove("penalty-lock");
}
function triggerPenaltyVibration() {
  if (!navigator.vibrate) return;

  // Subtle but disturbing pattern
  navigator.vibrate([
    120,   // vibrate
    80,    // pause
    120,
    80,
    200
  ]);
}
function isViewportTooSmall() {
  const minWidth = 360;   // safe phone width
  const minHeight = 520;  // safe quiz height

  return (
    window.innerWidth < minWidth ||
    window.innerHeight < minHeight
  );
}

/* =========================
   DETECTION HOOKS
========================= */

// TAB / APP SWITCH
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    showPenalty("tab-switch");
  }
});

// WINDOW BLUR (mobile app background)
window.addEventListener("blur", () => {
  showPenalty("blur");
});

// VIEWPORT / SPLIT SCREEN
let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

window.addEventListener("resize", () => {
  if (!quizStarted) return;

  if (isViewportTooSmall()) {
    showPenalty("resize-small");
  }
});

// PAGE RELOAD WARNING
window.addEventListener("beforeunload", e => {
  if (quizStarted) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function showXpGain(amount) {
  const xpBox = document.querySelector(".xp-box");
  if (!xpBox) return;

  const float = document.createElement("div");
  float.className = "xp-float";
  float.textContent = `+${amount}`;

  xpBox.appendChild(float);

  // remove after animation
  setTimeout(() => {
    float.remove();
  }, 1200);
}
/* =========================
   KEYBOARD CONTROLS
   N = Next
   P = Previous
========================= */

document.addEventListener("keydown", (e) => {
  // ❌ Ignore if typing inside input / textarea
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  // ❌ Only work when quiz is active
  if (!quizActive) return;

  // Normalize key
  const key = e.key.toLowerCase();

  // NEXT  (N)
  if (key === "n") {
    // same behavior as clicking Next button
    if (!nextBtn.disabled) {
      nextBtn.click();
    }
  }

  // PREVIOUS (P)
  if (key === "p") {
    if (!prevBtn.disabled) {
      prevBtn.click();
    }
  }
});
/* =========================
   SPACEBAR → PLAY / PAUSE VN
========================= */

document.addEventListener("keydown", (e) => {
  // Ignore if typing
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  // Space key
  if (e.code !== "Space") return;

  // Prevent page scroll
  e.preventDefault();

  // Find currently open VN card
  const activeCard = document.querySelector(".vn-card.active");
  if (!activeCard) return;

  const audio = activeCard.audioInstance;
  const playBtn = activeCard.querySelector(".vn-play-btn");
  const playIcon = playBtn.querySelector("i");

  if (!audio) return;

  if (audio.paused) {
    // Pause all others first
    document.querySelectorAll(".vn-card").forEach(c => {
      if (c !== activeCard && c.audioInstance) {
        c.audioInstance.pause();
        c.audioInstance.currentTime = 0;
        const ic = c.querySelector(".vn-play-btn i");
        if (ic) ic.className = "fa-solid fa-play";
      }
    });

    audio.play();
    playIcon.className = "fa-solid fa-pause";
  } else {
    audio.pause();
    playIcon.className = "fa-solid fa-play";
  }
});


// 🔥 Hook into your existing question attempt recorder
const originalRecordQuestionAttempt = recordQuestionAttempt;

async function saveChapterDetailedStats() {
  if (!currentUser) return;

  if (!round1Snapshot || round1Snapshot.length < 30) {
    console.log("⚠️ Detailed stats skipped (<30 questions)");
    return;
  }

  const correct = round1Snapshot.filter(q => q.correct).length;
  const total = round1Snapshot.length;

  await addDoc(
    collection(db, "users", currentUser.uid, "chapterStats"),
    {
      userId: currentUser.uid, // 🔥 REQUIRED FOR RULES
      date: new Date().toISOString().slice(0, 10),
      subject: currentSubject?.name || "",
      chapter: currentChapter?.name || "",
      totalQuestions: total,
      correct: correct,
      wrong: total - correct,
      marks: marks,
      rounds: round,
      accuracy: Math.round((correct / total) * 100),
      createdAt: serverTimestamp()
    }
  );

  console.log("✅ Chapter detailed stats saved");
}
function getWeekKey() {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const year = now.getFullYear();

  // week number calculation
  const firstJan = new Date(year, 0, 1);
  const days = Math.floor((now - firstJan) / 86400000);
  const week = Math.ceil((days + firstJan.getDay() + 1) / 7);

  return `${year}-W${week}`;
}