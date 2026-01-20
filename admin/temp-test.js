import {
  doc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { db } from "/assets/js/firebase.js";

import { Timestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =========================
   FIREBASE TEMP TEST REF
========================= */
const logsContainer = document.getElementById("logsContainer");
const clearLogsBtn  = document.getElementById("clearLogs");
const questionsContainer = document.getElementById("questionsContainer");
let questionCount = 0;
let questionMode = "mcq";      // "mcq" | "direct"
let modeLocked = false; 
function adminLog(message, type = "info") {
  if (!logsContainer) return;
  
  const time = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  
  const log = document.createElement("div");
  log.className = `log-item ${type}`;
  
  const timeSpan = document.createElement("span");
  timeSpan.textContent = `[${time}] `;
  
  const textSpan = document.createElement("span");
  const cursor = document.createElement("span");
  
  cursor.className = "log-cursor";
  cursor.textContent = "█";
  
  log.appendChild(timeSpan);
  log.appendChild(textSpan);
  log.appendChild(cursor);
  logsContainer.prepend(log);
  
  let i = 0;
  const speed = 40; // typing speed (ms)
  
  const typer = setInterval(() => {
    textSpan.textContent += message[i];
    i++;
    
    if (i >= message.length) {
      clearInterval(typer);
      cursor.remove(); // ✅ STOP BLINKING FOREVER
    }
  }, speed);
}
/* =========================
   CONSOLE → ADMIN LOG BRIDGE
========================= */
function disablePublishMode() {
  liveBtn?.classList.add("disabled");
  scheduleBtn?.classList.add("disabled");

  liveBtn && (liveBtn.style.pointerEvents = "none");
  scheduleBtn && (scheduleBtn.style.pointerEvents = "none");
}

function enablePublishMode() {
  liveBtn?.classList.remove("disabled");
  scheduleBtn?.classList.remove("disabled");

  liveBtn && (liveBtn.style.pointerEvents = "");
  scheduleBtn && (scheduleBtn.style.pointerEvents = "");
}

(function hookConsole() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  function stringify(args) {
    return args.map(a => {
      if (typeof a === "object") {
        try {
          return JSON.stringify(a, null, 2);
        } catch {
          return String(a);
        }
      }
      return String(a);
    }).join(" ");
  }

  console.log = (...args) => {
    original.log(...args);
    adminLog(stringify(args), "info");
  };

  console.info = (...args) => {
    original.info(...args);
    adminLog(stringify(args), "info");
  };

  console.warn = (...args) => {
    original.warn(...args);
    adminLog(stringify(args), "warn");
  };

  console.error = (...args) => {
    original.error(...args);
    adminLog(stringify(args), "danger");
  };
})();

// Clear logs
clearLogsBtn?.addEventListener("click", () => {
  logsContainer.innerHTML = "";
});
let timerInterval = null;
let adminPresenceInterval = null;

let scheduleInterval = null;
let scheduledTimeCache = null;
let remainingSeconds = 0;

const TEMP_TEST_REF = doc(db, "tempTests", "current");

function setupCorrectOption(block) {
  const checks = block.querySelectorAll(".correct-check");

  checks.forEach(check => {
    check.addEventListener("change", () => {
      checks.forEach(c => {
        if (c !== check) c.checked = false;
      });
    });
  });
}

/* =========================
   AUTO HEIGHT GROW
========================= */
function setupAutoGrow(block) {
  block.querySelectorAll("textarea").forEach(el => {
    el.style.height = "auto";
    el.addEventListener("input", () => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    });
  });
}

const joinedEl = document.getElementById("joinedCount");
const submittedEl = document.getElementById("submittedCount");
const activeEl = document.getElementById("activeCount");

const testId = window.currentTestId; // already set in your admin publish

// --- LISTEN JOINED ---


// --- LISTEN SUBMITTED ---

function updateActive() {
  const j = Number(joinedEl.textContent || 0);
  const s = Number(submittedEl.textContent || 0);
  activeEl.textContent = Math.max(j - s, 0);
}

function toggleOptions(block, mode) {
  const optionsWrap = block.querySelector(".options-wrap");
  if (!optionsWrap) return;

  if (mode === "direct") {
    optionsWrap.classList.add("hidden");
  } else {
    optionsWrap.classList.remove("hidden");
  }
}

