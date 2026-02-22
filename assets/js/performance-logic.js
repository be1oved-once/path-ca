import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  setDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
  
import { generatePerformanceInsight } from "./insight-engine.js";
/* ======================
   USER STATS CACHE
====================== */

const USER_CACHE_KEY = "pathca_user_cache_v1";
const USER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

window.__getUserCache = function () {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // expire check
    if (Date.now() - parsed.ts > USER_CACHE_TTL) {
      localStorage.removeItem(USER_CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

window.__setUserCache = function (data) {
  try {
    localStorage.setItem(
      USER_CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        data
      })
    );
  } catch {}
};

window.__clearUserCache = function () {
  localStorage.removeItem(USER_CACHE_KEY);
};
// 🔒 Safe global init
window.allAttempts = [];
/* =========================
   STATS
========================= */

const streakEl = document.getElementById("streakVal");
const mostXpEl = document.getElementById("mostXpVal");
const attemptsEl = document.getElementById("attemptVal");
const visitsEl = document.getElementById("visitVal");

/* =========================
   ⚡ INSTANT CACHE HYDRATION
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const cache = window.__getUserCache?.();
  if (!cache) return;

try {
  if (!cache) return;

  // ===== TOP STATS =====
  if (streakEl) streakEl.textContent = cache.streak ?? 0;
  if (mostXpEl) mostXpEl.textContent = formatK(cache.bestXpDay ?? 0);
  if (attemptsEl) attemptsEl.textContent = formatK(cache.totalAttempts ?? 0);
  if (visitsEl) visitsEl.textContent = formatK(cache.pageVisits ?? 0);

  // ===== WEEK GRAPH (SAFE) =====
  if (cache.weeklyXp) {
    const canvas = document.getElementById("xpWeekChart");

    // ⚠️ guard everything
    if (canvas && window.Chart && typeof getWeekDates === "function") {

      const weekDates = getWeekDates();
      const values = new Array(7).fill(0);

      weekDates.forEach((date, i) => {
        values[i] = cache.weeklyXp?.[date] || 0;
      });

      const weekTotal = values.reduce((a, b) => a + b, 0);
      if (weekTotalEl) weekTotalEl.textContent = weekTotal;

      // prevent double chart
      if (!window.__fastChartDrawn) {
        window.__fastChartDrawn = true;

        const ctx = canvas.getContext("2d");

        xpChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
            datasets: [{
              data: values,
              tension: 0.45,
              borderWidth: 2.5,
              borderColor: "#6366F1",
              backgroundColor: "rgba(99,102,241,0.22)",
              pointRadius: 4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display:false } }
          }
        });
      }
    }
  }
// ⚡ show real content early if cache worked
if (skeleton) skeleton.style.display = "none";
if (realContent) realContent.style.display = "block";
} catch (e) {
  console.warn("Cache hydration failed:", e); // 👈 now shows real error
}
});
/* =========================
   ⚡ FAST ATTEMPTS HYDRATION
========================= */

(function hydrateAttemptsFast() {
  try {
    const raw = localStorage.getItem("pathca_attempts_cache_v1");
    if (!raw) return;

    const parsed = JSON.parse(raw);

    // expire after 24h
    if (Date.now() - parsed.ts > 86400000) return;

    window.allAttempts = parsed.data || [];

    // update overview immediately
    updatePracticeOverview("all");

  } catch {}
})();

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

// Show skeleton initially
// Show skeleton only if no cache
const hasFastCache = !!window.__getUserCache?.();

if (skeleton) skeleton.style.display = hasFastCache ? "none" : "block";
if (realContent) realContent.style.display = hasFastCache ? "block" : "none";
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

    if (a.type === "RTP") rtp++;
    else if (a.type === "MTP") mtp++;
    else if (a.type === "CHAPTER") chapter++;
  });

  if (rtpCard) rtpCard.textContent = `${rtp} Attempts`;
  if (mtpCard) mtpCard.textContent = `${mtp} Attempts`;
  if (chapterCard) chapterCard.textContent = `${chapter} Chapters`;
  updatePeriodInsight(rtp, mtp, chapter);
});

