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
  setDoc,
  collection,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initDailyRobot, incrementDailyProgress } from "./daily-robot.js";
import { syncPublicLeaderboard } from "./common.js";

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
    if (xpEl) xpEl.textContent = String(currentXP).padStart(2, "0");
  });

  // Load bookmarks on login
  loadBookmarksOnce(user.uid);

  // Check for paused session on login
  checkPausedSession(user.uid);
});

/* =========================
   DATA
========================= */
import { rtpMtpSubjects } from "./rtp-mtp.js";

/* =========================
   STATE
========================= */
const chapterText  = document.getElementById("chapterText");
const attemptPopup = document.getElementById("attemptPopup");
attemptPopup.addEventListener("click", e => e.stopPropagation());

let selectedAttempt = null;
let currentSubject  = null;

let baseQuestions    = [];
let wrongQuestions   = [];
let bookmarkMap      = {};
let qIndex           = 0;
let round            = 1;
let marks            = 0;
let round1Completed  = false;
let timer            = null;
let autoNextTimeout  = null;
let timeLeft         = 45;
let examTimer        = null;
let examTimeLeft     = 0;
let answered         = false;
let round1Snapshot   = [];
let activeQuestions  = [];
let quizStartTime    = null;   // for scorecard total time
let quizActive       = false;

window.round1Snapshot = round1Snapshot;

/* =========================
   DOM
========================= */
const subjectBtn   = document.getElementById("subjectBtn");
const chapterBtn   = document.getElementById("chapterBtn");
const subjectText  = document.getElementById("subjectText");
const subjectPopup = document.getElementById("subjectPopup");

const startBtn  = document.getElementById("startQuiz");
const resetBtn  = document.getElementById("resetQuiz");

const quizArea   = document.getElementById("quizArea");
const qText      = document.getElementById("questionText");
const optionsBox = document.getElementById("optionsBox");
const timeEl     = document.getElementById("timeLeft");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const limitInput  = document.getElementById("questionLimit");
const progressBar = document.getElementById("progressBar");
const roundLabel  = document.getElementById("roundLabel");
const marksBox    = document.getElementById("marksBox");
const marksValue  = document.getElementById("marksValue");

const resultActions = document.querySelector(".result-actions");

/* =========================
   INITIAL STATE
========================= */
limitInput.disabled = true;
resetBtn.disabled   = true;
prevBtn.disabled    = true;
nextBtn.disabled    = true;
if (resultActions) resultActions.classList.add("hidden");

/* =========================
   BOOKMARK SYSTEM
========================= */
function getQuestionId(q) {
  return btoa(
    encodeURIComponent(q.text || q.question || "")
      .replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode("0x" + p1))
  ).replace(/=/g, "");
}

function bookmarkKey(uid) { return `bookmarks_${uid}`; }
function getLocalBookmarks(uid) {
  try { return JSON.parse(localStorage.getItem(bookmarkKey(uid))) || {}; }
  catch { return {}; }
}
function setLocalBookmarks(uid, data) {
  localStorage.setItem(bookmarkKey(uid), JSON.stringify(data));
}

async function loadBookmarksOnce(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "bookmarks"));
    const local = {};
    snap.forEach(d => {
      local[d.id] = d.data();
      bookmarkMap[d.id] = true;
    });
    setLocalBookmarks(uid, local);
  } catch(e) { console.error("❌ Bookmark load failed", e); }
}

function saveBookmark(q) {
  if (!currentUser) return;
  const id    = getQuestionId(q);
  const local = getLocalBookmarks(currentUser.uid);
  local[id] = {
    subject:      currentSubject?.name || "",
    chapter:      selectedAttempt?.name || "",
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
  ).catch(err => console.error("❌ Bookmark remove failed", err));
}

/* =========================
   POPUP HELPERS
========================= */
function closeAllPopups() {
  if (subjectPopup) subjectPopup.classList.remove("show");
  if (attemptPopup) attemptPopup.classList.remove("show");
}