function insertParsedQuestions(parsedQuestions) {
  questionsContainer.innerHTML = "";
  questionCount = 0;
  modeLocked = true;

  let hasMCQ = false;
  let hasDirect = false;

  parsedQuestions.forEach(q => {
    questionCount++;

    // ===== MCQ BLOCK =====
    if (q.type === "mcq") {
      hasMCQ = true;

      const block = document.createElement("div");
      block.className = "question-block";

      block.innerHTML = `
        <textarea
          class="admin-textarea question-text"
          placeholder="Question ${questionCount}">${q.question}</textarea>

        <div class="options-wrap">
          ${[0,1,2,3].map(i => `
            <div class="option-row">
              <input type="checkbox" class="correct-check"
                ${q.correctIndex === i ? "checked" : ""}>
              <input
                type="text"
                class="admin-input option-input"
                placeholder="Option ${i+1}"
                value="${q.options[i] || ""}">
            </div>
          `).join("")}
        </div>

        <button type="button" class="outline-btn delete-question">
          Delete Question
        </button>
      `;

      questionsContainer.appendChild(block);

      setupCorrectOption(block);
      setupAutoGrow(block);

      block.querySelector(".delete-question")
        .addEventListener("click", () => block.remove());
    }


    // ===== DIRECT BLOCK =====
    if (q.type === "direct") {
      hasDirect = true;

      const block = document.createElement("div");
      block.className = "question-block";

      block.innerHTML = `
        <textarea
          class="admin-textarea question-text"
          placeholder="Question ${questionCount}">${q.question}</textarea>

        <button type="button" class="outline-btn delete-question">
          Delete Question
        </button>
      `;

      questionsContainer.appendChild(block);

      setupAutoGrow(block);

      block.querySelector(".delete-question")
        .addEventListener("click", () => block.remove());
    }

  });

  // 🔥 Set correct global mode UI
  if (hasDirect && !hasMCQ) {
    setQuestionMode("direct");
  } 
  else if (hasMCQ && !hasDirect) {
    setQuestionMode("mcq");
  } 
  else {
    // mixed file → default lock
    setQuestionMode("mcq");
  }

  adminLog(`Inserted ${parsedQuestions.length} questions`);
}
function setQuestionMode(mode) {
  questionMode = mode;

  withOptionsBtn.classList.toggle("active", mode === "mcq");
  withoutOptionsBtn.classList.toggle("active", mode === "direct");

  // 🔁 Update ALL existing questions
  document.querySelectorAll(".question-block").forEach(block => {
    toggleOptions(block, mode);
  });
}
document.addEventListener("DOMContentLoaded", () => {
const uploadBtn = document.getElementById("uploadQuestionBtn");
const fileInput = document.getElementById("questionFileInput");
const fileNameLabel = document.getElementById("uploadFileName");

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  if (!fileInput.files.length) return;

  const file = fileInput.files[0];
  fileNameLabel.textContent = file.name;

  let textContent = "";

  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "txt") {
    textContent = await file.text();
  }

  else if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    textContent = result.value;
  }

  else if (ext === "pdf") {
    textContent = await readPdfText(file);
  }

  else {
    alert("Unsupported file type");
    return;
  }

  console.log("RAW FILE TEXT:\n", textContent);

  const questions = parseQuestionFormat(textContent);
  console.log("PARSED QUESTIONS:", questions);
insertParsedQuestions(questions);

  // Later we will auto-insert into your question UI
});
/* =========================
   ADMIN-ONLINE SCHEDULER
========================= */
function calculateRemainingSeconds(expiresAt) {
  if (!expiresAt) return 0;

  const now = Date.now();
  const end = expiresAt.toDate().getTime();

  return Math.max(Math.floor((end - now) / 1000), 0);
}
const leaderboardBtn = document.getElementById("leaderboardBtn");
const leaderboardPage = document.getElementById("leaderboardPage");
const leaderboardBackBtn = document.getElementById("leaderboardBackBtn");

leaderboardBtn?.addEventListener("click", () => {
  leaderboardPage.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});

leaderboardBackBtn?.addEventListener("click", () => {
  leaderboardPage.classList.add("hidden");
  document.body.style.overflow = "";
});
/* =========================
   ADMIN-ONLINE SCHEDULER (FIXED)
========================= */
console.log("Attaching onSnapshot to TEMP_TEST_REF");

let schedulerInterval = null;

