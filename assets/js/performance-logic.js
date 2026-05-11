import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
  
import { generatePerformanceInsight } from "./insight-engine.js";
/* ======================
   USER STATS CACHE
====================== */
// 🔒 Safe global init
window.allAttempts = [];
/* =========================
   STATS
========================= */

const streakEl = document.getElementById("streakVal");
const mostXpEl = document.getElementById("mostXpVal");
const attemptsEl = document.getElementById("attemptVal");
const visitsEl = document.getElementById("visitVal");
const chapterTableBody =
  document.querySelector("#chapterTable tbody");

const mtpTableBody =
  document.querySelector("#mtpTable tbody");

const rtpTableBody =
  document.querySelector("#rtpTable tbody");

const summaryAttemptsEl =
  document.getElementById("summaryAttempts");

const summaryQuestionsEl =
  document.getElementById("summaryQuestions");

const bestChapterName =
  document.getElementById("bestChapterName");

const bestChapterMeta =
  document.getElementById("bestChapterMeta");

const weakChapterName =
  document.getElementById("weakChapterName");

const weakChapterMeta =
  document.getElementById("weakChapterMeta");
/* =========================
   ⚡ FAST ATTEMPTS HYDRATION
========================= */
const practiceCards = document.querySelectorAll(".practice-card");

const rtpCard = document.querySelector(".practice-card.rtp .practice-count");
const mtpCard = document.querySelector(".practice-card.mtp .practice-count");
const chapterCard = document.querySelector(".practice-card.chapter .practice-count");


const applyBtn = document.querySelector(".apply-btn");

const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");

/* =========================
   AUTO FILL LAST 7 DAYS
========================= */
(function autoFillLast7Days() {
  if (!fromDateInput || !toDateInput) return;

  const today = new Date();
  const to = today.toISOString().slice(0, 10);

  const fromDate = new Date();
  fromDate.setDate(today.getDate() - 6); // last 7 days incl today
  const from = fromDate.toISOString().slice(0, 10);

  fromDateInput.value = from;
  toDateInput.value = to;

  // enforce limits silently
  fromDateInput.max = to;
  toDateInput.max = to;
  toDateInput.min = from;
})();

/* 🔹 Fake placeholder removal */
fromDateInput?.addEventListener("change", () => {
  fromDateInput.removeAttribute("data-placeholder");
});

toDateInput?.addEventListener("change", () => {
  toDateInput.removeAttribute("data-placeholder");
});

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function subtractDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// 🔒 Initial hard limits (today based)
const today = new Date().toISOString().slice(0, 10);

fromDateInput.max = today;
toDateInput.max = today;

// When TO date changes → limit FROM date


function daysBetween(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
}

const skeleton = document.getElementById("performanceSkeleton");
const realContent = document.getElementById("performanceContent");
function formatK(num = 0) {
  if (num < 1000) return num;
  return (num / 1000)
    .toFixed(num >= 10000 ? 0 : 2)
    .replace(/\.0+$/, "") + "k";
}

function calcAccuracy(attempts) {
  let correct = 0, total = 0;

  attempts.forEach(a => {
    correct += a.correct || 0;
    total += a.total || 0;
  });

  if (total === 0) return null;
  return (correct / total) * 100;
}

function splitAttemptsByTime(attempts) {
  if (attempts.length < 2) return [[], []];

  const sorted = [...attempts].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const mid = Math.floor(sorted.length / 2);
  return [sorted.slice(0, mid), sorted.slice(mid)];
}
function resolveTrend(delta) {
  if (delta === null) {
    return { text: "No Data", icon: "fa-minus", cls: "neutral" };
  }

  if (delta >= 8) {
    return { text: "Improving", icon: "fa-arrow-trend-up", cls: "up" };
  }

  if (delta <= -20) {
    return { text: "Critical", icon: "fa-triangle-exclamation", cls: "critical" };
  }

  if (delta <= -8) {
    return { text: "Needs Focus", icon: "fa-arrow-trend-down", cls: "down" };
  }

  return { text: "Stable", icon: "fa-circle", cls: "neutral" };
}
function updateTrendUI(cardEl, attempts) {
  const trendEl = cardEl.querySelector(".practice-trend");
  if (!trendEl) return;

  if (attempts.length < 2) {
    trendEl.className = "practice-trend neutral";
    trendEl.innerHTML = `<i class="fa-solid fa-circle"></i> Stable`;
    return;
  }

  const [oldSet, newSet] = splitAttemptsByTime(attempts);
  const oldAcc = calcAccuracy(oldSet);
  const newAcc = calcAccuracy(newSet);

  if (oldAcc === null || newAcc === null) {
    trendEl.className = "practice-trend neutral";
    trendEl.innerHTML = `<i class="fa-solid fa-circle"></i> Stable`;
    return;
  }

  const delta = newAcc - oldAcc;
  const trend = resolveTrend(delta);

  trendEl.className = `practice-trend ${trend.cls}`;
  trendEl.innerHTML = `<i class="fa-solid ${trend.icon}"></i> ${trend.text}`;
}
/* =========================
   XP WEEK CHART
========================= */

