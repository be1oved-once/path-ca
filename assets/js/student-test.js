console.log("🎓 student-test.js loaded");

import {
  collection,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  onSnapshot,
  Timestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { db } from "./firebase.js";
import { auth } from "./firebase.js";

const TEMP_TEST_REF = doc(db, "tempTests", "current");
const skeleton = document.getElementById("studentSkeleton");
const quizSetup = document.querySelector(".quiz-setup");

let testStarted = false;
let serverTimerInterval = null;
let remainingSeconds = 0;
let user = null;

import { onAuthStateChanged } from 
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

let currentUser = null; // global

onAuthStateChanged(auth, usr => {
  if (!usr) {
    console.log("⏳ Waiting for user login...");
    return;
  }

  currentUser = usr; // ✅ store properly
  console.log("✅ Auth ready:", currentUser.uid);

  attachTestListener(); // attach snapshot AFTER auth
});
function attachTestListener() {
  onSnapshot(TEMP_TEST_REF, (snap) => {
  if (!snap.exists()) {
    console.log("❌ No active test");
    return;
  }

  const data = snap.data();
  // 🔥 ADMIN HEARTBEAT CHECK
// ✅ TEST VALIDITY CHECK (ONLY TIMER BASED)
if (data.status !== "live") {
  console.log("⌛ Test not live yet");
  return;
}

if (!data.expiresAt) {
  console.warn("⚠️ No expiry set");
  return;
}

const now = Date.now();
const end = data.expiresAt.toDate().getTime();

if (now >= end) {
  console.log("⏰ Test expired");
  return;
}

  window.currentTestId = data.testId;
  // ✅ Only react when test is LIVE
  if (data.status !== "live") {
  console.log("⌛ Waiting for live test");
  return; // skeleton stays
}

  // ⛔ Prevent double start
  if (testStarted) return;
  testStarted = true;

  console.log("🚀 Student test LIVE");

  // ── Activate anti-cheat restrictions ──
  if (typeof window.__acActivate === "function") window.__acActivate();
// ---- MARK STUDENT AS JOINED ----
if (!currentUser) return; // ✅ guard

const joinRef = doc(
  db,
  "users",
  currentUser.uid,
  "testJoins",
  window.currentTestId
);

setDoc(joinRef, {
  testId: window.currentTestId,
  joinedAt: serverTimestamp()
}).catch(() => {});
  /* =========================
     HEADER / META
  ========================= */
  subjectText.textContent = data.subject || "—";

  if (pageTextBox) {
    pageTextBox.value = data.pageText || "";
    pageTextBox.setAttribute("readonly", true);
  }

  /* =========================
     QUESTIONS
  ========================= */
  const questions = data.questions || [];
  if (!questions.length) {
    alert("No questions found");
    return;
  }

  // 🔥 Normalize questions for student logic
  window.activeQuestions = questions.map(q => ({
    text: q.qText,
    options: q.type === "mcq" ? q.options : [],
    correctIndex: q.correctIndex,
    type: q.type,

    attempted: false,
    correct: false,
    selectedIndex: null
  }));

  /* =========================
     TIMER (SERVER SYNC via expiresAt)
     Uses expiresAt — same source as admin dashboard + Cloudflare Worker.
     Never drifts, works even if admin is offline.
  ========================= */
  if (!data.expiresAt) {
    console.warn("⚠️ Timer not started yet — expiresAt missing");
    return;
  }

  const expiresMs = data.expiresAt.toDate().getTime();
  syncServerTimer(expiresMs);

  /* =========================
     START QUIZ
  ========================= */
  quizArea.classList.remove("hidden");
  // ✅ HIDE SKELETON – TEST ARRIVED
// ✅ remove skeleton
if (skeleton) skeleton.style.display = "none";

// ✅ reveal UI safely
document
  .querySelectorAll(".hidden-by-skeleton")
  .forEach(el => el.classList.remove("hidden-by-skeleton"));
  startStudentQuiz(); // 👈 tumhara existing function
});
}


/* =========================
   DATA
========================= */
let currentSubject = null;
let baseQuestions = [];     // original limited list

let qIndex = 0;
let marks = 0;
let round1Completed = false;
let autoNextTimeout = null;
let answered = false;

let activeQuestions = [];
let round1Snapshot = [];
let submissionDone = false;

// 🔥 expose globally
window.round1Snapshot = round1Snapshot;
/* =========================
   DOM
========================= */

const quizArea = document.getElementById("quizArea");
const qText = document.getElementById("questionText");
const optionsBox = document.getElementById("optionsBox");
const subjectText = document.getElementById("subjectText");
const timerEl = document.getElementById("timeLeft");

const pageTextBox   = document.getElementById("pageTextBox");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const progressBar = document.getElementById("progressBar");

const marksBox = document.getElementById("marksBox");
const marksValue = document.getElementById("marksValue");

function syncServerTimer(expiresMs) {
  clearInterval(serverTimerInterval);
  
  function tick() {
    const left = Math.max(0, expiresMs - Date.now());
    remainingSeconds = Math.ceil(left / 1000);
    updateTimerUI(remainingSeconds);
    
    if (remainingSeconds <= 0) {
      clearInterval(serverTimerInterval);
      onTimeUp();
    }
  }
  
  tick(); // immediate
  serverTimerInterval = setInterval(tick, 1000);
}
function updateTimerUI(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");

  timerEl.textContent = `${m}:${s}`;
}
function onTimeUp() {
  console.log("⏰ TIME UP (student)");

  // ── Deactivate anti-cheat ──
  if (typeof window.__acDeactivate === "function") window.__acDeactivate();

  timerEl.textContent = "TIME UP";

  // disable options
  optionsBox.querySelectorAll("button, textarea").forEach(el => {
    el.disabled = true;
  });

  // finish quiz safely
  finishRound(); // 👈 tumhara existing function
}
/* =========================
   INITIAL STATE (PAGE LOAD)
========================= */
 ;
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

function resetReviewState() {
  round1Snapshot = [];
  window.round1Snapshot = [];

  const reviewContent = document.getElementById("reviewContent");
  const reviewPanel = document.getElementById("reviewPanel");

  if (reviewContent) reviewContent.innerHTML = "";
  if (reviewPanel) reviewPanel.classList.add("hidden");
}

function startStudentQuiz() {
  // reset state
  qIndex = 0;
  marks = 0;
  round1Completed = false;;

  // use questions received from admin
  baseQuestions = window.activeQuestions.map(q => ({
    ...q,
    attempted: false,
    correct: false,
    selectedIndex: null
  }));

  startRound(baseQuestions);
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

function renderReview() {
  const reviewContent = document.getElementById("reviewContent");
  reviewContent.innerHTML = "";

  round1Snapshot.forEach((q, i) => {
    const block = document.createElement("div");
    block.className = "review-question";

    const title = document.createElement("div");
    title.textContent = `${i + 1}. ${q.text}`;
    block.appendChild(title);

    // 🔹 MCQ REVIEW
    if (q.type === "mcq") {
      q.options.forEach((opt, idx) => {
        const optDiv = document.createElement("div");
        optDiv.textContent = opt;

        if (idx === q.correctIndex) optDiv.classList.add("correct");
        if (idx === q.selectedIndex && !q.correct)
          optDiv.classList.add("wrong");

        block.appendChild(optDiv);
      });
    }

    // 🔹 DIRECT ANSWER REVIEW
    else {
      const ta = document.createElement("textarea");
      ta.className = "direct-answer option-like";
      ta.value = q.userAnswer || "";
      ta.readOnly = true;

      block.appendChild(ta);
    }

    reviewContent.appendChild(block);
  });
}
/* =========================
   RENDER
========================= */
function cleanQuestionText(text) {
  return text.replace(/^(\(\d+\)|\d+\.|\d+\)|\s)+/g, "").trim();
}

function renderQuestion() {
  clearTimeout(autoNextTimeout);
  autoNextTimeout = null;
  answered = false;

  const q = activeQuestions[qIndex]; // ✅ FIX

  // 🔥 Last question → Submit
  if (qIndex === activeQuestions.length - 1) {
    nextBtn.textContent = "Submit";
    nextBtn.classList.add("submit-btn");
  } else {
    nextBtn.textContent = "Next";
    nextBtn.classList.remove("submit-btn");
  }

  qText.innerHTML = `${qIndex + 1}. ${q.text}`;
  progressBar.style.width =
    ((qIndex + 1) / activeQuestions.length) * 100 + "%";

  optionsBox.innerHTML = "";

  // 🔹 MCQ
  if (q.type === "mcq") {
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.disabled = q.attempted;
      btn.onclick = () => handleAnswer(btn, i);
      optionsBox.appendChild(btn);
    });
  }

  // 🔹 DIRECT ANSWER
  // 🔹 DIRECT (text answer)