onSnapshot(TEMP_TEST_REF, async (snap) => {

  /* =========================
     NO ACTIVE TEST
  ========================= */
  if (!snap.exists()) {
    console.log("No active test");

    clearTestBtn && (clearTestBtn.disabled = true);
    leaderboardBtn?.classList.remove("hidden");

    // stop all timers safely
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }

    remainingSeconds = 0;
    timerDisplay && (timerDisplay.textContent = "00:00");
    liveTimerText && (liveTimerText.textContent = "00:00");
    liveTimerBar?.classList.add("hidden");

enablePublishMode();
    return;
  }

  /* =========================
     TEST EXISTS
  ========================= */
  const data = snap.data();
// ================================
// LIVE STUDENT MONITOR (FIXED)
// ================================

const joinedEl = document.getElementById("joinedCount");
const submittedEl = document.getElementById("submittedCount");
const activeEl = document.getElementById("activeCount");

const currentTestId = data.testId; // ✅ now guaranteed real

// Clear previous listeners if reloaded
if (window.joinListenerUnsub) window.joinListenerUnsub();
if (window.submitListenerUnsub) window.submitListenerUnsub();

// --- LISTEN JOINED ---
window.joinListenerUnsub = onSnapshot(
  collectionGroup(db, "testJoins"),
  snap => {
    let joined = 0;
    snap.forEach(d => {
      if (d.data().testId === currentTestId) joined++;
    });
    joinedEl.textContent = joined;
    updateActive();
  }
);

// --- LISTEN SUBMITTED ---
window.submitListenerUnsub = onSnapshot(
  collectionGroup(db, "testSubmissions"),
  snap => {
    let submitted = 0;
    snap.forEach(d => {
      if (d.data().testId === currentTestId) submitted++;
    });
    submittedEl.textContent = submitted;
    updateActive();
  }
);

function updateActive() {
  const j = Number(joinedEl.textContent || 0);
  const s = Number(submittedEl.textContent || 0);
  activeEl.textContent = Math.max(j - s, 0);
}

disablePublishMode();
  console.log(
    "Test:",
    data.status,
    "| Questions:",
    data.questions?.length || 0
  );

  clearTestBtn && (clearTestBtn.disabled = false);

  /* =========================
     DISPLAY INFO
  ========================= */
  scheduleInfo && (scheduleInfo.textContent =
    formatDateTime(data.schedule?.at));

  expiresInfo && (expiresInfo.textContent =
    formatDateTime(data.expiresAt));

  /* =========================
     🔥 LIVE TIMER SYNC (FIX)
  ========================= */
  if (data.status === "live" && data.expiresAt) {

    const now = Date.now();
    const end = data.expiresAt.toDate().getTime();

    remainingSeconds = Math.max(
      Math.floor((end - now) / 1000),
      0
    );

    // show timer UI
    liveTimerBar?.classList.remove("hidden");

    // update text immediately
    updateTimerDisplay();

    // restart interval ONLY if not running
    if (!timerInterval && remainingSeconds > 0) {
      startTimer();
    }

    // if time already over
    if (remainingSeconds <= 0) {
      timerDisplay.textContent = "TIME UP";
      liveTimerText.textContent = "TIME UP";
    }
  }

  /* =========================
     ⏰ SCHEDULE → LIVE HANDLER
  ========================= */
  if (
    data.publishMode === "schedule" &&
    data.status !== "live" &&
    data.schedule?.at
  ) {
    const scheduledTime = data.schedule.at.toDate();

    if (!schedulerInterval) {
      console.log("Scheduler armed");

      schedulerInterval = setInterval(async () => {
        if (Date.now() < scheduledTime.getTime()) return;

        console.log("TIME REACHED → GOING LIVE");

        clearInterval(schedulerInterval);
        schedulerInterval = null;

        await updateDoc(TEMP_TEST_REF, {
          status: "live",
          publishMode: "live",
          "timer.startedAt": serverTimestamp(),
          adminLastSeen: serverTimestamp()
        });

        openTimerPage();
      }, 1000);
    }
  }

});
/* =========================
   SUBJECT DROPDOWN
========================= */
const subjectBtn = document.getElementById("subjectBtn");
const subjectPopup = document.getElementById("subjectPopup");
const subjectValue = document.getElementById("subjectValue");
const clearTestBtn = document.getElementById("clearTestBtn");
/* =========================
   FIREBASE TEMP TEST REF
========================= */

/* 🔒 Disable clear test on page load */
if (clearTestBtn) {
  clearTestBtn.disabled = true;
}

const subjectArrow = document.getElementById("subjectArrow");

