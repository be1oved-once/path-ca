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

  // close others
  document.querySelectorAll(".attempt-list").forEach(l => {
    l.classList.remove("show");
  });

  // uncheck others
  document.querySelectorAll('.attempt-header input[type="checkbox"]').forEach(cb => {
    if (cb !== checkbox) cb.checked = false;
  });

  list.classList.add("show");

} else {
  list.classList.remove("show");
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

  resetTracker();
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
   QUESTION TRACKER
========================= */
function initTracker(count) {
  const tracker = document.getElementById("questionTracker");
  if (!tracker) return;
  tracker.innerHTML = "";
  tracker.classList.remove("hidden");
  for (let i = 0; i < count; i++) {
    const box = document.createElement("div");
    box.className   = "tracker-box";
    box.textContent = i + 1;
    box.id          = `tbox-${i}`;
    tracker.appendChild(box);
  }
}

function updateTracker(index, isCorrect) {
  let box;
  if (round === 1) {
    box = document.getElementById(`tbox-${index}`);
  } else {
    const row = document.getElementById(`tracker-retry-${round}`);
    if (row) box = row.children[index];
  }
  if (!box) return;
  box.classList.remove("t-correct", "t-wrong");
  box.classList.add(isCorrect ? "t-correct" : "t-wrong");
}

function resetTracker() {
  const tracker = document.getElementById("questionTracker");
  if (tracker) tracker.classList.add("hidden");
}

function appendRetryTracker(count) {
  const tracker = document.getElementById("questionTracker");
  if (!tracker) return;

  const divider = document.createElement("div");
  divider.className   = "tracker-divider";
  divider.textContent = `Retry Round ${round - 1}`;
  tracker.appendChild(divider);

  const row = document.createElement("div");
  row.className = "tracker-retry-row";
  row.id        = `tracker-retry-${round}`;

  for (let i = 0; i < count; i++) {
    const box = document.createElement("div");
    box.className          = "tracker-box";
    box.dataset.retryRound = round;
    box.dataset.retryIndex = i;
    box.textContent        = i + 1;
    row.appendChild(box);
  }

  tracker.appendChild(row);
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

  if (round === 1) initTracker(list.length);
  else             appendRetryTracker(list.length);

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

function renderMath(element, html) {
  element.innerHTML = html;

  if (window.MathJax) {
    MathJax.typesetPromise([element]).catch(console.error);
  }
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
      const td = document.createElement("td"); td.innerHTML = cell; tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
wrap.appendChild(table);

if (window.MathJax) {
  MathJax.typesetPromise([wrap]).catch(console.error);
}

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
  renderMath(
  qText,
  `${qIndex + 1}. ${q.text}`
);

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
    const prefix =
  window.TIC_SETTINGS?.showABCD
    ? String.fromCharCode(65 + uiIndex) + ". "
    : "";

btn.innerHTML = prefix + opt.text;
    btn.disabled = q.attempted;

    if (q.attempted) {
      if (uiIndex === q._correctIndexInUI) btn.classList.add("correct");
      if (q._selectedIndex === uiIndex && uiIndex !== q._correctIndexInUI) btn.classList.add("wrong");
    }

    btn.onclick = () => handleAnswer(btn, uiIndex);
    optionsBox.appendChild(btn);
  });

if (window.MathJax) {
  MathJax.typesetPromise([optionsBox]).catch(console.error);
}

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
    updateTracker(qIndex, true);

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
    updateTracker(qIndex, false);
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

  if (pct >= 90) {
    return {
      label: "Outstanding",
      color: "#22c55e",
      bar: "#22c55e"
    };
  }

  if (pct >= 75) {
    return {
      label: "Excellent",
      color: "#16a34a",
      bar: "#4ade80"
    };
  }

  if (pct >= 60) {
    return {
      label: "Good Job",
      color: "#f59e0b",
      bar: "#fbbf24"
    };
  }

  if (pct >= 40) {
    return {
      label: "Keep Trying",
      color: "#f97316",
      bar: "#fb923c"
    };
  }

  return {
    label: "Needs Work",
    color: "#ef4444",
    bar: "#f87171"
  };
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

    <div class="sc-badge" style="color:${perf.color}">
      <span class="sc-badge-icon">
        ${
          accuracy >= 90
          ? `<svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"
              fill="currentColor"/>
            </svg>`
          : accuracy >= 75
          ? `<svg viewBox="0 0 24 24" fill="none">
              <path d="M20 7L9 18L4 13"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"/>
            </svg>`
          : accuracy >= 60
          ? `<svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9"
              stroke="currentColor"
              stroke-width="2"/>
              <path d="M8 13L10.5 15.5L16 10"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"/>
            </svg>`
          : `<svg viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"/>
              <circle cx="12" cy="16" r="1"
              fill="currentColor"/>
              <circle cx="12" cy="12" r="9"
              stroke="currentColor"
              stroke-width="2"/>
            </svg>`
        }
      </span>

      <span>${perf.label}</span>
    </div>

    <div class="sc-title">${subject} — ${attempt}</div>

    <div class="sc-ring-wrap">
      <svg class="sc-ring" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none"
          stroke="${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}"
          stroke-width="10"/>

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
        <span class="sc-pct" style="color:${perf.bar}">
          ${accuracy}%
        </span>

        <span class="sc-pct-label">
          Accuracy
        </span>
      </div>
    </div>

    <div class="sc-stats-grid">

      <div class="sc-stat">
        <div class="sc-stat-icon sc-blue">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L22 4"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"/>

            <path d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"/>
          </svg>
        </div>

        <span class="sc-stat-val">${total}</span>
        <span class="sc-stat-key">Questions</span>
      </div>

      <div class="sc-stat">
        <div class="sc-stat-icon sc-green">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12"
            stroke="currentColor"
            stroke-width="2.8"
            stroke-linecap="round"
            stroke-linejoin="round"/>
          </svg>
        </div>

        <span class="sc-stat-val" style="color:#22c55e">
          ${correct}
        </span>

        <span class="sc-stat-key">Correct</span>
      </div>

      <div class="sc-stat">
        <div class="sc-stat-icon sc-red">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18"
            stroke="currentColor"
            stroke-width="2.8"
            stroke-linecap="round"/>

            <path d="M6 6L18 18"
            stroke="currentColor"
            stroke-width="2.8"
            stroke-linecap="round"/>
          </svg>
        </div>

        <span class="sc-stat-val" style="color:#ef4444">
          ${wrong}
        </span>

        <span class="sc-stat-key">Wrong</span>
      </div>

      <div class="sc-stat">
        <div class="sc-stat-icon sc-purple">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.9 8.6L22 9.3L16.7 14L18.3 21L12 17.5L5.7 21L7.3 14L2 9.3L9.1 8.6L12 2Z"
            fill="currentColor"/>
          </svg>
        </div>

        <span class="sc-stat-val" style="color:#6c63ff">${Number(marks || 0).toFixed(2)}</span>

        <span class="sc-stat-key">Score</span>
      </div>

      <div class="sc-stat sc-stat-full">

        <div class="sc-stat-icon sc-time">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9"
            stroke="currentColor"
            stroke-width="2.4"/>

            <path d="M12 7V12L15 15"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"/>
          </svg>
        </div>

        <span class="sc-stat-val">
          ${formatTime(totalTime)}
        </span>

        <span class="sc-stat-key">
          Time Taken
        </span>

      </div>

    </div>

    <div class="sc-share-row">

      <button class="sc-share-btn sc-wa" id="scShareWA">
        <i class="fa-brands fa-whatsapp"></i>
        WhatsApp Story
      </button>

      <button class="sc-share-btn sc-ig" id="scShareIG">
        <i class="fa-brands fa-instagram"></i>
        Instagram Story
      </button>

    </div>

    <button class="sc-retry-btn" id="scRetryBtn">
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M1 4v6h6"/>
        <path d="M3.51 15a9 9 0 1 0 .49-3.75"/>
      </svg>

      Retry Round
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

document.getElementById("scShareWA").onclick = () =>
  _shareScorecard("whatsapp", { correct, total, accuracy, marks, totalTime, subject, chapter: attempt });

document.getElementById("scShareIG").onclick = () =>
  _shareScorecard("instagram", {
    correct,
    total,
    accuracy,
    marks,
    totalTime,
    subject,
    chapter: attempt
  });
}
async function _loadFont(family, url, descriptors = {}) {
  try {
    const f = new FontFace(family, `url(${url})`, descriptors);
    const loaded = await f.load();
    document.fonts.add(loaded);
    return true;
  } catch (e) {
    console.warn(`Font load failed: ${url}`, e);
    return false;
  }
}
/* =========================
   DROP-IN REPLACEMENT
   Paste this into BOTH files:
   • questions-logic-rtp.js  (replace _shareScorecard + add helpers)
   • questions-logic.js      (same)

   Also in showScorecard() HTML, change the share button onclick to:
     document.getElementById("scShareWA").onclick = () =>
       _shareScorecard("whatsapp", { correct, total, accuracy, marks, totalTime, subject, chapter: attempt });
     document.getElementById("scShareIG").onclick = () =>
       _shareScorecard("instagram", { correct, total, accuracy, marks, totalTime, subject, chapter: attempt });

   And fix marks.toFixed crash in showScorecard HTML:
     ${Number(marks || 0).toFixed(2)}
========================= */