const canvas = document.getElementById("xpWeekChart");
const weekTotalEl = document.getElementById("xpWeekTotal");

let chartInstance = null;
let xpChart = null;

function getWeekDates() {
  const today = new Date();
  const day = today.getDay() || 7; // Sunday fix
  today.setDate(today.getDate() - day + 1); // go to Monday

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function isDarkMode() {
  return document.body.classList.contains("dark");
}

function syncDateLimits() {
  const from = fromDateInput.value;
  const to = toDateInput.value;

  if (from) {
    toDateInput.min = from;
    toDateInput.max = addDays(from, 30);
  }

  if (to) {
    fromDateInput.max = to;
    fromDateInput.min = subtractDays(to, 30);
  }

  // Auto-fix silently
  if (from && to && new Date(to) - new Date(from) > 30 * 86400000) {
    toDateInput.value = addDays(from, 30);
  }
  
  updatePracticeTrends(
  subjectValue?.dataset?.subject || "all",
  fromDateInput.value,
  toDateInput.value
);
}

applyBtn?.addEventListener("click", async () => {
  const from = fromDateInput.value;
  const to = toDateInput.value;


fromDateInput.addEventListener("change", syncDateLimits);
toDateInput.addEventListener("change", syncDateLimits);

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDocs(
    collection(db, "users", user.uid, "attempts")
  );

  let rtp = 0, mtp = 0, chapter = 0;

  snap.forEach(doc => {
    const a = doc.data();
    if (a.date < from || a.date > to) return;

    // Fix 4: strict normalized matching
    const t = (a.type || "").toUpperCase().trim();
    if (t === "RTP") rtp++;
    else if (t === "MTP") mtp++;
    else if (t === "CHAPTER") chapter++;
  });

  if (rtpCard) rtpCard.textContent = `${rtp} Attempts`;
  if (mtpCard) mtpCard.textContent = `${mtp} Attempts`;
  if (chapterCard) chapterCard.textContent = `${chapter} Chapters`;

  // Fix 2: only show insight when real data exists in this period
  const total = rtp + mtp + chapter;
  const insightSection = document.querySelector('.period-insight');
  if (total > 0) {
    if (insightSection) insightSection.style.display = '';
    updatePeriodInsight(rtp, mtp, chapter);
  } else {
    if (insightSection) insightSection.style.display = 'none';
  }

  // Fix 6: reset so detailed analysis reloads fresh on next open
  detailedLoaded = false;
});

auth.onAuthStateChanged(async user => {
  if (!user) {
    // Show "not logged in" banner, keep skeleton visible
    const banner = document.getElementById("notLoggedInBanner");
    if (banner) banner.style.display = "flex";
    return;
  }
async function validateAndFixStreak(user, userData) {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const last = userData.lastActiveDate || null;

    if (!last) return userData.streak ?? 0;

    const diffDays =
      (new Date(todayStr) - new Date(last)) / (1000 * 60 * 60 * 24);

    // ✅ If user missed a day → reset streak
    if (diffDays >= 2) {
      await updateDoc(doc(db, "users", user.uid), {
        streak: 0
      });

      return 0;
    }

    return userData.streak ?? 0;

  } catch (err) {
    console.warn("Streak validation failed:", err);
    return userData.streak ?? 0;
  }
}

  const ref = doc(db, "users", user.uid);
const attemptsSnap = await getDocs(
  collection(db, "users", user.uid, "attempts")
);
  // 🔥 page visit count (fire & forget)
  updateDoc(ref, {
    pageVisits: increment(1)
  }).catch(() => {});

  const snap = await getDoc(ref);
  if (!snap.exists()) {
    if (skeleton) skeleton.style.display = "none";
    if (realContent) realContent.style.display = "block";
    return;
  }

  const data = snap.data();
// 🔥 AUTO STREAK FIX
const fixedStreak = await validateAndFixStreak(user, data);
data.streak = fixedStreak;
/* =========================
   PRACTICE OVERVIEW
========================= */

let rtpCount = 0;
let mtpCount = 0;
let chapterCount = 0;
// Fix 2: Don't generate insight yet — wait for real data from loadPracticeOverviewData

attemptsSnap.forEach(doc => {
  const a = doc.data();
  const t = (a.type || "").toUpperCase().trim();
  if (t === "RTP") rtpCount++;
  else if (t === "MTP") mtpCount++;
  else if (t === "CHAPTER") chapterCount++;
});

window.allAttempts = [];

attemptsSnap.forEach(doc => {
  window.allAttempts.push(doc.data());
});

updatePracticeTrends("all", fromDateInput.value, toDateInput.value);

// Update UI
if (rtpCard) rtpCard.textContent = `${rtpCount} Attempts`;
if (mtpCard) mtpCard.textContent = `${mtpCount} Attempts`;
if (chapterCard) chapterCard.textContent = `${chapterCount} Chapters`;

const weekDates = getWeekDates();
const values = new Array(7).fill(0);

const weeklyXp = data.weeklyXp || {};

weekDates.forEach((date, i) => {
  values[i] = weeklyXp[date] || 0;
});

// 🔢 WEEK TOTAL
const weekTotal = values.reduce((a, b) => a + b, 0);
if (weekTotalEl) {
  weekTotalEl.textContent = weekTotal;
}
// 🔥 Sync weekly XP to public leaderboard

// inside auth.onAuthStateChanged(user => { ... })

await setDoc(
  doc(db, "publicLeaderboard", user.uid),
  {
    name: data.name || user.displayName || "User",
    xp: weekTotal,
    gender: data.gender || "",
    dob: data.dob || "",
    pfp: data.pfp || ""
  },
  { merge: true }
);
  /* ---------- STATS ---------- */
  streakEl.textContent = data.streak ?? 0;
  mostXpEl.textContent = formatK(data.bestXpDay ?? 0);
  attemptsEl.textContent = formatK(data.totalAttempts ?? 0);
  visitsEl.textContent = formatK(data.pageVisits ?? 0);

Chart.defaults.font.family = "Poppins, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
Chart.defaults.font.size = 12;
  /* ---------- WEEKLY XP ---------- */
  const canvas = document.getElementById("xpWeekChart");
if (!canvas || typeof Chart === "undefined") {
  if (skeleton) skeleton.style.display = "none";
  if (realContent) realContent.style.display = "block";
  return;
}

const ctx = canvas.getContext("2d");

// destroy only if needed
if (xpChart) {
  xpChart.destroy();
  xpChart = null;
}

// 🔥 Vertical crosshair plugin (Trading-style)
const verticalLinePlugin = {
  id: "verticalLine",
  afterDraw(chart) {
    if (!chart.tooltip || !chart.tooltip._active?.length) return;

    const ctx = chart.ctx;
    const activePoint = chart.tooltip._active[0];
    const x = activePoint.element.x;
    const topY = chart.chartArea.top;
    const bottomY = chart.chartArea.bottom;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(99,102,241,0.35)"; // 🔵 subtle indigo
    ctx.setLineDash([4, 4]); // dashed like trading apps
    ctx.stroke();
    ctx.restore();
  }
};

xpChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      data: values, // your weekly XP array
      tension: 0.45,
      borderWidth: 2.5,
      borderColor: "#6366F1",
  backgroundColor: "rgba(99,102,241,0.22)",
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: "#818CF8",
      fill: true
    }]
  },
