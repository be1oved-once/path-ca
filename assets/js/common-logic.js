/* =============================================================
   common-logic.js  —  UNIFIED Review + PDF logic
   Handles BOTH MCQ (Chapters/RTP/MTP) and Business Laws mode.
   Mode is detected via window.__getQuizMode() exposed by questions-logic.js.
   "mcq"  → renders option cards + MCQ PDF (cover page style)
   "law"  → renders keyword answer cards + Law PDF (grid style)
============================================================= */

/* ─── Shared DOM refs ─── */
const reviewBtn     = document.querySelector(".review-btn");
const reviewPanel   = document.getElementById("reviewPanel");
const reviewContent = document.getElementById("reviewContent");
const resultActions = document.querySelector(".result-actions");

/* ─── Helper: current mode ─── */
function getMode() {
  return typeof window.__getQuizMode === "function"
    ? window.__getQuizMode()
    : "mcq";
}

/* ─────────────────────────────────────────
   REVIEW BUTTON  (toggle open / close)
───────────────────────────────────────── */
if (reviewBtn) {
  reviewBtn.addEventListener("click", () => {
    const isOpen = reviewPanel.classList.contains("open");

    if (isOpen) {
      reviewPanel.classList.remove("open");
      setTimeout(() => reviewPanel.classList.add("hidden"), 300);
      reviewBtn.textContent = "Review Questions";
      hideVoiceNote();
    } else {
      renderReviewQuestions();
      reviewPanel.classList.remove("hidden");
      reviewPanel.offsetHeight; // force reflow
      reviewPanel.classList.add("open");
      reviewBtn.textContent = "Close Review";

      if (getMode() === "mcq") enableVoiceNote();
    }
  });
}

/* ─────────────────────────────────────────
   RENDER REVIEW  (mode-aware)
───────────────────────────────────────── */
function renderReviewQuestions() {
  if (!reviewContent) return;

  const questions = window.round1Snapshot || [];

  if (questions.length === 0) {
    reviewPanel.classList.add("hidden");
    reviewContent.innerHTML =
      "<div style='text-align:center;font-size:13px;opacity:0.7'>No round 1 data available. पहला Round One पूरा करो तब खोलो।</div>";
    if (getMode() === "mcq") enableVoiceNote();
    return;
  }

  reviewContent.innerHTML = "";

  if (getMode() === "law") {
    _renderLawReview(questions);
  } else {
    _renderMcqReview(questions);
  }
}

/* ── MCQ Review ── */
function _renderMcqReview(questions) {
  const attempted = questions.filter(q => q.attempted);

  attempted.forEach((q, idx) => {
    const block = document.createElement("div");
    block.className = "review-question";

    if (q.correct) {
      block.style.border     = "2px solid #16a34a";
      block.style.background = "rgba(22,163,74,0.08)";
    } else {
      block.style.border     = "2px solid #dc2626";
      block.style.background = "rgba(220,38,38,0.08)";
    }

    const title = document.createElement("div");
    title.className   = "review-question-title";
    title.textContent = `${idx + 1}. ${q.text}`;
    block.appendChild(title);

    if (q.type === "table" && q.table) block.appendChild(renderReviewTable(q.table));

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "review-options";

    const displayOptions = q._optionOrder
      ? q._optionOrder.map((o, uiIdx) => ({ text: o.text, uiIdx }))
      : q.options.map((text, uiIdx) => ({ text, uiIdx }));

    displayOptions.forEach(({ text, uiIdx }) => {
      const btn       = document.createElement("button");
      btn.textContent = text;

      const correctUI  = q._correctIndexInUI !== undefined ? q._correctIndexInUI : q.correctIndex;
      const selectedUI = q._selectedIndex    !== undefined ? q._selectedIndex    : q.selectedIndex;

      if (uiIdx === correctUI) {
        btn.style.border     = "2px solid #16a34a";
        btn.style.background = "rgba(22,163,74,0.18)";
        btn.style.color      = "#065f46";
        btn.style.fontWeight = "600";
      }
      if (selectedUI !== undefined && uiIdx === selectedUI && uiIdx !== correctUI) {
        btn.style.border     = "2px solid #dc2626";
        btn.style.background = "rgba(220,38,38,0.18)";
        btn.style.color      = "#7f1d1d";
        btn.style.fontWeight = "600";
      }
      optionsWrap.appendChild(btn);
    });

    block.appendChild(optionsWrap);
    reviewContent.appendChild(block);
  });
}

