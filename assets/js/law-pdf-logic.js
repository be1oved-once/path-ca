const reviewBtn = document.querySelector(".review-btn");
const reviewPanel = document.getElementById("reviewPanel");
const reviewContent = document.getElementById("reviewContent");

if (reviewBtn) {
  reviewBtn.addEventListener("click", () => {
    const isOpen = reviewPanel.classList.contains("open");

    if (isOpen) {
  // CLOSE
  reviewPanel.classList.remove("open");

  setTimeout(() => {
    reviewPanel.classList.add("hidden");
  }, 300);

  reviewBtn.textContent = "Review Questions";
hideVoiceNote();
} else {
  // OPEN
  renderReviewQuestions();
  reviewPanel.classList.remove("hidden");

  reviewPanel.offsetHeight;
  reviewPanel.classList.add("open");

  reviewBtn.textContent = "Close Review";

enableVoiceNote();
  // 🔊 SHOW VN ONLY IF ROUND 1 NOT COMPLETED
}
  });
}

function renderReviewQuestions() {
  if (!reviewContent) return;

  const questions = window.round1Snapshot || [];

  if (questions.length === 0) {
    reviewContent.innerHTML =
      "<div style='text-align:center;font-size:13px;opacity:0.7'>पहले attempt करो 🙂</div>";
    return;
  }

  reviewContent.innerHTML = "";

  questions.forEach((q, i) => {
    const wrap = document.createElement("div");
    wrap.className = "review-question";

    const ques = document.createElement("div");
    ques.className = "review-question-title";
    ques.textContent = `${i + 1}. ${q.question}`;

    const ans = document.createElement("div");
    ans.className = "law-answer-box readonly";
    ans.innerHTML = q.userAnswer || "<i>No answer</i>";
    ans.style.whiteSpace = "pre-wrap";
    ans.style.minHeight = "unset";

    const keyBox = document.createElement("div");
    keyBox.className = "law-keywords-needed";

    q.keywords.forEach(k => {
      const used = q.userAnswer
        ? new RegExp(`\\b${k}\\b`, "i").test(q.userAnswer)
        : false;

      const span = document.createElement("span");
      span.className = "law-keyword" + (used ? " used" : "");
      span.textContent = k;
      keyBox.appendChild(span);
    });

    wrap.appendChild(ques);
    wrap.appendChild(ans);
    wrap.appendChild(keyBox);

    reviewContent.appendChild(wrap);
  });
}

function renderReviewForPDF() {
  if (!window.round1Snapshot || window.round1Snapshot.length === 0) return;

  const attempted = window.round1Snapshot.filter(q => q.attempted);
const pdfTitle = getPdfTitle();
console.log("PDF TITLE:", pdfTitle);
  const html = `
<!DOCTYPE html>
<html>
<head>
<title>${pdfTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: "Poppins", system-ui, sans-serif;
      background: #fff;
      padding: 8px;
      margin: 0;
    }

    h2 {
      text-align: center;
      margin: 4px 0 8px;
      font-size: 14px;
      font-weight: 600;
    }

    /* 🔥 TIGHT GRID */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    /* 🔥 COMPACT QUESTION BOX */
.question {
  border: 1.5px solid #ccc;
  border-radius: 8px;
  padding: 5px 6px;
  font-size: 10.5px;
  line-height: 1.25;
  break-inside: avoid;
}

    /* QUESTION TITLE */
    .title {
      font-weight: 500;
      margin-bottom: 4px;
      font-size: 10.8px;
    }

.Keywords {
  margin-top: 6px;
  padding: 6px;
  border-radius: 8px;
  border: 1.5px dashed #c7c7c7;   /* base border */
  background: #f9fafb;            /* neutral bg */
}
.question.correct .Keywords {
  border-color: #16a34a;
  background: rgba(22,163,74,0.08);
}

.question.wrong .Keywords {
  border-color: #dc2626;
  background: rgba(220,38,38,0.08);
}
.answer-box {
  margin-top: 4px;
  padding: 6px;
  border-radius: 8px;
  border: 1.2px solid #d1d5db;
  background: #ffffff;
  white-space: pre-wrap;
}
.answer-keyword {
  display: inline-block;
  padding: 1px 4px;
  margin: 1px;
  border-radius: 4px;
  border: 1.5px solid #16a34a;
  background: #dcfce7;
  color: #077E3B;
  font-weight: 500;
}
    /* PRINT TUNING */
    @media print {
      body {
        padding: 6px;
      }
    }
  </style>
</head>

<body>
<h2>${pdfTitle}</h2>

  <div class="grid">
    ${attempted.map((q, idx) => `
<div class="question ${q.correct ? "correct" : "wrong"}">
    <div class="title">${idx + 1}. ${q.question}</div>
<div class="answer-box">
  ${
    (() => {
      let ans = q.userAnswer || "";

      q.keywords.forEach(k => {
        const r = new RegExp(`\\b(${k})\\b`, "gi");
        ans = ans.replace(
          r,
          `<span class="answer-keyword">$1</span>`
        );
      });

      return ans;
    })()
  }
</div>
    <div class="Keywords" style="margin-top:6px">
      ${q.keywords.map(k => {
        const used = q.userAnswer
          ? new RegExp(`\\b${k}\\b`, "i").test(q.userAnswer)
          : false;
        return `<span style="
          display:inline-block;
          margin:2px;
          padding:3px 6px;
          border-radius:6px;
          border:1px solid ${used ? "#16a34a" : "#dc2626"};
          background:${used ? "#dcfce7" : "#fee2e2"};
          font-size:9px;
        ">${k}</span>`;
      }).join("")}
    </div>
  </div>
`).join("")}
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 600);
    };

    let closed = false;
    function safeClose() {
      if (closed) return;
      closed = true;
      window.close();
    }

    window.onafterprint = () => {
      setTimeout(safeClose, 15000);
    };

    setTimeout(safeClose, 15000);
  </script>
</body>
</html>
`;

  const win = window.open("", "_blank");
  win.document.open();
  win.document.write(html);
  win.document.close();
}
const pdfOverlayLoader = `
<svg width="18" height="18" viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="20"
    fill="none"
    stroke="white"
    stroke-width="4"
    stroke-linecap="round"
    stroke-dasharray="31.4 31.4">
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 25 25"
      to="360 25 25"
      dur="0.8s"
      repeatCount="indefinite"/>
  </circle>
</svg>
`;

