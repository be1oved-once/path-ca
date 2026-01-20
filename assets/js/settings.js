/* =========================
   GLOBAL SETTINGS ENGINE
========================= */

window.initSettings = initSettings;

function initSettings() {

  /* =========================
     DEFAULTS
  ========================= */
  const DEFAULT_SETTINGS = {
    randomizeQuestions: true,
    randomizeOptions: true,
    showABCD: true,
    questionTimer: true,
    questionTime: 45,
    rtpExamMode: false,
    autoSkip: true
  };

  const SETTINGS_KEY = "tic_settings";

  /* =========================
     LOAD / SAVE
  ========================= */
  function loadSettings() {
    try {
      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(localStorage.getItem(SETTINGS_KEY))
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(window.TIC_SETTINGS)
    );
  }

  // 🔥 INIT GLOBAL
  window.TIC_SETTINGS = loadSettings();

  /* =========================
     BASIC TOGGLES
  ========================= */
  function bindToggle(labelText, key) {
    const item = [...document.querySelectorAll(".settings-item")]
      .find(el => el.innerText.includes(labelText));
    if (!item) return;

    const toggle = item.querySelector(".toggle-switch");
    if (!toggle) return;

    toggle.classList.toggle("active", window.TIC_SETTINGS[key]);

    toggle.addEventListener("click", e => {
      e.stopPropagation();

      window.TIC_SETTINGS[key] = !window.TIC_SETTINGS[key];
      toggle.classList.toggle("active", window.TIC_SETTINGS[key]);
      saveSettings();
    });
  }

  bindToggle("Randomize Questions", "randomizeQuestions");
  bindToggle("Randomize Options", "randomizeOptions");
  bindToggle("Show A", "showABCD");
  bindToggle("RTP", "rtpExamMode");
  bindToggle("Auto-Skip", "autoSkip");

  /* =========================
     QUESTION TIMER
  ========================= */
  const timerSetting = document.getElementById("timerSetting");
  const timerToggle  = document.getElementById("timerToggle");
  const timerExpand  = document.getElementById("timerExpand");
  const timerInput   = document.getElementById("timerInput");
  const timerSaveBtn = document.getElementById("timerSaveBtn");
  const timerLabel   = document.getElementById("timerLabel");

  if (!timerToggle || !timerExpand) return;

  // restore
  timerToggle.classList.toggle(
    "active",
    window.TIC_SETTINGS.questionTimer
  );
  timerLabel.textContent =
    `(Current: ${window.TIC_SETTINGS.questionTime}s)`;
  timerInput.value = window.TIC_SETTINGS.questionTime;

  /* ===== TIMER OPEN / CLOSE HELPERS ===== */

  function openTimerExpand(el) {
    el.classList.add("active");
    el.style.height = "0px";
    el.offsetHeight;
    el.style.height = el.scrollHeight + "px";

    el.addEventListener("transitionend", function done(e) {
      if (e.propertyName !== "height") return;
      el.style.height = "auto";
      el.removeEventListener("transitionend", done);
    });
  }

  function closeTimerExpand(el) {
    el.style.height = el.scrollHeight + "px";
    el.offsetHeight;
    el.style.height = "0px";
    el.classList.remove("active");
  }

  /* ===== TIMER TOGGLE ===== */
  timerToggle.addEventListener("click", e => {
    e.stopPropagation();

    window.TIC_SETTINGS.questionTimer =
      !window.TIC_SETTINGS.questionTimer;

    timerToggle.classList.toggle(
      "active",
      window.TIC_SETTINGS.questionTimer
    );

    if (!window.TIC_SETTINGS.questionTimer) {
      closeTimerExpand(timerExpand);
    }

    saveSettings();
  });

  /* ===== ROW CLICK (THIS WAS MISSING) ===== */
  timerSetting.addEventListener("click", e => {
    if (e.target.closest(".toggle-switch")) return;
    if (!window.TIC_SETTINGS.questionTimer) return;

    e.stopPropagation();

    if (timerExpand.classList.contains("active")) {
      closeTimerExpand(timerExpand);
    } else {
      openTimerExpand(timerExpand);
    }
  });

  /* ===== SAVE BUTTON ===== */
  timerSaveBtn.addEventListener("click", e => {
    e.stopPropagation();

    let val = Number(timerInput.value);
    val = Math.max(30, Math.min(400, val));

    window.TIC_SETTINGS.questionTime = val;
    timerInput.value = val;
    timerLabel.textContent = `(Current: ${val}s)`;

    saveSettings();
    closeTimerExpand(timerExpand);
  });
}