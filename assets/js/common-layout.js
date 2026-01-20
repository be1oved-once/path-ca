(function () {

  const layoutHTML = `
  <header class="top-header">
<a href="/index.html" class="brand-link">
<div class="brand-logo bordered-logo">>
  <span class="footer-before"><span class="before-text">Before</span><span class="before-underline"></span></span><span class="brand-x">x</span><span class="brand-am">am</span>
</div>
</a>
    <nav class="top-nav">
      <a href="/index.html" class="desk-nav-item">Home</a>
      <a href="/mtp-rtp.html">RTP/MTP</a>
      <a href="javascript:void(0)" onclick="openSettings()">Settings</a>
      <a href="/About-us.html">About</a>
      <a href="/contact.html">Drop Suggestion</a>
      <a href="/Sponsor.html">Sponsor</a>

    </nav>
      <!-- RIGHT : ICON ACTIONS -->
  <div class="top-actions">

<button class="icon-btn" id="notifyBtn" title="Notifications">
  <i class="fa-regular fa-bell"></i>
  <span class="notify-dot"></span>
</button>

<button class="icon-btn" id="themeBtn" title="Theme">
  <i class="fa-solid fa-moon"></i>
</button>

    <div class="profile-wrap">
      <button class="icon-btn profile-btn" id="profileBtn" title="Profile">
        <i class="fa-solid fa-user"></i>
      </button>

      <!-- PROFILE POPUP -->
      <div class="profile-popup" id="profilePopup">
        <a href="/profile.html">My Profile</a>
        <a href="/performance.html">My Performance</a>
        <a href="/bookmarks.html">Bookmarks</a>
        <a href="/correction-test.html">Correction Test</a>
        <a href="#">Saved Tests</a>
        <a href="#">Account Settings</a>
        <hr>
        <a href="javascript:void(0)" class="auth-logout">Logout</a>
      </div>
      <div class="profile-lock-popup" id="profileLockPopup">
  <p>Login to unlock</p>
  <button onclick="openAuth('login')">Login</button>
</div>
    </div>

  </div>
<div class="mobile-header-actions">
  <button class="icon-btn" id="notifyBtnMobile" title="Notifications">
    <i class="fa-regular fa-bell"></i>
<span class="notify-dot"></span>
  </button>

  <button id="menuBtn" class="menu-btn" aria-label="Menu">
    <span></span>
    <span></span>
    <span></span>
  </button>
</div>
  </header>
<!-- ===== NOTIFICATION PANEL ===== -->
<!-- ===== NOTIFICATION PANEL ===== -->
<div id="notifyPanel" class="notify-panel">
  <div class="notify-header">
    <span>Notifications</span>
    <button id="notifyClose">×</button>
  </div>

<div id="notifyList" class="notify-list">
<div class="notify-item">
  <p class="notify-text"></p>
  <small class="notify-time"></small>
</div>
    </div>
    
  </div>

<!-- ===== Left Open Strip ===== -->
<div id="leftStrip" class="left-strip">
  <div class="grab-line"></div>
</div>

<!-- ===== Left Sidebar ===== -->
<aside id="leftSidebar" class="left-sidebar">
  <div class="sidebar-header">
    <span class="menu-main">Student</span>
    <span class="menu-dot">.</span>
    <span class="menu-sub">Functions</span>
  </div>
  <hr class="sidebar-hr" />

<ul class="sidebar-list">

  <!-- 🔒 LOGIN LOCK OVERLAY -->
  <div id="loginLockOverlay" class="login-lock-overlay">
    <div class="login-lock-box">
      <i class="fa-solid fa-lock"></i>
      <h4>Login Required</h4>
      <p>
        Student functions LOCKED<br>
      </p>
      <button class="primary-btn pill"
              onclick="openAuth('login')">
        UNLOCK
      </button>
    </div>
  </div>
<li class="admin-only admin-dropdown" style="display:none;">
  <button class="admin-toggle" id="adminToggle">
    <i class="fa-solid fa-shield-halved"></i>
    <span>I'm Admin</span>
  </button>

  <div class="admin-menu" id="adminMenu">
    <a href="/admin/push-noti.html">Push Notifications</a>
    <a href="/admin/test-setup.html">Temp Test</a>
  </div>
</li>
  <li class="mobile-left">
    <a href="/profile.html">
      <i class="fa-solid fa-user"></i>
      <span>My Profile</span>
    </a>
  </li>
  <li class="mobile-left">
    <a href="/performance.html">
      <i class="fa-solid fa-chart-line"></i>
      <span>My Performance</span>
    </a>
  </li>

  <li class="mobile-left">
    <a href="/bookmarks.html">
      <i class="fa-solid fa-star"></i>
      <span>Bookmarks</span>
    </a>
  </li>
  <li class="mobile-left">
    <a href="/correction-test.html">
      <i class="fa-solid fa-pen-to-square"></i>
      <span>Take a Correction Test</span>
    </a>
  </li>
<li class="mobile-left">
  <a href="/leaderboard.html">
    <i class="fa-solid fa-trophy"></i>
    <span>Leaderboard</span>
  </a>
</li>
  <li class="mobile-left">
    <a href="/blogs.html">
      <i class="fa-solid fa-newspaper"></i>
      <span>Articles</span>
    </a>
  </li>
    <li class="mobile-left"><a href="/thoughts.html"><i class="fa-regular fa-comment-dots"></i><span>Drop Thoughts</span></a></li>
    <li class="desktop-left"><a href="/chapters.html"><i class="fa-solid fa-book"></i>
    <span>Chapters</span></a>
</li>
    <li class="desktop-left"><a href="/mtp-rtp.html"><i class="fa-solid fa-file-lines"></i><span>RTP / MTP</span></a></li>
    <li class="desktop-left"><a href="/business-laws.html"><i class="fa-solid fa-scale-balanced"></i></i><span>Business Laws</span></a></li>
  <li class="desktop-left"><a href="/blogs.html"><i class="fa-solid fa-newspaper"></i><span>Articles</span></a></li>
  <li class="desktop-left"><a href="/About-us.html"><i class="fa-solid fa-circle-info"></i><span>About</span></a></li>
  <li class="desktop-left"><a href="javascript:void(0)" onclick="openSettings()"><i class="fa-solid fa-gear"></i><span>Settings</span></a></li>
  <li class="desktop-left"><a href="/contact.html"><i class="fa-solid fa-comment"></i><span>Suggestions</span></a></li>
  <li class="desktop-left"><a href="/sponsor-us.html"><i class="fa-solid fa-hand-holding-heart"></i>
    <span>Sponsor Us</span></a>
</li>
    <div class="thought-hint">
  <div class="thought-arrow"></div>
  <p>
    Want to drop opinions<br>
    <span>anonymously?</span>
  </p>
</div>
<div class="auth-actions">
<a href="javascript:void(0)"
   class="auth-btn login-btn auth-login"
   onclick="openAuth('login')">
  Login
</a>
<a href="javascript:void(0)"
   class="auth-btn signup-btn auth-signup"
   onclick="openAuth('signup')">
  Sign Up
</a>
  <a href="javascript:void(0)" class="auth-btn login-btn auth-logout" style="display:none;">LogOut</a>
</div>
</ul>

</aside>
  <!-- ===== Right Sidebar ===== -->
  <aside id="rightSidebar" class="right-sidebar">
<div class="sidebar-header">
<span class="menu-main">Explore</span>
<span class="menu-dot">•</span>
<span class="menu-sub">Menu</span>

</div>
    <hr class="sidebar-hr" />
<ul class="sidebar-list">
  <li><a href="/index.html">Home</a></li>
  <li><a href="/chapters.html">Chapters</a></li>
  <li><a href="/mtp-rtp.html">RTP / MTP</a></li>
  <li><a href="/business-laws.html">Business Laws</a></li>
  <li><a href="/About-us.html">About Us</a></li>
  <li><a href="/sponsor-us.html">Sponsor Us</a></li>
  <li><a href="javascript:void(0)" onclick="openSettings()">Settings</a></li>
  <li><a href="/contact.html">Suggestions / Contact</a></li>
  <div class="thought-hint right-hint">
  <div class="thought-arrow right-arrow"></div>
  <p>
    Have a suggestion or issue?<br>
    <span>Reach us anytime.</span>
  </p>
</div><br>
      <hr class="sidebar-hr" />
<div class="theme-toggle">
  <span>Dark Mode</span>
  <div class="theme-switch" id="themeToggle">
    <div class="switch-knob"></div>
  </div>
</div>
<div class="auth-actions auth-actions-right">
<a href="javascript:void(0)"
   class="auth-btn login-btn auth-login"
   onclick="openAuth('login')">
  Login
</a>
<a href="javascript:void(0)"
   class="auth-btn signup-btn auth-signup"
   onclick="openAuth('signup')">
  Sign Up
</a>
  <a href="javascript:void(0)" class="auth-btn login-btn auth-logout" style="display:none;">LogOut</a>
</div>

</ul>
  </aside>

  <!-- ===== Overlay ===== -->
  <div id="overlay"></div>
<div id="leftOverlay" class="side-overlay"></div>
<!-- ===== AUTH POPUP ===== -->
<!-- ===== SETTINGS MODAL ===== -->
<div id="settingsModal" class="settings-modal">
  <div class="settings-box">

    <button class="settings-close" id="settingsClose">×</button>

    <h2 class="settings-title">Settings</h2>

    <p class="settings-sub">PERSONALIZATION</p>

    <div class="settings-item">
      <span>Randomize Questions</span>
      <div class="toggle-switch active"></div>
    </div>

    <div class="settings-item">
      <span>Randomize Options</span>
      <div class="toggle-switch active"></div>
    </div>

    <div class="settings-item">
      <span>Show A / B / C / D</span>
      <div class="toggle-switch active"></div>
    </div>

    <div class="settings-item timer-setting" id="timerSetting">
  <span>
    Question Timer<br>
    <small id="timerLabel">(Current: 45s)</small>
  </span>
  <div class="toggle-switch" id="timerToggle"></div>
</div>

<div class="timer-expand" id="timerExpand">
  <div class="timer-input-wrap">
    <input
      type="number"
      min="30"
      max="400"
      id="timerInput"
      value="45"
    />
    <button id="timerSaveBtn">Save</button>
  </div>

  <small class="timer-hint">
    Minimum 30 seconds. Applies to all quizzes.
  </small>
</div>

    <div class="settings-item">
      <span>RTP / MTP Exam Mode<br><small>100 Q = 120 mins</small></span>
      <div class="toggle-switch"></div>
    </div>

    <div class="settings-item">
      <span>Auto-Skip to Next</span>
      <div class="toggle-switch active"></div>
    </div>

  </div>
</div>
<div id="authModal" class="auth-modal">
<div class="sheet-handle"></div>
  <div class="auth-box">

    <button class="auth-close" id="authClose">×</button>

    <h2 id="authTitle">Login</h2>

    <button class="google-btn">
      <i class="fa-brands fa-google"></i>
      Continue with Google
    </button>

    <div class="auth-divider">
      <span>OR</span>
    </div>

    <!-- LOGIN FORM -->
<form id="loginForm" class="auth-form">
  <input type="text" id="loginUsername" placeholder="Username or Email" required>

  <div class="password-field">
    <input type="password" id="loginPassword" placeholder="Password" required>
    <i class="fa-solid fa-eye toggle-pass"></i>
  </div>
  <p class="forgot-pass">
  <a href="/reset-password.html">Forgot password?</a>
</p>
  <p class="auth-error" id="loginError"></p>

  <button type="submit" class="primary-btn">Login</button>
</form>

    <!-- SIGNUP FORM -->
<form id="signupForm" class="auth-form hidden">
  <input type="text" id="signupUsername" placeholder="Username" required>
  <input type="email" id="signupEmail" placeholder="Email" required>

  <div class="password-field">
    <input type="password" id="signupPassword" placeholder="Password" required>
    <i class="fa-solid fa-eye toggle-pass"></i>
  </div>

  <div class="password-field">
    <input type="password" id="signupPassword2" placeholder="Re-enter Password" required>
    <i class="fa-solid fa-eye toggle-pass"></i>
  </div>
<!-- OTP INLINE (hidden by default)
<div id="otpInlineBox" class="password-field hidden">
  <input
    type="text"
    id="otpInput"
    placeholder="Enter 4-digit OTP"
    maxlength="4"
    inputmode="numeric"
    style="
      text-align:center;
      letter-spacing:6px;
      font-size:13px;
    "
  />
  <p class="auth-error" id="otpError"></p>
</div> ----->

  <p class="auth-error" id="signupError"></p>

  <button type="submit" class="primary-btn">Sign Up</button>
</form>

    <p class="auth-switch">
      <span id="switchText">Not have an account?</span>
      <button id="switchAuth">Sign Up</button>
    </p>

  </div>
</div>
<!-- ===== FOOTER ===== -->
<footer class="site-footer">
  <div class="footer-inner">

    <div class="footer-brand">
<a href="/index.html" class="brand-link">
<div class="brand-logo bordered-logo">>
<span class="footer-before"><span class="before-text">Before</span><span class="before-underline"></span></span><span class="brand-x">x</span><span class="brand-am">am</span>
</div>
</a>
      <p class="footer-tagline">
Built for serious exam practice, smart evaluation, and real results.
      </p>
    </div>

    <div class="footer-links">
      <div class="footer-col">
        <h4>Platform</h4>
        <a href="/index.html">Home</a>
        <a href="/chapters.html">Practice</a>
        <a href="/temp-test.html">Live Tests</a>
        <a href="/bookmarks.html">Bookmarks</a>
      </div>

      <div class="footer-col">
        <h4>Support</h4>
        <a href="#">Help / FAQ</a>
        <a href="/contact.html">Contact</a>
        <a href="/contact.html">Feedback</a>
      </div>

      <div class="footer-col">
        <h4>Legal</h4>
        <a href="/Legal/privacy-policy.html">Privacy Policy</a>
        <a href="/Legal/terms.html">Terms & Conditions</a>
        <a href="/Legal/disclaimer.html">Disclaimer</a>
      </div>

      <div class="footer-col">
        <h4>About</h4>
        <a href="/About-us.html">About Us</a>
        <a href="/Legal/our-mission.html">Our Mission</a>
        <a href="/blogs.html">Blogs</a>
      </div>
    </div>

  </div>

  <div class="footer-bottom">
    © 2025 Beforexam · All rights reserved
  </div>
</footer>
  `;

  document.body.insertAdjacentHTML("beforeend", layoutHTML);
  // =========================
// TWEMOJI GLOBAL LOADER
// =========================
(function loadTwemoji() {
  if (window.twemoji) return; // prevent double load

  const script = document.createElement("script");
  script.src = "https://twemoji.maxcdn.com/v/latest/twemoji.min.js";
  script.onload = () => {
    // First parse when loaded
    twemoji.parse(document.body, {
      folder: "svg",
      ext: ".svg"
    });
  };
  document.head.appendChild(script);
})();
})();


