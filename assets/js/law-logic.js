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

let currentUser = null;
let currentXP = 0;
let xpApplied = false;
const xpEl = document.getElementById("xpValue");

auth.onAuthStateChanged(user => {
  if (!user) {
    currentUser = null;
    currentXP = 0;
    if (xpEl) xpEl.textContent = "00";
    return;
  }

  currentUser = user;

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

import { lawChapters } from "./questions-law.js";
/* =========================
   DATA
========================= */

let currentSubject = null;
let currentChapter = null;

let baseQuestions = [];     // original limited list

let wrongQuestions = [];    // retry pool
let totalMarks = 0;
let totalXp = 0;
let qIndex = 0;
let round = 1;
let round1Completed = false;

let autoNextTimeout = null;

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


const startBtn = document.getElementById("startQuiz");
const resetBtn = document.getElementById("resetQuiz");

const quizArea = document.getElementById("quizArea");
const qText = document.getElementById("questionText");
const answerBox = document.getElementById("lawAnswer");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
nextBtn.disabled = true;
const progressBar = document.getElementById("progressBar");

const roundLabel = document.getElementById("roundLabel");
const marksBox = document.getElementById("marksBox");
const marksValue = document.getElementById("marksValue");
const chapterBtn = document.getElementById("chapterBtn");
const chapterText = document.getElementById("chapterText");
const chapterPopup = document.getElementById("chapterPopup");

chapterBtn.classList.remove("disabled");

chapterBtn.onclick = () => {
  chapterPopup.innerHTML = "";
  chapterPopup.classList.add("show");

  lawChapters.forEach(ch => {
    const b = document.createElement("button");
    b.textContent = ch.name;

    b.onclick = () => {
      currentChapter = ch;
      chapterText.textContent = ch.name;
      chapterPopup.classList.remove("show");
    };

    chapterPopup.appendChild(b);
  });
};
/* =========================
   INITIAL STATE (PAGE LOAD)
========================= */
resetBtn.disabled = true;
prevBtn.disabled = true;
lawAnswer.addEventListener("input", () => {
  const text = lawAnswer.innerText.trim();
  nextBtn.disabled = text.length === 0;
});

const resultActions = document.querySelector(".result-actions");
if (resultActions) resultActions.classList.add("hidden");
/* =========================
   SUBJECT POPUP
========================= */
function closeAllPopups() {
  subjectPopup.classList.remove("show");
  chapterPopup.classList.remove("show");
}
/* =========================
   START
========================= */
startBtn.onclick = () => {
  // 🔥 FORCE CLEAN START UI
qText.textContent = "";
const reviewPanel = document.getElementById("reviewPanel");
const reviewContent = document.getElementById("reviewContent");
reviewPanel.classList.add("hidden");
reviewContent.innerHTML = "";

  const actions = document.querySelector(".result-actions");
  if (actions) actions.classList.add("hidden");

  lawAnswer.style.display = "block";
  lawAnswer.contentEditable = true;
  lawAnswer.classList.remove("readonly");

  document.getElementById("lawKeywordsNeeded").style.display = "none";

  // ---------- EXISTING CHECK ----------
  if (!currentChapter) {
    alert("Select chapter");
    return;
  }

  // ---------- EXISTING LOGIC ----------
  activeQuestions = currentChapter.questions.map(q => ({
    ...q,
    userAnswer: "",
    locked: false,
    xpApplied: false   //
  }));

  qIndex = 0;
  quizArea.classList.remove("hidden");
  resetBtn.disabled = false;
  prevBtn.disabled = true;

reviewContent.innerHTML = "";
delete reviewContent.dataset.ready;
  renderLawQuestion();
  
};

/* =========================
   RESET
========================= */
resetBtn.onclick = () => {
  qText.textContent = "";
  // ---------- CORE STATE ----------
  qIndex = 0;
  activeQuestions = [];
  round1Snapshot = [];
  window.round1Snapshot = [];

  // ---------- QUIZ UI ----------
  quizArea.classList.add("hidden");

  // reset chapter
  currentChapter = null;
  chapterText.textContent = "None Selected";

  // reset buttons
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  resetBtn.disabled = true;

  // ---------- ANSWER BOX ----------
  lawAnswer.innerHTML = "";
  lawAnswer.style.display = "block";     // 🔥 restore
  lawAnswer.contentEditable = true;
  lawAnswer.classList.remove("readonly");

  // ---------- KEYWORDS ----------
  const keyBox = document.getElementById("lawKeywordsNeeded");
  keyBox.innerHTML = "";
  keyBox.style.display = "none";

  // ---------- REVIEW ----------

const reviewPanel = document.getElementById("reviewPanel");
const reviewContent = document.getElementById("reviewContent");
reviewPanel.classList.add("hidden");
reviewContent.innerHTML = "";

  // ---------- RESULT ACTIONS ----------
  const actions = document.querySelector(".result-actions");
  if (actions) actions.classList.add("hidden");

  // ---------- QUESTION TEXT ----------
  qText.textContent = "";
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
  renderLawQuestion();
}
/* =========================
   TIMER
========================= */


function updateTimer() {
  timeEl.textContent = String(timeLeft).padStart(2, "0");
  timeEl.classList.toggle("danger", timeLeft <= 5);
}

function clearTimer() {
  clearInterval(timer);
}
function getQuestionId(q) {
  // stable unique id
  return btoa(q.text).replace(/=/g, "");
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

function renderLawQuestion() {
  if (!activeQuestions.length) return;

  const q = activeQuestions[qIndex];
  qText.textContent = `${qIndex + 1}. ${q.question}`;

  qText.textContent = `${qIndex + 1}. ${q.question}`;

  // answer
  if (q.locked) {
  lawAnswer.innerHTML = q.userAnswer;
} else {
  lawAnswer.innerHTML = "";
}
  lawAnswer.style.whiteSpace = "pre-wrap";
lawAnswer.contentEditable = !q.locked;
lawAnswer.classList.toggle("readonly", q.locked);

  const box = document.getElementById("lawKeywordsNeeded");
  box.innerHTML = "";

  if (q.locked) {
    box.style.display = "flex";

    q.keywords.forEach(k => {
      const used = q.userAnswer
        ? new RegExp(`\\b${k}\\b`, "i").test(q.userAnswer)
        : false;

      const span = document.createElement("span");
      span.className = "law-keyword" + (used ? " used" : "");
      span.textContent = k;
      box.appendChild(span);
    });
  } else {
    box.style.display = "none";
  }

  prevBtn.disabled = qIndex === 0;
  nextBtn.disabled = !q.locked && lawAnswer.innerText.trim().length === 0;
}

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
  if (qIndex === 0) return;
  qIndex--;
  renderLawQuestion();
};

nextBtn.onclick = () => {
  const q = activeQuestions[qIndex];

  // 1️⃣ PURE TEXT (no spans, no nesting)
  let rawText = lawAnswer.innerText;

  // 2️⃣ SAFE HTML + LINE BREAKS
 rawText = rawText
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  // normalize multiple newlines to single
  .replace(/\n{3,}/g, "\n\n")
  .replace(/\n/g, "<br>");

  // 3️⃣ APPLY HIGHLIGHT ONCE
  let html = rawText;

  q.keywords.forEach(k => {
    const r = new RegExp(`\\b(${k})\\b`, "gi");
    html = html.replace(r, `<span class="keyword-hit">$1</span>`);
  });

  q.userAnswer = html;
q.locked = true;

/* 🔥 LAW ANSWER EVALUATION */
const evalResult = evaluateLawAnswer({
  userAnswerHTML: html,
  keywords: q.keywords
});

q.eval = evalResult; // save per-question result
if (currentUser && evalResult.xp > 0 && !q.xpApplied) {
  q.xpApplied = true;

  // 🔥 Immediate XP update
  updateDoc(doc(db, "users", currentUser.uid), {
    xp: increment(evalResult.xp)
  });

  // 🔥 Activity / streak / daily XP
  recordQuestionAttempt(evalResult.xp);
  updateBestXpIfNeeded();
}

console.log("📊 Law Eval:", evalResult);

  lawAnswer.innerHTML = html;
  lawAnswer.setAttribute("contenteditable", "false");

  if (qIndex === activeQuestions.length - 1) {
    finishLawTest();
    return;
  }

  qIndex++;
  setTimeout(renderLawQuestion, 300);
};

/* =========================
   FINISH ROUND
========================= */

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

function finishLawTest() {
  qText.textContent = "सारे Attempt कर दिए! 🤗";

  lawAnswer.style.display = "none";
  document.getElementById("lawKeywordsNeeded").style.display = "none";

  prevBtn.disabled = true;
  nextBtn.disabled = true;

  // ✅ EXPOSE DATA FOR REVIEW / PDF
  window.activeQuestions = activeQuestions.map(q => ({ ...q }));
  window.round1Snapshot = activeQuestions.map(q => ({
    ...q,
    attempted: true
  }));

  window.currentChapterName = currentChapter?.name || "";
totalMarks = 0;
totalXp = 0;

activeQuestions.forEach(q => {
  if (q.eval) {
    totalMarks += q.eval.marks;
    totalXp += q.eval.xp;
  }
});

// round marks to .5 steps
totalMarks = Math.round(totalMarks * 2) / 2;

// UI
marksValue.textContent = totalMarks.toFixed(1);
marksBox.classList.remove("hidden");

console.log("🏁 FINAL MARKS:", totalMarks);
console.log("⚡ FINAL XP:", totalXp);

  const actions = document.querySelector(".result-actions");
  if (actions) actions.classList.remove("hidden");
}
function evaluateLawAnswer({ userAnswerHTML, keywords }) {
  // ---------- CLEAN TEXT ----------
  const text = userAnswerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .trim();

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // ---------- KEYWORD MATCH ----------
  let used = 0;

  keywords.forEach(k => {
    const safe = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const r = new RegExp(`\\b${safe}\\b`, "i");
    if (r.test(text)) used++;
  });

  const totalKeywords = keywords.length;
  const keywordPercent =
    totalKeywords === 0 ? 0 : (used / totalKeywords) * 100;

  // ---------- XP LOGIC ----------
  let xp = 0;
  if (keywordPercent >= 100) xp = 10;
  else if (keywordPercent >= 80) xp = 8;
  else if (keywordPercent >= 40) xp = 4;
  else if (keywordPercent >= 20) xp = 2;

  // ---------- MARKS LOGIC ----------
  let marks = (keywordPercent / 100) * 4;

  // Word count caps
  if (wordCount < 100) marks = Math.min(marks, 1);
  else if (wordCount >= 200) marks = Math.min(marks, 4);

  // Minimum marks rule
  if (marks < 1) marks = 1;

  // 🔒 FORCE .5 STEPS ONLY
  marks = Math.round(marks * 2) / 2;

  return {
    wordCount,
    keywordsUsed: used,
    totalKeywords,
    keywordPercent: Math.round(keywordPercent),
    marks,
    xp
  };
}
window.evaluateLawAnswer = evaluateLawAnswer;