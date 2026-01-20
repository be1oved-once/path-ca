/* =========================
   FIREBASE + XP
========================= */
import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let currentUser = null;
let currentXP = 0;
const xpEl = document.getElementById("xpValue");

import { onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";



auth.onAuthStateChanged(user => {
  if (!user) {
    currentUser = null;
    currentXP = 0;
    if (xpEl) xpEl.textContent = "00";
    return;
  }

  currentUser = user;

  // 🔥 REAL-TIME XP (NO DELAY)
  onSnapshot(doc(db, "users", user.uid), snap => {
    if (!snap.exists()) return;

    const data = snap.data();
    currentXP = data.xp || 0;

    if (xpEl) {
      xpEl.textContent = String(currentXP).padStart(2, "0");
    }
  });
});

/* =========================
   DATA
========================= */
import { rtpMtpSubjects } from "./rtp-mtp.js";


const chapterText = document.getElementById("chapterText");
const attemptPopup = document.getElementById("attemptPopup");
attemptPopup.addEventListener("click", e => {
  e.stopPropagation();
});
const chapterPopup = document.getElementById("chapterPopup");
let selectedAttempt = null;

let currentSubject = null;


let baseQuestions = [];     // original limited list

let wrongQuestions = [];    // retry pool

let qIndex = 0;
let round = 1;
let marks = 0;
let round1Completed = false;
let timer = null;
let autoNextTimeout = null;
let timeLeft = 45;
let examTimer = null;
let examTimeLeft = 0;
let answered = false;
let round1Snapshot = [];
window.round1Snapshot = round1Snapshot;
/* =========================
   DOM
========================= */
const subjectBtn = document.getElementById("subjectBtn");
const chapterBtn = document.getElementById("chapterBtn");
const subjectText = document.getElementById("subjectText");

const subjectPopup = document.getElementById("subjectPopup");

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
  if (subjectPopup) subjectPopup.classList.remove("show");
  if (attemptPopup) attemptPopup.classList.remove("show");
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
  resetReviewState();
  resetBtn.disabled = true;
limitInput.disabled = true;
  if (!subjectPopup) return;

  closeAllPopups();

  subjectPopup.innerHTML = "";
  subjectPopup.classList.add("show");

  rtpMtpSubjects.forEach(sub => {
    const b = document.createElement("button");
    b.textContent = sub.name;

    b.onclick = () => {
      resetReviewState();
      currentSubject = sub;
      subjectText.textContent = sub.name;

      selectedAttempt = null;
      chapterText.textContent = "Select Attempt";
      chapterBtn.classList.remove("disabled");

      resetMarksState();
      quizArea.classList.add("hidden");

      closeAllPopups();
    };

    subjectPopup.appendChild(b);
  });
};

/* =========================
   CHAPTER POPUP
========================= */
chapterBtn.addEventListener("click", () => {
  if (!currentSubject) return;

  attemptPopup.innerHTML = "";
  attemptPopup.classList.toggle("show");

  renderAttemptPopup();
});
function renderAttemptPopup() {
  console.log("Current subject:", currentSubject);
console.log("All subjects:", rtpMtpSubjects);
  attemptPopup.innerHTML = "";

  const subjectData = rtpMtpSubjects.find(
  s => s.name === currentSubject.name
);

  if (!subjectData) {
    attemptPopup.innerHTML = "<div>No attempts available</div>";
    return;
  }

  ["RTP", "MTP"].forEach(type => {
    const section = document.createElement("div");
    section.className = "attempt-section";

    const header = document.createElement("label");
    header.className = "attempt-header";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
checkbox.name = "attemptType";

    const title = document.createElement("span");
    title.textContent = type;

    header.appendChild(checkbox);
    header.appendChild(title);

    const list = document.createElement("div");
    list.className = "attempt-list";

checkbox.addEventListener("change", e => {
  e.stopPropagation();

  if (checkbox.checked) {
    // 🔒 close other lists
    document.querySelectorAll(".attempt-list").forEach(l => {
      l.classList.remove("show");
      l.style.maxHeight = null;
    });

    list.classList.add("show");
    list.style.maxHeight = list.scrollHeight + "px";
  } else {
    list.classList.remove("show");
    list.style.maxHeight = null;
  }
});

    subjectData.attempts
      .filter(a => a.type === type)
      .forEach(att => {
        const btn = document.createElement("button");
        btn.textContent = att.name;

btn.onclick = () => {
  selectedAttempt = att;
  chapterText.textContent = att.name;
  attemptPopup.classList.remove("show");
  
  // ✅ ENABLE CONTROLS AFTER ATTEMPT SELECTION
  limitInput.disabled = false;
  resetBtn.disabled = false;
};

        list.appendChild(btn);
      });

    section.appendChild(header);
    section.appendChild(list);
    attemptPopup.appendChild(section);
  });
}

