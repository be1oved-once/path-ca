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
  confirmCancel.onclick = () => { hideConfirmToast(); if (options.onCancel) options.onCancel(); };
  confirmYes.onclick = async () => { if (confirmAction) await confirmAction(); hideConfirmToast(); if (options.onOk) options.onOk(); };
}

function hideConfirmToast() {
  confirmToast.classList.remove("show");
  toastBackdrop.classList.remove("show");
  confirmAction = null;
}

function requireLoginToast() {
  showConfirmToast("Login required to continue", null, {
    cancelText: "Login",
    okText:     "Sign Up",
    onCancel:   () => openAuth("login"),
    onOk:       () => openAuth("signup")
  });
}

/* ==========================================================
   IMAGEKIT UPLOAD HELPER
========================================================== */
const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/YOUR_IMAGEKIT_ID"; // ← replace with your ImageKit URL endpoint
const IMAGEKIT_PUBLIC_KEY   = "YOUR_IMAGEKIT_PUBLIC_KEY";                 // ← replace with your public key
const IMAGEKIT_AUTH_ENDPOINT = "/api/imagekit-auth";                      // ← your backend auth endpoint (or use unsigned upload)

async function uploadToImageKit(file, onProgress) {
  // Use unsigned upload (set unsigned=true in ImageKit dashboard for the preset)
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", `opinion_${Date.now()}_${file.name}`);
  formData.append("publicKey", IMAGEKIT_PUBLIC_KEY);
  formData.append("folder", "/opinions");

  // For a signed upload you'd fetch a token from your backend first.
  // Here we do a simple unsigned upload. Make sure to enable unsigned uploads in ImageKit dashboard.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.url);
      } else {
        reject(new Error("ImageKit upload failed: " + xhr.responseText));
      }
    };
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(formData);
  });
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
function getEl(id) {
  return document.getElementById(id);
}