options: {
  responsive: true,
  maintainAspectRatio: false,

  // 🔥 THIS IS THE MAIN FIX
  interaction: {
    mode: "index",     // 👈 whole vertical line
    intersect: false   // 👈 not just point
  },

  hover: {
    mode: "index",
    intersect: false
  },

  animation: {
    duration: 900,
    easing: "easeOutQuart",
    from: ctx => {
      if (ctx.type === "data") return 0;
    }
  },

  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#e5e7eb",
      bodyColor: "#e5e7eb",
      borderColor: "rgba(99,102,241,0.35)",
      borderWidth: 1
    }
  },

  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#64748b" }
    },
    y: {
      beginAtZero: true,
      suggestedMax: Math.ceil(Math.max(...values, 10) * 1.25),
      ticks: {
        maxTicksLimit: 6,
        color: "#64748b"
      },
      grid: {
        color: "rgba(99,102,241,0.12)"
      }
    }
  }
}
,
  plugins: [verticalLinePlugin]
});
// ===== Hide skeleton, show real UI =====
if (skeleton) skeleton.style.display = "none";
if (realContent) realContent.style.display = "block";
// 🔥 load detailed analysis
// 🚀 background load practice overview
setTimeout(() => {
  loadPracticeOverviewData(user);
}, 50);
});

