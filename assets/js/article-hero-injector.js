/**
 * article-hero-injector.js
 * PathCA — Auto-injects a styled hero thumbnail above every article header.
 * Works with any article following the standard HTML structure.
 * Automatically adapts to dark/light mode via CSS variable observation.
 *
 * Usage: <script src="/assets/js/article-hero-injector.js"></script>
 * Place anywhere in the <body>, before or after other scripts.
 */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
     THEME CONFIG — per kicker category
     Each entry: { accent, bg, pattern, icon, label }
     Falls back to "default" if kicker not matched.
  ───────────────────────────────────────────── */
  const THEMES = {
    "exam strategy": {
      accent:  "#3730a3",
      accentD: "#818cf8",
      bg:      "#eef0ff",
      bgD:     "#1a1830",
      pattern: "grid",
      icon:    "target",
      tag:     "Strategy"
    },
    "mental wellness": {
      accent:  "#0f766e",
      accentD: "#5eead4",
      bg:      "#ecfdf5",
      bgD:     "#0d1f1e",
      pattern: "wave",
      icon:    "brain",
      tag:     "Wellness"
    },
    "psychology": {
      accent:  "#7c3aed",
      accentD: "#c4b5fd",
      bg:      "#f5f3ff",
      bgD:     "#1a1528",
      pattern: "dots",
      icon:    "mind",
      tag:     "Psychology"
    },
    "mindset": {
      accent:  "#b45309",
      accentD: "#fcd34d",
      bg:      "#fffbeb",
      bgD:     "#1c1700",
      pattern: "diagonal",
      icon:    "compass",
      tag:     "Mindset"
    },
    "study tips": {
      accent:  "#0369a1",
      accentD: "#38bdf8",
      bg:      "#eff6ff",
      bgD:     "#0c1a2e",
      pattern: "grid",
      icon:    "book",
      tag:     "Study"
    },
    "default": {
      accent:  "#3730a3",
      accentD: "#818cf8",
      bg:      "#f5f4ff",
      bgD:     "#16151f",
      pattern: "grid",
      icon:    "pen",
      tag:     "PathCA"
    }
  };

  /* ─────────────────────────────────────────────
     SVG PATTERN GENERATORS
  ───────────────────────────────────────────── */
  function patternGrid(accent) {
    const c = hexToRgba(accent, 0.09);
    return `
      <pattern id="ph-grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="${c}" stroke-width="0.8"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#ph-grid)"/>
    `;
  }

  function patternDots(accent) {
    const c = hexToRgba(accent, 0.13);
    return `
      <pattern id="ph-dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.2" fill="${c}"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#ph-dots)"/>
    `;
  }

  function patternWave(accent) {
    const c = hexToRgba(accent, 0.1);
    return `
      <path d="M0 20 Q 50 5, 100 20 T 200 20 T 300 20 T 400 20 T 500 20 T 600 20 T 700 20 T 800 20" 
            fill="none" stroke="${c}" stroke-width="1.5"/>
      <path d="M0 40 Q 50 25, 100 40 T 200 40 T 300 40 T 400 40 T 500 40 T 600 40 T 700 40 T 800 40" 
            fill="none" stroke="${c}" stroke-width="1.2"/>
      <path d="M0 60 Q 50 45, 100 60 T 200 60 T 300 60 T 400 60 T 500 60 T 600 60 T 700 60 T 800 60" 
            fill="none" stroke="${c}" stroke-width="0.9"/>
    `;
  }

  function patternDiagonal(accent) {
    const c = hexToRgba(accent, 0.08);
    return `
      <pattern id="ph-diag" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="14" stroke="${c}" stroke-width="4"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#ph-diag)"/>
    `;
  }

  function getPattern(name, accent) {
    switch (name) {
      case "dots":     return patternDots(accent);
      case "wave":     return patternWave(accent);
      case "diagonal": return patternDiagonal(accent);
      default:         return patternGrid(accent);
    }
  }

  /* ─────────────────────────────────────────────
     SVG ICON GENERATORS (inline, no dependency)
  ───────────────────────────────────────────── */
  function getIcon(name, color) {
    const icons = {
      target: `<circle cx="28" cy="28" r="20" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.5"/>
               <circle cx="28" cy="28" r="12" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.7"/>
               <circle cx="28" cy="28" r="5" fill="${color}" opacity="0.9"/>
               <line x1="28" y1="0" x2="28" y2="10" stroke="${color}" stroke-width="2" opacity="0.4"/>
               <line x1="28" y1="46" x2="28" y2="56" stroke="${color}" stroke-width="2" opacity="0.4"/>
               <line x1="0" y1="28" x2="10" y2="28" stroke="${color}" stroke-width="2" opacity="0.4"/>
               <line x1="46" y1="28" x2="56" y2="28" stroke="${color}" stroke-width="2" opacity="0.4"/>`,

      brain: `<path d="M28 8 C18 8 10 15 10 24 C10 28 12 32 15 34 C13 36 12 39 13 42 C14 46 18 48 22 47 L22 50 L34 50 L34 47 C38 48 42 46 43 42 C44 39 43 36 41 34 C44 32 46 28 46 24 C46 15 38 8 28 8Z" 
              fill="none" stroke="${color}" stroke-width="2.5" opacity="0.75"/>
             <path d="M28 14 L28 44 M20 20 C20 20 24 23 28 20 M28 20 C28 20 32 23 36 20 M18 30 C18 30 22 33 28 30 M28 30 C28 30 34 33 38 30" 
              fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>`,

      mind: `<circle cx="28" cy="20" r="10" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.7"/>
             <path d="M18 30 C10 36 10 50 28 50 C46 50 46 36 38 30" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.7"/>
             <path d="M28 20 L28 34 M22 26 L34 26" stroke="${color}" stroke-width="2" opacity="0.5"/>
             <circle cx="23" cy="18" r="2" fill="${color}" opacity="0.6"/>
             <circle cx="33" cy="18" r="2" fill="${color}" opacity="0.6"/>`,

      compass: `<circle cx="28" cy="28" r="20" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.5"/>
                <polygon points="28,12 32,28 28,26 24,28" fill="${color}" opacity="0.9"/>
                <polygon points="28,44 24,28 28,30 32,28" fill="${color}" opacity="0.35"/>
                <circle cx="28" cy="28" r="3" fill="${color}" opacity="0.8"/>`,

      book: `<rect x="10" y="8" width="32" height="40" rx="2" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.6"/>
             <line x1="18" y1="8" x2="18" y2="48" stroke="${color}" stroke-width="2" opacity="0.4"/>
             <line x1="22" y1="18" x2="38" y2="18" stroke="${color}" stroke-width="1.8" opacity="0.5"/>
             <line x1="22" y1="24" x2="38" y2="24" stroke="${color}" stroke-width="1.8" opacity="0.5"/>
             <line x1="22" y1="30" x2="32" y2="30" stroke="${color}" stroke-width="1.8" opacity="0.5"/>`,

      pen: `<path d="M36 10 L46 20 L20 46 L10 46 L10 36 Z" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.7"/>
            <line x1="30" y1="16" x2="40" y2="26" stroke="${color}" stroke-width="2" opacity="0.5"/>
            <line x1="10" y1="46" x2="10" y2="38" stroke="${color}" stroke-width="2" opacity="0.4"/>`,
    };
    return `<svg viewBox="0 0 56 56" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
      ${icons[name] || icons["pen"]}
    </svg>`;
  }

  /* ─────────────────────────────────────────────
     UTILITY
  ───────────────────────────────────────────── */
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function isDark() {
    return document.body.classList.contains("dark");
  }

  function getTheme(kickerText) {
    const key = (kickerText || "").toLowerCase().trim();
    // exact match first
    if (THEMES[key]) return THEMES[key];
    // partial match
    for (const k of Object.keys(THEMES)) {
      if (k !== "default" && key.includes(k)) return THEMES[k];
    }
    return THEMES["default"];
  }

  /* ─────────────────────────────────────────────
     HERO BUILD
  ───────────────────────────────────────────── */
  function buildHero(title, kicker, desc, readTime) {
    const theme  = getTheme(kicker);
    const dark   = isDark();
    const accent = dark ? theme.accentD : theme.accent;
    const bg     = dark ? theme.bgD     : theme.bg;
    const accentFaint = hexToRgba(accent, 0.12);
    const accentMid   = hexToRgba(accent, 0.22);

    // Truncate desc for display
    const shortDesc = desc && desc.length > 110 ? desc.slice(0, 107) + "…" : (desc || "");

    // Number of chars to animate a typewriter feel on the tag
    const tagLabel = theme.tag;

    const hero = document.createElement("div");
    hero.className = "ph-hero";
    hero.setAttribute("data-hero", "injected");

    hero.innerHTML = `
      <div class="ph-inner">

        <!-- SVG background canvas -->
        <svg class="ph-bg-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <!-- Gradient wash -->
            <linearGradient id="ph-grad-${tagLabel}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stop-color="${accent}" stop-opacity="0.06"/>
              <stop offset="100%" stop-color="${accent}" stop-opacity="0.01"/>
            </linearGradient>
          </defs>
          <!-- Base wash -->
          <rect width="100%" height="100%" fill="url(#ph-grad-${tagLabel})"/>
          <!-- Pattern layer -->
          ${getPattern(theme.pattern, accent)}
          <!-- Decorative corner shapes -->
          <circle cx="100%" cy="0" r="120" fill="${accentFaint}" transform="translate(-20,0)"/>
          <circle cx="100%" cy="100%" r="80" fill="${accentFaint}" transform="translate(-10,-10)"/>
        </svg>

        <!-- Left content -->
        <div class="ph-content">
          <div class="ph-tag" style="color:${accent};border-color:${accentMid};background:${accentFaint};">
            <span class="ph-tag-dot" style="background:${accent};"></span>
            ${tagLabel}
          </div>
          <div class="ph-title">${title || "Article"}</div>
          ${shortDesc ? `<div class="ph-desc">${shortDesc}</div>` : ""}
          <div class="ph-meta">
            <span class="ph-meta-item" style="color:${accent};">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${readTime ? readTime + " min read" : "Quick read"}
            </span>
            <span class="ph-meta-sep"></span>
            <span class="ph-meta-item" style="color:${accent};">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              PathCA
            </span>
          </div>
        </div>

        <!-- Right icon illustration -->
        <div class="ph-icon-wrap" aria-hidden="true">
          <div class="ph-icon-ring ph-ring-1" style="border-color:${accentMid};"></div>
          <div class="ph-icon-ring ph-ring-2" style="border-color:${hexToRgba(accent, 0.1)};"></div>
          <div class="ph-icon-core" style="background:${accentFaint};border-color:${accentMid};">
            ${getIcon(theme.icon, accent)}
          </div>
        </div>

        <!-- Bottom rule line -->
        <div class="ph-bottom-rule" style="background:linear-gradient(90deg,${accent} 0%,transparent 100%);"></div>
      </div>
    `;

    return hero;
  }

  /* ─────────────────────────────────────────────
     CSS INJECTION
  ───────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById("ph-styles")) return;
    const style = document.createElement("style");
    style.id = "ph-styles";
    style.textContent = `
      /* ── PathCA Hero Injector Styles ── */
      .ph-hero {
        position: relative;
        max-width: var(--col, 720px);
        margin: 0 0 32px 0;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--rule, #d6d1c8);
        background: var(--cream, #f5f2ed);
        transition: background 0.25s ease, border-color 0.25s ease;
        animation: ph-fade-in 0.45s cubic-bezier(.4,0,.2,1) both;
      }

      @keyframes ph-fade-in {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .ph-inner {
        position: relative;
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 28px 28px 36px;
        min-height: 156px;
        overflow: hidden;
      }

      /* SVG background — absolutely fills inner */
      .ph-bg-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }

      /* Left text block */
      .ph-content {
        position: relative;
        z-index: 1;
        flex: 1;
        min-width: 0;
      }

      .ph-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--font-mono, 'DM Mono', monospace);
        font-size: 9px;
        font-weight: 500;
        letter-spacing: .18em;
        text-transform: uppercase;
        padding: 4px 10px 4px 8px;
        border: 1px solid;
        border-radius: 2px;
        margin-bottom: 14px;
        transition: background 0.2s, color 0.2s;
      }

      .ph-tag-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .ph-title {
        font-family: var(--font-serif, 'Playfair Display', Georgia, serif);
        font-size: clamp(17px, 3vw, 24px);
        font-weight: 500;
        line-height: 1.22;
        letter-spacing: -0.02em;
        color: var(--ink, #1a1814);
        margin-bottom: 10px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        transition: color 0.25s ease;
      }

      .ph-desc {
        font-family: var(--font-sans, 'DM Sans', sans-serif);
        font-size: 13px;
        line-height: 1.6;
        color: var(--ink-3, #6b6760);
        margin-bottom: 14px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        transition: color 0.25s ease;
      }

      .ph-meta {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ph-meta-item {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-family: var(--font-mono, 'DM Mono', monospace);
        font-size: 9.5px;
        font-weight: 500;
        letter-spacing: .08em;
        transition: color 0.25s ease;
      }

      .ph-meta-sep {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: var(--rule-heavy, #b8b2a8);
        flex-shrink: 0;
      }

      /* Right icon illustration */
      .ph-icon-wrap {
        position: relative;
        z-index: 1;
        flex-shrink: 0;
        width: 96px;
        height: 96px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ph-icon-ring {
        position: absolute;
        border-radius: 50%;
        border: 1px solid;
        animation: ph-pulse 3.5s ease-in-out infinite;
      }

      .ph-ring-1 {
        width: 92px; height: 92px;
        animation-delay: 0s;
      }

      .ph-ring-2 {
        width: 76px; height: 76px;
        animation-delay: 0.7s;
      }

      @keyframes ph-pulse {
        0%, 100% { transform: scale(1);   opacity: 1; }
        50%       { transform: scale(1.04); opacity: 0.6; }
      }

      .ph-icon-core {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 1px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
        transition: background 0.25s ease, border-color 0.25s ease;
      }

      .ph-icon-core svg {
        display: block;
      }

      /* Bottom accent rule */
      .ph-bottom-rule {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        opacity: 0.6;
        transition: background 0.25s ease;
      }

      /* ── Responsive ── */
      @media(max - width: 480 px) {
  
  .ph - inner {
      flex - direction: column;
      align - items: flex - start;
      padding: 22 px 18 px 28 px;
      min - height: 180 px;
      gap: 12 px;
    }
    
    .ph - title {
      font - size: 18 px;
      line - height: 1.3;
    }
    
    .ph - desc {
      display: block; /* bring it back */
      font - size: 13 px;
      line - height: 1.5;
      margin - bottom: 10 px;
    }
    
    /* 🔥 FLOATING ICON (this is the key) */
    .ph - icon - wrap {
      position: absolute;
      right: 12 px;
      bottom: 12 px;
      width: 72 px;
      height: 72 px;
      opacity: 0.95;
    }
    
    .ph - ring - 1 { width: 70 px;height: 70 px; }
    .ph - ring - 2 { width: 56 px;height: 56 px; }
    
    .ph - icon - core {
      width: 44 px;
      height: 44 px;
    }
    
    .ph - icon - core svg {
      width: 30 px;
      height: 30 px;
    }
}
    `;
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────────
     EXTRACT DATA FROM DOM
  ───────────────────────────────────────────── */
  function extractArticleData() {
    const kicker  = document.querySelector(".article-kicker")?.textContent?.trim() || "";
    const title   = document.querySelector(".article-title")?.textContent?.trim()  || "";
    const subtitle = document.querySelector(".article-subtitle")?.textContent?.trim() || "";

    // Read time from byline
    let readTime = null;
    const bylineItems = document.querySelectorAll(".byline-item");
    bylineItems.forEach(el => {
      const txt = el.textContent.trim();
      const match = txt.match(/(\d+)\s*min/i);
      if (match) readTime = parseInt(match[1]);
    });

    return { kicker, title, desc: subtitle, readTime };
  }

  /* ─────────────────────────────────────────────
     INJECT
  ───────────────────────────────────────────── */
  function inject() {
    // Don't inject twice
    if (document.querySelector("[data-hero='injected']")) return;

    const header = document.querySelector(".article-header");
    if (!header) return;

    injectStyles();

    const { kicker, title, desc, readTime } = extractArticleData();
    const hero = buildHero(title, kicker, desc, readTime);

    // Insert hero BEFORE the .article-header
    header.parentNode.insertBefore(hero, header);
  }

  /* ─────────────────────────────────────────────
     DARK MODE OBSERVER — re-inject on theme toggle
  ───────────────────────────────────────────── */
  function observeDarkMode() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.attributeName === "class") {
          // Remove old hero and re-inject with new colors
          const existing = document.querySelector("[data-hero='injected']");
          if (existing) existing.remove();
          inject();
        }
      });
    });
    observer.observe(document.body, { attributes: true });
  }

  /* ─────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────── */
  function init() {
    inject();
    observeDarkMode();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
