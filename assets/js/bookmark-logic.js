
/* =========================
   FIREBASE + XP
========================= */
import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  setDoc,      // ✅ ADD
  deleteDoc,   // ✅ ADD
  doc          // ✅ ADD
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let currentUser = null;


document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async user => {
    if (!user) return;

    currentUser = user; // ✅ THIS WAS MISSING

    await loadBookmarkMap(user.uid);
    await loadSubjectsFromFirebase(user.uid);
  });
});

/* =========================
   DATA
========================= */
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
let timeLeft = 45;
let answered = false;

let activeQuestions = [];
let round1Snapshot = [];

let subjects = [];

let bookmarkMap = {};

async function loadBookmarkMap(uid) {
  bookmarkMap = {};

  const snap = await getDocs(
    collection(db, "users", uid, "bookmarks")
  );

  snap.forEach(docSnap => {
    bookmarkMap[docSnap.id] = true;
  });

  console.log("⭐ Bookmark map loaded", bookmarkMap);
}

async function loadSubjectsFromFirebase(uid) {
  console.log("🔄 Fetching questions from Firestore...");

  subjects = [];

  try {
    const snap = await getDocs(
      collection(db, "users", uid, "bookmarks")
    );

    if (snap.empty) {
      console.warn("⚠️ No questions found in bookmarks");
      return;
    }

    const map = {}; // subject → chapter → questions

    snap.forEach(docSnap => {
      const d = docSnap.data();

      if (!d.subject || !d.chapter || !d.question) {
        console.warn("⚠️ Skipped invalid doc:", docSnap.id, d);
        return;
      }

      if (!map[d.subject]) map[d.subject] = {};
      if (!map[d.subject][d.chapter]) map[d.subject][d.chapter] = [];

      map[d.subject][d.chapter].push({
        text: d.question,
        options: d.options,
        correctIndex: d.correctIndex
      });
    });

    // convert to UI-friendly structure
    subjects = Object.keys(map).map(subjectName => ({
      name: subjectName,
      chapters: Object.keys(map[subjectName]).map(chName => ({
        name: chName,
        questions: map[subjectName][chName]
      }))
    }));

    console.log("✅ Firestore fetch SUCCESS");
    console.log("📘 Subjects parsed:", subjects);

  } catch (err) {
    console.error("❌ Firestore fetch FAILED", err);
  }
}

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
  resetReviewState();