async function loadPracticeOverviewData(user) {
  try {
    const attemptsSnap = await getDocs(
      collection(db, "users", user.uid, "attempts")
    );
    
    let rtpCount = 0;
    let mtpCount = 0;
    let chapterCount = 0;
    
    window.allAttempts = [];
    
    attemptsSnap.forEach(doc => {
      const a = doc.data();
      window.allAttempts.push(a);
      
      // Fix 4: strict type matching — only count exact type strings
      const t = (a.type || "").toUpperCase().trim();
      if (t === "RTP") rtpCount++;
      else if (t === "MTP") mtpCount++;
      else if (t === "CHAPTER") chapterCount++;
    });
    
    if (rtpCard) rtpCard.textContent = `${rtpCount} Attempts`;
    if (mtpCard) mtpCard.textContent = `${mtpCount} Attempts`;
    if (chapterCard) chapterCard.textContent = `${chapterCount} Chapters`;
    
    updatePracticeTrends("all", fromDateInput.value, toDateInput.value);

    // Fix 2: Only show insight when real data exists (at least some attempts)
    const totalLoaded = rtpCount + mtpCount + chapterCount;
    if (totalLoaded > 0) {
      updatePeriodInsight(rtpCount, mtpCount, chapterCount);
      // Make insight section visible
      const insightSection = document.querySelector('.period-insight');
      if (insightSection) insightSection.style.display = '';
    } else {
      // Hide insight section if no data
      const insightSection = document.querySelector('.period-insight');
      if (insightSection) insightSection.style.display = 'none';
    }
    
  } catch (err) {
    console.error("Practice overview load failed:", err);
  }
}

const subjectBtn = document.getElementById("practiceSubjectBtn");
const subjectPopup = document.getElementById("practiceSubjectPopup");
const subjectValue = document.getElementById("practiceSubjectValue");

function updatePracticeOverview(subject = "all") {
  let rtp = 0, mtp = 0, chapter = 0;

  (window.allAttempts || []).forEach(a => {
    if (subject !== "all") {
      const stored = (a.subject || "").toLowerCase();
      if (!stored.includes(subject)) return;
    }

    // Fix 4: strict normalized matching
    const t = (a.type || "").toUpperCase().trim();
    if (t === "RTP") rtp++;
    else if (t === "MTP") mtp++;
    else if (t === "CHAPTER") chapter++;
  });

  rtpCard.textContent = `${rtp} Attempts`;
  mtpCard.textContent = `${mtp} Attempts`;
  chapterCard.textContent = `${chapter} Chapters`;
}
const subjectArrow = subjectBtn.querySelector("i");
subjectBtn?.addEventListener("click", e => {
  e.stopPropagation();

  const isOpen = subjectPopup.classList.contains("dp-subject-open");

  if (isOpen) {
    subjectPopup.classList.remove("dp-subject-open");
    subjectPopup.style.maxHeight = null;
    subjectPopup.style.opacity = "0";
    subjectPopup.style.pointerEvents = "none";
    subjectArrow.classList.remove("fa-chevron-up");
    subjectArrow.classList.add("fa-chevron-down");
  } else {
    subjectPopup.classList.add("dp-subject-open");
    subjectPopup.style.maxHeight = subjectPopup.scrollHeight + "px";
    subjectPopup.style.opacity = "1";
    subjectPopup.style.pointerEvents = "auto";
    subjectArrow.classList.remove("fa-chevron-down");
    subjectArrow.classList.add("fa-chevron-up");
  }
});

subjectPopup?.addEventListener("click", e => {
  const subject = e.target.dataset.subject;
  if (!subject) return;

  subjectValue.textContent = e.target.textContent;
  subjectValue.dataset.subject = subject;

  // Close popup
  subjectPopup.classList.remove("dp-subject-open");
  subjectPopup.style.maxHeight = null;
  subjectPopup.style.opacity = "0";
  subjectPopup.style.pointerEvents = "none";
  subjectArrow.classList.remove("fa-chevron-up");
  subjectArrow.classList.add("fa-chevron-down");

  // 🔥 THIS WAS MISSING
  updatePracticeOverview(subject);
  updatePracticeTrends(
  e.target.dataset.subject,
  fromDateInput.value,
  toDateInput.value
);
});

/* Close on outside click */
document.addEventListener("click", () => {
  if (subjectPopup) {
    subjectPopup.classList.remove("dp-subject-open");
    subjectPopup.style.maxHeight = null;
    subjectPopup.style.opacity = "0";
    subjectPopup.style.pointerEvents = "none";
    subjectArrow.classList.remove("fa-chevron-up");
    subjectArrow.classList.add("fa-chevron-down");
  }
});
if (!fromDateInput.value) {
  fromDateInput.dataset.placeholder = "Select start date";
}