/* =========================
   START
========================= */
startBtn.onclick = () => {
  resetMarksState();
  if (!currentSubject || !selectedAttempt) {
    alert("Select subject and attempt (RTP / MTP)");
    return;
  }

  const max = selectedAttempt.questions.length;
let limit = parseInt(limitInput.value || max);
limit = Math.max(1, Math.min(limit, max));
limitInput.value = limit;

let questionsPool = [...selectedAttempt.questions];

if (window.TIC_SETTINGS?.randomizeQuestions) {
  questionsPool.sort(() => Math.random() - 0.5);
}

baseQuestions = questionsPool
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
  limitInput.disabled = false;
};

/* =========================
   RESET
========================= */
resetBtn.onclick = () => {
  clearExamTimer();
  resetReviewState();
  marks = 0;
round1Completed = false;
if (marksValue) marksValue.textContent = "0";
if (marksBox) marksBox.classList.add("hidden");
  quizArea.classList.add("hidden");

  subjectText.textContent = "None Selected";
  chapterText.textContent = "None Selected";

  currentSubject = null;

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
let activeQuestions = [];
function startRound(list) {
  // 🔥 ABSOLUTE RESET (CRITICAL)
  clearTimer();
  clearExamTimer();

  activeQuestions = list;
  qIndex = 0;
  quizArea.classList.remove("hidden");

  // 🔥 MTP EXAM MODE (120 mins)

  if (
  window.TIC_SETTINGS?.rtpExamMode &&
  selectedAttempt?.type === "MTP"
) {
  clearTimer();
  startExamTimer(120); // 🔥 120 minutes
}

renderQuestion();
}

/* =========================
   TIMER
========================= */
function startTimer() {
  clearInterval(timer);

  // ⛔ DO NOT RUN IN MTP EXAM MODE
  if (
    window.TIC_SETTINGS?.rtpExamMode &&
    selectedAttempt?.type === "MTP"
  ) {
    return;
  }

  timeLeft = Number(window.TIC_SETTINGS?.questionTime || 45);
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timer);
      autoNext();
    }
  }, 1000); // ⬅ FIXED from 700ms
}

function updateTimer() {
  timeEl.textContent = String(timeLeft).padStart(2, "0");
  timeEl.classList.toggle("danger", timeLeft <= 5);
}

function clearTimer() {
  clearInterval(timer);
}

/* =========================
   EXAM TIMER (MTP MODE)
========================= */

/* =========================
   MTP EXAM TIMER (120 MIN)
========================= */

function startExamTimer(minutes) {
  clearExamTimer();
  
  examTimeLeft = minutes * 60;
  updateExamTimer();
  
  examTimer = setInterval(() => {
    examTimeLeft--;
    updateExamTimer();
    
    if (examTimeLeft <= 0) {
      clearExamTimer();
      finishRound(); // auto submit
    }
  }, 1000);
}

function updateExamTimer() {
  const m = Math.floor(examTimeLeft / 60);
  const s = examTimeLeft % 60;
  timeEl.textContent =
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0");
}

