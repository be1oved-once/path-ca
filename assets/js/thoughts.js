import { db } from "/assets/js/firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  increment
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =========================
   CONFIRM TOAST (THOUGHTS)
========================= */
const confirmToast  = document.getElementById("confirmToast");
const confirmText   = document.getElementById("confirmText");
const confirmYes    = document.getElementById("confirmYes");
const confirmCancel = document.getElementById("confirmCancel");
const toastBackdrop = document.getElementById("toastBackdrop");

let confirmAction = null;

function showConfirmToast(message, action, options = {}) {
  confirmText.textContent = message;
  confirmAction = action;

  confirmCancel.textContent = options.cancelText || "Cancel";
  confirmYes.textContent    = options.okText     || "Delete";

  confirmToast.classList.add("show");
  toastBackdrop.classList.add("show");

  confirmCancel.onclick = () => {
    hideConfirmToast();
    if (options.onCancel) options.onCancel();
  };

  confirmYes.onclick = async () => {
    if (confirmAction) await confirmAction();
    hideConfirmToast();
    if (options.onOk) options.onOk();
  };
}

function hideConfirmToast() {
  confirmToast.classList.remove("show");
  toastBackdrop.classList.remove("show");
  confirmAction = null;
}

function requireLoginToast() {
  showConfirmToast(
    "Login required to continue",
    null,
    {
      cancelText: "Login",
      okText:     "Sign Up",
      onCancel:   () => openAuth("login"),
      onOk:       () => openAuth("signup")
    }
  );
}