if (!toDateInput.value) {
  toDateInput.dataset.placeholder = "Select end date";
}
function updatePracticeTrends(subject = "all", from = null, to = null) {
  const attempts = window.allAttempts || [];

  const filtered = attempts.filter(a => {
    if (subject !== "all") {
      const stored = (a.subject || "").toLowerCase();
      if (!stored.includes(subject)) return false;
    }
    if (from && a.date < from) return false;
    if (to && a.date > to) return false;
    return true;
  });

  updateTrendUI(document.querySelector(".practice-card.rtp"),
    filtered.filter(a => a.type === "RTP")
  );
  updateTrendUI(document.querySelector(".practice-card.mtp"),
    filtered.filter(a => a.type === "MTP")
  );
  updateTrendUI(document.querySelector(".practice-card.chapter"),
    filtered.filter(a => a.type === "CHAPTER")
  );
}

// 🔹 Accuracy (overall / subject-filtered)
const filteredForAccuracy = window.allAttempts.filter(a => {
  if (subjectValue?.dataset?.subject && subjectValue.dataset.subject !== "all") {
    return (a.subject || "").toLowerCase().includes(subjectValue.dataset.subject);
  }
  return true;
});

const accuracyPercent = Math.round(calcAccuracy(filteredForAccuracy) || 0);

// 🔹 Trend text (pick strongest among RTP/MTP/Chapter)
const trendEls = document.querySelectorAll(".practice-trend");
let currentTrend = "Stable";

trendEls.forEach(el => {
  if (el.classList.contains("critical")) currentTrend = "Critical";
  else if (el.classList.contains("down")) currentTrend = "Needs Focus";
  else if (el.classList.contains("up")) currentTrend = "Improving";
});

const selectedSubject =
  subjectValue?.dataset?.subject || "All Subjects";
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
   PERIOD INSIGHT GENERATOR
   (Clean, Error-Free)
========================= */
function runInsightTyping(text) {
  const insightPara = document.getElementById("periodInsightText");
  if (!insightPara) return;

  insightPara.textContent = ""; // clear previous
  insightPara.classList.add("typing");

  let i = 0;
  const cursor = document.createElement("span");
  cursor.className = "typing-cursor";
  cursor.textContent = "█";
  insightPara.appendChild(cursor);

  const typer = setInterval(() => {
    cursor.insertAdjacentText("beforebegin", text[i]);
    i++;

    if (i >= text.length) {
      clearInterval(typer);
      cursor.remove();
      insightPara.classList.remove("typing");
    }
  }, 70);
}
/* =========================
   BUILD & GENERATE INSIGHT
========================= */

function updatePeriodInsight(rtp, mtp, chapter) {

  // ---- Accuracy ----
  const attempts = window.allAttempts || [];
  let correct = 0, total = 0;

  attempts.forEach(a => {
    correct += a.correct || 0;
    total += a.total || 0;
  });

  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  // ---- Trend ----
  let currentTrend = "Stable";
  const trendEls = document.querySelectorAll(".practice-trend");

  trendEls.forEach(el => {
    if (el.classList.contains("up")) currentTrend = "Improving";
    else if (el.classList.contains("down")) currentTrend = "Needs Focus";
    else if (el.classList.contains("critical")) currentTrend = "Critical";
  });

  // ---- Subject ----
  const subject =
    document.getElementById("practiceSubjectValue")
      ?.dataset?.subject || "All Subjects";

  // ---- Generate Insight Text ----
  const insightText = generatePerformanceInsight({
    trend: currentTrend,
    accuracy: accuracy,
    subject: subject,
    rtp: rtp,
    mtp: mtp,
    chapter: chapter
  });

  // ---- Typing Animation ----
  runInsightTyping(insightText);
}
/* =========================
   DETAILED ANALYSIS OVERLAY (FIXED)
========================= */

const analysisOverlay = document.getElementById("analysisOverlay");
const openAnalysis = document.getElementById("openDetailedAnalysis");
const closeAnalysis = document.getElementById("closeAnalysis");

let detailedLoaded = false;

// #detailed hash → auto-open overlay
async function openDetailedOverlay() {
  analysisOverlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      analysisOverlay.classList.add("active");
    });
  });
  document.body.style.overflow = "hidden";
  
  if (!detailedLoaded) {
    const loader = document.getElementById("analysisLoader");
    const content = document.getElementById("analysisContent");
    loader?.classList.remove("hidden");
    if (content) content.style.display = "none";
    const user = auth.currentUser;
    await loadDetailedAnalysis(user);
    loader?.classList.add("hidden");
    if (content) content.style.display = "block";
    detailedLoaded = true;
  }
}

if (window.location.hash === "#detailed") {
  // Wait for auth + DOM ready
  auth.onAuthStateChanged(user => {
    if (user) {
      setTimeout(() => openDetailedOverlay(), 800);
    }
  });
}