// 🔥 Filter out removed bookmarks (safety)
baseQuestions = baseQuestions.filter(
  q => bookmarkMap[getQuestionId(q)]
);
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

  baseQuestions = currentChapter.questions
    .slice(0, limit)
    .map(q => ({
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
resetBtn.onclick = async () => {
  if (currentUser) {
  await loadBookmarkMap(currentUser.uid);
  await loadSubjectsFromFirebase(currentUser.uid);
}
  // 🔥 Clear previous attempt data
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



========================= */

function getLocalDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
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
  timeLeft = 45;
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timer);
      autoNext(); // ⬅ NO correct shown
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

function renderQuestion() {
  clearTimeout(autoNextTimeout);
  autoNextTimeout = null;
  clearTimer();
  answered = false;

  const q = activeQuestions[qIndex];

  qText.innerHTML = `${qIndex + 1}. ${q.text}`;

  /* ⭐ BOOKMARK BUTTON */
/* ⭐ BOOKMARK BUTTON (Font Awesome) */
/* ⭐ BOOKMARK BUTTON (AUTO-FILL FROM FIREBASE) */
const star = document.createElement("i");
star.className = "bookmark-btn fa-star";

const qid = getQuestionId(q);

// 🔥 auto-fill state
q.bookmarked = !!bookmarkMap[qid];

if (q.bookmarked) {
  star.classList.add("fa-solid", "active");
} else {
  star.classList.add("fa-regular");
}

star.onclick = async () => {
  console.log("⭐ toggle", qid, q.bookmarked);
  if (!currentUser) return;

  q.bookmarked = !q.bookmarked;

  if (q.bookmarked) {
    star.classList.remove("fa-regular");
    star.classList.add("fa-solid", "active");
    await saveBookmark(q);
    bookmarkMap[qid] = true;
} else {
  // ❌ UNBOOKMARK
  star.classList.remove("fa-solid", "active");
  star.classList.add("fa-regular");

  await removeBookmark(q);
  delete bookmarkMap[qid];

  // 🔥 REMOVE FROM ALL ACTIVE QUIZ STATE
  activeQuestions = activeQuestions.filter(
    item => getQuestionId(item) !== qid
  );

  baseQuestions = baseQuestions.filter(
    item => getQuestionId(item) !== qid
  );

  round1Snapshot = round1Snapshot.filter(
    item => getQuestionId(item) !== qid
  );

  // 🔥 IF CURRENT QUESTION WAS REMOVED → MOVE SAFELY
  if (qIndex >= activeQuestions.length) {
    qIndex = Math.max(0, activeQuestions.length - 1);
  }

  // 🔥 RE-RENDER OR END QUIZ
  if (activeQuestions.length === 0) {
    finishRound(); // nothing left
  } else {
    renderQuestion();
  }
}
};

qText.appendChild(star);

  progressBar.style.width =
    ((qIndex + 1) / activeQuestions.length) * 100 + "%";

  optionsBox.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.disabled = q.attempted;

    if (q.attempted && i === q.correctIndex) {
      btn.classList.add("correct");
    }

    btn.onclick = () => handleAnswer(btn, i);
    optionsBox.appendChild(btn);
  });

  prevBtn.disabled = qIndex === 0;
  nextBtn.disabled = !q.attempted;

  if (!q.attempted) startTimer();
}

/* =========================
   ANSWER
========================= */
function handleAnswer(btn, idx) {
  if (answered) return;
  answered = true;
  clearTimer();

  const q = activeQuestions[qIndex];
  q.attempted = true;

  const all = optionsBox.children;
  [...all].forEach(b => (b.disabled = true));

if (idx === q.correctIndex) {
  btn.classList.add("correct");
  q.correct = true;
  if (round === 1) {
    marks += 1;
  }

  setTimeout(next, 1000);
} else {
  btn.classList.add("wrong");
  all[q.correctIndex].classList.add("correct");
  q.correct = false;
if (round === 1) {
    marks -= 0.25;
  }
  
  // ✅ Enable next immediately
  nextBtn.disabled = false;

  // ⏳ Auto move after 3s (if user doesn't click)
  autoNextTimeout = setTimeout(() => {
    next();
  }, 3000);
    q.selectedIndex = idx;
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

/* =========================
   FINISH ROUND
========================= */
function finishRound() {
if (!round1Completed) {
  round1Completed = true;

  // 📸 Freeze round-1 data
  round1Snapshot = activeQuestions.map(q => ({ ...q }));
  window.round1Snapshot = round1Snapshot;

  // 🎯 UI
  marksValue.textContent = marks.toFixed(2);
  marksBox.classList.remove("hidden");
  if (resultActions) resultActions.classList.remove("hidden");
  
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
/* =========================
   KEYBOARD CONTROLS (DESKTOP)
========================= */
/* =========================
   KEYBOARD SCROLL CONTROL
========================= */

let scrollInterval = null;
const SCROLL_STEP = 60;     // small scroll (tap)
const SCROLL_SPEED = 12;   // smooth continuous speed

function startScroll(direction) {
  if (scrollInterval) return;

  scrollInterval = setInterval(() => {
    window.scrollBy({
      top: direction * SCROLL_SPEED,
      behavior: "auto"
    });
  }, 16); // ~60fps
}

function stopScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
}
/* =========================
   KEYBOARD SHORTCUTS
========================= */
document.addEventListener("keydown", e => {
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  /* -------------------------
     ↓ ARROW → Scroll Down
  ------------------------- */
  if (e.key === "ArrowDown") {
    e.preventDefault();

    // Small tap scroll
    window.scrollBy({ top: SCROLL_STEP, behavior: "smooth" });

    // Long press → continuous scroll
    startScroll(1);
  }

  /* -------------------------
     ↑ ARROW → Scroll Up
  ------------------------- */
  if (e.key === "ArrowUp") {
    e.preventDefault();

    window.scrollBy({ top: -SCROLL_STEP, behavior: "smooth" });
    startScroll(-1);
  }

  /* -------------------------
     B → Toggle Bookmark
  ------------------------- */
  if (e.key.toLowerCase() === "b") {
    e.preventDefault();

    const star = document.querySelector(".bookmark-btn");
    if (star) star.click();
  }

  /* -------------------------
     R → Toggle Review
  ------------------------- */
  if (e.key.toLowerCase() === "r") {
    reviewBtn?.click();
  }

  /* -------------------------
     ESC → Close Review
  ------------------------- */
  if (e.key === "Escape") {
    if (reviewPanel?.classList.contains("open")) {
      reviewBtn?.click();
    }
  }

  /* -------------------------
     CTRL + P → Save PDF
  ------------------------- */
  if (e.ctrlKey && e.key.toLowerCase() === "p") {
    e.preventDefault();
    pdfBtn?.click();
  }
});

/* =========================
   STOP SCROLL ON KEY RELEASE
========================= */
document.addEventListener("keyup", e => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    stopScroll();
  }
});