else {
  const ta = document.createElement("textarea");
  ta.className = "option-textarea";

ta.placeholder = "Type your answer here…";
  ta.value = q.userAnswer || "";
  ta.disabled = q.attempted;

  ta.addEventListener("input", () => {
    q.userAnswer = ta.value.trim();

    if (q.userAnswer.length > 0) {
      q.attempted = true;

      // ✅ enable next / submit immediately
      nextBtn.disabled = false;

      // 🔥 if last question → make sure it says SUBMIT
      if (qIndex === activeQuestions.length - 1) {
        nextBtn.textContent = "Submit";
        nextBtn.classList.add("submit-btn");
      }
    } else {
      q.attempted = false;
      nextBtn.disabled = true;
    }
  });

  optionsBox.appendChild(ta);
}

  prevBtn.disabled = qIndex === 0;
  nextBtn.disabled = !q.attempted;
}

/* =========================
   ANSWER
========================= */
function handleAnswer(btn, idx) {
  const q = activeQuestions[qIndex];

  // 🔴 IMPORTANT LINE (THIS WAS MISSING)
  q.selectedIndex = idx;

  if (answered) return;
  answered = true;

  q.attempted = true;

  const all = optionsBox.children;
  [...all].forEach(b => (b.disabled = true));

  if (idx === q.correctIndex) {
    btn.classList.add("correct");
    q.correct = true;
    marks += 1;
    setTimeout(next, 1000);
  } else {
    btn.classList.add("wrong");
    all[q.correctIndex].classList.add("correct");
    q.correct = false;
    marks -= 0.25;
    nextBtn.disabled = false;
  }
}

