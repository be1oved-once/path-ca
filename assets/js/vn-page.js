import { db } from "/assets/js/firebase.js";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ═══════════════════════════════════════════════════════════════════
   CONFIRM TOAST  (same pattern as thoughts.js)
═══════════════════════════════════════════════════════════════════ */
const confirmToast  = document.getElementById("confirmToast");
const confirmText   = document.getElementById("confirmText");
const confirmYes    = document.getElementById("confirmYes");
const confirmCancel = document.getElementById("confirmCancel");
const toastBackdrop = document.getElementById("toastBackdrop");

let confirmAction = null;

function showConfirmToast(message, action, options = {}) {
  confirmText.textContent   = message;
  confirmAction             = action;
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

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */
const CLOUD_NAME    = "dhjjtjbur";
const UPLOAD_PRESET = "VoiceNotes";
const INSTAGRAM_MODE = "D"; // "D" = direct link, anything else = subscription flow

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL AUDIO ENGINE
═══════════════════════════════════════════════════════════════════ */
const globalAudio    = new Audio();
let currentPlayingId = null;

/* ═══════════════════════════════════════════════════════════════════
   DOM READY
═══════════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  VnApp.init();
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP OBJECT
═══════════════════════════════════════════════════════════════════ */
const VnApp = {

  cardMap: {},
  currentVoiceId: null,

  /* ─── INIT ──────────────────────────────────────────────────── */
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.bindPreviewPlayer();
    this.loadVoiceNotesRealtime();
    console.log("Voice Notes Page Initialized Successfully");
  },

  /* ─── CACHE DOM ─────────────────────────────────────────────── */
  cacheDOM() {
    this.feed            = document.getElementById("vnList");
    this.skeleton        = document.getElementById("skeletonLoader");
    this.floatBtn        = document.getElementById("vnFloatBtn");
    this.uploadModal     = document.getElementById("vnUploadModal");
    this.uploadClose     = document.getElementById("vnUploadClose");
    this.publishBtn      = document.getElementById("vnPublishBtn");
    this.statusText      = document.getElementById("vnUploadStatus");
    this.audioInput      = document.getElementById("vnAudioFile");
    this.previewWrap     = document.getElementById("vnPreviewWrap");
    this.previewAudio    = document.getElementById("vnPreviewAudio");
    this.previewPlayBtn  = document.getElementById("vnPreviewPlayBtn");
    this.previewPlayIcon = this.previewPlayBtn.querySelector("i");
    this.previewFill     = document.querySelector(".vn-preview-fill");
    this.previewHandle   = document.querySelector(".vn-preview-handle");
    this.previewTime     = document.getElementById("vnPreviewTime");
    // Comments
    this.commentsPanel      = document.getElementById("vnCommentsPanel");
    this.commentsClose      = document.getElementById("vnCommentsClose");
    this.commentsList       = document.getElementById("vnCommentsList");
    this.commentInput       = document.getElementById("vnCommentInput");
    this.commentSendBtn     = document.getElementById("vnCommentSendBtn");
    this.commentNameDisplay = document.getElementById("vnCommentNameDisplay");
    // Sub modal
    this.subModal   = document.getElementById("subModal");
    this.subClose   = document.getElementById("subClose");
    this.subPayBtn  = document.getElementById("subPayBtn");
    this.subPayFlow = document.getElementById("subPayFlow");
    this.paymentFile   = document.getElementById("paymentFile");
    this.fileNameLabel = document.getElementById("fileName");
    this.submitPayBtn  = document.getElementById("submitPaymentBtn");
    this.subStatus     = document.getElementById("subStatus");
  },

  /* ─── BIND EVENTS ───────────────────────────────────────────── */
  bindEvents() {
    // Float button → open upload overlay
    this.floatBtn.addEventListener("click", () => {
      this.uploadModal.classList.add("show");
      document.body.classList.add("lock-scroll");
    });

    // Upload close
    this.uploadClose.addEventListener("click", () => {
      this.uploadModal.classList.remove("show");
      document.body.classList.remove("lock-scroll");
    });

    // Publish
    this.publishBtn.addEventListener("click", () => this.publishVoiceNote());

    // Audio file chosen
    this.audioInput.addEventListener("change", () => this.handleAudioSelected());

    // Comments close
    this.commentsClose.addEventListener("click", () => {
      this.commentsPanel.classList.remove("show");
      document.body.classList.remove("lock-scroll");
    });

    // Comments send
    this.commentSendBtn.addEventListener("click", () => this.sendComment());

    // Sub modal
    this.subClose.addEventListener("click",     () => this.closeSubModal());
    this.subModal.addEventListener("click", (e) => {
      if (e.target === this.subModal) this.closeSubModal();
    });
    this.subPayBtn.addEventListener("click", () => {
      this.subPayBtn.style.display = "none";
      this.subPayFlow.classList.add("show");
    });
    this.paymentFile.addEventListener("change", () => {
      this.fileNameLabel.textContent = this.paymentFile.files[0]
        ? this.paymentFile.files[0].name
        : "No file chosen";
    });
    this.submitPayBtn.addEventListener("click", () => this.submitPayment());

    // Instagram CTA delegation
    document.addEventListener("click", (e) => {
      const igBtn = e.target.closest(".vn-cta:not(.vn-cta-disabled)");
      if (!igBtn) return;
      e.preventDefault();
      const user = window.currentUser;
      if (!user) { requireLoginToast(); return; }
      if (INSTAGRAM_MODE === "D") {
        window.open(igBtn.href, "_blank");
      } else {
        this.openSubModal();
      }
    });

    // Close menu popups on outside click
    document.addEventListener("click", () => {
      document.querySelectorAll(".vn-menu-popup.show").forEach(p => p.classList.remove("show"));
    });
  },

  /* ─── LOAD REALTIME ─────────────────────────────────────────── */
  loadVoiceNotesRealtime() {
    const q = query(collection(db, "voiceNotes"), orderBy("createdAt", "desc"));
    let firstLoad = true;

    onSnapshot(q, (snap) => {
      // Hide skeleton on first real data
      if (firstLoad) {
        firstLoad = false;
        const sk = this.skeleton;
        if (sk) sk.style.display = "none";
      }

      snap.forEach(docSnap => {
        const id   = docSnap.id;
        const data = { id, ...docSnap.data() };

        if (!this.cardMap[id]) {
          const card = this.createVoiceCard(id, data);
          card.dataset.id = id;
          this.feed.appendChild(card);
          this.attachPlayerLogic(card);
          this.cardMap[id] = card;
        }

        // Always refresh vote UI from latest snapshot
        this.refreshVoteUI(this.cardMap[id], id, data);
      });
    });
  },

  /* ─── CREATE CARD ───────────────────────────────────────────── */
  createVoiceCard(id, data) {
    const card = document.createElement("article");
    card.className = "vn-card";
    card.dataset.audio = data.audioURL;

    const singer = data.name || "Anonymous";
    const user   = window.currentUser;
    const uid    = user ? user.uid : null;
    const uv     = (uid && data.voters && data.voters[uid]) ? data.voters[uid] : null;

    const igHTML = data.ig
      ? `<a class="vn-cta" href="https://instagram.com/${this.escapeHTML(data.ig.replace("@",""))}" target="_blank" rel="noopener">
           Get Instagram <i class="fa-brands fa-instagram"></i>
         </a>`
      : `<div class="vn-cta vn-cta-disabled">Instagram not provided</div>`;

    card.innerHTML = `
      <!-- collapsed header -->
      <div class="vn-collapsed">
        <div class="vn-left">
          <div class="vn-wave"><span></span><span></span><span></span></div>
        </div>
        <div class="vn-info">
          <h4>${this.escapeHTML(data.title)}</h4>
          <div class="vn-singer">${this.escapeHTML(singer)}</div>
          <div class="vn-sub">Tap to listen</div>
        </div>
        <div class="vn-arrow"><i class="fa-solid fa-chevron-down"></i></div>
      </div>

      <!-- 3-dot menu -->
      <div class="vn-menu">
        <i class="fa-solid fa-ellipsis"></i>
        <div class="vn-menu-popup">
          ${this.canDelete(data) ? `<button class="delete-btn"><i class="fa-regular fa-trash-can"></i> Delete</button>` : ""}
        </div>
      </div>

      <!-- expanded body -->
      <div class="vn-expanded">
        <!-- player -->
        <div class="vn-player">
          <button class="vn-play-btn"><i class="fa-solid fa-play"></i></button>
          <div class="vn-progress">
            <div class="vn-progress-bar">
              <div class="vn-progress-fill"></div>
              <div class="vn-progress-handle"></div>
            </div>
            <div class="vn-time">00:00 / 00:00</div>
          </div>
        </div>

        <!-- footer -->
        <div class="vn-footer">
          <div class="vn-votes">
            <button class="vote-btn up ${uv === "up" ? "active" : ""}">
              <i class="${uv === "up" ? "fa-solid" : "fa-regular"} fa-thumbs-up"></i>
              <span>${data.up || 0}</span>
            </button>
            <button class="vote-btn down ${uv === "down" ? "active" : ""}">
              <i class="${uv === "down" ? "fa-solid" : "fa-regular"} fa-thumbs-down"></i>
              <span>${data.down || 0}</span>
            </button>
            <button class="vn-comment-btn">
              <i class="fa-regular fa-comment"></i>
            </button>
            ${igHTML}
          </div>
        </div>
      </div>
    `;

    this.bindCardEvents(card, id, data);
    return card;
  },

  /* ─── BIND CARD EVENTS ──────────────────────────────────────── */
  bindCardEvents(card, id, data) {
    const collapsed  = card.querySelector(".vn-collapsed");
    const menuBtn    = card.querySelector(".vn-menu");
    const menuPopup  = card.querySelector(".vn-menu-popup");
    const deleteBtn  = card.querySelector(".delete-btn");
    const upBtn      = card.querySelector(".vote-btn.up");
    const downBtn    = card.querySelector(".vote-btn.down");
    const commentBtn = card.querySelector(".vn-comment-btn");

    // Expand/collapse
    collapsed.addEventListener("click", () => {
      // close other active cards
      document.querySelectorAll(".vn-card.active").forEach(c => {
        if (c !== card) c.classList.remove("active");
      });
      card.classList.toggle("active");
    });

    // 3-dot menu
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuPopup.classList.toggle("show");
    });

    // Delete
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menuPopup.classList.remove("show");
        showConfirmToast("Delete this voice note permanently?", async () => {
          try {
            await deleteDoc(doc(db, "voiceNotes", id));
            card.remove();
            delete this.cardMap[id];
          } catch (err) {
            console.error("Delete error:", err);
          }
        });
      });
    }

    // Votes (optimistic)
    upBtn.addEventListener("click",   (e) => { e.stopPropagation(); this.handleVoteOptimistic(id, "up",   upBtn, downBtn); });
    downBtn.addEventListener("click", (e) => { e.stopPropagation(); this.handleVoteOptimistic(id, "down", upBtn, downBtn); });

    // Comments
    commentBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.openComments(id);
    });
  },

  /* ─── REFRESH VOTE UI (from snapshot) ──────────────────────── */
  refreshVoteUI(card, id, data) {
    const user   = window.currentUser;
    const uid    = user ? user.uid : null;
    const uv     = (uid && data.voters && data.voters[uid]) ? data.voters[uid] : null;
    const upBtn  = card.querySelector(".vote-btn.up");
    const downBtn = card.querySelector(".vote-btn.down");
    if (!upBtn || !downBtn) return;
    this.syncVoteBtn(upBtn,   "up",   data.up   || 0, uv);
    this.syncVoteBtn(downBtn, "down", data.down || 0, uv);
  },

  /* ─── SYNC VOTE BTN (matches thoughts.js exactly) ──────────── */
  syncVoteBtn(btn, type, count, userVote) {
    const active = userVote === type;
    btn.classList.toggle("active", active);
    btn.innerHTML = `
      <i class="${active ? "fa-solid" : "fa-regular"} fa-thumbs-${type === "up" ? "up" : "down"}"></i>
      <span>${count}</span>
    `;
  },

  /* ─── OPTIMISTIC VOTING (matches thoughts.js exactly) ──────── */
  async handleVoteOptimistic(id, type, upBtn, downBtn) {
    const user = window.currentUser;
    if (!user) { requireLoginToast(); return; }

    const uid         = user.uid;
    const curUp       = parseInt(upBtn.querySelector("span")?.textContent   || "0") || 0;
    const curDown     = parseInt(downBtn.querySelector("span")?.textContent || "0") || 0;
    const wasUp       = upBtn.classList.contains("active");
    const wasDown     = downBtn.classList.contains("active");

    let newUp    = curUp;
    let newDown  = curDown;
    let newVote  = null;

    if (type === "up") {
      if (wasUp) { newUp--;  newVote = null; }
      else { newUp++; if (wasDown) newDown--; newVote = "up"; }
    } else {
      if (wasDown) { newDown--; newVote = null; }
      else { newDown++; if (wasUp) newUp--; newVote = "down"; }
    }

    // Instant UI update
    this.syncVoteBtn(upBtn,   "up",   newUp,   newVote);
    this.syncVoteBtn(downBtn, "down", newDown, newVote);

    // Background Firestore persist
    try {
      const ref  = doc(db, "voiceNotes", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const fbData   = snap.data();
      const voters   = { ...(fbData.voters || {}) };
      const prevVote = voters[uid];

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
    }
  },

  /* ─── AUDIO PLAYER LOGIC ────────────────────────────────────── */
  attachPlayerLogic(card) {
    const playBtn      = card.querySelector(".vn-play-btn");
    const playIcon     = playBtn.querySelector("i");
    const progressFill = card.querySelector(".vn-progress-fill");
    const progressHandle = card.querySelector(".vn-progress-handle");
    const timeText     = card.querySelector(".vn-time");
    const audioSrc     = card.dataset.audio;

    // Preload duration
    const metaAudio = new Audio(audioSrc);
    metaAudio.addEventListener("loadedmetadata", () => {
      timeText.textContent = "00:00 / " + this.formatTime(metaAudio.duration);
    });

    globalAudio.addEventListener("loadedmetadata", () => {
      if (currentPlayingId === card.dataset.id) {
        timeText.textContent = "00:00 / " + this.formatTime(globalAudio.duration);
      }
    });

    // Play / pause
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Stop previous card's icon
      if (currentPlayingId && currentPlayingId !== card.dataset.id) {
        const prevCard = document.querySelector(`.vn-card[data-id="${currentPlayingId}"]`);
        if (prevCard) {
          prevCard.querySelector(".vn-play-btn i").className = "fa-solid fa-play";
          prevCard.classList.remove("playing");
        }
      }

      if (currentPlayingId !== card.dataset.id) {
        globalAudio.src = audioSrc;
        globalAudio.currentTime = 0;
        currentPlayingId = card.dataset.id;
      }

      if (globalAudio.paused) {
        globalAudio.play();
        playIcon.className = "fa-solid fa-pause";
        card.classList.add("playing");
      } else {
        globalAudio.pause();
        playIcon.className = "fa-solid fa-play";
        card.classList.remove("playing");
        currentPlayingId = null;
      }
    });

    // Progress update
    globalAudio.addEventListener("timeupdate", () => {
      if (currentPlayingId !== card.dataset.id) return;
      const p = (globalAudio.currentTime / globalAudio.duration) * 100 || 0;
      progressFill.style.width   = p + "%";
      progressHandle.style.left  = p + "%";
      timeText.textContent = this.formatTime(globalAudio.currentTime) + " / " + this.formatTime(globalAudio.duration);
    });

    // Ended
    globalAudio.addEventListener("ended", () => {
      if (currentPlayingId === card.dataset.id) {
        playIcon.className = "fa-solid fa-play";
        progressFill.style.width  = "0%";
        progressHandle.style.left = "0%";
        card.classList.remove("playing");
        currentPlayingId = null;
      }
    });

    // Scrub
    const bar = card.querySelector(".vn-progress-bar");
    bar.addEventListener("click", (e) => {
      if (currentPlayingId !== card.dataset.id) return;
      const rect = bar.getBoundingClientRect();
      const pct  = (e.clientX - rect.left) / rect.width;
      globalAudio.currentTime = pct * globalAudio.duration;
    });
  },

  /* ─── COMMENTS ──────────────────────────────────────────────── */
  openComments(voiceId) {
    this.currentVoiceId = voiceId;
    this.commentsPanel.classList.add("show");
    document.body.classList.add("lock-scroll");
    this.getCurrentUsername().then(name => {
      this.commentNameDisplay.textContent = name;
    });
    this.loadCommentsRealtime();
  },

  async getCurrentUsername() {
    const user = window.currentUser;
    if (!user) return "Anonymous";
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      return snap.exists() ? (snap.data().username || "Anonymous") : "Anonymous";
    } catch { return "Anonymous"; }
  },

  async sendComment() {
    const user = window.currentUser;
    if (!user) { requireLoginToast(); return; }
    const text = this.commentInput.value.trim();
    if (!text) return;
    const name = await this.getCurrentUsername();
    await addDoc(collection(db, "voiceNotes", this.currentVoiceId, "comments"), {
      uid: user.uid, name, text, parent: null, createdAt: serverTimestamp()
    });
    this.commentInput.value = "";
  },

  loadCommentsRealtime() {
    if (this._commentsUnsub) this._commentsUnsub();
    const q = query(collection(db, "voiceNotes", this.currentVoiceId, "comments"), orderBy("createdAt", "asc"));
    this._commentsUnsub = onSnapshot(q, (snap) => {
      this.commentsList.innerHTML = "";
      const all = [];
      snap.forEach(d => all.push({ id: d.id, ...d.data() }));
      all.filter(c => !c.parent).forEach(c => {
        this.commentsList.appendChild(this.renderComment(c, all));
      });
    });
  },

  renderComment(comment, all) {
    const div = document.createElement("div");
    div.className = "comment-item";
    div.innerHTML = `
      <div class="comment-author">${this.escapeHTML(comment.name)}</div>
      <div class="comment-text">${this.escapeHTML(comment.text).replace(/\n/g, "<br>")}</div>
      <div class="comment-reply-btn">Reply</div>
      <div class="comment-replies"></div>
    `;

    const replyBtn  = div.querySelector(".comment-reply-btn");
    const repliesBox = div.querySelector(".comment-replies");

    replyBtn.onclick = async () => {
      if (repliesBox.querySelector(".comment-write-box")) return;
      const box = document.createElement("div");
      box.className = "comment-write-box reply";
      const username = await this.getCurrentUsername();
      box.innerHTML = `
        <div class="reply-name-display">${this.escapeHTML(username)}</div>
        <div class="comment-input-wrap">
          <textarea class="reply-textarea" placeholder="Write a reply..."></textarea>
          <button class="reply-send-btn"><i class="fa-solid fa-arrow-up"></i></button>
        </div>
      `;
      repliesBox.prepend(box);
      box.querySelector(".reply-send-btn").addEventListener("click", async () => {
        const user = window.currentUser;
        if (!user) { requireLoginToast(); return; }
        const text = box.querySelector(".reply-textarea").value.trim();
        if (!text) return;
        const name = await this.getCurrentUsername();
        await addDoc(collection(db, "voiceNotes", this.currentVoiceId, "comments"), {
          uid: user.uid, name, text, parent: comment.id, createdAt: serverTimestamp()
        });
      });
    };

    all.filter(r => r.parent === comment.id).forEach(r => {
      const rDiv = document.createElement("div");
      rDiv.className = "comment-item reply";
      rDiv.innerHTML = `
        <div class="comment-author">${this.escapeHTML(r.name)}</div>
        <div class="comment-text">${this.escapeHTML(r.text).replace(/\n/g, "<br>")}</div>
      `;
      repliesBox.appendChild(rDiv);
    });

    return div;
  },

  /* ─── UPLOAD PREVIEW PLAYER ─────────────────────────────────── */
  bindPreviewPlayer() {
    this.audioInput.addEventListener("change", () => this.handleAudioSelected());

    this.previewPlayBtn.addEventListener("click", () => {
      if (this.previewAudio.paused) {
        this.previewAudio.play();
        this.previewPlayIcon.className = "fa-solid fa-pause";
      } else {
        this.previewAudio.pause();
        this.previewPlayIcon.className = "fa-solid fa-play";
      }
    });

    this.previewAudio.addEventListener("timeupdate", () => {
      const p = (this.previewAudio.currentTime / this.previewAudio.duration) * 100 || 0;
      this.previewFill.style.width   = p + "%";
      this.previewHandle.style.left  = p + "%";
      this.previewTime.textContent   = this.formatTime(this.previewAudio.currentTime) + " / " + this.formatTime(this.previewAudio.duration);
    });

    this.previewAudio.addEventListener("ended", () => {
      this.previewPlayIcon.className = "fa-solid fa-play";
      this.previewFill.style.width   = "0%";
      this.previewHandle.style.left  = "0%";
    });
  },

  handleAudioSelected() {
    const file = this.audioInput.files[0];
    if (!file) return;
    this.previewAudio.src = URL.createObjectURL(file);
    this.previewWrap.style.display = "flex";
    this.previewAudio.addEventListener("loadedmetadata", () => {
      this.previewTime.textContent = "00:00 / " + this.formatTime(this.previewAudio.duration);
    }, { once: true });
  },

  /* ─── PUBLISH VOICE NOTE ────────────────────────────────────── */
  async publishVoiceNote() {
    const user = window.currentUser;
    if (!user) { requireLoginToast(); return; }

    const songName   = document.getElementById("vnSongName").value.trim();
    const singerName = document.getElementById("vnSingerName").value.trim();
    const igId       = document.getElementById("vnIg").value.trim();
    const file       = this.audioInput.files[0];

    if (!songName || !file) {
      this.statusText.textContent = "Song name & audio file required";
      return;
    }

    this.publishBtn.disabled = true;
    this.statusText.textContent = "Uploading audio…";

    try {
      const audioURL = await this.uploadAudioToCloudinary(file);
      this.statusText.textContent = "Publishing…";

      await addDoc(collection(db, "voiceNotes"), {
        title:    songName,
        name:     singerName || "Anonymous",
        ig:       igId || "",
        audioURL,
        createdAt: serverTimestamp(),
        up: 0,
        down: 0,
        voters: {}
      });

      this.statusText.textContent = "Published ✓";
      this.statusText.style.color = "#22c55e";

      setTimeout(() => {
        this.uploadModal.classList.remove("show");
        document.body.classList.remove("lock-scroll");
        this.resetUploadForm();
      }, 1000);

    } catch (err) {
      console.error("Publish error:", err);
      this.statusText.textContent = "Upload failed. Please try again.";
    } finally {
      this.publishBtn.disabled = false;
    }
  },

  resetUploadForm() {
    document.getElementById("vnSongName").value   = "";
    document.getElementById("vnSingerName").value = "";
    document.getElementById("vnIg").value         = "";
    this.audioInput.value       = "";
    this.previewWrap.style.display  = "none";
    this.previewAudio.src           = "";
    this.previewPlayIcon.className  = "fa-solid fa-play";
    this.previewFill.style.width    = "0%";
    this.previewHandle.style.left   = "0%";
    this.statusText.textContent     = "";
    this.statusText.style.color     = "";
  },

  /* ─── CLOUDINARY UPLOAD ─────────────────────────────────────── */
  async uploadAudioToCloudinary(file) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, { method: "POST", body: form });
    const data = await res.json();
    return data.secure_url;
  },

  /* ─── SUBSCRIPTION MODAL ────────────────────────────────────── */
  openSubModal() {
    this.subModal.classList.add("show");
    document.body.classList.add("lock-scroll");
  },

  closeSubModal() {
    this.subModal.classList.remove("show");
    document.body.classList.remove("lock-scroll");
    this.subPayFlow.classList.remove("show");
    this.subPayBtn.style.display = "block";
    this.subStatus.textContent   = "";
    this.paymentFile.value        = "";
    this.fileNameLabel.textContent = "No file chosen";
  },

  async submitPayment() {
    const file = this.paymentFile.files[0];
    if (!file) { this.subStatus.textContent = "Please select screenshot"; return; }

    this.subStatus.textContent = "Submitting…";
    try {
      const user     = window.currentUser;
      const uid      = user.uid;
      const email    = user.email;
      const userSnap = await getDoc(doc(db, "users", uid));
      const username = userSnap.exists() ? userSnap.data().username : "unknown";

      const imgURL = await this.uploadImageToCloudinary(file, username, email);
      await addDoc(collection(db, "paymentProofs"), { uid, username, email, screenshot: imgURL, createdAt: serverTimestamp() });

      this.subStatus.textContent = "Submitted ✓";
      setTimeout(() => this.closeSubModal(), 1200);
    } catch (err) {
      console.error(err);
      this.subStatus.textContent = "Upload failed";
    }
  },

  async uploadImageToCloudinary(file, username, email) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    form.append("folder", "PaymentsScreenshots");
    const cleanUser  = username.replace(/\s+/g, "_");
    const cleanEmail = email.replace(/[@.]/g, "_");
    form.append("public_id", `${cleanUser}_${cleanEmail}_${Date.now()}`);
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
    const data = await res.json();
    return data.secure_url;
  },

  /* ─── HELPERS ───────────────────────────────────────────────── */
  canDelete(data) {
    const user = window.currentUser;
    return user && data.uid && data.uid === user.uid;
  },

  formatTime(sec) {
    sec = Math.floor(sec) || 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  },

  escapeHTML(t) {
    const d = document.createElement("div");
    d.textContent = t || "";
    return d.innerHTML;
  }
};