subjectBtn.addEventListener("click", e => {
    e.stopPropagation();

    const isOpen = subjectPopup.classList.toggle("show");
    subjectArrow.classList.toggle("open", isOpen);
  });

  /* ITEM CLICK */
  subjectPopup.querySelectorAll(".subject-item").forEach(item => {
    item.addEventListener("click", () => {
      subjectValue.textContent = item.dataset.subject;

      subjectPopup.classList.remove("show");
      subjectArrow.classList.remove("open");
    });
  });

  /* OUTSIDE CLICK */
  document.addEventListener("click", e => {
    if (
      !subjectBtn.contains(e.target) &&
      !subjectPopup.contains(e.target)
    ) {
      subjectPopup.classList.remove("show");
      subjectArrow.classList.remove("open");
    }
  });

/* =========================
   QUESTIONS
========================= */
const addQuestionBtn = document.getElementById("addQuestionBtn");

 // 🔒 once first question added
let testDuration = null; // in minutes
let timerSeconds = 0;


addQuestionBtn?.addEventListener("click", () => {
  addQuestionBlock();
});

function addQuestionBlock() {
if (!modeLocked) {
  modeLocked = true;

  withOptionsBtn.classList.add("disabled");
  withoutOptionsBtn.classList.add("disabled");
}

  questionCount++;

  const block = document.createElement("div");
  block.className = "question-block";

  block.innerHTML = `
    <textarea
      class="admin-textarea question-text"
      placeholder="Question ${questionCount}"></textarea>

    <div class="options-wrap">
      ${[1,2,3,4].map(i => `
        <div class="option-row">
          <input type="checkbox" class="correct-check">
          <input
            type="text"
            class="admin-input option-input"
            placeholder="Option ${i}">
        </div>
      `).join("")}
    </div>
    <button type="button" class="outline-btn delete-question">
  Delete Question
</button>
  `;

  questionsContainer.appendChild(block);
  block.querySelector(".delete-question").addEventListener("click", () => {
  block.remove();
});

  setupCorrectOption(block);
  setupAutoGrow(block);

  // ✅ APPLY GLOBAL MODE SAFELY
  toggleOptions(block, questionMode);
  
  const questionInput = block.querySelector(".question-text");
if (questionInput) {
  questionInput.focus();
}
}
/* =========================
   SINGLE CORRECT OPTION
========================= */
function validateQuestions() {
  const blocks = document.querySelectorAll(".question-block");

  if (blocks.length === 0) {
    alert("Add at least one question");
    return false;
  }

  if (questionMode === "mcq") {
    for (let block of blocks) {
      const checks = block.querySelectorAll(".correct-check");
      let checkedCount = 0;

      checks.forEach(c => {
        if (c.checked) checkedCount++;
      });

      if (checkedCount !== 1) {
        alert("Each MCQ must have exactly ONE correct option");
        return false;
      }
    }
  }

  return true;
}
/* =========================
   QUESTION TYPE TOGGLE
========================= */
function setupQuestionTypeToggle(block) {
  const typeBtns = block.querySelectorAll(".type-btn");
  const optionsWrap = block.querySelector(".options-wrap");

  typeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      typeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const type = btn.dataset.type;

      if (type === "direct") {
        optionsWrap.classList.add("hidden");
      } else {
        optionsWrap.classList.remove("hidden");
      }
    });
  });
}


/* =========================
   PUBLISH MODE
========================= */
const liveBtn = document.getElementById("liveBtn");
const scheduleBtn = document.getElementById("scheduleBtn");
const scheduleBox = document.getElementById("scheduleBox");

liveBtn.addEventListener("click", () => {
  liveBtn.classList.add("active");
  scheduleBtn.classList.remove("active");
  scheduleBox.classList.add("hidden");
});

scheduleBtn.addEventListener("click", () => {
  scheduleBtn.classList.add("active");
  liveBtn.classList.remove("active");
  scheduleBox.classList.remove("hidden");
});

/* =========================
   PUBLISH (DATA READY)
========================= */
async function cleanupAllTestSubmissions() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    
    for (const user of usersSnap.docs) {
      const subsSnap = await getDocs(
        collection(db, "users", user.id, "testSubmissions")
      );
      
      for (const sub of subsSnap.docs) {
        await deleteDoc(sub.ref);
      }
    }
    
    adminLog("Firebase test submissions cleaned");
    
  } catch (e) {
    console.error("Cleanup error:", e);
  }
}

const publishBtn = document.getElementById("publishBtn");

