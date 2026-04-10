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
let testListenerUnsub = null;
let _expiresAtPollInterval = null; // polls Firestore when snapshot arrives with null expiresAt

onAuthStateChanged(auth, usr => {
  if (!usr) {
    console.log("⏳ Waiting for user login...");
    return;
  }

  currentUser = usr;
  console.log("✅ Auth ready:", currentUser.uid);

  attachTestListener();
});

// ─────────────────────────────────────────────────────────────────
// stopExpiresAtPoll — cancel any active expiresAt polling
// ─────────────────────────────────────────────────────────────────
function stopExpiresAtPoll() {
  if (_expiresAtPollInterval) {
    clearInterval(_expiresAtPollInterval);
    _expiresAtPollInterval = null;
  }
}

// ─────────────────────────────────────────────────────────────────
// startExpiresAtPoll — when Firestore delivers status:"live" but
// expiresAt is still null (intermediate write), we can't rely on
// another onSnapshot because data hasn't changed yet from Firestore's
// perspective. Poll getDoc every 500ms until expiresAt appears,
// then boot the test properly.
// ─────────────────────────────────────────────────────────────────
function startExpiresAtPoll() {
  stopExpiresAtPoll(); // prevent duplicate polls
  console.warn("⚠️ expiresAt missing — polling Firestore every 500ms...");

  let attempts = 0;
  _expiresAtPollInterval = setInterval(async () => {
    attempts++;
    if (attempts > 20) {
      // Give up after 10 seconds — something is wrong on admin/Worker side
      stopExpiresAtPoll();
      console.error("❌ expiresAt never arrived after 10s — giving up");
      return;
    }

    try {
      const fresh = await getDoc(TEMP_TEST_REF);
      if (!fresh.exists()) { stopExpiresAtPoll(); return; }

      const d = fresh.data();
      if (d.status !== "live" || !d.expiresAt) return; // keep waiting

      stopExpiresAtPoll();
      console.log("✅ expiresAt arrived via poll — booting test");
      bootTest(d);
    } catch (err) {
      console.error("Poll error:", err);
    }
  }, 500);
}

function attachTestListener() {
  if (testListenerUnsub) {
    testListenerUnsub();
    testListenerUnsub = null;
  }

  testListenerUnsub = onSnapshot(TEMP_TEST_REF, (snap) => {

    // ─────────────────────────────────────────────────
    // Handle test cleared / doc deleted by admin
    // ─────────────────────────────────────────────────
    if (!snap.exists()) {
      console.log("🛑 Test cleared by admin or does not exist");

      stopExpiresAtPoll();
      clearInterval(serverTimerInterval);
      serverTimerInterval = null;

      if (typeof window.__acDeactivate === "function") window.__acDeactivate();

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
        if (skeleton) skeleton.style.display = "";
        quizArea.classList.add("hidden");
      }

      testStarted = false;
      return;
    }

    const data = snap.data();

    if (data.status !== "live") {
      console.log("⌛ Test not live yet — status:", data.status);
      stopExpiresAtPoll(); // cancel any stale poll
      return;
    }

    // ─────────────────────────────────────────────────
    // expiresAt missing: Firestore delivered an intermediate
    // snapshot. The admin's single updateDoc sets both
    // status:"live" AND expiresAt atomically, but Firestore
    // can still deliver a local-cache snapshot with only the
    // first field visible. We CANNOT wait for another onSnapshot
    // because no further change is coming — we must actively poll.
    // ─────────────────────────────────────────────────
    if (!data.expiresAt) {
      if (!testStarted && !_expiresAtPollInterval) {
        startExpiresAtPoll();
      }
      return;
    }

    stopExpiresAtPoll(); // expiresAt is here — no need to poll

    const now = Date.now();
    const end = data.expiresAt.toDate().getTime();

    if (now >= end) {
      console.log("⏰ Test already expired on arrival — showing ended state");
      if (skeleton) skeleton.style.display = "none";
      document.querySelectorAll(".hidden-by-skeleton").forEach(el => el.classList.remove("hidden-by-skeleton"));
      if (quizSetup) quizSetup.style.display = "";
      const subj = document.getElementById("subjectText");
      if (subj) subj.textContent = "⏰ Test has already ended";
      return;
    }

    // ⛔ Prevent double start
    if (testStarted) return;

    bootTest(data);
  });
}

// ─────────────────────────────────────────────────────────────────
// bootTest — single entry point that starts the quiz from Firestore
// data. Called from both onSnapshot and the expiresAt poll path.
// ─────────────────────────────────────────────────────────────────
function bootTest(data) {
  // Guard: don't boot twice
  if (testStarted) return;
  testStarted = true;

  console.log("🚀 Student test LIVE");

  // ─── Timer — must compute BEFORE anything else ───
  // expiresAt is set by admin at go-live moment so this reflects the
  // EXACT remaining time for this student (late joiners get less time — correct).
  const expiresMs = data.expiresAt.toDate().getTime();

  penaltyPerWrong = (typeof data.penaltyMarks === "number")
    ? Math.round(data.penaltyMarks * 100) / 100  // prevent float drift (0.25, 0.5, etc.)
    : 0.25;

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
     Timer is based on expiresAt set at the moment admin went live.
     Late joiners automatically get less time — this is the correct behavior.
  ========================= */
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
    // Round to 2 decimal places to prevent floating point drift
    // e.g. 3 - 0.25 = 2.75 not 2.7499999...
    marks = Math.round((marks - penaltyPerWrong) * 100) / 100;
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