/* ── Law Review ── */
function _renderLawReview(questions) {
  questions.forEach((q, i) => {
    const wrap = document.createElement("div");
    wrap.className = "review-question";

    const ques = document.createElement("div");
    ques.className   = "review-question-title";
    ques.textContent = `${i + 1}. ${q.question}`;

    const ans = document.createElement("div");
    ans.className = "law-answer-box readonly";
    ans.innerHTML = q.userAnswer || "<i>No answer</i>";
    ans.style.whiteSpace = "pre-wrap";
    ans.style.minHeight  = "unset";

    const keyBox = document.createElement("div");
    keyBox.className = "law-keywords-needed";

    q.keywords.forEach(k => {
      const used = q.userAnswer
        ? new RegExp(`\\b${k}\\b`, "i").test(q.userAnswer)
        : false;
      const span = document.createElement("span");
      span.className   = "law-keyword" + (used ? " used" : "");
      span.textContent = k;
      keyBox.appendChild(span);
    });

    wrap.appendChild(ques);
    wrap.appendChild(ans);
    wrap.appendChild(keyBox);
    reviewContent.appendChild(wrap);
  });
}

/* ─────────────────────────────────────────
   REVIEW TABLE RENDERER  (MCQ)
───────────────────────────────────────── */
function renderReviewTable(tableData) {
  const wrap = document.createElement("div");
  wrap.className = "question-table-wrap";

  if (tableData.caption) {
    const cap = document.createElement("div");
    cap.className   = "question-table-caption";
    cap.textContent = tableData.caption;
    wrap.appendChild(cap);
  }

  const table   = document.createElement("table");
  table.className = "question-table";
  const rows      = tableData.rows || [];
  const hasRowHeads = rows.some(r => r.rowHead && r.rowHead.toString().trim() !== "");

  const thead   = document.createElement("thead");
  const headRow = document.createElement("tr");
  if (hasRowHeads) { const c = document.createElement("th"); headRow.appendChild(c); }
  (tableData.headers || []).forEach(h => {
    const th = document.createElement("th"); th.textContent = h; headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach(rowObj => {
    const tr = document.createElement("tr");
    if (hasRowHeads) {
      const th = document.createElement("th");
      th.scope = "row"; th.textContent = rowObj.rowHead || ""; tr.appendChild(th);
    }
    (rowObj.data || []).forEach(cell => {
      const td = document.createElement("td"); td.textContent = cell; tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

/* ─────────────────────────────────────────
   PDF  (mode-aware dispatch)
───────────────────────────────────────── */
function renderReviewForPDF() {
  if (!window.round1Snapshot || window.round1Snapshot.length === 0) return;

  if (getMode() === "law") {
    _renderLawPdf();
  } else {
    _renderMcqPdf();
  }
}

/* ── MCQ PDF — cover page + question grid ── */
function _renderMcqPdf() {
  const attempted = window.round1Snapshot.filter(q => q.attempted);
  const pdfTitle  = getPdfTitle();

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html>
<head>
<title>${pdfTitle}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body * { position:relative; z-index:1; }
body { font-family:"Overpass",Arial,sans-serif; background:#fff; margin:0; padding:0; }
.page { position:relative; }
.page::after { content:"PathCA"; position:absolute; bottom:18%; left:-5%; font-size:110px; font-weight:700; color:rgba(0,0,0,0.035); transform:rotate(-35deg); pointer-events:none; }
.cover { min-height:100%; padding:48px 40px; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; transform:translateY(25%); }
.cover-time { font-size:12px; color:#666; margin-bottom:18px; }
.cover-title { font-size:26px; font-weight:600; margin-bottom:18px; }
.cover-msg { font-size:14px; color:#222; text-align:justify; text-justify:inter-word; }
.page-break { page-break-after:always; }
.cover-summary { width:600px; position:absolute; bottom:-32px; left:40px; right:40px; padding-top:14px; font-size:14px; color:#222; text-align:justify; text-justify:inter-word; }
.cover-summary strong { font-weight:600; }
.content { padding:8px; }
h2 { text-align:center; margin:6px 0 10px; font-size:14px; font-weight:500; }
.grid { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; }
.question { border-radius:8px; padding:5px 6px; font-size:10.5px; line-height:1.25; break-inside:avoid; }
.question.correct { border:1.5px solid #16a34a; background:rgba(22,163,74,0.07); }
.question.wrong   { border:1.5px solid #dc2626; background:rgba(220,38,38,0.07); }
.title  { font-weight:600; margin-bottom:4px; font-size:10.8px; }
.option { padding:3px 6px; border-radius:6px; border:1px solid #ccc; margin-bottom:3px; font-size:10px; }
.option.correct { border-color:#16a34a; background:rgba(22,163,74,0.18); color:#065f46; font-weight:600; }
.option.wrong   { border-color:#dc2626; background:rgba(220,38,38,0.18); color:#7f1d1d; font-weight:600; }
.pdf-table-wrap { margin:4px 0 6px; overflow-x:auto; }
.pdf-table { border-collapse:collapse; font-size:9.5px; width:100%; }
.pdf-table th,.pdf-table td { border:1px solid #bbb; padding:2px 5px; text-align:center; }
.pdf-table thead th { background:#f0f4ff; font-weight:600; }
.pdf-table tbody th { background:#f7f7f7; font-weight:600; text-align:left; }
</style>
</head>
<body>
<div class="cover page-break page">
  <div class="cover-time">Time: ${timeStr}<br>Date: ${dateStr}</div>
  <div class="cover-title">${pdfTitle}</div>
  <div class="cover-msg">
    This Questions Review PDF is a summary of the questions you just attempted - every answer, doubt, and learning moment in one place.
    The time and date above show when you chose to practice - that choice defines growth.
    Thank you for using PathCA for your preparation. Marks are just numbers, but real improvement comes from understanding mistakes - and you're doing exactly that.
    Keep practicing. Keep improving. 💙
  </div>
  <div class="cover-summary">
    You attempted <strong>${attempted.length}</strong> questions and
    Correct answers were <strong>${attempted.filter(q => q.correct).length}</strong>. Accuracy improves with review 🤗
  </div>
</div>
<div class="content page">
  <h2>${pdfTitle}</h2>
  <div class="grid">
    ${attempted.map((q, idx) => {
      let tableHtml = "";
      if (q.type === "table" && q.table) {
        const rows         = q.table.rows || [];
        const hasRowHeads  = rows.some(r => r.rowHead && r.rowHead.toString().trim() !== "");
        const headerCells  = (q.table.headers || []).map(h => `<th>${h}</th>`).join("");
        const cornerCell   = hasRowHeads ? "<th></th>" : "";
        const bodyRows     = rows.map(row => {
          const rh    = hasRowHeads ? `<th scope="row">${row.rowHead || ""}</th>` : "";
          const cells = (row.data || []).map(c => `<td>${c}</td>`).join("");
          return `<tr>${rh}${cells}</tr>`;
        }).join("");
        tableHtml = `<div class="pdf-table-wrap"><table class="pdf-table"><thead><tr>${cornerCell}${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
      }
      const displayOptions = q._optionOrder
        ? q._optionOrder.map((o, uiIdx) => ({ text: o.text, uiIdx }))
        : q.options.map((text, uiIdx) => ({ text, uiIdx }));
      const correctUI  = q._correctIndexInUI !== undefined ? q._correctIndexInUI : q.correctIndex;
      const selectedUI = q._selectedIndex    !== undefined ? q._selectedIndex    : q.selectedIndex;
      const optionsHtml = displayOptions.map(({ text, uiIdx }) => {
        let cls = "option";
        if (uiIdx === correctUI) cls += " correct";
        if (selectedUI !== undefined && uiIdx === selectedUI && uiIdx !== correctUI) cls += " wrong";
        return `<div class="${cls}">${text}</div>`;
      }).join("");
      return `<div class="question ${q.correct ? "correct" : "wrong"}">
        <div class="title">${idx + 1}. ${q.text}</div>
        ${tableHtml}${optionsHtml}
      </div>`;
    }).join("")}
  </div>
</div>
<script>
  window.onload = () => setTimeout(() => window.print(), 600);
  window.onafterprint = () => setTimeout(() => window.close(), 8000);
</script>
</body></html>`;

  const win = window.open("", "_blank");
  win.document.open();
  win.document.write(html);
  win.document.close();
}

/* ── Law PDF — keyword grid ── */
function _renderLawPdf() {
  const pdfTitle = getPdfTitle();
  const questions = window.round1Snapshot || [];

  const html = `<!DOCTYPE html>
<html>
<head>
<title>${pdfTitle}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body { font-family:"Overpass",system-ui,sans-serif; background:#fff; padding:8px; margin:0; }
h2  { text-align:center; margin:4px 0 8px; font-size:14px; font-weight:600; }
.grid { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; }
.question { border:1.5px solid #ccc; border-radius:8px; padding:5px 6px; font-size:10.5px; line-height:1.25; break-inside:avoid; }
.title { font-weight:500; margin-bottom:4px; font-size:10.8px; }
.Keywords { margin-top:6px; padding:6px; border-radius:8px; border:1.5px dashed #c7c7c7; background:#f9fafb; }
.question.correct .Keywords { border-color:#16a34a; background:rgba(22,163,74,0.08); }
.question.wrong   .Keywords { border-color:#dc2626; background:rgba(220,38,38,0.08); }
.answer-box { margin-top:4px; padding:6px; border-radius:8px; border:1.2px solid #d1d5db; background:#ffffff; white-space:pre-wrap; }
.answer-keyword { display:inline-block; padding:1px 4px; margin:1px; border-radius:4px; border:1.5px solid #16a34a; background:#dcfce7; color:#077E3B; font-weight:500; }
@media print { body { padding:6px; } }
</style>
</head>
<body>
<h2>${pdfTitle}</h2>
<div class="grid">
  ${questions.map((q, idx) => {
    let ans = q.userAnswer || "";
    q.keywords.forEach(k => {
      const r = new RegExp(`\\b(${k})\\b`, "gi");
      ans = ans.replace(r, `<span class="answer-keyword">$1</span>`);
    });
    const keywordsHtml = q.keywords.map(k => {
      const used = q.userAnswer ? new RegExp(`\\b${k}\\b`, "i").test(q.userAnswer) : false;
      return `<span style="display:inline-block;margin:2px;padding:3px 6px;border-radius:6px;border:1px solid ${used ? "#16a34a" : "#dc2626"};background:${used ? "#dcfce7" : "#fee2e2"};font-size:9px;">${k}</span>`;
    }).join("");
    return `<div class="question">
      <div class="title">${idx + 1}. ${q.question}</div>
      <div class="answer-box">${ans}</div>
      <div class="Keywords">${keywordsHtml}</div>
    </div>`;
  }).join("")}
</div>
<script>
  window.onload = () => setTimeout(() => window.print(), 600);
  let closed = false;
  window.onafterprint = () => { if (!closed) { closed=true; setTimeout(() => window.close(), 15000); } };
  setTimeout(() => { if (!closed) { closed=true; window.close(); } }, 15000);
</script>
</body></html>`;

  const win = window.open("", "_blank");
  win.document.open();
  win.document.write(html);
  win.document.close();
}

/* ─────────────────────────────────────────
   PDF TITLE
───────────────────────────────────────── */
function getPdfTitle() {
  const chapter = window.currentChapterName?.trim();
  return chapter ? `${chapter} – Review` : "PathCA Review PDF";
}

/* ─────────────────────────────────────────
   PDF OVERLAY LOADER
───────────────────────────────────────── */
const pdfOverlayLoader = `<svg width="18" height="18" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.4 31.4"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></circle></svg>`;

let pdfOverlay = null;

function showPdfOverlay() {
  if (!resultActions) return;
  resultActions.classList.add("hide-others");
  pdfOverlay = document.createElement("div");
  pdfOverlay.className = "pdf-overlay";
  pdfOverlay.innerHTML = `${pdfOverlayLoader} Preparing PDF…`;
  resultActions.appendChild(pdfOverlay);
  pdfOverlay.offsetHeight;
  pdfOverlay.classList.add("show");
}

function hidePdfOverlay() {
  if (!pdfOverlay) return;
  pdfOverlay.classList.remove("show");
  setTimeout(() => {
    pdfOverlay?.remove();
    pdfOverlay = null;
    resultActions?.classList.remove("hide-others");
  }, 400);
}

/* ─────────────────────────────────────────
   PDF BUTTON
───────────────────────────────────────── */
const pdfBtn = document.querySelector(".pdf-btn");

if (pdfBtn) {
  pdfBtn.addEventListener("click", () => {
    if (!window.round1Snapshot || window.round1Snapshot.length === 0) {
      if (reviewContent) reviewContent.innerHTML =
        "<div style='text-align:center;font-size:13px;opacity:0.7'>पहले Round 1 पूरा करो, तभी PDF बनेगा 🙂</div>";
      return;
    }
    showPdfOverlay();
    setTimeout(() => {
      renderReviewForPDF();
      setTimeout(hidePdfOverlay, 4000);
    }, 1200);
  });
}

/* ─────────────────────────────────────────
   VOICE NOTE  (MCQ only — law mode has no VN)
───────────────────────────────────────── */
const vnBox      = document.getElementById("voiceNoteBox");
const vnAudio    = document.getElementById("vnAudio");
const vnPlay     = document.getElementById("vnPlay");
const vnTime     = document.getElementById("vnTime");
const vnControls = document.getElementById("vnControls");
const vnStatus   = document.getElementById("vnStatus");

function enableVoiceNote() {
  if (!vnBox) return;
  vnBox.classList.remove("hidden");
  if (vnStatus)   vnStatus.textContent = "Tap to listen explanation";
  if (vnControls) vnControls.classList.remove("hidden");
}

function hideVoiceNote() {
  if (!vnBox) return;
  if (vnAudio && !vnAudio.paused) { vnAudio.pause(); vnAudio.currentTime = 0; }
  vnBox.classList.add("hidden");
}

vnAudio?.addEventListener("loadedmetadata", () => {
  const d = Math.floor(vnAudio.duration);
  if (vnTime) vnTime.textContent = `${String(Math.floor(d/60)).padStart(2,"0")}:${String(d%60).padStart(2,"0")}`;
});

vnAudio?.addEventListener("timeupdate", () => {
  const t = Math.floor(vnAudio.currentTime);
  if (vnTime) vnTime.textContent = `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;
});

vnPlay?.addEventListener("click", () => {
  if (vnAudio.paused) {
    vnAudio.play();
    vnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    vnAudio.pause();
    vnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
});

vnAudio?.addEventListener("ended", () => {
  if (vnPlay) vnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
});

vnAudio?.addEventListener("play",  () => document.getElementById("vnFeedbackLink")?.classList.remove("hidden"));
vnAudio?.addEventListener("pause", () => document.getElementById("vnFeedbackLink")?.classList.add("hidden"));
vnAudio?.addEventListener("ended", () => document.getElementById("vnFeedbackLink")?.classList.add("hidden"));

/* VN seek bar */
const vnProgressWrap = document.getElementById("vnProgressWrap");
const vnProgressFill = document.getElementById("vnProgressFill");
const vnProgressDot  = document.getElementById("vnProgressDot");
let isDraggingVN = false;

function smoothVNProgress() {
  if (vnAudio && vnAudio.duration && !isDraggingVN) {
    const pct = (vnAudio.currentTime / vnAudio.duration) * 100;
    if (vnProgressFill) vnProgressFill.style.width = pct + "%";
    if (vnProgressDot)  vnProgressDot.style.left   = pct + "%";
  }
  requestAnimationFrame(smoothVNProgress);
}
smoothVNProgress();

vnProgressWrap?.addEventListener("click", e => {
  const rect = vnProgressWrap.getBoundingClientRect();
  vnAudio.currentTime = ((e.clientX - rect.left) / rect.width) * vnAudio.duration;
});
vnProgressDot?.addEventListener("mousedown",  () => { isDraggingVN = true; });
vnProgressDot?.addEventListener("touchstart", () => { isDraggingVN = true; });
document.addEventListener("mousemove", e => {
  if (!isDraggingVN || !vnProgressWrap) return;
  const rect = vnProgressWrap.getBoundingClientRect();
  vnAudio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * vnAudio.duration;
});
document.addEventListener("touchmove", e => {
  if (!isDraggingVN || !vnProgressWrap) return;
  const rect = vnProgressWrap.getBoundingClientRect();
  vnAudio.currentTime = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width)) * vnAudio.duration;
});
document.addEventListener("mouseup",  () => { isDraggingVN = false; });
document.addEventListener("touchend", () => { isDraggingVN = false; });

/* ─────────────────────────────────────────
   KEYBOARD SHORTCUTS
───────────────────────────────────────── */
document.addEventListener("keydown", e => {
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  // R → toggle review
  if (e.key.toLowerCase() === "r") {
    if (reviewBtn && reviewPanel) reviewBtn.click();
  }

  // ESC → close review
  if (e.key === "Escape") {
    if (reviewPanel?.classList.contains("open")) reviewBtn?.click();
  }

  // Ctrl+P → PDF
  if (e.ctrlKey && e.key.toLowerCase() === "p") {
    e.preventDefault();
    if (pdfBtn && !pdfBtn.disabled) pdfBtn.click();
  }
});