publishBtn.addEventListener("click", async () => {
  await cleanupAllTestSubmissions();
  if (!validateQuestions()) return;
  const payload = collectData();
  const mins = parseInt(timerInput.value);



  if (!mins || mins < 1 || mins > 60) {
    alert("Timer must be between 1 and 60 minutes");
    return;
  }

scheduleTime.addEventListener("change", () => {
  if (scheduleTime.value) {
    scheduleTime.setAttribute("value", scheduleTime.value);
  } else {
    scheduleTime.removeAttribute("value");
  }
});

  const isScheduled = scheduleBtn.classList.contains("active");

let scheduleAt = null;

if (isScheduled) {
  const date = scheduleDate.value;
  const time = scheduleTime.value;

  if (!date || !time) {
    alert("Select schedule date & time");
    return;
  }

  // 🔥 IST → UTC (CORRECT)
  const local = new Date(`${date}T${time}:00`);
  scheduleAt = Timestamp.fromDate(
  new Date(`${date}T${time}:00`)
);
}

  const firebasePayload = {
  subject: payload.subject,
  pageText: payload.pageText,
  questionMode,
  
  publishMode: isScheduled ? "schedule" : "live",
  
  schedule: isScheduled ?
    { at: scheduleAt } :
    null,
  
  timer: {
    minutes: mins,
    startedAt: !isScheduled ? serverTimestamp() : null
  },
  
  // 🔥 ADD THIS (VERY IMPORTANT)
  expiresAt: Timestamp.fromDate(
    new Date(Date.now() + mins * 60 * 1000)
  ),
  
  questions: payload.questions,
  
  status: isScheduled ? "scheduled" : "live",
  
  createdAt: serverTimestamp()
};

const testId = "temp_" + Date.now();

firebasePayload.testId = testId;

await setDoc(TEMP_TEST_REF, firebasePayload, { merge: true });

  // 🔥 IMPORTANT DIFFERENCE
  if (!isScheduled) {
  await updateDoc(TEMP_TEST_REF, {
    status: "live",
    publishMode: "live",
    "timer.startedAt": serverTimestamp(),
    adminLastSeen: serverTimestamp()
  });

  openTimerPage();
}
else {
    alert("Test scheduled successfully");
  }
});

function collectData() {
  const subject = subjectValue.textContent;
  const pageText = document.getElementById("pageText").value;

  const questions = [];
  
document.querySelectorAll(".question-block").forEach(block => {
  const qText = block.querySelector(".question-text").value.trim();
  if (!qText) return;

  let options = [];
  let correctIndex = null;

  if (questionMode === "mcq") {
    block.querySelectorAll(".option-row").forEach((row, i) => {
      options.push(row.querySelector(".option-input").value);

      if (row.querySelector(".correct-check").checked) {
        correctIndex = i;
      }
    });
  }

  questions.push({
    qText,
    type: questionMode,      // 🔥 GLOBAL
    options: questionMode === "mcq" ? options : [],
    correctIndex: questionMode === "mcq" ? correctIndex : null
  });
});

  return {
    subject,
    pageText,
    questions,
    mode: scheduleBtn.classList.contains("active") ? "schedule" : "live",
    schedule:
      scheduleBtn.classList.contains("active")
        ? {
            date: scheduleBox.querySelector("input[type=date]").value,
            time: scheduleBox.querySelector("input[type=time]").value
          }
        : null
  };
}

const withOptionsBtn = document.getElementById("withOptionsBtn");
const withoutOptionsBtn = document.getElementById("withoutOptionsBtn");

withOptionsBtn.addEventListener("click", () => {
  if (modeLocked) return;          // ⛔ block after first question
  setQuestionMode("mcq");
});

withoutOptionsBtn.addEventListener("click", () => {
  if (modeLocked) return;          // ⛔ block after first question
  setQuestionMode("direct");
});
/* =========================
   SCHEDULE DATE & TIME RULES (SAFE)
========================= */

/* =========================
   SCHEDULE DATE & TIME (HARD LOCK)
========================= */

const scheduleDate = document.getElementById("scheduleDate");
const scheduleTime = document.getElementById("scheduleTime");

function nowInfo() {
  const n = new Date();
  return {
    date: n.toISOString().split("T")[0],
    time:
      String(n.getHours()).padStart(2, "0") + ":" +
      String(n.getMinutes()).padStart(2, "0")
  };
}

/* Initialize defaults */
function initScheduleFields() {
  if (!scheduleDate || !scheduleTime) return;

  const now = nowInfo();

  // ✅ Date
  scheduleDate.min = now.date;
  scheduleDate.value = now.date;

  // ✅ Time
  scheduleTime.value = "";
  scheduleTime.min = now.time;
}