async function saveUserMarks() {
  const user = currentUser;  // ✅ use stored auth user
  if (!user) return;

  const testId = window.currentTestId;

  const submissionRef = doc(
    db,
    "users",
    user.uid,
    "testSubmissions",
    `submission_${testId}`
  );

  // 🔥 CHECK if already submitted
  const existing = await getDoc(submissionRef);

  if (existing.exists()) {
    console.log("⚠️ Already submitted — showing locked screen");

    // 👉 SHOW ALREADY SUBMITTED UI
    quizArea.classList.remove("hidden");
    qText.textContent = "You already submitted this test.";
    timerEl.textContent = "--";
    optionsBox.innerHTML = "";
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    return; // ⛔ stop further saving
  }

  // ---------- Continue normal saving ----------
  const answers = activeQuestions.map(q => {
    if (q.type === "mcq") {
      return {
        type: "mcq",
        question: q.text,
        selectedIndex: q.selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect: q.selectedIndex === q.correctIndex,
        evaluated: true
      };
    }

    return {
      type: "direct",
      question: q.text,
      answerText: q.userAnswer || "",
      evaluated: false
    };
  });

  const mcqQuestions = activeQuestions.filter(q => q.type === "mcq");
  const total = mcqQuestions.length;
  const correct = mcqQuestions.filter(q => q.correct).length;
  const wrong = mcqQuestions.filter(q => q.attempted && !q.correct).length;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  const username = userSnap.exists()
    ? userSnap.data().username
    : "Student";

  await setDoc(submissionRef, {
    uid: user.uid,
    username,
    testId,
    subject: subjectText.textContent || "",
    marks: Number(marks.toFixed(2)),
    total,
    correct,
    wrong,
    answers,
    submittedAt: serverTimestamp()
  });

  console.log("✅ Submission saved successfully");

  // Remove join marker after submit
  if (currentUser) {
    await deleteDoc(
      doc(db, "users", currentUser.uid, "testJoins", window.currentTestId)
    ).catch(() => {});
  }
}
function autoNext() {
  clearTimeout(autoNextTimeout);
autoNextTimeout = null;
  q.attempted = true;
  q.correct = false;
    q.timedOut = true;      // ✅ ADD THIS
  q.selectedIndex = null; // ✅ ENSURE NO SELECTION
  next();
}

/* =========================
   NAV
========================= */
function next() {
  if (qIndex < activeQuestions.length - 1) {
    qIndex++;
    renderQuestion();
  } else {
    // 🔥 LAST QUESTION → SUBMIT
    finishRound();
  }
}

prevBtn.onclick = () => {
  if (qIndex > 0) {
    qIndex--;
    renderQuestion();
  }
};

nextBtn.onclick = async () => {
  if (autoNextTimeout) {
    clearTimeout(autoNextTimeout);
    autoNextTimeout = null;
  }

  // 🔥 LAST QUESTION → SUBMIT
  if (qIndex === activeQuestions.length - 1) {
    finishRound();
    return;
  }

  next();
};
/* =========================
   FINISH ROUND
========================= */
function finishRound() {
  if (round1Completed) return;
  round1Completed = true;

  // ── Deactivate anti-cheat — test is over ──
  if (typeof window.__acDeactivate === "function") window.__acDeactivate();

  saveUserMarks();
  
  round1Snapshot = activeQuestions.map(q => ({ ...q }));
  window.round1Snapshot = round1Snapshot;

  marksValue.textContent = marks.toFixed(2);
  marksBox.classList.remove("hidden");
  resultActions?.classList.remove("hidden");

qText.textContent = "सब सही कर दिए! 🤗 मार्क्स नीच दिए है!";
  optionsBox.innerHTML = "";
  progressBar.style.width = "100%";

  prevBtn.disabled = true;
  nextBtn.disabled = true;

  timerEl.textContent = "--";
}