/* ── Helpers ─────────────────────────────────────────────── */

function _truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function _showShareToast(platform) {
  const old = document.getElementById("_scToast");
  if (old) old.remove();
  const t = document.createElement("div");
  t.id = "_scToast";
  t.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:#1e1b4b;color:#fff;padding:13px 22px;border-radius:14px;
    font-size:14px;z-index:99999;text-align:center;max-width:300px;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);line-height:1.5;
    font-family:sans-serif;pointer-events:none;
  `;
  const app = platform === "whatsapp" ? "WhatsApp" : "Instagram";
  t.innerHTML = `Image saved! Open from gallery and share to <b>${app}</b> 📤`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);       ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);   ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);       ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
  ctx.lineTo(x, y + r);           ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
  ctx.fill();
}

/* ── Main share function ─────────────────────────────────── */

async function _shareScorecard(platform, data) {
  const { correct, total, accuracy, totalTime, subject } = data;
  // chapter key differs between the two files — handle both
  const chapter = data.chapter || data.attempt || "";
  // Guard marks against undefined/NaN always
  const marks   = Number(data.marks || 0);
  const wrong   = total - correct;
  const perf    = getPerformanceLabel(accuracy);
  const isDark  = document.body.classList.contains("dark");

  /* ── Button loading state ── */
  const btnId    = platform === "whatsapp" ? "scShareWA" : "scShareIG";
  const btn      = document.getElementById(btnId);
  const origHTML = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled  = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Preparing…`;
  }

  /* ── Step 1: Ensure Poppins is loaded ──────────────────────
     The page already imports Poppins via <link> in <head>.
     We just wait for document.fonts.ready to confirm it's active.
     Then force canvas to use it by "touching" it in DOM first.
  ─────────────────────────────────────────────────────────── */
  await document.fonts.ready;

  // If Poppins somehow isn't loaded yet, try fetching it
  if (![...document.fonts].some(f => f.family === "Poppins" && f.status === "loaded")) {
    try {
      const f400 = new FontFace("Poppins",
        "url(https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.woff2)",
        { weight: "400" });
      const f700 = new FontFace("Poppins",
        "url(https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2)",
        { weight: "700" });
      const [r400, r700] = await Promise.allSettled([f400.load(), f700.load()]);
      if (r400.status === "fulfilled") document.fonts.add(r400.value);
      if (r700.status === "fulfilled") document.fonts.add(r700.value);
      await document.fonts.ready;
    } catch (e) {
      console.warn("Poppins fallback load failed", e);
    }
  }

  // DOM probe: force browser to activate font for canvas
  const probe = document.createElement("div");
  probe.style.cssText = `
    font-family:'Poppins',sans-serif;font-weight:700;font-size:72px;
    position:absolute;left:-9999px;top:-9999px;visibility:hidden;
    white-space:nowrap;
  `;
  probe.textContent = "PathCA 0123456789%";
  document.body.appendChild(probe);
  // One frame to let browser paint it
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  probe.remove();

  /* ── Step 2: Draw canvas ────────────────────────────────── */
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Font helper — matches what's used on the web page
  const F = (size, bold = false) =>
    `${bold ? "700" : "400"} ${size}px 'Poppins', sans-serif`;

  /* Background */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  if (isDark) {
    bg.addColorStop(0,   "#0f0c29");
    bg.addColorStop(0.5, "#111827");
    bg.addColorStop(1,   "#1e1b4b");
  } else {
    bg.addColorStop(0,   "#f8f7ff");
    bg.addColorStop(0.5, "#eef2ff");
    bg.addColorStop(1,   "#e0e7ff");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* Decorative blobs */
  const drawBlob = (x, y, r, color) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  drawBlob(W * 0.87, H * 0.10, 280, "rgba(108,99,255,0.13)");
  drawBlob(W * 0.13, H * 0.88, 230, "rgba(139,92,246,0.11)");
  drawBlob(W * 0.50, H * 0.50, 180, "rgba(99,102,241,0.05)");

  /* White card */
  const PAD = 64;
  const cardX = PAD, cardY = 140, cardW = W - PAD * 2, cardH = H - 280;
  ctx.shadowColor   = "rgba(0,0,0,0.14)";
  ctx.shadowBlur    = 70;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle     = isDark ? "rgba(15,12,41,0.94)" : "rgba(255,255,255,0.96)";
  _roundRect(ctx, cardX, cardY, cardW, cardH, 56);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.textAlign = "center";

  /* ── Branding ── */
  ctx.font      = F(64, true);
  ctx.fillStyle = "#6c63ff";
  ctx.fillText("PathCA", W / 2, 252);

  ctx.font      = F(30);
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.55)" : "rgba(17,24,39,0.52)";
  ctx.fillText("CA Foundation Practice", W / 2, 304);

  /* ── Divider line ── */
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(108,99,255,0.15)";
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, 330); ctx.lineTo(cardX + cardW - 60, 330);
  ctx.stroke();

  /* ── Subject + Chapter ── */
  ctx.font      = F(44, true);
  ctx.fillStyle = isDark ? "#f3f4f6" : "#111827";
  ctx.fillText(_truncate(subject || "Practice Test", 24), W / 2, 420);

  ctx.font      = F(30);
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.50)" : "rgba(17,24,39,0.48)";
  ctx.fillText(_truncate(chapter, 30), W / 2, 468);

  /* ── Accuracy Ring ── */
  const rX = W / 2, rY = 770, rR = 162;

  // Track
  ctx.lineWidth   = 24;
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";
  ctx.beginPath(); ctx.arc(rX, rY, rR, 0, Math.PI * 2); ctx.stroke();

  // Glow
  ctx.shadowColor = perf.bar; ctx.shadowBlur = 32;

  // Progress
  ctx.strokeStyle = perf.bar;
  ctx.lineCap     = "round";
  ctx.beginPath();
  ctx.arc(rX, rY, rR, -Math.PI / 2,
    -Math.PI / 2 + (accuracy / 100) * Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur  = 0;
  ctx.lineCap     = "butt";

  // Percentage
  ctx.font      = F(104, true);
  ctx.fillStyle = perf.bar;
  ctx.fillText(`${accuracy}%`, rX, rY + 30);

  ctx.font      = F(30);
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.48)" : "rgba(17,24,39,0.46)";
  ctx.fillText("Accuracy", rX, rY + 84);

  /* ── Performance label ── */
  ctx.font      = F(52, true);
  ctx.fillStyle = perf.bar;
  ctx.fillText(perf.label, W / 2, 1060);

  /* ── Stats Cards (2×2 grid) ── */
  const statsData = [
    { label: "Questions", value: String(total),          color: "#3b82f6" },
    { label: "Correct",   value: String(correct),        color: "#22c55e" },
    { label: "Wrong",     value: String(wrong),          color: "#ef4444" },
    { label: "Score",     value: marks.toFixed(1),       color: "#8b5cf6" },
  ];

  const scW = 400, scH = 160;
  const scGap = 30;
  const scStartX = (W - (scW * 2 + scGap)) / 2;
  const scStartY = 1130;

  statsData.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx  = scStartX + col * (scW + scGap);
    const sy  = scStartY + row * (scH + scGap);

    // Card bg
    ctx.fillStyle = isDark
      ? "rgba(255,255,255,0.05)"
      : col === 0 ? "rgba(59,130,246,0.06)" : "rgba(34,197,94,0.06)";
    if (i === 2) ctx.fillStyle = isDark ? "rgba(255,255,255,0.05)" : "rgba(239,68,68,0.06)";
    if (i === 3) ctx.fillStyle = isDark ? "rgba(255,255,255,0.05)" : "rgba(139,92,246,0.06)";
    _roundRect(ctx, sx, sy, scW, scH, 28);

    // Value
    ctx.font      = F(62, true);
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, sx + scW / 2, sy + 76);

    // Label
    ctx.font      = F(26);
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.52)" : "rgba(17,24,39,0.54)";
    ctx.fillText(s.label, sx + scW / 2, sy + 120);
  });

  /* ── Time Taken ── */
  ctx.font      = F(38, true);
  ctx.fillStyle = isDark ? "#d1d5db" : "#374151";
  ctx.fillText("⏱  " + formatTime(totalTime), W / 2, scStartY + 2 * (scH + scGap) + 60);

  /* ── Footer ── */
  ctx.font      = F(26);
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.25)";
  ctx.fillText("pathca.vercel.app", W / 2, H - 80);

  /* ── Restore button ── */
  if (btn) { btn.disabled = false; btn.innerHTML = origHTML; }

  /* ── Step 3: Export + Share ─────────────────────────────── */
  canvas.toBlob(async blob => {
    if (!blob) { console.error("Canvas toBlob failed"); return; }

    const file    = new File([blob], "pathca-scorecard.png", { type: "image/png" });
    const blobUrl = URL.createObjectURL(blob);

    // Native Web Share (Android Chrome + iOS Safari)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My PathCA Score",
          text:  `I scored ${accuracy}% on ${subject} (${chapter}) — PathCA`,
        });
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        return;
      } catch (e) {
        if (e.name === "AbortError") {
          URL.revokeObjectURL(blobUrl);
          return; // user cancelled — don't download
        }
        // Other error — fall through to download
        console.warn("Web Share failed:", e);
      }
    }

    // Fallback: download + toast
    _showShareToast(platform);
    const a = document.createElement("a");
    a.href = blobUrl; a.download = "pathca-scorecard.png"; a.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

  }, "image/png");
}

// ── Helper: show share toast ──────────────────────────────────
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

    <div class="resume-icon">
      <i class="fa-solid fa-circle-pause"></i>
    </div>

    <div class="resume-body">
      <div class="resume-title">
        You have a paused ${state.attemptType || "practice"}
      </div>

      <div class="resume-sub">
        ${state.subjectName} — ${state.attemptName}
      </div>

      <div class="resume-sub">
        Question ${(state.qIndex || 0) + 1} · Round ${state.round || 1}
      </div>
    </div>

    <div class="resume-btns">
      <button class="resume-btn-resume" id="resumeBtn">
        <i class="fa-solid fa-play"></i>
        <span>Resume</span>
      </button>

      <button class="resume-btn-restart" id="restartBtn">
        <i class="fa-solid fa-rotate-right"></i>
        <span>Restart</span>
      </button>
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