window.addEventListener("hashchange", () => {
  if (window.location.hash === "#detailed") openDetailedOverlay();
});

/* =========================
   OPEN
========================= */
openAnalysis?.addEventListener("click", () => openDetailedOverlay());

/* =========================
   CLOSE (BACK BUTTON)
========================= */
closeAnalysis?.addEventListener("click", () => {
  // Step 1: slide out
  analysisOverlay.classList.remove("active");
  // Step 2: after animation completes — hide from pointer events
  setTimeout(() => {
    analysisOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }, 380); // matches CSS transition duration
});
const tabs = document.querySelectorAll(".analysis-tab");
const tables = document.querySelectorAll(".analysis-table");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tables.forEach(tb => tb.classList.remove("active"));

    tab.classList.add("active");

    const type = tab.dataset.type;
    document.getElementById(type + "Table").classList.add("active");
  });
});

// ===== PAGINATION STATE =====
let chapterLastDoc = null;
let rtpLastDoc = null;

const PAGE_SIZE = 10;
function formatDateUI(dateStr) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

async function loadDetailedAnalysis(user) {
  if (!user) return;

  try {
    // 🔥 fetch both collections in parallel
    const [chapterSnap, rtpMtpSnap] = await Promise.all([
  getDocs(
    query(
      collection(db, "users", user.uid, "chapterStats"),
      orderBy("date", "desc")
    )
  ),

  getDocs(
    query(
      collection(db, "users", user.uid, "rtpMtpStats"),
      orderBy("date", "desc")
    )
  )
]);

    // =============================
    // RESET TABLES — clear any stale/demo rows
    // =============================
    if (chapterTableBody) chapterTableBody.innerHTML = "";
    if (mtpTableBody) mtpTableBody.innerHTML = "";
    if (rtpTableBody) rtpTableBody.innerHTML = "";

    let totalAttempts = 0;
    let totalQuestions = 0;

    const chapterAgg = {}; // for strongest/weak

    // =============================
    // 🔷 CHAPTER TABLE
    // =============================
    chapterSnap.forEach(docSnap => {
      const d = docSnap.data();

      totalAttempts++;
      totalQuestions += d.totalQuestions || 0;

      // ----- aggregate per chapter
      const key = d.chapter || "Unknown";

      if (!chapterAgg[key]) {
        chapterAgg[key] = { correct: 0, total: 0, attempts: 0 };
      }

      chapterAgg[key].correct += d.correct || 0;
      chapterAgg[key].total += d.totalQuestions || 0;
      chapterAgg[key].attempts++;

      // ----- row build
      const acc = d.accuracy ?? 0;
      // Support both field names: marks or score
      const marksDisplay = d.marks != null ? d.marks : (d.score != null ? d.score : "-");
      const totalDisplay = d.totalMarks != null ? d.totalMarks : (d.totalQuestions || 0);
      const marksStr = marksDisplay !== "-" ? `${marksDisplay}/${totalDisplay}` : "-";

      chapterTableBody.insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td>${formatDateUI(d.date)}</td>
          <td>${d.subject || "-"}</td>
          <td>${d.chapter || "-"}</td>
          <td>${d.totalQuestions || 0}</td>
          <td class="col-marks">${marksStr}</td>
          <td class="col-wrongs">${d.wrong ?? 0}</td>
          <td class="col-accuracy">${acc}%</td>
        </tr>`
      );
    });

    // Empty state for chapter table
    if (chapterSnap.empty) {
      chapterTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--analysis-text-muted);padding:28px 12px;font-size:13px;">No chapter attempts yet</td></tr>`;
    }

    // =============================
    // 🔷 RTP / MTP TABLE
    // =============================
    let mtpCount = 0, rtpCount = 0;

    rtpMtpSnap.forEach(docSnap => {
      const d = docSnap.data();

      totalAttempts++;
      totalQuestions += d.totalQuestions || 0;

      const acc = d.accuracy ?? 0;
      const marksDisplay = d.marks != null ? d.marks : (d.score != null ? d.score : "-");
      const totalDisplay = d.totalMarks != null ? d.totalMarks : (d.totalQuestions || 0);
      const marksStr = marksDisplay !== "-" ? `${marksDisplay}/${totalDisplay}` : "-";

      const rowHTML = `<tr>
          <td>${formatDateUI(d.date)}</td>
          <td>${d.subject || "-"}</td>
          <td>${d.attempt || "-"}</td>
          <td>${d.totalQuestions || 0}</td>
          <td class="col-marks">${marksStr}</td>
          <td class="col-wrongs">${d.wrong ?? 0}</td>
          <td class="col-accuracy">${acc}%</td>
        </tr>`;

      // Fix 4: strict type check for MTP/RTP
      const t = (d.type || "").toUpperCase().trim();
      if (t === "MTP") {
        mtpTableBody.insertAdjacentHTML("beforeend", rowHTML);
        mtpCount++;
      } else if (t === "RTP") {
        rtpTableBody.insertAdjacentHTML("beforeend", rowHTML);
        rtpCount++;
      }
    });

    // Empty states
    if (mtpCount === 0) {
      mtpTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--analysis-text-muted);padding:28px 12px;font-size:13px;">No MTP attempts yet</td></tr>`;
    }
    if (rtpCount === 0) {
      rtpTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--analysis-text-muted);padding:28px 12px;font-size:13px;">No RTP attempts yet</td></tr>`;
    }

    // =============================
    // 🔷 SUMMARY
    // =============================
    if (summaryAttemptsEl) summaryAttemptsEl.textContent = totalAttempts;
    if (summaryQuestionsEl) summaryQuestionsEl.textContent = totalQuestions;

    // =============================
    // 🔷 STRONGEST & WEAKEST CHAPTER
    // =============================
    let best = null;
    let weak = null;

    Object.entries(chapterAgg).forEach(([name, stat]) => {
      const acc = stat.total === 0
        ? 0
        : Math.round((stat.correct / stat.total) * 100);

      if (!best || acc > best.acc) best = { name, acc, attempts: stat.attempts };
      if (!weak || acc < weak.acc) weak = { name, acc, attempts: stat.attempts };
    });

    if (best && bestChapterName) {
      bestChapterName.textContent = best.name;
      if (bestChapterMeta) bestChapterMeta.textContent = `${best.acc}% accuracy • ${best.attempts} attempt${best.attempts>1?'s':''}`;
    } else if (bestChapterName) {
      bestChapterName.textContent = "—";
      if (bestChapterMeta) bestChapterMeta.textContent = "No data yet";
    }

    if (weak && weakChapterName) {
      weakChapterName.textContent = weak.name;
      if (weakChapterMeta) weakChapterMeta.textContent = `${weak.acc}% accuracy • ${weak.attempts} attempt${weak.attempts>1?'s':''}`;
    } else if (weakChapterName) {
      weakChapterName.textContent = "—";
      if (weakChapterMeta) weakChapterMeta.textContent = "No data yet";
    }

  } catch (err) {
    console.error("Detailed analysis load failed:", err);
    // Show error state in tables
    const errMsg = `<tr><td colspan="7" style="text-align:center;color:var(--analysis-danger);padding:28px 12px;font-size:13px;">Failed to load data. Please try again.</td></tr>`;
    if (chapterTableBody) chapterTableBody.innerHTML = errMsg;
    if (mtpTableBody) mtpTableBody.innerHTML = errMsg;
    if (rtpTableBody) rtpTableBody.innerHTML = errMsg;
  }
}
/* =========================
   SMART PDF EXPORT — Minimal Elegant Design
========================= */
document
  .getElementById("downloadAnalysisPdf")
  ?.addEventListener("click", async () => {
    const btn = document.getElementById("downloadAnalysisPdf");
    const originalHTML = btn.innerHTML;

    // Show loading state
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span> Preparing…`;

    try {
      const { jsPDF } = window.jspdf;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });

      const pageW = 595;
      const margin = 44;
      const contentW = pageW - margin * 2;

      /* ─────────────────────────────────────
         HEADER — clean white with thin rule
      ───────────────────────────────────── */

      // White background (default)
      // Brand name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);   // near-black
      doc.text("PathCA", margin, 48);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text("Performance Analysis Report", margin, 62);

      // Generated date — right aligned
      doc.setFontSize(8);
      doc.text(
        `Generated ${new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}`,
        pageW - margin,
        48,
        { align: "right" }
      );

      // Thin separator line
      doc.setDrawColor(229, 231, 235); // gray-200
      doc.setLineWidth(0.5);
      doc.line(margin, 72, pageW - margin, 72);

      let y = 92;

      /* ─────────────────────────────────────
         FIND ACTIVE TAB
      ───────────────────────────────────── */
      const activeTab = document.querySelector(".analysis-tab.active");
      if (!activeTab) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        return;
      }

      const type = activeTab.dataset.type;

      const titleMap = {
        chapter: "Chapter-wise Analysis",
        mtp:     "MTP Analysis",
        rtp:     "RTP Analysis"
      };

      const tableMap = {
        chapter: "chapterTable",
        mtp:     "mtpTable",
        rtp:     "rtpTable"
      };

      /* ─────────────────────────────────────
         SECTION TITLE
      ───────────────────────────────────── */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text(titleMap[type], margin, y);
      y += 16;

      /* ─────────────────────────────────────
         TABLE DATA
      ───────────────────────────────────── */
      const table = document.querySelector(`#${tableMap[type]} table`);
      if (!table) throw new Error("Table not found");

      const headers = [];
      const rows = [];

      table.querySelectorAll("thead th").forEach(th => {
        headers.push(th.innerText.trim());
      });

      table.querySelectorAll("tbody tr").forEach(tr => {
        const row = [];
        tr.querySelectorAll("td").forEach(td => row.push(td.innerText.trim()));
        if (row.length) rows.push(row);
      });

      if (!rows.length) {
        btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> No data`;
        setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2000);
        return;
      }

      /* ─────────────────────────────────────
         ELEGANT MINIMAL TABLE
         — white bg, thin gray lines
         — no colored header band
         — subtle alternate rows
      ───────────────────────────────────── */
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: contentW,

        styles: {
          fontSize: 8,
          cellPadding: { top: 7, right: 9, bottom: 7, left: 9 },
          lineColor: [229, 231, 235],
          lineWidth: 0.4,
          textColor: [55, 65, 81],   // gray-700
          font: "helvetica",
          valign: "middle"
        },

        headStyles: {
          fillColor: [248, 249, 252],  // near-white
          textColor: [107, 114, 128],  // gray-500
          fontStyle: "bold",
          fontSize: 7.5,
          lineColor: [209, 213, 219],
          lineWidth: 0.5
        },

        alternateRowStyles: {
          fillColor: [252, 253, 254]   // barely visible tint
        },

        columnStyles: {
          // Accuracy column (last) — slightly bold
          [headers.length - 1]: { fontStyle: "bold", textColor: [79, 70, 229] }
        },

        didDrawPage: (data) => {
          // Footer on each page
          const pgH = doc.internal.pageSize.getHeight();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(156, 163, 175); // gray-400
          doc.text(
            `PathCA • pathca.vercel.app • Page ${data.pageNumber}`,
            pageW / 2,
            pgH - 22,
            { align: "center" }
          );
          // Footer line
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.4);
          doc.line(margin, pgH - 32, pageW - margin, pgH - 32);
        }
      });

      /* ─────────────────────────────────────
         SAVE
      ───────────────────────────────────── */
      const fileName = `PathCA-${type}-${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fileName);

      btn.innerHTML = `<i class="fa-solid fa-check"></i> Downloaded`;
      setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2200);

    } catch (err) {
      console.error("PDF export failed:", err);
      btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Failed`;
      setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2500);
    }
  });

document.getElementById("downloadAnalysisXLS")?.addEventListener("click", () => {
  if (!window.isPremiumUser) {
      openSubscription(document.body)
    return;
  }
  const activeTab = document.querySelector(".analysis-tab.active")?.dataset.type;

  let table;

  if (activeTab === "chapter") {
    table = document.querySelector("#chapterTable table");
  } else if (activeTab === "mtp") {
    table = document.querySelector("#mtpTable table");
  } else {
    table = document.querySelector("#rtpTable table");
  }

  if (!table) return;

  /* =========================
     EXTRACT DATA
  ========================= */

  const ws = XLSX.utils.table_to_sheet(table);

  const range = XLSX.utils.decode_range(ws["!ref"]);

  /* =========================
     🔥 AUTO COLUMN WIDTH
  ========================= */

  const colWidths = [];

  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLen = 10;

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.v) {
        maxLen = Math.max(maxLen, String(cell.v).length);
      }
    }

    colWidths.push({ wch: Math.min(maxLen + 2, 40) });
  }

  ws["!cols"] = colWidths;

  /* =========================
     🎨 HEADER STYLING
  ========================= */

  for (let C = range.s.c; C <= range.e.c; ++C) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;

    ws[addr].s = {
      fill: { fgColor: { rgb: "6C63FF" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center" }
    };
  }

  /* =========================
     🎨 ZEBRA ROWS
  ========================= */

  for (let R = 1; R <= range.e.r; ++R) {
    if (R % 2 === 0) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        ws[addr].s = {
          fill: { fgColor: { rgb: "F5F7FF" } }
        };
      }
    }
  }

  /* =========================
     🏷️ BRAND HEADER ROW
  ========================= */

  XLSX.utils.sheet_add_aoa(ws, [["PathCA Performance Report"]], {
    origin: "A1"
  });

  ws["A1"].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: "left" }
  };

  /* shift table down */
  XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 });

  /* =========================
     SAVE
  ========================= */

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Analysis");

  XLSX.writeFile(wb, `PathCA-${activeTab}-analysis.xlsx`);
});