auth.onAuthStateChanged(async user => {
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  // 🔥 page visit count (fire & forget)
  updateDoc(ref, {
    pageVisits: increment(1)
  }).catch(() => {});

  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

/* =========================
   PRACTICE OVERVIEW
========================= */

const attemptsSnap = await getDocs(
  collection(db, "users", user.uid, "attempts")
);

let rtpCount = 0;
let mtpCount = 0;
let chapterCount = 0;
updatePeriodInsight(rtpCount, mtpCount, chapterCount);

attemptsSnap.forEach(doc => {
  const a = doc.data();

  if (a.type === "RTP") rtpCount++;
  else if (a.type === "MTP") mtpCount++;
  else if (a.type === "CHAPTER") chapterCount++;
});

window.allAttempts = [];

attemptsSnap.forEach(doc => {
  window.allAttempts.push(doc.data());
});
// ===== SAVE ATTEMPT SUMMARY TO CACHE (FAST LOAD) =====
try {
  const summary = {
    rtpCount,
    mtpCount,
    chapterCount,
    attempts: window.allAttempts.slice(0, 200) // light cache
  };

  const existing = JSON.parse(localStorage.getItem("userCache") || "{}");
  existing.attemptSummary = summary;
  localStorage.setItem("userCache", JSON.stringify(existing));

} catch (e) {
  console.warn("Attempt cache save failed");
} 
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

// ✅ SAVE TO FAST CACHE
window.__setUserCache?.({
  streak: data.streak ?? 0,
  bestXpDay: data.bestXpDay ?? 0,
  totalAttempts: data.totalAttempts ?? 0,
  pageVisits: data.pageVisits ?? 0,
  weeklyXp: data.weeklyXp || {}
});


Chart.defaults.font.family = "Poppins, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
Chart.defaults.font.size = 12;
  /* ---------- WEEKLY XP ---------- */
  const canvas = document.getElementById("xpWeekChart");
if (!canvas || typeof Chart === "undefined") return;

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
});
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

    if (a.type === "RTP") rtp++;
    else if (a.type === "MTP") mtp++;
    else if (a.type === "CHAPTER") chapter++;
  });

  rtpCard.textContent = `${rtp} Attempts`;
  mtpCard.textContent = `${mtp} Attempts`;
  chapterCard.textContent = `${chapter} Chapters`;
}
const subjectArrow = subjectBtn.querySelector("i");
subjectBtn?.addEventListener("click", e => {
  e.stopPropagation();

  const isOpen = subjectPopup.style.maxHeight;

  if (isOpen) {
    subjectPopup.style.maxHeight = null;
    subjectArrow.classList.remove("fa-chevron-up");
    subjectArrow.classList.add("fa-chevron-down");
  } else {
    subjectPopup.style.maxHeight = subjectPopup.scrollHeight + "px";
    subjectArrow.classList.remove("fa-chevron-down");
    subjectArrow.classList.add("fa-chevron-up");
  }
});

subjectPopup?.addEventListener("click", e => {
  const subject = e.target.dataset.subject;
  if (!subject) return;

  subjectValue.textContent = e.target.textContent;
subjectValue.dataset.subject = subject;
  subjectPopup.style.maxHeight = null;

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
    subjectPopup.style.maxHeight = null;
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
   DETAILED ANALYSIS OVERLAY
========================= */

/* =========================
   DETAILED ANALYSIS OVERLAY
========================= */

const analysisOverlay = document.getElementById("analysisOverlay");
const openAnalysis = document.getElementById("openDetailedAnalysis");
const closeAnalysis = document.getElementById("closeAnalysis");

// OPEN
openAnalysis?.addEventListener("click", () => {
  analysisOverlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    analysisOverlay.classList.add("active");
  });
  document.body.style.overflow = "hidden";
});

// CLOSE
closeAnalysis?.addEventListener("click", () => {
  analysisOverlay.classList.remove("active");
  
  setTimeout(() => {
    analysisOverlay.classList.add("hidden");
  }, 350); // match CSS transition
  
  document.body.style.overflow = "";
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