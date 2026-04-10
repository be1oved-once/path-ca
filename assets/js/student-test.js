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
let penaltyPerWrong = 0.25; // default; overwritten from Firestore data.penaltyMarks

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

let currentUser = null;
let testListenerUnsub = null; // FIX #7: store unsub handle

onAuthStateChanged(auth, usr => {
  if (!usr) {
    console.log("⏳ Waiting for user login...");
    return;
  }

  currentUser = usr;
  console.log("✅ Auth ready:", currentUser.uid);

  attachTestListener();
});

function attachTestListener() {
  // FIX #7: unsub any previous listener before attaching a new one
  if (testListenerUnsub) {
    testListenerUnsub();
    testListenerUnsub = null;
  }

  testListenerUnsub = onSnapshot(TEMP_TEST_REF, (snap) => {

    // ─────────────────────────────────────────────────
    // FIX #2: Handle test cleared / doc deleted by admin
    // ─────────────────────────────────────────────────
    if (!snap.exists()) {
      console.log("🛑 Test cleared by admin or does not exist");

      // Stop the timer
      clearInterval(serverTimerInterval);
      serverTimerInterval = null;

      // Deactivate anti-cheat
      if (typeof window.__acDeactivate === "function") window.__acDeactivate();

      // If quiz was already running, lock everything and show message
      if (testStarted) {
        timerEl.textContent = "--";
        optionsBox.querySelectorAll("button, textarea").forEach(el => {
          el.disabled = true;
        });
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        qText.textContent = "⛔ This test has been ended by the admin.";
        optionsBox.innerHTML = "";
      } else {
        // Test hasn't started yet — show waiting state
        if (skeleton) skeleton.style.display = "";
        quizArea.classList.add("hidden");
      }

      // Reset so a future test can start fresh
      testStarted = false;
      return;
    }

    const data = snap.data();

    // ─────────────────────────────────────────────────
    // FIX #3: Single status check (removed duplicate)
    // ─────────────────────────────────────────────────
    if (data.status !== "live") {
      console.log("⌛ Test not live yet");
      return;
    }

    // ─────────────────────────────────────────────────
    // FIX #4: Expiry check before testStarted guard
    // ─────────────────────────────────────────────────
    if (!data.expiresAt) {
      // ✅ SAFE WAIT: expiresAt can be null for ~1 second during scheduled go-live
      // because admin writes status:"live" + expiresAt in one updateDoc, but
      // Firestore may deliver an intermediate snapshot. Just wait for next snapshot.
      console.warn("⚠️ expiresAt not set yet — waiting for next snapshot...");
      // ✅ CRITICAL FIX: reset testStarted so the next snapshot (with expiresAt)
      // is not blocked by the "Prevent double start" guard below.
      testStarted = false;
      return; // onSnapshot will fire again immediately with the complete data
    }

    const now = Date.now();
    const end = data.expiresAt.toDate().getTime();

    if (now >= end) {
      console.log("⏰ Test already expired on arrival — ignoring");
      // Show expired message instead of silent skeleton
      if (skeleton) skeleton.style.display = "none";
      document.querySelectorAll(".hidden-by-skeleton").forEach(el => el.classList.remove("hidden-by-skeleton"));
      if (quizSetup) quizSetup.style.display = "";
      const subj = document.getElementById("subjectText");
      if (subj) subj.textContent = "Test Ended";
      return;
    }

    // ⛔ Prevent double start
    if (testStarted) return;
    testStarted = true;

    console.log("🚀 Student test LIVE");

    penaltyPerWrong = (typeof data.penaltyMarks === "number") ? data.penaltyMarks : 0.25;

    window.currentTestId = data.testId;

    // Activate anti-cheat restrictions
    if (typeof window.__acActivate === "function") window.__acActivate();

    // Mark student as joined
    if (!currentUser) return;

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
       TIMER — synced to server expiresAt
       FIX #1: Timer only starts HERE, when status is confirmed "live"
       and expiresAt is read from Firestore (set at go-live moment by admin).
       This ensures zero drift between admin publish and student timer.
    ========================= */
    const expiresMs = data.expiresAt.toDate().getTime();
    syncServerTimer(expiresMs);

    /* =========================
       START QUIZ
    ========================= */
    quizArea.classList.remove("hidden");

    // Remove skeleton
    if (skeleton) skeleton.style.display = "none";
    document
      .querySelectorAll(".hidden-by-skeleton")
      .forEach(el => el.classList.remove("hidden-by-skeleton"));

    startStudentQuiz();
  });
}