function clearExamTimer() {
  clearInterval(examTimer);
  examTimer = null;
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

document.addEventListener("click", e => {
  if (
  attemptPopup &&
  !attemptPopup.contains(e.target) &&
  !chapterBtn.contains(e.target)
) {
  attemptPopup.classList.remove("show");
}
});
function renderQuestion() {
  clearTimeout(autoNextTimeout);
autoNextTimeout = null;
  clearTimer();
  answered = false;

  const q = activeQuestions[qIndex];
  qText.textContent = `${qIndex + 1}. ${q.text}`;

  progressBar.style.width =
    ((qIndex + 1) / activeQuestions.length) * 100 + "%";

  optionsBox.innerHTML = "";

  let options = q.options.map((opt, i) => ({
  text: opt,
  index: i
}));

if (window.TIC_SETTINGS?.randomizeOptions) {
  options.sort(() => Math.random() - 0.5);
}

options.forEach(({ text, index }, i) => {
  const btn = document.createElement("button");

  btn.textContent = window.TIC_SETTINGS?.showABCD
    ? String.fromCharCode(65 + i) + ". " + text
    : text;

  // 🔥 ATTACH CORRECTNESS TO BUTTON
  btn.dataset.correct = index === q.correctIndex ? "true" : "false";

  btn.disabled = q.attempted;

  if (q.attempted && btn.dataset.correct === "true") {
    btn.classList.add("correct");
  }

  btn.onclick = () => handleAnswer(btn);
  optionsBox.appendChild(btn);
});

  prevBtn.disabled = qIndex === 0;
  nextBtn.disabled = !q.attempted;

  if (
  window.TIC_SETTINGS?.questionTimer &&
  !q.attempted &&
  !(
    window.TIC_SETTINGS?.rtpExamMode &&
    selectedAttempt?.type === "MTP"
  )
) {
  startTimer();
}
}

/* =========================
   ANSWER
========================= */
async function handleAnswer(btn) {
  if (answered) return;
  answered = true;
  clearTimer();

  const q = activeQuestions[qIndex];
  q.attempted = true;

  const all = optionsBox.children;
  [...all].forEach(b => (b.disabled = true));

  const isCorrect = btn.dataset.correct === "true";

  if (isCorrect) {
    btn.classList.add("correct");
    q.correct = true;

    if (round === 1) {
      marks += 1;
    }

    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.uid), {
        xp: increment(5)
      });

      await recordQuestionAttempt(5);
      await updateBestXpIfNeeded();
    }

    if (window.TIC_SETTINGS?.autoSkip) {
      autoNextTimeout = setTimeout(next, 1000);
    } else {
      nextBtn.disabled = false;
    }

  } else {
    btn.classList.add("wrong");

    // 🔥 SHOW ACTUAL CORRECT OPTION
    [...all].forEach(b => {
      if (b.dataset.correct === "true") {
        b.classList.add("correct");
      }
    });

    q.correct = false;

    if (round === 1) {
      marks -= 0.25;
    }

    if (currentUser) {
      await recordQuestionAttempt(0);
    }

    nextBtn.disabled = false;

    if (window.TIC_SETTINGS?.autoSkip) {
      autoNextTimeout = setTimeout(next, 3000);
    }
  }

  // for review / retry
  q.selectedOption = btn.textContent;
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
  clearExamTimer();
  if (round === 1 && !round1Completed) {
    round1Completed = true;

    round1Snapshot = activeQuestions.map(q => ({ ...q }));
    window.round1Snapshot = round1Snapshot;

    const correctCount = round1Snapshot.filter(q => q.correct).length;

    marksValue.textContent = marks.toFixed(2);
    marksBox.classList.remove("hidden");

    // 🔥🔥 THIS IS THE MISSING WRITE 🔥🔥
    recordAttemptSummary({
      type: selectedAttempt.type,            // RTP or MTP
      subject: currentSubject?.name || "",
      attempt: selectedAttempt?.name || "",
      correct: correctCount,
      total: round1Snapshot.length,
      xpEarned: correctCount * 5
    });
  }

  wrongQuestions = activeQuestions.filter(q => !q.correct);

  if (wrongQuestions.length > 0) {
    round++;
    updateRoundLabel();
    startRound(wrongQuestions.map(q => ({ ...q, attempted: false })));
  } else {
    qText.textContent = "सब सही कर दिए! 🤗";
    optionsBox.innerHTML = "";
    progressBar.style.width = "100%";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    resetBtn.disabled = true;
    clearTimer();
    timeEl.textContent = "--";
  }
}
document.addEventListener("click", e => {
  if (
    subjectBtn &&
    !subjectBtn.contains(e.target) &&
    chapterBtn &&
    !chapterBtn.contains(e.target) &&
    subjectPopup &&
    !subjectPopup.contains(e.target) &&
    attemptPopup &&
    !attemptPopup.contains(e.target)
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

    // 🔥 WEEKLY XP (THIS WAS MISSING)
    [`weeklyXp.${today}`]: increment(xpGained)
  };

  // 🔥 STREAK (only first attempt of the day)
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

    // reset day on first attempt
    updates.dailyXp = xpGained;
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
async function recordAttemptSummary(data) {
  if (!currentUser) return;

  try {
    await addDoc(
      collection(db, "users", currentUser.uid, "attempts"),
      {
        type: selectedAttempt.type,                 // RTP / MTP
        subject: data.subject || "",
        chapter: selectedAttempt.name || "",
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

    console.log("✅ RTP/MTP attempt saved");
  } catch (e) {
    console.error("❌ RTP/MTP attempt failed", e);
  }
}