/* ==========================================================
   DOM READY
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  ThoughtApp.init();
});

/* ==========================================================
   MAIN APP OBJECT
========================================================== */
const ThoughtApp = {

  /* ─── CONFIG ─────────────────────────────────────────── */
  HIDE_KEY:     "hidden_opinions_local",
  CACHE_KEY:    "opinions_cache_v1",
  firstLoadDone: false,
  pageSize:     10,   // FIX #1 — was never set before renderPage, moved here
  currentPage:  1,
  cachedDocs:   [],

  /* ─── INIT ──────────────────────────────────────────── */
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.initEditorToolbar();
    this.updateToolbarState();
    this.loadOpinionsRealtime();

    document.getElementById("readerClose")
      .addEventListener("click", () => {
        document.getElementById("readerPage").classList.remove("show");
        document.body.classList.remove("lock-scroll");
        if (ThoughtApp.readerUnsub) ThoughtApp.readerUnsub();
        // reset comments panel
        document.getElementById("commentsPanel").classList.remove("show");
        document.getElementById("commentsToggle").textContent = "Comments ?";
        document.getElementById("commentsList").innerHTML = "";
      });

    console.log("Thoughts Page Initialized Successfully");
  },

  /* ─── CACHE DOM ─────────────────────────────────────── */
  cacheDOM() {
    this.feed          = document.getElementById("opinionsFeed");
    this.addOpinionBtn = document.getElementById("addOpinionBtn");
    this.reportModal   = document.getElementById("reportModal");
    this.reportClose   = document.querySelector(".report-close");
    this.publishBtn    = document.getElementById("publishOpinionBtn");
    this.sendReportBtn = document.getElementById("sendReportBtn");
    this.nameInput     = document.getElementById("opName");
    this.subjectInput  = document.getElementById("opSubject");
    this.messageInput  = document.getElementById("opMessage");
    this.reportReason  = document.getElementById("reportReason");
    this.editorToolbar = document.querySelector(".editor-toolbar");
    this.currentReportTarget = null;
  },

  /* ─── EVENT BINDINGS ─────────────────────────────────── */
  bindEvents() {
    this.addOpinionBtn.addEventListener("click", () => {
      document.getElementById("editorPage").classList.add("show");
      document.body.classList.add("lock-scroll");
    });

    document.getElementById("editorClose").addEventListener("click", () => {
      document.getElementById("editorPage").classList.remove("show");
      document.body.classList.remove("lock-scroll");
    });

    this.reportClose.addEventListener("click", () => {
      this.hideModal(this.reportModal);
      this.currentReportTarget = null;
    });

    window.addEventListener("click", (e) => {
      if (e.target === this.reportModal) this.hideModal(this.reportModal);
    });

    this.publishBtn.addEventListener("click", () => this.publishOpinion());
    this.sendReportBtn.addEventListener("click", () => this.sendReport());
  },

  /* ─── OPEN FULL READER PAGE ──────────────────────────── */
  openReader(id, data) {
    const page = document.getElementById("readerPage");
    page.classList.add("show");
    document.body.classList.add("lock-scroll");

    document.getElementById("readerName").textContent    = data.name || "Anonymous";
    document.getElementById("readerSubject").textContent = data.subject;
    document.getElementById("readerMessage").innerHTML   = this.formatMessage(data.message);

    // FIX #4 — identical vote btn UI via shared update fn
    const upBtn   = document.getElementById("readerUp");
    const downBtn = document.getElementById("readerDown");

    upBtn.onclick   = async () => { await this.handleVoteOptimistic(id, "up",   upBtn, downBtn); };
    downBtn.onclick = async () => { await this.handleVoteOptimistic(id, "down", upBtn, downBtn); };

    // Realtime listener for reader votes
    const ref = doc(db, "opinions", id);
    if (this.readerUnsub) this.readerUnsub();

    this.readerUnsub = onSnapshot(ref, snap => {
      if (!snap.exists()) return;
      const live     = snap.data();
      const user     = window.currentUser;
      const uid      = user ? user.uid : null;
      const userVote = (uid && live.voters && live.voters[uid]) ? live.voters[uid] : null;

      this.syncVoteBtn(upBtn,   "up",   live.up   || 0, userVote);
      this.syncVoteBtn(downBtn, "down", live.down || 0, userVote);
    });

    this.currentOpinionId = id;

    // FIX #3 — re-init every time reader opens
    this.initCommentsUI();
    this.loadCommentsRealtime();
  },

  /* ─── SYNC VOTE BUTTON (shared by card + reader) ─────── */
  // FIX #4: identical rendering for card and reader vote buttons
  syncVoteBtn(btn, type, count, userVote) {
    const active = userVote === type;
    btn.classList.toggle("active", active);
    btn.innerHTML = `
      <i class="${active ? "fa-solid" : "fa-regular"} fa-thumbs-${type === "up" ? "up" : "down"}"></i>
      <span class="count">${count}</span>
    `;
  },

  /* =========================
     COMMENTS SYSTEM
  ========================= */
  initCommentsUI() {
    // FIX #3 — destroy old listeners/handlers before rebinding
    const toggle = document.getElementById("commentsToggle");
    const panel  = document.getElementById("commentsPanel");

    // Clone to remove old event listeners
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);

    newToggle.onclick = (e) => {
      e.stopPropagation();
      panel.classList.toggle("show");
      newToggle.textContent = panel.classList.contains("show") ? "Close comments" : "Comments ?";
    };

    // Click outside to close — attach fresh
    const outsideHandler = (e) => {
      if (!panel.contains(e.target) && e.target !== newToggle) {
        panel.classList.remove("show");
        newToggle.textContent = "Comments ?";
      }
    };
    document.removeEventListener("click", this._outsideCommentHandler);
    this._outsideCommentHandler = outsideHandler;
    document.addEventListener("click", outsideHandler);

    // Name edit
    const nameDisplay = document.getElementById("commentNameDisplay");
    const nameInput   = document.getElementById("commentNameInput");

    nameDisplay.onclick = () => {
      nameInput.value = nameDisplay.textContent.trim();
      nameDisplay.style.display = "none";
      nameInput.removeAttribute("hidden");
      nameInput.style.display = "block";
      nameInput.focus();
    };

    nameInput.onblur = () => {
      const val = nameInput.value.trim() || "Anonymous";
      nameDisplay.textContent = val;
      nameInput.style.display = "none";
      nameDisplay.style.display = "block";
    };

    // Textarea autosize
    const textarea = document.getElementById("commentInput");
    textarea.value = "";
    textarea.style.height = "auto";
    textarea.oninput = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    // Send handlers — clone to remove old
    const oldSendBtn = document.getElementById("commentSendBtn");
    const newSendBtn = oldSendBtn.cloneNode(true);
    oldSendBtn.parentNode.replaceChild(newSendBtn, oldSendBtn);

    newSendBtn.onclick = () => this.sendComment(null);

    const oldTA = document.getElementById("commentInput");
    const newTA = oldTA.cloneNode(true);
    oldTA.parentNode.replaceChild(newTA, oldTA);
    newTA.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendComment(null);
      }
    });
    newTA.oninput = () => {
      newTA.style.height = "auto";
      newTA.style.height = newTA.scrollHeight + "px";
    };

    panel.addEventListener("click", (e) => e.stopPropagation());
  },

  async sendComment(parentId, replyBox = null) {
    const user = window.currentUser;
    if (!user) { requireLoginToast(); return; }

    let name, text;
    if (!parentId) {
      name = document.getElementById("commentNameDisplay").textContent.trim();
      text = document.getElementById("commentInput").value.trim();
    } else {
      name = replyBox.querySelector(".reply-name-display").textContent.trim();
      text = replyBox.querySelector(".reply-textarea").value.trim();
    }

    if (!text) return;

    await addDoc(
      collection(db, "opinions", this.currentOpinionId, "comments"),
      { uid: user.uid, name, text, parent: parentId || null, createdAt: serverTimestamp() }
    );

    if (!parentId) {
      const t = document.getElementById("commentInput");
      t.value = "";
      t.style.height = "auto";
    } else {
      const t = replyBox.querySelector(".reply-textarea");
      t.value = "";
      t.style.height = "auto";
    }
  },

  loadCommentsRealtime() {
    const list = document.getElementById("commentsList");
    list.innerHTML = "";

    if (this._commentUnsub) this._commentUnsub();

    const q = query(
      collection(db, "opinions", this.currentOpinionId, "comments"),
      orderBy("createdAt", "asc")
    );

    this._commentUnsub = onSnapshot(q, snap => {
      list.innerHTML = "";
      const all = [];
      snap.forEach(d => all.push({ id: d.id, ...d.data() }));
      all.filter(c => !c.parent).forEach(c => {
        const el = this.renderComment(c, all);
        list.appendChild(el);
      });
    });
  },

  renderComment(comment, all) {
    const div = document.createElement("div");
    div.className = "comment-item";
    div.innerHTML = `
      <div class="comment-author">${this.escapeHTML(comment.name)}</div>
      <div class="comment-text">${this.escapeHTML(comment.text)}</div>
      <div class="comment-reply-btn">↩ Reply</div>
      <div class="comment-replies" id="replies-${comment.id}"></div>
    `;

    const replyBtn  = div.querySelector(".comment-reply-btn");
    const repliesBox = div.querySelector(".comment-replies");

    replyBtn.onclick = () => {
      if (repliesBox.querySelector(".comment-write-box")) return;
      const box = document.createElement("div");
      box.className = "comment-write-box";
      box.innerHTML = `
        <div class="reply-name-display">Anonymous</div>
        <div class="comment-input-wrap">
          <textarea class="reply-textarea" maxlength="200" placeholder="Write a reply..."></textarea>
          <button class="reply-send-btn"><i class="fa-solid fa-arrow-up"></i></button>
        </div>
      `;
      repliesBox.prepend(box);

      const ta   = box.querySelector(".reply-textarea");
      const send = box.querySelector(".reply-send-btn");
      this._attachReplyNameEdit(box.querySelector(".reply-name-display"));

      ta.oninput = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
      send.onclick = () => this.sendComment(comment.id, box);
      ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendComment(comment.id, box); }
      });
    };

    all.filter(r => r.parent === comment.id).forEach(r => {
      const rDiv = document.createElement("div");
      rDiv.className = "comment-item";
      rDiv.innerHTML = `
        <div class="comment-author">${this.escapeHTML(r.name)}</div>
        <div class="comment-text">${this.escapeHTML(r.text)}</div>
      `;
      repliesBox.appendChild(rDiv);
    });

    return div;
  },

  _attachReplyNameEdit(displayEl) {
    displayEl.onclick = (e) => {
      e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.value = displayEl.textContent.trim();
      input.maxLength = 25;
      input.className = "comment-name-edit";
      displayEl.replaceWith(input);
      input.focus();
      input.onblur = () => {
        const nd = document.createElement("div");
        nd.className = "reply-name-display";
        nd.textContent = input.value.trim() || "Anonymous";
        input.replaceWith(nd);
        this._attachReplyNameEdit(nd);
      };
    };
  },

  /* ─── MODAL HELPERS ──────────────────────────────────── */
  showModal(modal) { modal.classList.add("show");    },
  hideModal(modal) { modal.classList.remove("show"); },

  /* ─── EDITOR TOOLBAR ──────────────────────────────────
     FIX #5: added Underline button (handled in HTML too)
     FIX #6: Normal now properly strips bold/italic/underline
  ─────────────────────────────────────────────────────── */
  initEditorToolbar() {
    const buttons = this.editorToolbar.querySelectorAll("button");
    const editor  = this.messageInput;

    buttons.forEach(btn => {
      btn.addEventListener("mousedown", (e) => {
        // prevent editor losing focus
        e.preventDefault();
      });

      btn.addEventListener("click", () => {
        const style = btn.dataset.style;
        editor.focus();

        if (style === "bold")      document.execCommand("bold");
        if (style === "italic")    document.execCommand("italic");
        // FIX #5 — underline works
        if (style === "underline") document.execCommand("underline");
        // FIX #6 — Normal removes ALL formatting reliably
        if (style === "normal") {
          document.execCommand("removeFormat");
          // execCommand removeFormat doesn't always strip everything; force it
          const sel = window.getSelection();
          if (sel && sel.rangeCount) {
            const range = sel.getRangeAt(0);
            if (!range.collapsed) {
              document.execCommand("bold",      false, null); // toggle off if on
              document.execCommand("italic",    false, null);
              document.execCommand("underline", false, null);
              // re-apply removeFormat as cleanup
              document.execCommand("removeFormat");
            }
          }
        }

        this.updateToolbarState();
      });
    });

    editor.addEventListener("keyup",   () => this.updateToolbarState());
    editor.addEventListener("mouseup", () => this.updateToolbarState());
    editor.addEventListener("selectionchange", () => this.updateToolbarState());
  },

  updateToolbarState() {
    const buttons = this.editorToolbar.querySelectorAll("button");
    const isBold      = document.queryCommandState("bold");
    const isItalic    = document.queryCommandState("italic");
    const isUnderline = document.queryCommandState("underline");

    buttons.forEach(btn => {
      btn.classList.remove("active");
      const s = btn.dataset.style;
      if (s === "bold"      && isBold)      btn.classList.add("active");
      if (s === "italic"    && isItalic)    btn.classList.add("active");
      if (s === "underline" && isUnderline) btn.classList.add("active");
      // Normal active only if no formatting
      if (s === "normal" && !isBold && !isItalic && !isUnderline) btn.classList.add("active");
    });
  },

  /* ─── LOCAL STORAGE HELPERS ──────────────────────────── */
  getHiddenOpinions() {
    try { return JSON.parse(localStorage.getItem(this.HIDE_KEY)) || []; }
    catch { return []; }
  },
  hideOpinionLocal(id) {
    const hidden = this.getHiddenOpinions();
    if (!hidden.includes(id)) {
      hidden.push(id);
      localStorage.setItem(this.HIDE_KEY, JSON.stringify(hidden));
    }
  },

  /* ─── PUBLISH OPINION ────────────────────────────────── */
  async publishOpinion() {
    const user = window.currentUser;
    if (!user) { requireLoginToast(); return; }

    const name    = this.nameInput.value.trim() || "Anonymous";
    const subject = this.subjectInput.value.trim();
    const message = this.messageInput.innerHTML;

    if (!subject || !message.trim()) {
      alert("Subject and Message are required!");
      return;
    }

    this.publishBtn.disabled = true;
    this.publishBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Publishing...`;

    try {
      await addDoc(collection(db, "opinions"), {
        uid: user.uid,
        name, subject, message,
        up: 0, down: 0,
        voters: {},
        createdAt: serverTimestamp()
      });

      this.nameInput.value    = "";
      this.subjectInput.value = "";
      this.messageInput.innerHTML = "";
      document.getElementById("editorPage").classList.remove("show");
      document.body.classList.remove("lock-scroll");

    } catch (err) {
      console.error("Publish Error:", err);
      alert("Failed to publish opinion.");
    } finally {
      this.publishBtn.disabled = false;
      this.publishBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Publish`;
    }
  },

  /* ─── DELETE PERMISSION ──────────────────────────────── */
  canDeleteOpinion(data) {
    const user = window.currentUser;
    if (!user) return false;
    const ADMIN_EMAILS = ["nicknow20@gmail.com", "saurabhjoshionly@gmail.com"];
    if (ADMIN_EMAILS.includes(user.email)) return true;
    return data.uid === user.uid;
  },

  /* ─── REALTIME FEED ──────────────────────────────────── */
  loadOpinionsRealtime() {
    this.pageSize    = 10;   // FIX #1 — ensure 10 per page
    this.currentPage = 1;
    this.cachedDocs  = [];

    const baseQuery = query(collection(db, "opinions"), orderBy("createdAt", "desc"));

    onSnapshot(baseQuery, (snapshot) => {
      this.cachedDocs = snapshot.docs;
      const page = this.firstLoadDone ? this.currentPage : 1;
      this.renderPage(page);
      this.buildPagination();
    });
  },

  renderPage(page) {
    this.currentPage = page;
    const start    = (page - 1) * this.pageSize;
    const end      = start + this.pageSize;
    const pageDocs = this.cachedDocs.slice(start, end);

    if (!this.firstLoadDone) {
      document.getElementById("skeletonLoader").style.display = "block";
      this.feed.style.display = "none";
    }

    setTimeout(() => {
      document.getElementById("skeletonLoader").style.display = "none";
      this.feed.style.display = "block";
      this.feed.innerHTML = "";
      const hidden = this.getHiddenOpinions();

      pageDocs.forEach(docSnap => {
        if (hidden.includes(docSnap.id)) return;
        const data = docSnap.data();
        const card = this.createOpinionCard(docSnap.id, data);
        this.feed.appendChild(card);
      });

      this.firstLoadDone = true;
    }, this.firstLoadDone ? 0 : 200);
  },

  buildPagination() {
    const total = this.cachedDocs.length;
    const pages = Math.ceil(total / this.pageSize);
    const wrap  = document.getElementById("pagination");
    wrap.innerHTML = "";

    if (pages <= 1) return; // hide if only 1 page

    // Prev button
    if (this.currentPage > 1) {
      const prev = document.createElement("button");
      prev.innerHTML = `<i class="fa-solid fa-chevron-left"></i>`;
      prev.onclick   = () => { this.renderPage(this.currentPage - 1); this.buildPagination(); window.scrollTo({ top: 0, behavior: "smooth" }); };
      wrap.appendChild(prev);
    }

    for (let i = 1; i <= pages; i++) {
      // Show first, last, current ±1, and ellipsis
      const showBtn = i === 1 || i === pages || Math.abs(i - this.currentPage) <= 1;
      if (!showBtn) {
        if (i === 2 || i === pages - 1) {
          const dot = document.createElement("span");
          dot.className = "pagination-dot";
          dot.textContent = "…";
          wrap.appendChild(dot);
        }
        continue;
      }

      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === this.currentPage) btn.classList.add("active");
      btn.onclick = () => {
        this.renderPage(i);
        this.buildPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      wrap.appendChild(btn);
    }

    // Next button
    if (this.currentPage < pages) {
      const next = document.createElement("button");
      next.innerHTML = `<i class="fa-solid fa-chevron-right"></i>`;
      next.onclick   = () => { this.renderPage(this.currentPage + 1); this.buildPagination(); window.scrollTo({ top: 0, behavior: "smooth" }); };
      wrap.appendChild(next);
    }
  },

  /* ─── CREATE OPINION CARD ────────────────────────────── */
  getPreviewText(html, words = 20) {
    const temp  = document.createElement("div");
    temp.innerHTML = html;
    const text  = temp.textContent || temp.innerText || "";
    const parts = text.trim().split(/\s+/);
    if (parts.length <= words) return html;
    return parts.slice(0, words).join(" ") + "…";
  },

  createOpinionCard(id, data) {
    const card = document.createElement("article");
    card.className = "opinion-card";

    const preview     = this.getPreviewText(data.message, 20);
    const fmtMessage  = this.formatMessage(preview);
    const dateText    = this.formatTimestamp(data.createdAt);

    const user     = window.currentUser;
    const uid      = user ? user.uid : null;
    const userVote = (uid && data.voters && data.voters[uid]) ? data.voters[uid] : null;

    card.innerHTML = `
      <div class="opinion-top">
        <div class="opinion-author">${this.escapeHTML(data.name || "Anonymous")}</div>
        <h3 class="opinion-subject">${this.escapeHTML(data.subject)}</h3>
        <div class="menu">
          <i class="fa-solid fa-ellipsis"></i>
          <div class="menu-popup">
            <button class="report-btn"><i class="fa-regular fa-flag"></i> Report</button>
            <button class="hide-btn"><i class="fa-regular fa-eye-slash"></i> Hide</button>
            ${this.canDeleteOpinion(data) ? `
              <button class="delete-btn"><i class="fa-regular fa-trash-can"></i> Delete</button>
            ` : ""}
          </div>
        </div>
      </div>
      <p class="opinion-message">${fmtMessage}</p>
      <div class="opinion-footer">
        <div class="opinion-votes">
          <button class="vote-btn up ${userVote === "up" ? "active" : ""}">
            <i class="${userVote === "up" ? "fa-solid" : "fa-regular"} fa-thumbs-up"></i>
            <span class="count">${data.up || 0}</span>
          </button>
          <button class="vote-btn down ${userVote === "down" ? "active" : ""}">
            <i class="${userVote === "down" ? "fa-solid" : "fa-regular"} fa-thumbs-down"></i>
            <span class="count">${data.down || 0}</span>
          </button>
        </div>
        <div class="opinion-time">Posted: <span>${dateText}</span></div>
      </div>
    `;

    this.bindCardEvents(card, id, data);
    return card;
  },

  formatMessage(message) { return message; },

  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  formatTimestamp(ts) {
    if (!ts) return "Just now";
    const date = ts.toDate();
    return date.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  },

  /* ─── CARD EVENT BINDERS ─────────────────────────────── */
  bindCardEvents(card, id, data) {
    const menuBtn   = card.querySelector(".menu");
    const menuPopup = card.querySelector(".menu-popup");
    const hideBtn   = card.querySelector(".hide-btn");
    const reportBtn = card.querySelector(".report-btn");
    const upBtn     = card.querySelector(".vote-btn.up");
    const downBtn   = card.querySelector(".vote-btn.down");
    const deleteBtn = card.querySelector(".delete-btn");

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        menuPopup.classList.remove("show");
        showConfirmToast("Delete this opinion permanently?", async () => {
          try {
            await deleteDoc(doc(db, "opinions", id));
            card.remove();
          } catch (err) {
            console.error("❌ Delete Error:", err);
          }
        });
      });
    }

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuPopup.classList.toggle("show");
    });

    document.addEventListener("click", () => menuPopup.classList.remove("show"));

    hideBtn.addEventListener("click",   () => { this.hideOpinionLocal(id); card.remove(); });
    reportBtn.addEventListener("click", () => {
      this.currentReportTarget = { id, subject: data.subject, message: data.message };
      this.showModal(this.reportModal);
      menuPopup.classList.remove("show");
    });

    // FIX #2 — butter smooth optimistic voting on card
    upBtn.addEventListener("click",   () => this.handleVoteOptimistic(id, "up",   upBtn, downBtn));
    downBtn.addEventListener("click", () => this.handleVoteOptimistic(id, "down", upBtn, downBtn));

    card.querySelector(".opinion-message").addEventListener("click", () => this.openReader(id, data));
  },

  /* ─── OPTIMISTIC VOTING (FIX #2) ────────────────────────
     1. Update UI instantly (butter smooth)
     2. Persist to Firebase in background silently
  ─────────────────────────────────────────────────────── */
  async handleVoteOptimistic(id, type, upBtn, downBtn) {
    const user = window.currentUser;
    if (!user) { requireLoginToast(); return; }

    const uid = user.uid;

    // Read current displayed counts from the DOM
    const curUpCount   = parseInt(upBtn.querySelector(".count")?.textContent   || upBtn.textContent) || 0;
    const curDownCount = parseInt(downBtn.querySelector(".count")?.textContent || downBtn.textContent) || 0;
    const wasUpActive   = upBtn.classList.contains("active");
    const wasDownActive = downBtn.classList.contains("active");

    // Compute new state
    let newUpCount   = curUpCount;
    let newDownCount = curDownCount;
    let newVote      = null;

    if (type === "up") {
      if (wasUpActive) {
        // un-vote
        newUpCount--;
        newVote = null;
      } else {
        newUpCount++;
        if (wasDownActive) newDownCount--;
        newVote = "up";
      }
    } else {
      if (wasDownActive) {
        newDownCount--;
        newVote = null;
      } else {
        newDownCount++;
        if (wasUpActive) newUpCount--;
        newVote = "down";
      }
    }

    // ✅ Instantly update DOM — butter smooth
    this.syncVoteBtn(upBtn,   "up",   newUpCount,   newVote);
    this.syncVoteBtn(downBtn, "down", newDownCount, newVote);

    // 🔥 Persist to Firebase silently in background
    try {
      const ref  = doc(db, "opinions", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const fbData       = snap.data();
      const voters       = { ...(fbData.voters || {}) };
      const prevVote     = voters[uid];

      let fbUp   = fbData.up   || 0;
      let fbDown = fbData.down || 0;

      if (prevVote === "up")   fbUp--;
      if (prevVote === "down") fbDown--;

      if (prevVote === type) {
        delete voters[uid];
      } else {
        voters[uid] = type;
        if (type === "up")   fbUp++;
        if (type === "down") fbDown++;
      }

      await updateDoc(ref, { up: fbUp, down: fbDown, voters });
    } catch (err) {
      console.error("Vote sync error:", err);
      // Optionally revert UI on error
    }
  },

  /* ─── SEND REPORT ────────────────────────────────────── */
  async sendReport() {
    const reason = this.reportReason.value.trim();
    if (!reason || !this.currentReportTarget) return;

    try {
      await addDoc(collection(db, "reports"), {
        opinionId: this.currentReportTarget.id,
        subject:   this.currentReportTarget.subject,
        message:   this.currentReportTarget.message,
        reason,
        createdAt: serverTimestamp()
      });

      this.reportReason.value   = "";
      this.currentReportTarget  = null;
      this.hideModal(this.reportModal);
      alert("Report submitted successfully!");

    } catch (err) {
      console.error("Report Error:", err);
      alert("Failed to submit report.");
    }
  }
};