/* =========================
   DATA
========================= */
let currentSubject = null;
let baseQuestions = [];

let qIndex = 0;
let marks = 0;
let round1Completed = false;
let autoNextTimeout = null;
let answered = false;

let activeQuestions = [];
let round1Snapshot = [];
let submissionDone = false; // FIX #6: used properly now

window.round1Snapshot = round1Snapshot;

/* =========================
   DOM
========================= */
const quizArea = document.getElementById("quizArea");
const qText = document.getElementById("questionText");
const optionsBox = document.getElementById("optionsBox");
const subjectText = document.getElementById("subjectText");
const timerEl = document.getElementById("timeLeft");

const pageTextBox = document.getElementById("pageTextBox");

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

  tick(); // immediate first tick
  serverTimerInterval = setInterval(tick, 1000);
}

function updateTimerUI(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

function onTimeUp() {
  console.log("⏰ TIME UP (student)");

  if (typeof window.__acDeactivate === "function") window.__acDeactivate();

  timerEl.textContent = "TIME UP";

  optionsBox.querySelectorAll("button, textarea").forEach(el => {
    el.disabled = true;
  });

  finishRound();
}

/* =========================
   INITIAL STATE (PAGE LOAD)
========================= */
prevBtn.disabled = true;
nextBtn.disabled = true;

const resultActions = document.querySelector(".result-actions");
if (resultActions) resultActions.classList.add("hidden");

/* =========================
   MARKS / REVIEW RESET
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
  qIndex = 0;
  marks = 0;
  round1Completed = false;
  submissionDone = false; // FIX #6: reset on each new quiz

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

    if (q.type === "mcq") {
      q.options.forEach((opt, idx) => {
        const optDiv = document.createElement("div");
        optDiv.textContent = opt;

        if (idx === q.correctIndex) optDiv.classList.add("correct");
        if (idx === q.selectedIndex && !q.correct)
          optDiv.classList.add("wrong");

        block.appendChild(optDiv);
      });
    } else {
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

  const q = activeQuestions[qIndex];

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

  if (q.type === "mcq") {
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.disabled = q.attempted;
      btn.onclick = () => handleAnswer(btn, i);
      optionsBox.appendChild(btn);
    });
  } else {
    const ta = document.createElement("textarea");
    ta.className = "option-textarea";
    ta.placeholder = "Type your answer here…";
    ta.value = q.userAnswer || "";
    ta.disabled = q.attempted;

    ta.addEventListener("input", () => {
      q.userAnswer = ta.value.trim();

      if (q.userAnswer.length > 0) {
        q.attempted = true;
        nextBtn.disabled = false;

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
    marks -= penaltyPerWrong;
    nextBtn.disabled = false;
  }
}

async function saveUserMarks() {
  // FIX #6: guard against duplicate saves
  if (submissionDone) return;
  submissionDone = true;

  const user = currentUser;
  if (!user) return;

  const testId = window.currentTestId;

  const submissionRef = doc(
    db,
    "users",
    user.uid,
    "testSubmissions",
    `submission_${testId}`
  );

  const existing = await getDoc(submissionRef);

  if (existing.exists()) {
    console.log("⚠️ Already submitted — showing locked screen");
    quizArea.classList.remove("hidden");
    qText.textContent = "You already submitted this test.";
    timerEl.textContent = "--";
    optionsBox.innerHTML = "";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

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

  if (currentUser) {
    await deleteDoc(
      doc(db, "users", currentUser.uid, "testJoins", window.currentTestId)
    ).catch(() => {});
  }
}

// FIX #5: autoNext now correctly references the current question
function autoNext() {
  clearTimeout(autoNextTimeout);
  autoNextTimeout = null;

  const q = activeQuestions[qIndex]; // ← was missing, caused ReferenceError
  if (q) {
    q.attempted = true;
    q.correct = false;
    q.timedOut = true;
    q.selectedIndex = null;
  }

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

  if (typeof window.__acDeactivate === "function") window.__acDeactivate();

  saveUserMarks(); // FIX #6: submissionDone flag inside saveUserMarks prevents double save

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