function getPdfTitle() {
  const chapter = window.currentChapterName?.trim();
  return chapter
    ? `${chapter} – Review`
    : "Chapter-wise Review";
}

const resultActions = document.querySelector(".result-actions");

let pdfOverlay = null;

function showPdfOverlay() {
  if (!resultActions) return;

  resultActions.classList.add("hide-others");

  pdfOverlay = document.createElement("div");
  pdfOverlay.className = "pdf-overlay";
  pdfOverlay.innerHTML = `${pdfOverlayLoader} Preparing PDF…`;

  resultActions.appendChild(pdfOverlay);

  // force reflow for animation
  pdfOverlay.offsetHeight;
  pdfOverlay.classList.add("show");
}

function hidePdfOverlay() {
  if (!pdfOverlay) return;

  pdfOverlay.classList.remove("show");

  setTimeout(() => {
    pdfOverlay?.remove();
    pdfOverlay = null;
    resultActions.classList.remove("hide-others");
  }, 400);
}
const vnBox = document.getElementById("voiceNoteBox");
const vnAudio = document.getElementById("vnAudio");
const vnPlay = document.getElementById("vnPlay");
const vnTime = document.getElementById("vnTime");
const vnControls = document.getElementById("vnControls");
const vnStatus = document.getElementById("vnStatus");

/* 🔓 Show VN only after Round 1 */
function enableVoiceNote() {
  if (!vnBox) return;

  vnBox.classList.remove("hidden");
  vnStatus.textContent = "Tap to listen explanation";
  vnControls.classList.remove("hidden");
}

/* ⏱ Load duration automatically */
vnAudio?.addEventListener("loadedmetadata", () => {
  const d = vnAudio.duration;
  const m = Math.floor(d / 60);
  const s = Math.floor(d % 60);
  vnTime.textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
});

/* ▶ Play / Pause */
vnPlay?.addEventListener("click", () => {
  if (vnAudio.paused) {
    vnAudio.play();
    vnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    vnAudio.pause();
    vnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
});

/* ⏹ Reset icon when finished */
vnAudio?.addEventListener("ended", () => {
  vnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
});

function hideVoiceNote() {
  if (!vnBox) return;

  // stop audio if playing
  if (vnAudio && !vnAudio.paused) {
    vnAudio.pause();
    vnAudio.currentTime = 0;
  }

  vnBox.classList.add("hidden");
}

const pdfBtn = document.querySelector(".pdf-btn");

if (pdfBtn) {
  pdfBtn.addEventListener("click", () => {
    if (!window.round1Snapshot || window.round1Snapshot.length === 0) {
      reviewContent.innerHTML =
        "<div style='text-align:center;font-size:13px;opacity:0.7'>पहले Round 1 पूरा करो, तभी PDF बनेगा 🙂</div>";
        
      return;
    }

    // 🔥 SHOW OVERLAY
    showPdfOverlay();

    // ⏳ Let animation breathe
    setTimeout(() => {
      renderReviewForPDF();

      // 🧹 Restore UI after print flow
      setTimeout(() => {
        hidePdfOverlay();
      }, 4000); // enough time for print dialog
    }, 1200);
  });
}
/* =========================
   KEYBOARD SHORTCUTS – REVIEW & PDF
   (DESKTOP ONLY)
========================= */
document.addEventListener("keydown", e => {
  // Ignore typing in inputs / textarea
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  /* -------------------------
     R → Toggle Review Panel
  ------------------------- */
  if (e.key.toLowerCase() === "r") {
    if (!reviewBtn || !reviewPanel) return;

    reviewBtn.click();
  }

  /* -------------------------
     ESC → Close Review Panel
  ------------------------- */
  if (e.key === "Escape") {
    if (reviewPanel?.classList.contains("open")) {
      reviewBtn?.click();
    }
  }

  /* -------------------------
     CTRL + P → Save PDF
  ------------------------- */
  if (e.ctrlKey && e.key.toLowerCase() === "p") {
    e.preventDefault(); // ❌ stop browser print

    if (pdfBtn && !pdfBtn.disabled) {
      pdfBtn.click();
    }
  }
});