window.addEventListener("DOMContentLoaded", () => {
  if (window.initSettings) {
    window.initSettings();
  }
});
/* =========================
   PWA INSTALL BANNER HTML
========================= */
(function () {

  const installHTML = `
    <div id="installBanner" class="pwa-banner hidden">
      <div class="pwa-content">
        <div class="pwa-icon">⚡</div>

        <div class="pwa-text">
          <strong>Install Beforexam</strong>
          <span>Faster access • Works offline</span>
        </div>

        <button id="installBtn" class="pwa-install-btn">Install</button>
        <button id="installClose" class="pwa-close">✕</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", installHTML);

})();

const adminToggle = document.getElementById("adminToggle");
const adminMenu = document.getElementById("adminMenu");

if (adminToggle && adminMenu) {
  // Toggle on click
  adminToggle.addEventListener("click", e => {
    e.stopPropagation(); // prevent document click
    adminMenu.classList.toggle("open");
  });

  // Prevent closing when clicking inside menu
  adminMenu.addEventListener("click", e => {
    e.stopPropagation();
  });

  // Close when clicking outside
  document.addEventListener("click", () => {
    adminMenu.classList.remove("open");
  });
}

function injectTempTestItem() {
  const leftSidebar = document.querySelector("#leftSidebar .sidebar-list");
  if (!leftSidebar) return;

  // ✅ If already exists, do nothing
  let existing = leftSidebar.querySelector(".temp-test-item");
  if (existing) return;

  // ✅ Always inject
  leftSidebar.insertAdjacentHTML(
    "afterbegin",
    `
    <li class="temp-test-item">
      <a href="/temp-test.html" class="temp-test-link">
        <i class="fa-solid fa-bolt"></i>
        <span>Temp Test</span>
        <span class="temp-test-dot"></span>
      </a>
    </li>
    `
  );
}
/* =========================
   OFFLINE BANNER (GLOBAL)
========================= */
(function () {
  const banner = document.createElement("div");
  banner.id = "offlineBanner";
  banner.textContent = "You are offline. Some features may not work.";
banner.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #ff4d4d;
  color: #fff;
  text-align: center;
  padding: 6px;
  font-size: 7px;
  z-index: 100000;
  display: none;
`;
  document.body.appendChild(banner);

  function update() {
    banner.style.display = navigator.onLine ? "none" : "block";
  }

  window.addEventListener("online", update);
  window.addEventListener("offline", update);

  update(); // initial check
})();
// =========================
// AUTO PARSE NEW CONTENT
// =========================
window.parseEmojis = function(target = document.body) {
  if (!window.twemoji) return;
  twemoji.parse(target, {
    folder: "svg",
    ext: ".svg"
  });
};