/* Enforce date rule */
function enforceDate() {
  if (!scheduleDate) return;

  const now = nowInfo();
  if (scheduleDate.value < now.date) {
    scheduleDate.value = now.date;
  }
  enforceTime();
}

/* Enforce time rule */
function enforceTime() {
  if (!scheduleDate || !scheduleTime) return;

  const now = nowInfo();

  if (scheduleDate.value === now.date) {
    scheduleTime.min = now.time;

    if (scheduleTime.value && scheduleTime.value < now.time) {
      scheduleTime.value = now.time;
    }
  } else {
    scheduleTime.min = "";
  }
}

/* Bind events safely */
scheduleBtn.addEventListener("click", () => {
  initScheduleFields();
  enforceTime();
});

scheduleDate.addEventListener("change", enforceDate);
scheduleTime.addEventListener("change", enforceTime);

liveBtn.addEventListener("click", () => {
  if (!scheduleDate || !scheduleTime) return;
  scheduleDate.removeAttribute("min");
  scheduleTime.removeAttribute("min");
});
/* =========================
   TIME "NONE" DISPLAY FIX
========================= */

/* When schedule opens */
/* Remove "None" on focus */

const timerPage = document.getElementById("timerPage");
const timerDisplay = document.getElementById("timerDisplay");
const timerInput = document.getElementById("timerInput");
const closeTimer = document.getElementById("closeTimer");
const liveTimerBar = document.getElementById("liveTimerBar");
const liveTimerText = document.getElementById("liveTimerText");

function lockQuestionEditing() {
  // Remove add button
  addQuestionBtn?.remove();

  // Remove delete buttons if any
  document.querySelectorAll(".delete-question").forEach(btn => btn.remove());
}

function freezePublishButton() {
  publishBtn.disabled = true;
  publishBtn.style.opacity = "0.5";
  publishBtn.style.pointerEvents = "none";
}

function openTimerPage() {
  startAdminPresenceCheck();
  const mins = parseInt(timerInput.value);

  if (!mins || mins < 1 || mins > 60) {
    alert("Timer must be between 1 and 60 minutes");
    return;
  }

clearTestBtn.disabled = false; 

  testDuration = mins;
  remainingSeconds = mins * 60;

  // 🔒 LOCK UI
  lockQuestionEditing();
  freezePublishButton();

  // ⛔ prevent scroll
  document.body.style.overflow = "hidden";

  timerPage.classList.remove("hidden");
  startTimer();
  
}

