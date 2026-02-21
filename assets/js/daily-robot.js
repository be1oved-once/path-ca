/* =========================
   GLOBAL DAILY TARGET ROBOT
========================= */

const robotOverlay = document.getElementById("dailyRobotOverlay");
const robotMessage = document.getElementById("robotMessage");
const robotCloseBtn = document.getElementById("robotCloseBtn");

/* ---------- DATE ---------- */
function getTodayKey() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/* ---------- TARGET LOGIC ---------- */
// 50–200, always multiple of 10
function generateTarget() {
  const min = 50;
  const max = 200;
  const steps = (max - min) / 10;
  return min + Math.floor(Math.random() * (steps + 1)) * 10;
}

function getDailyTarget(uid) {
  const today = getTodayKey();
  const key = `dailyTarget_${uid}_${today}`;

  let target = Number(localStorage.getItem(key));
  if (!target) {
    target = generateTarget();
    localStorage.setItem(key, String(target));
  }
  return target;
}

/* ---------- PROGRESS ---------- */
function getProgress(uid) {
  const today = getTodayKey();
  return Number(localStorage.getItem(`dailyCount_${uid}_${today}`) || 0);
}

/* ---------- INCREMENT (CALLED ON EVERY MCQ ATTEMPT) ---------- */
export function incrementDailyProgress(uid) {
  if (!uid) return;

  const today = getTodayKey();
  const countKey = `dailyCount_${uid}_${today}`;
  const completedKey = `dailyCompleted_${uid}_${today}`;

  let count = getProgress(uid) + 1;
  localStorage.setItem(countKey, String(count));

  const target = getDailyTarget(uid);

  console.log("[ROBOT]", { count, target });

  // 🔥 SHOW COMPLETION ONLY ONCE
  if (count >= target && !localStorage.getItem(completedKey)) {
    localStorage.setItem(completedKey, "1");

    showRobot(
      `🎉 Target Completed!<br>${target} MCQs done today`,
      true
    );
  }
}

/* ---------- UI ---------- */
function showRobot(message, success = false) {
  if (!robotOverlay) return;

  robotMessage.innerHTML = message;

  const wrap = robotOverlay.querySelector(".robot-wrap");
  if (wrap) {
    wrap.classList.toggle("robot-success", success);
  }

  robotOverlay.classList.remove("hidden");
}

robotCloseBtn?.addEventListener("click", () => {
  robotOverlay.classList.add("hidden");
});

/* ---------- INIT (SHOW TARGET ONCE PER DAY) ---------- */
export function initDailyRobot(uid) {
  if (!uid || !robotOverlay) return;

  const today = getTodayKey();
  const shownKey = `robotShown_${uid}_${today}`;

  if (!localStorage.getItem(shownKey)) {
    const target = getDailyTarget(uid);
    showRobot(`🎯 Today’s Target<br>Complete ${target} MCQs`);
    localStorage.setItem(shownKey, "1");
  }
}

/* ---------- OPTIONAL: DEV / ADMIN RESET ---------- */
export function resetDailyRobot(uid) {
  const today = getTodayKey();

  [
    `dailyTarget_${uid}_${today}`,
    `dailyCount_${uid}_${today}`,
    `dailyCompleted_${uid}_${today}`,
    `robotShown_${uid}_${today}`
  ].forEach(k => localStorage.removeItem(k));

  console.log("🧹 Daily robot reset for today");
}