function resetMarksState() {
  marks           = 0;
  round1Completed = false;
  if (marksValue) marksValue.textContent = "0";
  if (marksBox)   marksBox.classList.add("hidden");
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
  resetReviewState();
  resetBtn.disabled   = true;
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
   ATTEMPT POPUP
========================= */
chapterBtn.addEventListener("click", () => {
  if (!currentSubject) return;
  attemptPopup.innerHTML = "";
  attemptPopup.classList.toggle("show");
  renderAttemptPopup();
});

function renderAttemptPopup() {
  attemptPopup.innerHTML = "";

  const subjectData = rtpMtpSubjects.find(s => s.name === currentSubject.name);
  if (!subjectData) {
    attemptPopup.innerHTML = "<div>No attempts available</div>";
    return;
  }

  ["RTP", "MTP"].forEach(type => {
    const section  = document.createElement("div");
    section.className = "attempt-section";

    const header   = document.createElement("label");
    header.className = "attempt-header";

    const checkbox = document.createElement("input");
    checkbox.type  = "checkbox";
    checkbox.name  = "attemptType";

    const title    = document.createElement("span");
    title.textContent = type;

    header.appendChild(checkbox);
    header.appendChild(title);

    const list = document.createElement("div");
    list.className = "attempt-list";

    checkbox.addEventListener("change", e => {
      e.stopPropagation();
      if (checkbox.checked) {
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
          limitInput.disabled = false;
          resetBtn.disabled   = false;
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

  // Remove any existing scorecard
  const oldCard = document.getElementById("quizScorecard");
  if (oldCard) oldCard.remove();

  quizActive = true;

  const max   = selectedAttempt.questions.length;
  let limit   = parseInt(limitInput.value || max);
  limit = Math.max(1, Math.min(limit, max));
  limitInput.value = limit;

  let questionsPool = [...selectedAttempt.questions];

  if (window.TIC_SETTINGS?.randomizeQuestions) {
    questionsPool.sort(() => Math.random() - 0.5);
  }

  baseQuestions = questionsPool.slice(0, limit).map(q => {
    let optionOrder = q.options.map((_, i) => i);
    if (window.TIC_SETTINGS?.randomizeOptions) {
      optionOrder.sort(() => Math.random() - 0.5);
    }
    return {
      ...q,
      optionOrder,
      attempted:     false,
      correct:       false,
      selectedIndex: null
    };
  });

  round = 1;
  quizStartTime = Date.now();
  resetReviewState();
  if (resultActions) resultActions.classList.add("hidden");
  updateRoundLabel();
  startRound(baseQuestions);
  resetBtn.disabled   = false;
  limitInput.disabled = false;

  // Save session start for resume
  _savePausedSession();
};

/* =========================
   RESET
========================= */
resetBtn.onclick = () => {
  clearExamTimer();
  resetReviewState();
  quizActive = false;
  marks           = 0;
  round1Completed = false;
  if (marksValue) marksValue.textContent = "0";
  if (marksBox)   marksBox.classList.add("hidden");
  if (resultActions) resultActions.classList.add("hidden");

  const oldCard = document.getElementById("quizScorecard");
  if (oldCard) oldCard.remove();

  quizArea.classList.add("hidden");

  subjectText.textContent = "None Selected";
  chapterText.textContent = "None Selected";

  currentSubject  = null;
  selectedAttempt = null;
  chapterBtn.classList.add("disabled");

  limitInput.disabled = true;
  resetBtn.disabled   = true;
  prevBtn.disabled    = true;
  nextBtn.disabled    = true;
  if (timeEl) timeEl.textContent = "--";

  // Clear paused session
  _clearPausedSession();
};

/* =========================
   XP LOCAL STORAGE HELPERS
========================= */
function getLocalDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/* =========================
   ROUND CONTROL
========================= */
function startRound(list) {
  clearTimer();
  clearExamTimer();

  activeQuestions = list;
  qIndex          = 0;
  quizArea.classList.remove("hidden");

  // MTP exam mode (120 min)
  if (window.TIC_SETTINGS?.rtpExamMode && selectedAttempt?.type === "MTP") {
    clearTimer();
    startExamTimer(120);
  }

  renderQuestion();
}

/* =========================
   TIMER (per-question)
========================= */
function startTimer() {
  clearInterval(timer);
  if (window.TIC_SETTINGS?.rtpExamMode && selectedAttempt?.type === "MTP") return;

  timeLeft = Number(window.TIC_SETTINGS?.questionTime || 45);
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

function clearTimer() { clearInterval(timer); }

/* =========================
   EXAM TIMER (MTP 120 MIN)
========================= */
function startExamTimer(minutes) {
  clearExamTimer();
  examTimeLeft = minutes * 60;
  updateExamTimer();
  examTimer = setInterval(() => {
    examTimeLeft--;
    updateExamTimer();
    if (examTimeLeft <= 0) { clearExamTimer(); finishRound(); }
  }, 1000);
}

function updateExamTimer() {
  if (!timeEl) return;
  const m = Math.floor(examTimeLeft / 60);
  const s = examTimeLeft % 60;
  timeEl.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function clearExamTimer() {
  clearInterval(examTimer);
  examTimer = null;
}

/* =========================
   RENDER HELPERS
========================= */
function cleanQuestionText(text) {
  return text.replace(/^(\(\d+\)|\d+\.|\d+\)|\s)+/g, "").trim();
}

function updateRoundLabel() {
  if (!roundLabel) return;
  roundLabel.textContent = round === 1 ? "Practice" : "Retrying Round";
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

/* =========================
   OPTION RULE ENGINE
========================= */
function normalizeOption(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
}

function getOptionType(text) {
  const t = normalizeOption(text);
  if (/both\s+[a-d]\s+and\s+[a-d]/.test(t))   return "BOTH";
  if (/either\s+[a-d]\s+or\s+[a-d]/.test(t))  return "EITHER";
  if (/neither\s+[a-d]\s+nor\s+[a-d]/.test(t))return "NEITHER";
  if (t.includes("all of the above") || t.includes("all the above") || t.includes("all of these")) return "ALL";
  if (t.includes("none of the above") || t.includes("none of these")) return "NONE";
  if (t.includes("cant say") || t.includes("cannot say") || t.includes("cannot be determined")) return "CANT";
  if (t.includes("any of the above")) return "ANY";
  return "NORMAL";
}

function reorderMtpOptions(options) {
  const mapped = options.map((text, i) => ({ text, index: i, type: getOptionType(text) }));
  const normal = mapped.filter(o => o.type === "NORMAL");
  const both   = mapped.filter(o => o.type === "BOTH" || o.type === "EITHER");
  const none   = mapped.filter(o => ["NONE","NEITHER","CANT"].includes(o.type));
  const allAny = mapped.filter(o => o.type === "ALL" || o.type === "ANY");
  const final  = [];
  final.push(...normal.slice(0, 2));
  if (both.length)        final.push(both[0]);
  else if (normal[2])     final.push(normal[2]);
  if (none.length)        final.push(none[0]);
  else if (allAny.length) final.push(allAny[0]);
  else if (normal[3])     final.push(normal[3]);
  while (final.length < 4) {
    const next = mapped.find(o => !final.includes(o));
    if (!next) break;
    final.push(next);
  }
  return final.slice(0, 4);
}

/* =========================
   RENDER QUESTION
========================= */
function renderQuestion() {
  clearTimeout(autoNextTimeout);
  autoNextTimeout = null;
  clearTimer();
  answered = false;

  const q = activeQuestions[qIndex];

  // Question text + bookmark button
  qText.innerHTML = `${qIndex + 1}. ${q.text}`;

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

  // Remove old tables/diagrams
  document.querySelectorAll(".question-table-wrap, .diagram-wrap").forEach(el => el.remove());

  if (q.type === "table"   && q.table)   qText.after(renderTable(q.table));
  if (q.type === "diagram" && q.diagram) qText.after(renderDiagram(q.diagram));

  // Build option order once
  if (!q._optionOrder) {
    if (window.TIC_SETTINGS?.rtpExamMode && selectedAttempt?.type === "MTP") {
      q._optionOrder = reorderMtpOptions(q.options).map(o => ({ text: o.text, originalIndex: o.index }));
    } else {
      q._optionOrder = q.optionOrder.map(idx => ({ text: q.options[idx], originalIndex: idx }));
    }
    q._correctIndexInUI = q._optionOrder.findIndex(o => o.originalIndex === q.correctIndex);
  }

  q._optionOrder.forEach((opt, uiIndex) => {
    const btn = document.createElement("button");
    btn.textContent = window.TIC_SETTINGS?.showABCD
      ? String.fromCharCode(65 + uiIndex) + ". " + opt.text
      : opt.text;
    btn.disabled = q.attempted;

    if (q.attempted) {
      if (uiIndex === q._correctIndexInUI) btn.classList.add("correct");
      if (q._selectedIndex === uiIndex && uiIndex !== q._correctIndexInUI) btn.classList.add("wrong");
    }

    btn.onclick = () => handleAnswer(btn, uiIndex);
    optionsBox.appendChild(btn);
  });

  prevBtn.disabled = qIndex === 0;
  nextBtn.disabled = !q.attempted;

  if (
    window.TIC_SETTINGS?.questionTimer &&
    !q.attempted &&
    !(window.TIC_SETTINGS?.rtpExamMode && selectedAttempt?.type === "MTP")
  ) {
    startTimer();
  } else {
    clearTimer();
    if (timeEl) timeEl.textContent = "--";
  }
}

/* =========================
   ANSWER HANDLER
========================= */
async function handleAnswer(btn, uiIndex) {
  if (answered) return;
  answered = true;
  clearTimer();

  const q = activeQuestions[qIndex];
  q.attempted      = true;
  q._selectedIndex = uiIndex;

  const all = [...optionsBox.children];
  all.forEach(b => (b.disabled = true));

  const isCorrect = uiIndex === q._correctIndexInUI;

  if (isCorrect) {
    q.correct = true;
    all.forEach((b, i) => { if (i === q._correctIndexInUI) b.classList.add("correct"); });
    if (round === 1) marks += 1;

    if (currentUser) {
      updateDoc(doc(db, "users", currentUser.uid), { xp: increment(5) }).catch(console.error);
      recordQuestionAttempt(5).catch(console.error);
      updateBestXpIfNeeded().catch(console.error);
      showXpGain(5);
    }

    nextBtn.disabled = false;
    if (window.TIC_SETTINGS?.autoSkip) autoNextTimeout = setTimeout(next, 300);

  } else {
    q.correct = false;
    btn.classList.add("wrong");
    all.forEach((b, i) => { if (i === q._correctIndexInUI) b.classList.add("correct"); });
    if (round === 1) marks -= 0.25;
    if (currentUser) recordQuestionAttempt(0).catch(console.error);
    nextBtn.disabled = false;
    if (window.TIC_SETTINGS?.autoSkip) autoNextTimeout = setTimeout(next, 3000);
  }

  // Save paused session state after each answer
  _savePausedSession();
}

/* =========================
   AUTO NEXT (TIME UP)
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
   NAVIGATION
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
  if (qIndex > 0) { qIndex--; renderQuestion(); }
};

nextBtn.onclick = () => {
  if (autoNextTimeout) { clearTimeout(autoNextTimeout); autoNextTimeout = null; }
  next();
};

/* =========================
   FINISH ROUND
========================= */
async function finishRound() {
  clearExamTimer();
  quizActive = false;

  if (round === 1 && !round1Completed) {
    round1Completed  = true;
    round1Snapshot   = JSON.parse(JSON.stringify(activeQuestions));
    window.round1Snapshot = round1Snapshot;

    const correctCount = round1Snapshot.filter(q => q.correct).length;
    const total        = round1Snapshot.length;
    const totalTime    = quizStartTime ? Math.round((Date.now() - quizStartTime) / 1000) : 0;

    // ── UI: show scorecard (replaces direct retry start) ──
    showScorecard({
      correct:   correctCount,
      total,
      marks,
      totalTime,
      subject:   currentSubject?.name || "",
      attempt:   selectedAttempt?.name || ""
    });

    if (resultActions) resultActions.classList.remove("hidden");

    // ── FIREBASE SAVE (reliable async, no race conditions) ──
    if (currentUser) {
      _saveRtpMtpAll({ correctCount, total }).catch(e =>
        console.error("❌ RTP/MTP save pipeline failed", e)
      );
    }

    // Clear paused session — quiz is complete
    _clearPausedSession();
    return; // scorecard shows Retry Round button, so don't auto-start next round
  }

  // Retry rounds
  wrongQuestions = activeQuestions.filter(q => !q.correct);

  if (wrongQuestions.length > 0) {
    round++;
    updateRoundLabel();
    startRound(wrongQuestions.map(q => ({ ...q, attempted: false, _optionOrder: null })));
  } else {
    if (qText)       qText.textContent     = "सब सही कर दिए! 🤗";
    if (optionsBox)  optionsBox.innerHTML  = "";
    if (progressBar) progressBar.style.width = "100%";
    prevBtn.disabled  = true;
    nextBtn.disabled  = true;
    resetBtn.disabled = true;
    clearTimer();
    if (timeEl) timeEl.textContent = "--";
    _clearPausedSession();
  }
}

/* =========================
   CONSOLIDATED FIREBASE SAVE
   Called once after round 1 completes.
   Uses individual try/catch per operation to prevent one failure
   blocking others. No batch-deletes of wrong answers.
========================= */
async function _saveRtpMtpAll({ correctCount, total }) {
  if (!currentUser) return;

  // 1. Detailed stats
  try {
    if (round1Snapshot.length >= 1) {
      await addDoc(collection(db, "users", currentUser.uid, "rtpMtpStats"), {
        userId:         currentUser.uid,
        date:           getLocalDate(),
        type:           selectedAttempt?.type || "",
        subject:        currentSubject?.name  || "",
        attempt:        selectedAttempt?.name || "",
        totalQuestions: total,
        correct:        correctCount,
        wrong:          total - correctCount,
        marks,
        rounds:         round,
        accuracy:       total ? Math.round((correctCount / total) * 100) : 0,
        createdAt:      serverTimestamp()
      });
    }
  } catch(e) { console.error("❌ rtpMtpStats save failed", e); }

  // 2. Attempt summary
  try {
    await addDoc(collection(db, "users", currentUser.uid, "attempts"), {
      type:      selectedAttempt?.type || "RTP",
      subject:   currentSubject?.name  || "",
      chapter:   selectedAttempt?.name || "",
      correct:   correctCount,
      total,
      score:     total ? Math.round((correctCount / total) * 100) : 0,
      xpEarned:  correctCount * 5,
      createdAt: serverTimestamp(),
      date:      getLocalDate()
    });
  } catch(e) { console.error("❌ attempt summary save failed", e); }

  // Corrections collection is REMOVED — no wrong answers saved to Firebase
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

function showScorecard({ correct, total, marks, totalTime, subject, attempt }) {
  const old = document.getElementById("quizScorecard");
  if (old) old.remove();

  const accuracy  = total ? Math.round((correct / total) * 100) : 0;
  const wrong     = total - correct;
  const perf      = getPerformanceLabel(accuracy);
  const isDark    = document.body.classList.contains("dark");

  const card = document.createElement("div");
  card.id = "quizScorecard";
  card.className = "quiz-scorecard";

  card.innerHTML = `
    <div class="sc-inner">
      <div class="sc-badge" style="color:${perf.color}">${perf.label}</div>
      <div class="sc-title">${subject} — ${attempt}</div>

      <div class="sc-ring-wrap">
        <svg class="sc-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}" stroke-width="10"/>
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
          <span class="sc-stat-val" style="color:#6c63ff">${marks >= 0 ? marks.toFixed(2) : marks.toFixed(2)}</span>
          <span class="sc-stat-key">Score</span>
        </div>
        <div class="sc-stat sc-stat-full">
          <span class="sc-stat-val">⏱ ${formatTime(totalTime)}</span>
          <span class="sc-stat-key">Time Taken</span>
        </div>
      </div>

      <div class="sc-share-row">
        <button class="sc-share-btn sc-wa"  id="scShareWA">
          <i class="fa-brands fa-whatsapp"></i> WhatsApp Story
        </button>
        <button class="sc-share-btn sc-ig"  id="scShareIG">
          <i class="fa-brands fa-instagram"></i> Instagram Story
        </button>
      </div>

      <button class="sc-retry-btn" id="scRetryBtn">
        🔁 Retry Round
      </button>
    </div>
  `;

  // Insert ABOVE result-actions (Review + PDF buttons)
  const quizAreaEl = document.getElementById("quizArea");
  const divider    = quizAreaEl.querySelector(".quiz-divider");
  if (divider) {
    quizAreaEl.insertBefore(card, divider);
  } else {
    quizAreaEl.prepend(card);
  }

  // Retry button
  document.getElementById("scRetryBtn").onclick = () => {
    card.remove();
    wrongQuestions = round1Snapshot.filter(q => !q.correct);
    if (wrongQuestions.length > 0) {
      round++;
      updateRoundLabel();
      quizActive = true;
      quizStartTime = Date.now();
      if (resultActions) resultActions.classList.add("hidden");
      startRound(wrongQuestions.map(q => ({ ...q, attempted: false, _optionOrder: null })));
    } else {
      if (qText) qText.textContent = "सब सही कर दिए! 🤗";
      if (optionsBox) optionsBox.innerHTML = "";
    }
  };

  // Share buttons
  document.getElementById("scShareWA").onclick  = () => _shareScorecard("whatsapp", card, { correct, total, accuracy, marks, totalTime, subject, attempt });
  document.getElementById("scShareIG").onclick  = () => _shareScorecard("instagram", card, { correct, total, accuracy, marks, totalTime, subject, attempt });
}

/* =========================
   SCORECARD SHARE
   Generates a 1080×1920 story-format image and shares directly
   via Web Share API (supported on Android Chrome + iOS Safari).
   Falls back to download if Web Share not available.
========================= */
async function _shareScorecard(platform, cardEl, data) {
  const { correct, total, accuracy, marks, totalTime, subject, attempt } = data;
  const wrong = total - correct;
  const perf  = getPerformanceLabel(accuracy);

  // Draw on canvas (1080 × 1920 — story ratio)
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const isDark = document.body.classList.contains("dark");
  const grd = ctx.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, isDark ? "#0f172a" : "#f8f7ff");
  grd.addColorStop(1, isDark ? "#1e1b4b" : "#ede9fe");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Accent circles (decorative)
  ctx.beginPath(); ctx.arc(W * 0.85, H * 0.12, 260, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? "rgba(108,99,255,0.12)" : "rgba(108,99,255,0.10)"; ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.15, H * 0.88, 200, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? "rgba(139,92,246,0.10)" : "rgba(139,92,246,0.08)"; ctx.fill();

  // Card background
  const cx = 90, cy = 320, cw = W - 180, ch = H - 480;
  ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 60;
  ctx.fillStyle   = isDark ? "rgba(30,27,75,0.95)" : "#ffffff";
  _roundRect(ctx, cx, cy, cw, ch, 60);
  ctx.shadowBlur  = 0;

  // PathCA branding
  ctx.font         = "bold 52px Poppins, sans-serif";
  ctx.fillStyle    = "#6c63ff";
  ctx.textAlign    = "center";
  ctx.fillText("PathCA", W / 2, 200);

  ctx.font      = "36px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#a5b4fc" : "#7c6fd4";
  ctx.fillText("CA Foundation Practice", W / 2, 260);

  // Subject + attempt
  ctx.font      = "bold 42px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#e5e7eb" : "#1c1c1c";
  ctx.fillText(subject, W / 2, cy + 90);
  ctx.font      = "34px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
  ctx.fillText(attempt, W / 2, cy + 148);

  // Accuracy ring (drawn on canvas)
  const ringX = W / 2, ringY = cy + 360, ringR = 170;
  ctx.lineWidth   = 22;
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
  ctx.beginPath(); ctx.arc(ringX, ringY, ringR, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = perf.bar;
  ctx.lineCap     = "round";
  ctx.beginPath();
  ctx.arc(ringX, ringY, ringR, -Math.PI / 2, -Math.PI / 2 + (accuracy / 100) * Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.font      = `bold 110px Poppins, sans-serif`;
  ctx.fillStyle = perf.bar;
  ctx.textAlign = "center";
  ctx.fillText(accuracy + "%", ringX, ringY + 28);
  ctx.font      = "34px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
  ctx.fillText("Accuracy", ringX, ringY + 80);

  // Performance label
  ctx.font      = "bold 52px Poppins, sans-serif";
  ctx.fillStyle = perf.color;
  ctx.fillText(perf.label, W / 2, cy + 600);

  // Stats row
  const statsY = cy + 720, colW = cw / 4, startX = cx;
  const statsData = [
    { val: total,             key: "Questions",  color: isDark ? "#e5e7eb" : "#1c1c1c" },
    { val: correct,           key: "Correct",    color: "#22c55e" },
    { val: wrong,             key: "Wrong",      color: "#ef4444" },
    { val: marks.toFixed(1),  key: "Score",      color: "#6c63ff" }
  ];
  statsData.forEach((s, i) => {
    const sx = startX + colW * i + colW / 2;
    ctx.font      = `bold 58px Poppins, sans-serif`;
    ctx.fillStyle = s.color;
    ctx.textAlign = "center";
    ctx.fillText(String(s.val), sx, statsY);
    ctx.font      = "30px Poppins, sans-serif";
    ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
    ctx.fillText(s.key, sx, statsY + 50);
  });

  // Time taken
  ctx.font      = "bold 44px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "#e5e7eb" : "#1c1c1c";
  ctx.textAlign = "center";
  ctx.fillText("⏱ " + formatTime(totalTime), W / 2, statsY + 140);

  // Footer
  ctx.font      = "32px Poppins, sans-serif";
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
  ctx.fillText("pathca.vercel.app", W / 2, H - 120);

  // Convert to blob and share
  canvas.toBlob(async blob => {
    if (!blob) return;
    const file = new File([blob], "pathca-scorecard.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My CA Foundation Result — PathCA",
          text:  `I scored ${accuracy}% (${correct}/${total}) on ${subject} ${attempt}! Practice on pathca.vercel.app`
        });
        return;
      } catch(e) {
        if (e.name !== "AbortError") console.warn("Share failed, falling back to download", e);
      }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = "pathca-scorecard.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, "image/png");
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

/* =========================
   RESUME SYSTEM
   Saves current session state to localStorage on each answer.
   On page load (after auth), checks if a paused session exists
   and shows a resume prompt on the chapters-like setup area.
========================= */
function _pausedKey(uid) { return `paused_rtp_${uid}`; }

function _savePausedSession() {
  if (!currentUser || !currentSubject || !selectedAttempt) return;
  try {
    const state = {
      subjectName:    currentSubject.name,
      subjectId:      currentSubject.id || currentSubject.name,
      attemptName:    selectedAttempt.name,
      attemptId:      selectedAttempt.id || selectedAttempt.name,
      attemptType:    selectedAttempt.type || "",
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

    // Check freshness — ignore sessions older than 3 days
    if (Date.now() - (state.savedAt || 0) > 3 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(_pausedKey(uid));
      return;
    }

    _showResumePrompt(state);
  } catch(e) {
    console.error("❌ Paused session check failed", e);
  }
}

function _showResumePrompt(state) {
  // Don't show if a quiz is already running
  if (quizActive) return;

  const old = document.getElementById("resumeBanner");
  if (old) old.remove();

  const banner = document.createElement("div");
  banner.id = "resumeBanner";
  banner.className = "resume-banner";
  banner.innerHTML = `
    <div class="resume-banner-inner">
      <div class="resume-icon">⏸️</div>
      <div class="resume-body">
        <div class="resume-title">You have a paused ${state.attemptType || "practice"}</div>
        <div class="resume-sub">${state.subjectName} — ${state.attemptName}</div>
        <div class="resume-sub">Question ${state.qIndex + 1} · Round ${state.round}</div>
      </div>
      <div class="resume-btns">
        <button class="resume-btn-resume" id="resumeBtn">▶ Resume</button>
        <button class="resume-btn-restart" id="restartBtn">↺ Restart</button>
      </div>
    </div>
  `;

  // Insert above quiz-setup
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
  // Find subject & attempt objects
  const subjectObj = rtpMtpSubjects.find(s => s.name === state.subjectName);
  if (!subjectObj) return;
  const attemptObj = subjectObj.attempts.find(a => a.name === state.attemptName);
  if (!attemptObj) return;

  // Restore state
  currentSubject  = subjectObj;
  selectedAttempt = attemptObj;

  subjectText.textContent = subjectObj.name;
  chapterText.textContent = attemptObj.name;
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
  renderQuestion();
}

/* =========================
   FIREBASE: recordQuestionAttempt
   Reliable async with proper streak/XP logic.
========================= */
async function recordQuestionAttempt(xpGained) {
  if (!currentUser) return;
  incrementDailyProgress(currentUser.uid);

  const ref  = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data  = snap.data();
  const today = getLocalDate();

  let updates = {
    totalAttempts: increment(1),
    dailyXp:       increment(xpGained),
    dailyXpDate:   today,
    [`weeklyXp.${today}`]: increment(xpGained)
  };

  if (data.lastActiveDate !== today) {
    let streak = data.streak || 0;
    if (data.lastActiveDate) {
      const diff = (new Date(today) - new Date(data.lastActiveDate)) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    } else { streak = 1; }
    updates.streak             = streak;
    updates.lastActiveDate     = today;
    updates.dailyXp            = xpGained;
    updates[`weeklyXp.${today}`] = xpGained;
  }

  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  if (istNow.getDay() === 1 && data.lastActiveDate !== today) updates.weeklyXp = {};

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
      weekKey: _getWeekKey()
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

function _getWeekKey() {
  const now     = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const year    = now.getFullYear();
  const firstJan = new Date(year, 0, 1);
  const days    = Math.floor((now - firstJan) / 86400000);
  const week    = Math.ceil((days + firstJan.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

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
   URL PARAM AUTO-SELECT
========================= */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

window.addEventListener("DOMContentLoaded", () => {
  const subjectId = getParam("subject");
  const attemptId = getParam("attempt");
  if (!subjectId || !attemptId) return;

  const subject = rtpMtpSubjects.find(s => s.id === subjectId);
  if (!subject) return;
  currentSubject = subject;
  subjectText.textContent = subject.name;
  chapterBtn.classList.remove("disabled");

  const attempt = subject.attempts.find(a => a.id === attemptId);
  if (!attempt) return;
  selectedAttempt = attempt;
  chapterText.textContent = attempt.name;
  limitInput.disabled = false;
  resetBtn.disabled   = false;
});

/* =========================
   OUTSIDE CLICK: CLOSE POPUPS
========================= */
document.addEventListener("click", e => {
  if (
    subjectBtn && !subjectBtn.contains(e.target) &&
    chapterBtn && !chapterBtn.contains(e.target) &&
    subjectPopup && !subjectPopup.contains(e.target) &&
    attemptPopup && !attemptPopup.contains(e.target)
  ) {
    closeAllPopups();
  }
});

document.addEventListener("click", e => {
  if (attemptPopup && !attemptPopup.contains(e.target) && !chapterBtn.contains(e.target)) {
    attemptPopup.classList.remove("show");
  }
});

/* =========================
   EXPOSE for common-logic.js
========================= */
window.__getQuizMode = () => "mcq";

/* =========================
   DETAILED STATS (kept for backward compat, now inlined in _saveRtpMtpAll)
========================= */
async function saveRtpMtpDetailedStats() {
  // Delegated to _saveRtpMtpAll
}