function requireEl(id) {
  const el = document.getElementById(id);
  
  if (!el) {
    console.error(`[ThoughtApp] Missing element #${id}`);
    return null;
  }
  
  return el;
}
const ThoughtApp = {

  /* ─── CONFIG ─────────────────────────────────────────── */
  HIDE_KEY:      "hidden_opinions_local",
  CACHE_KEY:     "opinions_cache_v1",
  firstLoadDone: false,
  pageSize:      10,
  currentPage:   1,
  cachedDocs:    [],
  currentFlair:  "General",
  currentTab:    "text",
  currentQaTag:  "CA Foundation",
  uploadedImageUrl: null,
  currentFilter: "new",

  /* ─── INIT ──────────────────────────────────────────── */
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.initEditorToolbar();
    this.updateToolbarState();
    this.initPostTabs();
    this.initFlairPills();
    this.initImageUpload();
    this.initLinkPreview();
    this.initFilterButtons();
    this.loadOpinionsRealtime();

const readerClose = requireEl("readerClose");

if (readerClose) {
  readerClose.addEventListener("click", () => {
    
    const readerPage = requireEl("readerPage");
    
    if (readerPage) {
      readerPage.classList.remove("show");
    }
    
    document.body.classList.remove("lock-scroll");
    
    if (ThoughtApp.readerUnsub) ThoughtApp.readerUnsub();
    if (ThoughtApp._commentUnsub) ThoughtApp._commentUnsub();
    
    const commentsList = requireEl("commentsList");
    
    if (commentsList) {
      commentsList.innerHTML = "";
    }
    
  });
}

    // Share / Bookmark in reader
    document.getElementById("readerShareBtn").addEventListener("click", () => this.shareCurrentPost());
    document.getElementById("readerShareInline").addEventListener("click", () => this.shareCurrentPost());
    document.getElementById("readerBookmarkBtn").addEventListener("click", () => this.toggleBookmark());
    document.getElementById("readerCommentJump").addEventListener("click", () => {
      document.getElementById("readerCommentsSection").scrollIntoView({ behavior: "smooth" });
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

safeClass(el, action, className) {
  if (!el) return;
  
  if (action === "add") {
    el.classList.add(className);
  }
  
  if (action === "remove") {
    el.classList.remove(className);
  }
  
  if (action === "toggle") {
    el.classList.toggle(className);
  }
},
  /* ─── FILTER BUTTONS ─────────────────────────────────── */
  initFilterButtons() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter;
        this.renderPage(1);
        this.buildPagination();
      });
    });
  },

  /* ─── POST TYPE TABS ─────────────────────────────────── */
  initPostTabs() {
    document.querySelectorAll(".post-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".post-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        this.currentTab = tab.dataset.tab;
        const panel = document.getElementById("tab-" + this.currentTab);
        if (panel) this.safeClass(panel, "add", "active");
      });
    });

    // Title char count
    this.subjectInput.addEventListener("input", () => {
      const len = this.subjectInput.value.length;
      document.getElementById("titleCharCount").textContent = len;
      if (len > 100) document.getElementById("titleCharCount").style.color = "var(--danger)";
      else document.getElementById("titleCharCount").style.color = "";
    });
  },

  /* ─── FLAIR PILLS ────────────────────────────────────── */
  initFlairPills() {
    document.querySelectorAll("#flairPills .flair-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll("#flairPills .flair-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.currentFlair = pill.dataset.flair;
      });
    });

    document.querySelectorAll("[data-qa-tag]").forEach(pill => {
      pill.addEventListener("click", () => {
        pill.closest(".flair-pills").querySelectorAll(".flair-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.currentQaTag = pill.dataset.qaTag;
      });
    });
  },

  /* ─── IMAGE UPLOAD ───────────────────────────────────── */
  initImageUpload() {
    const zone     = document.getElementById("imageUploadZone");
    const input    = document.getElementById("imageFileInput");
    const preview  = document.getElementById("imagePreview");
    const previewW = document.getElementById("imagePreviewWrap");
    const removeBtn= document.getElementById("imgRemoveBtn");
    const status   = document.getElementById("uploadStatus");
    const fillBar  = document.getElementById("uploadProgressFill");

    const handleFile = async (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5 MB"); return; }

      // Show local preview instantly
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        zone.classList.add("hidden");
        previewW.classList.remove("hidden");
        status.textContent = "Uploading…";
        fillBar.style.width = "0%";
      };
      reader.readAsDataURL(file);

      try {
        const url = await uploadToImageKit(file, (pct) => {
          fillBar.style.width = pct + "%";
        });
        this.uploadedImageUrl = url;
        status.textContent = "✓ Uploaded";
        status.style.color = "var(--success, #22c55e)";
        fillBar.style.width = "100%";
      } catch (err) {
        console.error(err);
        status.textContent = "Upload failed — will use local preview only";
        status.style.color = "var(--danger)";
        // Fallback: store base64 if ImageKit fails (Firebase storage isn't used here)
        this.uploadedImageUrl = null;
      }
    };

    input.addEventListener("change", () => { if (input.files[0]) handleFile(input.files[0]); });

    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      handleFile(e.dataTransfer.files[0]);
    });
    zone.addEventListener("click", () => input.click());

    removeBtn.addEventListener("click", () => {
      preview.src = "";
      this.uploadedImageUrl = null;
      input.value = "";
      previewW.classList.add("hidden");
      zone.classList.remove("hidden");
      status.textContent = "";
    });
  },

  /* ─── LINK PREVIEW ───────────────────────────────────── */
  initLinkPreview() {
    const urlInput = document.getElementById("linkUrl");
    const card     = document.getElementById("linkPreviewCard");
    const titleEl  = document.getElementById("linkPreviewTitle");
    const urlEl    = document.getElementById("linkPreviewUrl");

    let debounceTimer;
    urlInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const val = urlInput.value.trim();
        if (!val || !val.startsWith("http")) { card.classList.add("hidden"); return; }
        try {
          const u = new URL(val);
          urlEl.textContent   = u.hostname;
          titleEl.textContent = u.hostname.replace("www.", "");
          card.classList.remove("hidden");
        } catch { card.classList.add("hidden"); }
      }, 400);
    });
  },

  /* ─── SHARE POST ─────────────────────────────────────── */
  shareCurrentPost() {
    const subject = document.getElementById("readerSubject").textContent;
    const url = `${window.location.origin}${window.location.pathname}?post=${this.currentOpinionId}`;
    if (navigator.share) {
      navigator.share({ title: subject, url });
    } else {
      navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
    }
  },

  /* ─── BOOKMARK ───────────────────────────────────────── */
  toggleBookmark() {
    const id  = this.currentOpinionId;
    const btn = document.getElementById("readerBookmarkBtn");
    const key = "bookmarked_opinions";
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}
    const idx = saved.indexOf(id);
    if (idx === -1) {
      saved.push(id);
      btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
      btn.classList.add("bookmarked");
    } else {
      saved.splice(idx, 1);
      btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
      btn.classList.remove("bookmarked");
    }
    localStorage.setItem(key, JSON.stringify(saved));
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

    // Avatar letter
    const name = data.name || "Anonymous";
    document.getElementById("readerAvatar").textContent = name.charAt(0).toUpperCase();

    document.getElementById("readerName").textContent      = name;
    document.getElementById("readerTimestamp").textContent = this.formatTimestamp(data.createdAt);
    document.getElementById("readerSubject").textContent   = data.subject;
    document.getElementById("readerMessage").innerHTML     = this.formatMessage(data.message || "");

    // Flair badge
    const flairEl = document.getElementById("readerFlair");
    if (data.flair) { flairEl.textContent = data.flair; flairEl.classList.remove("hidden"); }
    else { flairEl.classList.add("hidden"); }

    // Post type badge
    const typeBadge = document.getElementById("readerTypeBadge");
    const typeIcons = { image: "🖼️ Image Post", poll: "📊 Poll", link: "🔗 Link", question: "❓ Q&A", text: "" };
    if (data.postType && data.postType !== "text") {
      typeBadge.textContent = typeIcons[data.postType] || "";
      typeBadge.classList.remove("hidden");
    } else { typeBadge.classList.add("hidden"); }

    // Image
    const imgWrap = document.getElementById("readerImageWrap");
    if (data.imageUrl) {
      document.getElementById("readerImage").src        = data.imageUrl;
      document.getElementById("readerImgCaption").textContent = data.imgCaption || "";
      imgWrap.classList.remove("hidden");
    } else { imgWrap.classList.add("hidden"); }

    // Poll
    const pollWrap = document.getElementById("readerPollWrap");
    if (data.postType === "poll" && data.pollOptions) {
      this.renderReaderPoll(pollWrap, id, data);
      pollWrap.classList.remove("hidden");
    } else { pollWrap.classList.add("hidden"); }

    // Link
    const linkWrap = document.getElementById("readerLinkWrap");
    if (data.linkUrl) {
      linkWrap.innerHTML = `<a href="${this.escapeHTML(data.linkUrl)}" target="_blank" rel="noopener" class="reader-link-card">
        <i class="fa-solid fa-link"></i>
        <div><div class="link-preview-title">${this.escapeHTML(data.linkNote || data.linkUrl)}</div>
        <div class="link-preview-url">${this.escapeHTML(data.linkUrl)}</div></div>
      </a>`;
      linkWrap.classList.remove("hidden");
    } else { linkWrap.classList.add("hidden"); }

    // Bookmark state
    try {
      const saved = JSON.parse(localStorage.getItem("bookmarked_opinions")) || [];
      const btn   = document.getElementById("readerBookmarkBtn");
      if (saved.includes(id)) { btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>'; btn.classList.add("bookmarked"); }
      else { btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>'; btn.classList.remove("bookmarked"); }
    } catch {}

    const upBtn   = document.getElementById("readerUp");
    const downBtn = document.getElementById("readerDown");
    upBtn.onclick   = async () => { await this.handleVoteOptimistic(id, "up",   upBtn, downBtn); };
    downBtn.onclick = async () => { await this.handleVoteOptimistic(id, "down", upBtn, downBtn); };

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
    this.initCommentsUI();
    this.loadCommentsRealtime();
  },

  /* ─── READER POLL RENDER ─────────────────────────────── */
  renderReaderPoll(wrap, id, data) {
    const opts    = data.pollOptions || [];
    const votes   = data.pollVotes   || {};
    const uid     = window.currentUser ? window.currentUser.uid : null;
    const myVote  = uid ? (data.pollUserVotes || {})[uid] : null;
    const total   = Object.values(votes).reduce((s, v) => s + v, 0);

    wrap.innerHTML = `<div class="reader-poll">
      ${opts.map((opt, i) => {
        const count = votes[i] || 0;
        const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
        const voted = myVote === i;
        return `<button class="poll-vote-btn ${voted ? "voted" : ""}" data-idx="${i}" data-id="${id}">
          <span class="poll-opt-label">${this.escapeHTML(opt)}</span>
          <span class="poll-bar" style="width:${pct}%"></span>
          <span class="poll-pct">${pct}%</span>
        </button>`;
      }).join("")}
      <div class="poll-total">${total} vote${total !== 1 ? "s" : ""}</div>
    </div>`;

    wrap.querySelectorAll(".poll-vote-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!uid) { requireLoginToast(); return; }
        const idx = parseInt(btn.dataset.idx);
        const ref = doc(db, "opinions", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const d  = snap.data();
        const pv = (d.pollUserVotes || {})[uid];
        const newVotes      = { ...(d.pollVotes || {}) };
        const newUserVotes  = { ...(d.pollUserVotes || {}) };
        if (pv !== undefined) newVotes[pv] = Math.max(0, (newVotes[pv] || 1) - 1);
        if (pv === idx) { delete newUserVotes[uid]; }
        else { newVotes[idx] = (newVotes[idx] || 0) + 1; newUserVotes[uid] = idx; }
        await updateDoc(ref, { pollVotes: newVotes, pollUserVotes: newUserVotes });
        const updated = { ...d, pollVotes: newVotes, pollUserVotes: newUserVotes };
        this.renderReaderPoll(wrap, id, updated);
      });
    });
  },

  /* ─── SYNC VOTE BUTTON ───────────────────────────────── */
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
  
  const nameDisplay = requireEl("commentNameDisplay");
  const nameInput = requireEl("commentNameInput");
  const textarea = requireEl("commentInput");
  const oldSendBtn = requireEl("commentSendBtn");
  
  if (!nameDisplay || !nameInput || !textarea || !oldSendBtn) {
    console.error("Comments UI elements missing.");
    return;
  }
  
  // Name edit
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
  
  // Auto resize
  textarea.value = "";
  textarea.style.height = "auto";
  
  textarea.oninput = () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };
  
  // Replace send button safely
  const newSendBtn = oldSendBtn.cloneNode(true);
  
  if (oldSendBtn.parentNode) {
    oldSendBtn.parentNode.replaceChild(newSendBtn, oldSendBtn);
  }
  
  newSendBtn.onclick = () => this.sendComment(null);
  
  // Replace textarea safely
  const newTA = textarea.cloneNode(true);
  
  if (textarea.parentNode) {
    textarea.parentNode.replaceChild(newTA, textarea);
  }
  
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
  
  // Sort tabs
  document.querySelectorAll(".csort").forEach(btn => {
    
    btn.addEventListener("click", () => {
      
      document.querySelectorAll(".csort")
        .forEach(b => b.classList.remove("active"));
      
      btn.classList.add("active");
      
      this.commentSort = btn.dataset.sort;
      
      this.loadCommentsRealtime();
    });
    
  });
  
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
      { uid: user.uid, name, text, parent: parentId || null, likes: 0, createdAt: serverTimestamp() }
    );

    if (!parentId) {
      const t = document.getElementById("commentInput");
      t.value = ""; t.style.height = "auto";
    } else {
      const t = replyBox.querySelector(".reply-textarea");
      t.value = ""; t.style.height = "auto";
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
      let all = [];
      snap.forEach(d => all.push({ id: d.id, ...d.data() }));

      // Sort
      if (this.commentSort === "top") all.sort((a, b) => (b.likes || 0) - (a.likes || 0));

      list.innerHTML = "";
      const count = all.filter(c => !c.parent).length;
      const label = document.getElementById("commentsCountLabel");
      if (label) label.textContent = `${count} Comment${count !== 1 ? "s" : ""}`;

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
      <div class="comment-header">
        <div class="comment-avatar">${this.escapeHTML(comment.name.charAt(0).toUpperCase())}</div>
        <div class="comment-author-info">
          <div class="comment-author">${this.escapeHTML(comment.name)}</div>
          <div class="comment-time">${this.formatTimestamp(comment.createdAt)}</div>
        </div>
      </div>
      <div class="comment-text">${this.escapeHTML(comment.text)}</div>
      <div class="comment-actions">
        <button class="comment-like-btn" data-id="${comment.id}"><i class="fa-regular fa-heart"></i> <span>${comment.likes || 0}</span></button>
        <button class="comment-reply-btn">↩ Reply</button>
      </div>
      <div class="comment-replies" id="replies-${comment.id}"></div>
    `;

    div.querySelector(".comment-like-btn").addEventListener("click", async (e) => {
      const user = window.currentUser;
      if (!user) { requireLoginToast(); return; }
      const btn = e.currentTarget;
      const ref = doc(db, "opinions", this.currentOpinionId, "comments", comment.id);
      await updateDoc(ref, { likes: increment(1) });
      btn.querySelector("span").textContent = (parseInt(btn.querySelector("span").textContent) + 1);
      btn.querySelector("i").className = "fa-solid fa-heart";
      btn.style.color = "var(--danger)";
    });

    const replyBtn   = div.querySelector(".comment-reply-btn");
    const repliesBox = div.querySelector(".comment-replies");

    replyBtn.onclick = () => {
      if (repliesBox.querySelector(".comment-write-box")) return;
      const box = document.createElement("div");
      box.className = "comment-write-box reply-compose";
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
      rDiv.className = "comment-item reply-item";
      rDiv.innerHTML = `
        <div class="comment-header">
          <div class="comment-avatar reply-avatar">${this.escapeHTML(r.name.charAt(0).toUpperCase())}</div>
          <div class="comment-author-info">
            <div class="comment-author">${this.escapeHTML(r.name)}</div>
            <div class="comment-time">${this.formatTimestamp(r.createdAt)}</div>
          </div>
        </div>
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
      input.type = "text"; input.value = displayEl.textContent.trim();
      input.maxLength = 25; input.className = "comment-name-edit";
      displayEl.replaceWith(input); input.focus();
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
  showModal(modal) { modal.classList.add("show"); },
  hideModal(modal) { modal.classList.remove("show"); },

  /* ─── EDITOR TOOLBAR ─────────────────────────────────── */
  initEditorToolbar() {
    const buttons = this.editorToolbar.querySelectorAll("button");
    const editor  = this.messageInput;

    buttons.forEach(btn => {
      btn.addEventListener("mousedown", (e) => { e.preventDefault(); });
      btn.addEventListener("click", () => {
        const style = btn.dataset.style;
        editor.focus();

        if (style === "bold")                 document.execCommand("bold");
        else if (style === "italic")          document.execCommand("italic");
        else if (style === "underline")       document.execCommand("underline");
        else if (style === "strikeThrough")   document.execCommand("strikeThrough");
        else if (style === "insertUnorderedList") document.execCommand("insertUnorderedList");
        else if (style === "insertOrderedList")   document.execCommand("insertOrderedList");
        else if (style === "insertHorizontalRule") document.execCommand("insertHorizontalRule");
        else if (style === "h2") {
          document.execCommand("formatBlock", false, "<h2>");
        }
        else if (style === "blockquote") {
          document.execCommand("formatBlock", false, "<blockquote>");
        }
        else if (style === "insertCode") {
          const sel = window.getSelection();
          if (sel && sel.rangeCount && !sel.getRangeAt(0).collapsed) {
            const range = sel.getRangeAt(0);
            const code  = document.createElement("code");
            code.appendChild(range.extractContents());
            range.insertNode(code);
          }
        }
        else if (style === "normal") {
          document.execCommand("removeFormat");
          document.execCommand("formatBlock", false, "<p>");
        }

        this.updateToolbarState();
      });
    });

    editor.addEventListener("keyup",   () => this.updateToolbarState());
    editor.addEventListener("mouseup", () => this.updateToolbarState());
  },

  updateToolbarState() {
    const buttons     = this.editorToolbar.querySelectorAll("button");
    const isBold      = document.queryCommandState("bold");
    const isItalic    = document.queryCommandState("italic");
    const isUnderline = document.queryCommandState("underline");
    const isStrike    = document.queryCommandState("strikeThrough");

    buttons.forEach(btn => {
      btn.classList.remove("active");
      const s = btn.dataset.style;
      if (s === "bold"          && isBold)      btn.classList.add("active");
      if (s === "italic"        && isItalic)    btn.classList.add("active");
      if (s === "underline"     && isUnderline) btn.classList.add("active");
      if (s === "strikeThrough" && isStrike)    btn.classList.add("active");
      if (s === "normal" && !isBold && !isItalic && !isUnderline && !isStrike) btn.classList.add("active");
    });
  },

  /* ─── LOCAL STORAGE HELPERS ──────────────────────────── */
  getHiddenOpinions() {
    try { return JSON.parse(localStorage.getItem(this.HIDE_KEY)) || []; } catch { return []; }
  },
  hideOpinionLocal(id) {
    const hidden = this.getHiddenOpinions();
    if (!hidden.includes(id)) { hidden.push(id); localStorage.setItem(this.HIDE_KEY, JSON.stringify(hidden)); }
  },

  /* ─── PUBLISH OPINION ────────────────────────────────── */
  async publishOpinion() {
    const user = window.currentUser;
    if (!user) { requireLoginToast(); return; }

    const name    = this.nameInput.value.trim() || "Anonymous";
    const subject = this.subjectInput.value.trim();

    if (!subject) { alert("Please add a title!"); return; }

    this.publishBtn.disabled = true;
    this.publishBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    const postData = {
      uid: user.uid,
      name,
      subject,
      flair:    this.currentFlair,
      postType: this.currentTab,
      up: 0, down: 0,
      voters: {},
      createdAt: serverTimestamp()
    };

    // Type-specific fields
    if (this.currentTab === "text") {
      const message = this.messageInput.innerHTML;
      if (!message.trim()) { alert("Write something!"); this.publishBtn.disabled = false; this.publishBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Publish`; return; }
      postData.message = message;
    }

    if (this.currentTab === "image") {
      if (!this.uploadedImageUrl) { alert("Please upload an image first (or wait for upload to finish)."); this.publishBtn.disabled = false; this.publishBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Publish`; return; }
      postData.imageUrl   = this.uploadedImageUrl;
      postData.imgCaption = document.getElementById("imgCaption").value.trim();
      postData.message    = "";
    }

    if (this.currentTab === "poll") {
      const opts = [
        document.getElementById("pollOpt1").value.trim(),
        document.getElementById("pollOpt2").value.trim(),
        document.getElementById("pollOpt3").value.trim(),
        document.getElementById("pollOpt4").value.trim()
      ].filter(Boolean);
      if (opts.length < 2) { alert("Add at least 2 poll options!"); this.publishBtn.disabled = false; this.publishBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Publish`; return; }
      postData.pollOptions  = opts;
      postData.pollVotes    = {};
      postData.pollUserVotes= {};
      postData.pollDuration = parseInt(document.getElementById("pollDuration").value);
      postData.message      = "";
    }

    if (this.currentTab === "link") {
      const url = document.getElementById("linkUrl").value.trim();
      if (!url) { alert("Paste a URL!"); this.publishBtn.disabled = false; this.publishBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Publish`; return; }
      postData.linkUrl  = url;
      postData.linkNote = document.getElementById("linkNote").value.trim();
      postData.message  = "";
    }

    if (this.currentTab === "question") {
      const detail = document.getElementById("qaDetail").value.trim();
      postData.message  = detail;
      postData.qaTag    = this.currentQaTag;
      postData.answered = false;
    }

    try {
      await addDoc(collection(db, "opinions"), postData);

      // Reset form
      this.nameInput.value    = "";
      this.subjectInput.value = "";
      this.messageInput.innerHTML = "";
      document.getElementById("imgCaption").value = "";
      document.getElementById("linkUrl").value    = "";
      document.getElementById("linkNote").value   = "";
      document.getElementById("qaDetail").value   = "";
      ["pollOpt1","pollOpt2","pollOpt3","pollOpt4"].forEach(id => { document.getElementById(id).value = ""; });
      this.uploadedImageUrl = null;
      document.getElementById("imagePreviewWrap").classList.add("hidden");
      document.getElementById("imageUploadZone").classList.remove("hidden");
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
    this.pageSize    = 10;
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

  sortedDocs() {
    let docs = [...this.cachedDocs];
    if (this.currentFilter === "top") {
      docs.sort((a, b) => ((b.data().up || 0) - (b.data().down || 0)) - ((a.data().up || 0) - (a.data().down || 0)));
    } else if (this.currentFilter === "discussed") {
      // Sort by total votes (up + down = engagement)
      docs.sort((a, b) => ((b.data().up || 0) + (b.data().down || 0)) - ((a.data().up || 0) + (a.data().down || 0)));
    }
    return docs;
  },

  renderPage(page) {
    this.currentPage = page;
    const sorted   = this.sortedDocs();
    const start    = (page - 1) * this.pageSize;
    const end      = start + this.pageSize;
    const pageDocs = sorted.slice(start, end);

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

    if (pages <= 1) return;

    if (this.currentPage > 1) {
      const prev = document.createElement("button");
      prev.innerHTML = `<i class="fa-solid fa-chevron-left"></i>`;
      prev.onclick   = () => { this.renderPage(this.currentPage - 1); this.buildPagination(); window.scrollTo({ top: 0, behavior: "smooth" }); };
      wrap.appendChild(prev);
    }

    for (let i = 1; i <= pages; i++) {
      const showBtn = i === 1 || i === pages || Math.abs(i - this.currentPage) <= 1;
      if (!showBtn) {
        if (i === 2 || i === pages - 1) {
          const dot = document.createElement("span");
          dot.className = "pagination-dot"; dot.textContent = "…";
          wrap.appendChild(dot);
        }
        continue;
      }
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === this.currentPage) btn.classList.add("active");
      btn.onclick = () => { this.renderPage(i); this.buildPagination(); window.scrollTo({ top: 0, behavior: "smooth" }); };
      wrap.appendChild(btn);
    }

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
    if (data.postType) card.dataset.postType = data.postType;

    const preview    = this.getPreviewText(data.message || "", 20);
    const fmtMessage = this.formatMessage(preview);
    const dateText   = this.formatTimestamp(data.createdAt);
    const user       = window.currentUser;
    const uid        = user ? user.uid : null;
    const userVote   = (uid && data.voters && data.voters[uid]) ? data.voters[uid] : null;
    const name       = data.name || "Anonymous";
    const avatarLetter = name.charAt(0).toUpperCase();

    const flairHtml = data.flair ? `<span class="card-flair">${this.escapeHTML(data.flair)}</span>` : "";
    const typeIcon  = data.postType && data.postType !== "text" ? `<span class="card-type-icon"></span>` : "";
    const qaAnsweredBadge = (data.postType === "question" && data.answered) ? `<span class="card-answered-badge"><i class="fa-solid fa-circle-check"></i> Answered</span>` : "";
    const imageThumb = (data.postType === "image" && data.imageUrl) ?
      `<div class="card-image-thumb"><img src="${this.escapeHTML(data.imageUrl)}" alt="post image" loading="lazy"></div>` : "";

    card.innerHTML = `
      <div class="opinion-top">
        <div class="card-author-row">
          <div class="card-avatar">${avatarLetter}</div>
          <div class="card-author-meta">
            <div class="opinion-author">${this.escapeHTML(name)}</div>
            <div class="opinion-time-inline">${dateText}</div>
          </div>
          <div class="card-badges">${flairHtml}${typeIcon}${qaAnsweredBadge}</div>
        </div>
        <div class="menu">
          <i class="fa-solid fa-ellipsis"></i>
          <div class="menu-popup">
            <button class="report-btn"><i class="fa-regular fa-flag"></i> Report</button>
            <button class="hide-btn"><i class="fa-regular fa-eye-slash"></i> Hide</button>
            ${this.canDeleteOpinion(data) ? `<button class="delete-btn"><i class="fa-regular fa-trash-can"></i> Delete</button>` : ""}
          </div>
        </div>
      </div>
      ${imageThumb}
      <h3 class="opinion-subject">${this.escapeHTML(data.subject)}</h3>
      ${fmtMessage ? `<p class="opinion-message">${fmtMessage}</p>` : ""}
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
          <button class="card-comment-btn"><i class="fa-regular fa-comment"></i></button>
          <button class="card-share-btn"><i class="fa-solid fa-share-nodes"></i></button>
        </div>
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
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now  = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60)   return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
    const commentBtn= card.querySelector(".card-comment-btn");
    const shareBtn  = card.querySelector(".card-share-btn");

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        menuPopup.classList.remove("show");
        showConfirmToast("Delete this opinion permanently?", async () => {
          try { await deleteDoc(doc(db, "opinions", id)); card.remove(); }
          catch (err) { console.error("Delete Error:", err); }
        });
      });
    }

    menuBtn.addEventListener("click", (e) => { e.stopPropagation(); menuPopup.classList.toggle("show"); });
    document.addEventListener("click", () => menuPopup.classList.remove("show"));
    hideBtn.addEventListener("click", () => { this.hideOpinionLocal(id); card.remove(); });
    reportBtn.addEventListener("click", () => {
      this.currentReportTarget = { id, subject: data.subject, message: data.message };
      this.showModal(this.reportModal);
      menuPopup.classList.remove("show");
    });

    upBtn.addEventListener("click",   (e) => { e.stopPropagation(); this.handleVoteOptimistic(id, "up",   upBtn, downBtn); });
    downBtn.addEventListener("click", (e) => { e.stopPropagation(); this.handleVoteOptimistic(id, "down", upBtn, downBtn); });

    // Open reader on card click (except vote buttons and menu)
    card.addEventListener("click", (e) => {
      if (e.target.closest(".vote-btn") || e.target.closest(".menu") || e.target.closest(".card-share-btn")) return;
      this.openReader(id, data);
    });

    commentBtn?.addEventListener("click", (e) => { e.stopPropagation(); this.openReader(id, data); });

    shareBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = `${window.location.origin}${window.location.pathname}?post=${id}`;
      if (navigator.share) navigator.share({ title: data.subject, url });
      else navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
    });
  },

  /* ─── OPTIMISTIC VOTING ──────────────────────────────── */
  async handleVoteOptimistic(id, type, upBtn, downBtn) {
    const user = window.currentUser;
    if (!user) { requireLoginToast(); return; }

    const uid          = user.uid;
    const curUpCount   = parseInt(upBtn.querySelector(".count")?.textContent   || "0") || 0;
    const curDownCount = parseInt(downBtn.querySelector(".count")?.textContent || "0") || 0;
    const wasUpActive   = upBtn.classList.contains("active");
    const wasDownActive = downBtn.classList.contains("active");

    let newUpCount = curUpCount, newDownCount = curDownCount, newVote = null;
    if (type === "up") {
      if (wasUpActive) { newUpCount--; newVote = null; }
      else { newUpCount++; if (wasDownActive) newDownCount--; newVote = "up"; }
    } else {
      if (wasDownActive) { newDownCount--; newVote = null; }
      else { newDownCount++; if (wasUpActive) newUpCount--; newVote = "down"; }
    }

    this.syncVoteBtn(upBtn,   "up",   newUpCount,   newVote);
    this.syncVoteBtn(downBtn, "down", newDownCount, newVote);

    try {
      const ref    = doc(db, "opinions", id);
      const snap   = await getDoc(ref);
      if (!snap.exists()) return;
      const fbData   = snap.data();
      const voters   = { ...(fbData.voters || {}) };
      const prevVote = voters[uid];
      let fbUp = fbData.up || 0, fbDown = fbData.down || 0;
      if (prevVote === "up")   fbUp--;
      if (prevVote === "down") fbDown--;
      if (prevVote === type) { delete voters[uid]; }
      else { voters[uid] = type; if (type === "up") fbUp++; else fbDown++; }
      await updateDoc(ref, { up: fbUp, down: fbDown, voters });
    } catch (err) { console.error("Vote sync error:", err); }
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
      this.reportReason.value  = "";
      this.currentReportTarget = null;
      this.hideModal(this.reportModal);
      alert("Report submitted successfully!");
    } catch (err) {
      console.error("Report Error:", err);
      alert("Failed to submit report.");
    }
  }
};
