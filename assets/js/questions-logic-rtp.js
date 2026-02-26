/* =========================
   FIREBASE + XP
========================= */
import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initDailyRobot, incrementDailyProgress } from "./daily-robot.js";

let currentUser = null;
let currentXP = 0;
const xpEl = document.getElementById("xpValue");

import { onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { syncPublicLeaderboard } from "./common.js";


auth.onAuthStateChanged(user => {
  if (!user) {
    currentUser = null;
    currentXP = 0;
    if (xpEl) xpEl.textContent = "00";
    return;
  }

  currentUser = user;
initDailyRobot(user.uid);
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
  .map(q => {
    let optionOrder = q.options.map((_, i) => i);
    
    if (window.TIC_SETTINGS?.randomizeOptions) {
      optionOrder.sort(() => Math.random() - 0.5);
    }
    
    return {
      ...q,
      optionOrder, // 🔥 SAVE ORDER
      attempted: false,
      correct: false,
      selectedIndex: null
    };
  });
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

function renderDiagram(svgString) {
  const wrap = document.createElement("div");
  wrap.className = "diagram-wrap";
  wrap.innerHTML = svgString;

  const svg = wrap.querySelector("svg");
  if (svg) svg.classList.add("eco-diagram");

  return wrap;
}

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

// 🔥 REMOVE old table / diagram if exists
document.querySelectorAll(".question-table-wrap, .diagram-wrap")
  .forEach(el => el.remove());

// 🔥 TABLE SUPPORT
if (q.type === "table" && q.table) {
  const tableEl = renderTable(q.table);
  qText.after(tableEl);
}

// 🔥 DIAGRAM SUPPORT
if (q.type === "diagram" && q.diagram) {
  const diagramEl = renderDiagram(q.diagram);
  qText.after(diagramEl);
}

let options;

// 🔥 ALWAYS BUILD q._optionOrder — RTP & MTP SAFE
if (!q._optionOrder) {
  
  if (
    window.TIC_SETTINGS?.rtpExamMode &&
    selectedAttempt?.type === "MTP"
  ) {
    // MTP exam mode (120 min)
    q._optionOrder = reorderMtpOptions(q.options).map(o => ({
      text: o.text,
      originalIndex: o.index
    }));
  } else {
    // RTP / normal mode
    q._optionOrder = q.optionOrder.map(idx => ({
      text: q.options[idx],
      originalIndex: idx
    }));
  }
  
  // 🔑 Compute correct index ONCE
  q._correctIndexInUI = q._optionOrder.findIndex(
    o => o.originalIndex === q.correctIndex
  );
}

q._optionOrder.forEach((opt, uiIndex) => {
  const btn = document.createElement("button");

  btn.textContent = window.TIC_SETTINGS?.showABCD
    ? String.fromCharCode(65 + uiIndex) + ". " + opt.text
    : opt.text;

  btn.disabled = q.attempted;

  // 🔥 RE-APPLY STATE (CRITICAL)
  if (q.attempted) {
    if (uiIndex === q._correctIndexInUI) {
      btn.classList.add("correct");
    }
    if (
      q._selectedIndex === uiIndex &&
      uiIndex !== q._correctIndexInUI
    ) {
      btn.classList.add("wrong");
    }
  }

  btn.onclick = () => handleAnswer(btn, uiIndex);
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

  const q = activeQuestions[qIndex];
  q.attempted = true;
  q._selectedIndex = uiIndex;

  const all = optionsBox.children;
  [...all].forEach(b => (b.disabled = true));

  const isCorrect = uiIndex === q._correctIndexInUI;

  if (isCorrect) {
    q.correct = true;

    // ✅ APPLY GREEN IMMEDIATELY
    [...all].forEach((b, i) => {
      if (i === q._correctIndexInUI) {
        b.classList.add("correct");
      }
    });

    if (round === 1) {
      marks += 1;
    }

    if (currentUser) {
      updateDoc(doc(db, "users", currentUser.uid), {
        xp: increment(5)
      }).catch(console.error);

      recordQuestionAttempt(5).catch(console.error);
      updateBestXpIfNeeded().catch(console.error);
      showXpGain(5);
    }

    nextBtn.disabled = false;

    if (window.TIC_SETTINGS?.autoSkip) {
      autoNextTimeout = setTimeout(next, 300);
    }

  } else {
    // ❌ WRONG ANSWER
    q.correct = false;

    btn.classList.add("wrong");

    // ✅ SHOW CORRECT OPTION
    [...all].forEach((b, i) => {
      if (i === q._correctIndexInUI) {
        b.classList.add("correct");
      }
    });

    if (round === 1) {
      marks -= 0.25;
    }

    if (currentUser) {
      recordQuestionAttempt(0).catch(console.error);
    }

    nextBtn.disabled = false;

    if (window.TIC_SETTINGS?.autoSkip) {
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

/* =========================
   FINISH ROUND
========================= */
async function finishRound() {
  clearExamTimer();
if (round === 1 && !round1Completed) {
  round1Completed = true;

  // 📸 Freeze snapshot
  round1Snapshot = activeQuestions.map(q => ({ ...q }));
  window.round1Snapshot = round1Snapshot;

  const correctCount = round1Snapshot.filter(q => q.correct).length;

  /* =================================
     ✅ SAVE CORRECTIONS (NEW)
  ================================= */
  if (currentUser) {
    const wrongOnly = round1Snapshot.filter(q => !q.correct);

    try {
      const colRef = collection(
        db,
        "users",
        currentUser.uid,
        "corrections"
      );

      // 🔥 clear old corrections
      const old = await getDocs(colRef);
      old.forEach(d => deleteDoc(d.ref));

// 🚀 FAST PARALLEL SAVE
const writes = wrongOnly.map(q =>
  addDoc(colRef, {
    source: selectedAttempt?.type || "RTP/MTP",
    subject: currentSubject?.name || "",
    attempt: selectedAttempt?.name || "",
    text: q.text,
    options: q.options,
    correctAnswer: q.options[q.correctIndex],
    createdAt: serverTimestamp()
  })
);

await Promise.all(writes);

      console.log("✅ RTP/MTP corrections saved:", wrongOnly.length);
    } catch (e) {
      console.error("❌ corrections save failed", e);
    }
  }

  /* =================================
     ✅ SAVE DETAILED STATS (NEW)
  ================================= */
  /* =================================
     ✅ UI
  ================================= */
  marksValue.textContent = marks.toFixed(2);
  marksBox.classList.remove("hidden");

  /* =================================
     ✅ ATTEMPT SUMMARY (existing)
  ================================= */
await saveRtpMtpDetailedStats();

await recordAttemptSummary({
  type: selectedAttempt.type,
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
    [`weeklyXp.${today}`]: increment(xpGained)
  };

  // 🔥 STREAK LOGIC
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

    updates.dailyXp = xpGained;
    updates[`weeklyXp.${today}`] = xpGained;
  }

  // 🧹 RESET weekly XP on Monday
  const day = new Date().getDay(); // 1 = Monday
  if (day === 1 && data.lastActiveDate !== today) {
    updates.weeklyXp = {};
  }

  // 🔥 UPDATE USER
  await updateDoc(ref, updates);

  // 🔥🔥🔥 SYNC LEADERBOARD HERE 🔥🔥🔥
  await syncPublicLeaderboard(currentUser.uid);
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

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
window.addEventListener("DOMContentLoaded", () => {
  const subjectId = getParam("subject");   // economics
  const attemptId = getParam("attempt");   // eco_rtp_sep25

  if (!subjectId || !attemptId) return;

  // 1️⃣ Find subject
  const subject = rtpMtpSubjects.find(s => s.id === subjectId);
  if (!subject) return;

  currentSubject = subject;
  subjectText.textContent = subject.name;
  chapterBtn.classList.remove("disabled");

  // 2️⃣ Find attempt
  const attempt = subject.attempts.find(a => a.id === attemptId);
  if (!attempt) return;

  selectedAttempt = attempt;
  chapterText.textContent = attempt.name;

  // 3️⃣ Enable controls
  limitInput.disabled = false;
  resetBtn.disabled = false;

  console.log("✅ Auto-selected:", subject.name, attempt.name);
});

/* =========================
   RTP / MTP OPTION RULE ENGINE
   (CA FINAL – DATA SAFE)
========================= */

function normalizeOption(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getOptionType(text) {
  const t = normalizeOption(text);

  if (/both\s+[a-d]\s+and\s+[a-d]/.test(t)) return "BOTH";
  if (/either\s+[a-d]\s+or\s+[a-d]/.test(t)) return "EITHER";
  if (/neither\s+[a-d]\s+nor\s+[a-d]/.test(t)) return "NEITHER";

  if (t.includes("all of the above") || t.includes("all the above") || t.includes("all of these"))
    return "ALL";

  if (t.includes("none of the above") || t.includes("none of these"))
    return "NONE";

  if (
    t.includes("cant say") ||
    t.includes("cannot say") ||
    t.includes("cannot be determined")
  ) return "CANT";

  if (t.includes("any of the above")) return "ANY";

  return "NORMAL";
}

function reorderMtpOptions(options) {
  const mapped = options.map((text, i) => ({
    text,
    index: i,
    type: getOptionType(text)
  }));

  const normal = mapped.filter(o => o.type === "NORMAL");
  const both   = mapped.filter(o => o.type === "BOTH" || o.type === "EITHER");
  const none   = mapped.filter(o =>
    o.type === "NONE" || o.type === "NEITHER" || o.type === "CANT"
  );
  const allAny = mapped.filter(o => o.type === "ALL" || o.type === "ANY");

  // 🔥 ALWAYS rebuild final order (RTP SAFE)
  const final = [];

  // 1️⃣ First two → normal only
  final.push(...normal.slice(0, 2));

  // 2️⃣ Third → BOTH / EITHER if exists
  if (both.length) {
    final.push(both[0]);
  } else if (normal[2]) {
    final.push(normal[2]);
  }

  // 3️⃣ Fourth → NONE / NEITHER / ALL / ANY
  if (none.length) {
    final.push(none[0]);
  } else if (allAny.length) {
    final.push(allAny[0]);
  } else if (normal[3]) {
    final.push(normal[3]);
  }

  // 4️⃣ Fallback (never break UI)
  while (final.length < 4) {
    const next = mapped.find(o => !final.includes(o));
    if (!next) break;
    final.push(next);
  }

  return final.slice(0, 4);
}
async function saveRtpMtpDetailedStats() {
  if (!currentUser) return;

  // optional minimum guard (same as chapter)
  if (!round1Snapshot || round1Snapshot.length < 30) {
    console.log("⚠️ RTP/MTP detailed stats skipped (<30 questions)");
    return;
  }

  try {
    const correct = round1Snapshot.filter(q => q.correct).length;
    const total = round1Snapshot.length;

    await addDoc(
      collection(db, "users", currentUser.uid, "rtpMtpStats"),
      {
        userId: currentUser.uid,
        date: new Date().toISOString().slice(0, 10),

        type: selectedAttempt?.type || "", // RTP or MTP
        subject: currentSubject?.name || "",
        attempt: selectedAttempt?.name || "",

        totalQuestions: total,
        correct: correct,
        wrong: total - correct,
        marks: marks,
        rounds: round,
        accuracy: Math.round((correct / total) * 100),

        createdAt: serverTimestamp()
      }
    );

    console.log("✅ RTP/MTP detailed stats saved");
  } catch (e) {
    console.error("❌ RTP/MTP detailed stats failed", e);
  }
}