async function startTimer() {
  if (timerInterval) return; // ⛔ prevent double intervals

  updateTimerDisplay();

  timerInterval = setInterval(async () => {
    remainingSeconds--;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;

      timerDisplay.textContent = "TIME UP";
      liveTimerText.textContent = "TIME UP";

      try {
        await deleteDoc(TEMP_TEST_REF);
        adminLog("Test auto-ended (TIME UP)", "warn");
      } catch (e) {
        console.error(e);
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const s = String(remainingSeconds % 60).padStart(2, "0");

  timerDisplay.textContent = `${m}:${s}`;
  liveTimerText.textContent = `${m}:${s}`;
}

closeTimer.addEventListener("click", () => {
  timerPage.classList.add("hidden");

  // 🔓 restore page scrolling
  document.body.style.overflow = "";

  // ⏱ show running timer below header
  liveTimerBar.classList.remove("hidden");
});

async function forceClearTest(reason = "Admin offline") {
  clearInterval(adminPresenceInterval);
adminPresenceInterval = null;
  console.warn("🔥 Force clearing test:", reason);

  // Stop timers
  clearInterval(timerInterval);
  timerInterval = null;
  remainingSeconds = 0;

  // Reset timer UI
  if (timerDisplay) timerDisplay.textContent = "00:00";
  if (liveTimerText) liveTimerText.textContent = "00:00";

  // Hide overlays
  timerPage?.classList.add("hidden");
  liveTimerBar?.classList.add("hidden");
  document.body.style.overflow = "";

  // Disable clear button
  clearTestBtn.disabled = true;

  // Delete Firebase test
  try {
    await deleteDoc(TEMP_TEST_REF);
    console.log("Test deleted from Firebase");
  } catch (e) {
    console.error("Failed to delete test", e);
  }

  // Stop presence checker
  clearInterval(adminPresenceInterval);
  adminPresenceInterval = null;
}

clearTestBtn.addEventListener("click", e => {
  e.preventDefault();
  e.stopPropagation();

  showConfirmToast("Clear entire test setup?", async () => {

    // 1️⃣ Stop timers
    clearInterval(timerInterval);
    timerInterval = null;

    // 2️⃣ Reset timer UI
    remainingSeconds = 0;
    timerDisplay.textContent = "00:00";
    liveTimerText.textContent = "00:00";

    // 3️⃣ Hide timer pages
    timerPage.classList.add("hidden");
    liveTimerBar.classList.add("hidden");
    document.body.style.overflow = "";

    // 4️⃣ DELETE FIREBASE TEST (THIS WAS MISSING)
    await deleteDoc(TEMP_TEST_REF);

    console.log("Temp test fully deleted");

    // 5️⃣ Disable clear button
    clearTestBtn.disabled = true;
  });
});

const confirmToast = document.getElementById("confirmToast");
const confirmText = document.getElementById("confirmText");
const confirmYes = document.getElementById("confirmYes");
const confirmCancel = document.getElementById("confirmCancel");
const toastBackdrop = document.getElementById("toastBackdrop");

let confirmAction = null;

function showConfirmToast(message, onConfirm) {
  confirmText.textContent = message;
  confirmAction = onConfirm;

  confirmToast.classList.add("show");
  toastBackdrop?.classList.add("show");
}

function hideConfirmToast() {
  confirmToast.classList.remove("show");
  toastBackdrop?.classList.remove("show");
  confirmAction = null;
}

confirmCancel.onclick = hideConfirmToast;

confirmYes.onclick = () => {
  if (typeof confirmAction === "function") {
    confirmAction();
  }
  hideConfirmToast();
};


const leaderboardOverlay = document.getElementById("leaderboardOverlay");
const leaderboardList = document.getElementById("leaderboardList");
const closeLeaderboard = document.getElementById("closeLeaderboard");

leaderboardBtn.onclick = openLeaderboard;
closeLeaderboard.onclick = () => {
  leaderboardOverlay.classList.add("hidden");
};

function renderLeaderboard(list) {
  leaderboardList.innerHTML = "";

  if (!list.length) {
    leaderboardList.innerHTML =
      "<div class='lb-empty'>No submissions yet</div>";
    return;
  }

  list.forEach((u, i) => {
    const div = document.createElement("div");
    div.className = "leaderboard-item";

    const name =
      u.username ||
      u.name ||
      u.email?.split("@")[0] ||
      "Student";

    // 🔥 BUILD ANSWERS BLOCK SMARTLY
    const answersHTML = (u.answers || [])
      .map((a, idx) => {

        // ✅ MCQ → show correct / wrong
        if (a.type === "mcq") {
          const status = a.isCorrect ? "✅ Correct" : "❌ Wrong";

          return `
            <div class="lb-answer-card ${a.isCorrect ? "correct" : "wrong"}">
  <div class="lb-q">
    <span class="lb-q-no">Q${idx + 1}</span>
    <span class="lb-q-text">${a.question}</span>
  </div>

  <div class="lb-meta">
    <span class="lb-badge ${a.isCorrect ? "ok" : "bad"}">
      ${a.isCorrect ? "Correct" : "Wrong"}
    </span>
    <span class="lb-opt">
      Your: ${a.selectedIndex + 1} • Correct: ${a.correctIndex + 1}
    </span>
  </div>
</div>
          `;
        }

        // ✅ DIRECT → ONLY ANSWER TEXT (NO WRONG/RIGHT)
        return `
          <div class="lb-answer-card direct">
  <div class="lb-q">
    <span class="lb-q-no">Q${idx + 1}</span>
    <span class="lb-q-text">${a.question}</span>
  </div>

  <div class="lb-direct-answer">
    ${a.answerText || "No answer submitted"}
  </div>
</div>
        `;
      })
      .join("");

    div.innerHTML = `
      <div class="lb-row">
        <div class="lb-rank">
          <span class="lb-pos">#${i + 1}</span>
          <span class="lb-name">${name}</span>
        </div>
        <div class="lb-score">${u.marks}</div>
      </div>

      <div class="lb-expand">
        <div class="lb-stat">Attempts: <b><span class="lb-stat-value">${u.total}</span></b></div>
        ${answersHTML}
      </div>
    `;

    div.onclick = () => div.classList.toggle("active");
    leaderboardList.appendChild(div);
  });
}

async function openLeaderboard() {
  leaderboardOverlay.classList.remove("hidden");
  leaderboardList.innerHTML = "Loading...";

  const q = query(
    collectionGroup(db, "testSubmissions"),
    orderBy("marks", "desc")
  );

  const snap = await getDocs(q);

  const results = [];
  snap.forEach(doc => {
    results.push(doc.data());
  });

  renderLeaderboard(results);
}

});

function formatDateTime(ts) {
  if (!ts) return "—";

  const d = ts.toDate();

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}
async function clearTestCore(reason = "manual") {
  console.warn("Clearing test -", reason);

  // stop timers
  clearInterval(timerInterval);
  remainingSeconds = 0;

  // reset timer UI
  if (timerDisplay) timerDisplay.textContent = "00:00";
  if (liveTimerText) liveTimerText.textContent = "00:00";

  timerPage?.classList.add("hidden");
  liveTimerBar?.classList.add("hidden");
  document.body.style.overflow = "";

  // disable clear button
  clearTestBtn.disabled = true;

  // stop admin presence checker
  clearInterval(adminPresenceInterval);
  adminPresenceInterval = null;

  // 🔥 delete firebase test
  try {
    await deleteDoc(TEMP_TEST_REF);
    console.log("Test removed from Firebase");
  } catch (e) {
    console.error("❌ Firebase delete failed", e);
  }
}

function forceClearTest(reason = "admin inactive") {
  clearTestCore(reason);
}

function startAdminPresenceCheck() {
  if (adminPresenceInterval) return;

  adminPresenceInterval = setInterval(() => {
    const pageVisible = document.visibilityState === "visible";
    const pageFocused = document.hasFocus();
    const online = navigator.onLine;

    if (!pageVisible || !pageFocused || !online) {
      forceClearTest("Admin not active / offline");
    }
  }, 30000); // ✅ 15 seconds
}
// ===== File Upload Parsing System =====

function parseQuestionFormat(raw) {
  // 🔥 FIX FOR PDF FLATTENED TEXT
raw = raw
  .replace(/\s+Q:/g, "\nQ:")
  .replace(/\s+A:/g, "\nA:")
  .replace(/\s+B:/g, "\nB:")
  .replace(/\s+C:/g, "\nC:")
  .replace(/\s+D:/g, "\nD:")
  .replace(/\s+ANSWER:/g, "\nANSWER:");
  const lines = raw.split("\n");
  const questions = [];

  let current = {
    question: "",
    options: [],
    correctIndex: null,
    type: "direct" // 🔥 default direct
  };

  let mode = null;
  let waitingForAnswerLetter = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Q:
    if (line === "Q:" || line.startsWith("Q:")) {
      if (current.question) {
        // decide type before pushing
        current.type = current.options.length ? "mcq" : "direct";
        questions.push(current);
        current = {
          question: "",
          options: [],
          correctIndex: null,
          type: "direct"
        };
      }

      mode = "question";
      waitingForAnswerLetter = false;

      const qText = line.replace("Q:", "").trim();
      if (qText) current.question += qText;
      continue;
    }

    // A:, B:, C:, D:  → MCQ option
    if (/^[A-D]:/.test(line)) {
      mode = "option";
      waitingForAnswerLetter = false;

      const optText = line.replace(/^[A-D]:/, "").trim();
      current.options.push(optText || "");
      continue;
    }

    // ANSWER:
    if (line.startsWith("ANSWER:")) {
      const ansInline = line.replace("ANSWER:", "").trim();

      if (ansInline) {
        current.correctIndex = ansInline.charCodeAt(0) - 65;
        waitingForAnswerLetter = false;
      } else {
        waitingForAnswerLetter = true;
      }
      mode = null;
      continue;
    }

    // ANSWER letter on next line
    if (waitingForAnswerLetter && /^[A-D]$/.test(line)) {
      current.correctIndex = line.charCodeAt(0) - 65;
      waitingForAnswerLetter = false;
      continue;
    }

    // Continuation
    if (mode === "question") {
      current.question += (current.question ? " " : "") + line;
    } 
    else if (mode === "option") {
      const last = current.options.length - 1;
      current.options[last] +=
        (current.options[last] ? " " : "") + line;
    }
  }

  // Push last question
  if (current.question) {
    current.type = current.options.length ? "mcq" : "direct";
    questions.push(current);
  }

  return questions;
}

// ===== PDF READER =====
async function readPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(it => it.str);
    text += strings.join(" ") + "\n";
  }

  return text;
}