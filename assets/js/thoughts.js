
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
  confirmYes.textContent = options.okText || "Delete";

  confirmToast.classList.add("show");
  toastBackdrop.classList.add("show");

  confirmCancel.onclick = () => {
    hideConfirmToast();
    if (options.onCancel) options.onCancel();
  };

  confirmYes.onclick = async () => {
  if (confirmAction) await confirmAction();  // run first
  hideConfirmToast();                         // then clear
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
      okText: "Sign Up",
      onCancel: () => openAuth("login"),
      onOk: () => openAuth("signup")
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

  /* =========================
     CONFIG
  ========================= */
  HIDE_KEY: "hidden_opinions_local",
CACHE_KEY: "opinions_cache_v1",
firstLoadDone: false,
  /* =========================
     INIT
  ========================= */
init() {
  this.cacheDOM();
  this.bindEvents();
  this.initEditorToolbar();
  this.updateToolbarState();
  this.loadOpinionsRealtime();

  // 🔥 Reader close button
  document.getElementById("readerClose")
    .addEventListener("click", () => {
      document.getElementById("readerPage")
        .classList.remove("show");
        document.body.classList.remove("lock-scroll");
        if (ThoughtApp.readerUnsub) ThoughtApp.readerUnsub();
    });

  console.log("Thoughts Page Initialized Successfully");
},

  /* =========================
     CACHE DOM ELEMENTS
  ========================= */

  cacheDOM() {
    this.feed = document.getElementById("opinionsFeed");

    this.addOpinionBtn = document.getElementById("addOpinionBtn");
    this.opinionModal = document.getElementById("opinionModal");
    this.reportModal = document.getElementById("reportModal");
    this.reportClose = document.querySelector(".report-close");

    this.publishBtn = document.getElementById("publishOpinionBtn");
    this.sendReportBtn = document.getElementById("sendReportBtn");

    this.nameInput = document.getElementById("opName");
    this.subjectInput = document.getElementById("opSubject");
    this.messageInput = document.getElementById("opMessage");
    this.reportReason = document.getElementById("reportReason");

    this.editorToolbar = document.querySelector(".editor-toolbar");

    this.currentReportTarget = null;
  },

  /* =========================
     EVENT BINDINGS
  ========================= */
  bindEvents() {
    /* Open Opinion Modal */
   // Open full-page editor
// Open full-page editor
this.addOpinionBtn.addEventListener("click", () => {
  document.getElementById("editorPage").classList.add("show");
  document.body.classList.add("lock-scroll");
});

// Close full-page editor
document.getElementById("editorClose").addEventListener("click", () => {
  document.getElementById("editorPage").classList.remove("show");
  document.body.classList.remove("lock-scroll");
});

// Close editor
document.getElementById("editorClose").addEventListener("click", () => {
  document.getElementById("editorPage").classList.remove("show");
});

    /* Close Opinion Modal */

    /* Close Report Modal */
    this.reportClose.addEventListener("click", () => {
      this.hideModal(this.reportModal);
      this.currentReportTarget = null;
    });

    /* Outside click close */
    window.addEventListener("click", (e) => {
      if (e.target === this.reportModal) this.hideModal(this.reportModal);
    });

    /* Publish Opinion */
    this.publishBtn.addEventListener("click", () => {
      this.publishOpinion();
    });

    /* Send Report */
    this.sendReportBtn.addEventListener("click", () => {
      this.sendReport();
    });
  },
/* =========================
     OPEN FULL READER PAGE
  ========================= */
openReader(id, data) {
  const page = document.getElementById("readerPage");
  page.classList.add("show");
  document.body.classList.add("lock-scroll");
  document.getElementById("readerName").textContent =
    data.name || "Anonymous";
  
  document.getElementById("readerSubject").textContent =
    data.subject;
  
  document.getElementById("readerMessage").innerHTML =
    this.formatMessage(data.message);
  parseEmojis(document.getElementById("readerMessage"));
  // Attach vote buttons (same Firebase logic)
  const upBtn = document.getElementById("readerUp");
  const downBtn = document.getElementById("readerDown");
  
  upBtn.innerHTML = `
      <i class="fa-regular fa-thumbs-up"></i> ${data.up || 0}
    `;
  
  downBtn.innerHTML = `
      <i class="fa-regular fa-thumbs-down"></i> ${data.down || 0}
    `;
  
  // Attach vote handlers
upBtn.onclick = async () => {
  await this.handleVote(id, "up");
};

downBtn.onclick = async () => {
  await this.handleVote(id, "down");
};

// 🔥 Realtime sync for reader votes
const ref = doc(db, "opinions", id);

if (this.readerUnsub) this.readerUnsub(); // remove old listener

this.readerUnsub = onSnapshot(ref, snap => {
  if (!snap.exists()) return;
  const live = snap.data();

  const user = window.currentUser;
  const uid = user ? user.uid : null;
  const userVote = (uid && live.voters && live.voters[uid]) 
                    ? live.voters[uid] 
                    : null;

  upBtn.innerHTML = `
    <i class="${userVote === "up" ? "fa-solid" : "fa-regular"} fa-thumbs-up"></i> ${live.up || 0}
  `;

  downBtn.innerHTML = `
    <i class="${userVote === "down" ? "fa-solid" : "fa-regular"} fa-thumbs-down"></i> ${live.down || 0}
  `;
  upBtn.classList.toggle("active", userVote === "up");
  downBtn.classList.toggle("active", userVote === "down");
});
  // store current opinion id for comments
this.currentOpinionId = id;
this.initCommentsUI();
this.loadCommentsRealtime();
},
/* =========================
   COMMENTS SYSTEM
========================= */

initCommentsUI() {
  const toggle = document.getElementById("commentsToggle");
  const panel = document.getElementById("commentsPanel");

  toggle.onclick = () => {
    panel.classList.toggle("show");
    toggle.textContent = panel.classList.contains("show")
      ? "Close comments"
      : "Comments ?";
  };

  // click outside to close
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== toggle) {
      panel.classList.remove("show");
      toggle.textContent = "Comments ?";
    }
  });

  // name edit
  const nameDisplay = document.getElementById("commentNameDisplay");
  const nameInput = document.getElementById("commentNameInput");

function enablePrimaryNameEdit() {
  const nameDisplay = document.getElementById("commentNameDisplay");
  const nameInput = document.getElementById("commentNameInput");

  nameDisplay.onclick = () => {
    nameInput.value = nameDisplay.textContent.trim();
    nameDisplay.style.display = "none";
    nameInput.style.display = "block";
    nameInput.focus();
  };

  nameInput.onblur = () => {
    const val = nameInput.value.trim() || "Anonymous";
    nameDisplay.textContent = val;
    nameInput.style.display = "none";
    nameDisplay.style.display = "block";
  };
}

enablePrimaryNameEdit();

  // autosize textarea
  const textarea = document.getElementById("commentInput");
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });

  // send handlers
  document.getElementById("commentSendBtn")
    .onclick = () => this.sendComment(null);

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendComment(null);
    }
  });
  // Prevent closing when clicking inside comments panel
document.getElementById("commentsPanel")
  .addEventListener("click", (e) => {
    e.stopPropagation();
  });
},

async sendComment(parentId, replyBox = null) {
  const user = window.currentUser;
  if (!user) {
    requireLoginToast();
    return;
  }

  let name, text;

  // Primary comment
  if (!parentId) {
    name = document.getElementById("commentNameDisplay").textContent.trim();
    text = document.getElementById("commentInput").value.trim();
  } 
  // Reply comment
  else {
    name = replyBox.querySelector(".reply-name-display").textContent.trim();
    text = replyBox.querySelector(".reply-textarea").value.trim();
  }

  if (!text) return;

  await addDoc(
    collection(db, "opinions", this.currentOpinionId, "comments"),
    {
      uid: user.uid,
      name,
      text,
      parent: parentId || null,
      createdAt: serverTimestamp()
    }
  );

  // Reset inputs
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

  const q = query(
    collection(db, "opinions", this.currentOpinionId, "comments"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snap => {
    list.innerHTML = "";
    const all = [];

    snap.forEach(docSnap => {
      all.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Render only primary comments first
    all.filter(c => !c.parent).forEach(c => {
      const el = this.renderComment(c, all);
      list.appendChild(el);
      parseEmojis(el);
    });
  });
},

renderComment(comment, all) {

  const div = document.createElement("div");
  div.className = "comment-item";

  div.innerHTML = `
    <div class="comment-author">${this.escapeHTML(comment.name)}</div>
    <div class="comment-text">${this.escapeHTML(comment.text)}</div>
    <div class="comment-reply-btn">Reply</div>

    <!-- replies container -->
    <div class="comment-replies" id="replies-${comment.id}"></div>
  `;

  const replyBtn = div.querySelector(".comment-reply-btn");
  const repliesBox = div.querySelector(".comment-replies");

  // === Reply button click → inject inline reply box
replyBtn.onclick = () => {

  if (repliesBox.querySelector(".comment-write-box")) return;

  const replyInputBox = document.createElement("div");
  replyInputBox.className = "comment-write-box";

  replyInputBox.innerHTML = `
  <div class="reply-name-display">Anonymous</div>

  <div class="comment-input-wrap">
    <textarea class="reply-textarea" maxlength="200" placeholder="Write a reply..."></textarea>
    <button class="reply-send-btn">
      <i class="fa-solid fa-arrow-up"></i>
    </button>
  </div>
`;

  repliesBox.prepend(replyInputBox);

  const textarea = replyInputBox.querySelector(".reply-textarea");
  const sendBtn = replyInputBox.querySelector(".reply-send-btn");

  let nameValue = "Anonymous";

function attachReplyNameEdit(displayEl) {
  displayEl.onclick = (e) => {
    e.stopPropagation(); // 🔥 prevent panel collapse

    const input = document.createElement("input");
    input.type = "text";
    input.value = displayEl.textContent.trim();
    input.maxLength = 25;
    input.className = "comment-name-edit";

    displayEl.replaceWith(input);
    input.focus();

    input.onblur = () => {
      const newName = input.value.trim() || "Anonymous";
      const newDisplay = document.createElement("div");
      newDisplay.className = "reply-name-display";
      newDisplay.textContent = newName;

      input.replaceWith(newDisplay);
      attachReplyNameEdit(newDisplay);
    };
  };
}

  const firstDisplay = replyInputBox.querySelector(".reply-name-display");
attachReplyNameEdit(firstDisplay);

  // ✅ Auto expand textarea
  textarea.oninput = () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  // ✅ Send reply
  const sendReply = () => {
    this.sendComment(comment.id, replyInputBox);
  };

  sendBtn.onclick = sendReply;

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  });
};

  // === Render existing replies ===
  all.filter(r => r.parent === comment.id).forEach(r => {
    const rDiv = document.createElement("div");
    rDiv.className = "comment-item";

    rDiv.innerHTML = `
      <div class="comment-author">${this.escapeHTML(r.name)}</div>
      <div class="comment-text">${this.escapeHTML(r.text)}</div>
    `;

    repliesBox.appendChild(rDiv);

// ✅ Twemoji parse for replies
parseEmojis(rDiv);
  });

  return div;
},

  /* =========================
     MODAL HELPERS
  ========================= */
  showModal(modal) {
    modal.classList.add("show");
  },

  hideModal(modal) {
    modal.classList.remove("show");
  },

  /* =========================
     TOOLBAR (Bold / Italic / Normal)
  ========================= */
initEditorToolbar() {
  const buttons = this.editorToolbar.querySelectorAll("button");
  const editor = this.messageInput;

  // Click → apply format
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const style = btn.dataset.style;
      editor.focus();

      if (style === "bold") document.execCommand("bold");
      if (style === "italic") document.execCommand("italic");
      if (style === "normal") document.execCommand("removeFormat");

      this.updateToolbarState();
    });
  });

  // When cursor moves → update active states
  editor.addEventListener("keyup", () => this.updateToolbarState());
  editor.addEventListener("mouseup", () => this.updateToolbarState());

},
updateToolbarState() {
  const buttons = this.editorToolbar.querySelectorAll("button");

  buttons.forEach(btn => btn.classList.remove("active"));

  if (document.queryCommandState("bold")) {
    this.editorToolbar.querySelector('[data-style="bold"]').classList.add("active");
  }

  if (document.queryCommandState("italic")) {
    this.editorToolbar.querySelector('[data-style="italic"]').classList.add("active");
  }

  // If no formatting → mark Normal active
  if (
    !document.queryCommandState("bold") &&
    !document.queryCommandState("italic")
  ) {
    this.editorToolbar.querySelector('[data-style="normal"]').classList.add("active");
  }
},

applyTextStyle(style) {
  const textarea = this.messageInput;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  if (!selected) return;

  let newText;

  // Bold toggle
  if (style === "bold") {
    newText = selected.startsWith("**") && selected.endsWith("**")
      ? selected.slice(2,-2)
      : `**${selected}**`;
  }

  // Italic toggle
  else if (style === "italic") {
    newText = selected.startsWith("*") && selected.endsWith("*")
      ? selected.slice(1,-1)
      : `*${selected}*`;
  }

  // Normal removes markers
  else {
    newText = selected.replace(/(\*\*|\*)/g, "");
  }

  textarea.setRangeText(newText, start, end, "end");
  textarea.focus();
},

  /* =========================
     LOCAL STORAGE HELPERS
  ========================= */
  getHiddenOpinions() {
    try {
      return JSON.parse(localStorage.getItem(this.HIDE_KEY)) || [];
    } catch {
      return [];
    }
  },

  hideOpinionLocal(id) {
    const hidden = this.getHiddenOpinions();
    if (!hidden.includes(id)) {
      hidden.push(id);
      localStorage.setItem(this.HIDE_KEY, JSON.stringify(hidden));
    }
  },

  saveVoteData(data) {
    localStorage.setItem(this.VOTE_KEY, JSON.stringify(data));
  },

  /* =========================
     PUBLISH OPINION
  ========================= */
async publishOpinion() {

  // 🔒 Require login
  const user = window.currentUser;
  if (!user) {
    requireLoginToast();
    return;
  }

  const name = this.nameInput.value.trim() || "Anonymous";
  const subject = this.subjectInput.value.trim();
  const message = this.messageInput.innerHTML;

  if (!subject || !message.trim()) {
    alert("Subject and Message are required!");
    return;
  }

  try {
    await addDoc(collection(db, "opinions"), {
      uid: user.uid,        // 🔥 author id stored
      name: name,
      subject: subject,
      message: message,
      up: 0,
      down: 0,
      voters: {},           // 🔥 initialize voters map
      createdAt: serverTimestamp()
    });

    this.nameInput.value = "";
    this.subjectInput.value = "";
    this.messageInput.value = "";
    document.getElementById("editorPage").classList.remove("show");

  } catch (err) {
    console.error("Publish Error:", err);
    alert("Failed to publish opinion.");
  }
},
/* =========================
   CHECK DELETE PERMISSION
========================= */
canDeleteOpinion(data) {
  const user = window.currentUser;
  if (!user) return false;

  // Admin emails list (same as common.js)
  const ADMIN_EMAILS = [
    "nicknow20@gmail.com",
    "saurabhjoshionly@gmail.com"
  ];

  // Admin can delete any
  if (ADMIN_EMAILS.includes(user.email)) return true;

  // Owner can delete own
  return data.uid === user.uid;
},
  /* =========================
     REALTIME LOAD FEED
  ========================= */
loadOpinionsRealtime() {

  this.pageSize = 10;
  this.currentPage = 1;
  this.cachedDocs = [];

  const baseQuery = query(
    collection(db, "opinions"),
    orderBy("createdAt", "desc")
  );

  // Realtime cache listener
  onSnapshot(baseQuery, (snapshot) => {
  this.cachedDocs = snapshot.docs;
  
  // Keep current page if already loaded
  const page = this.firstLoadDone ? this.currentPage : 1;
  
  this.renderPage(page);
  this.buildPagination();
});
},
renderPage(page) {
  this.currentPage = page;

  const start = (page - 1) * this.pageSize;
  const end = start + this.pageSize;
  const pageDocs = this.cachedDocs.slice(start, end);

  // Skeleton ON
// Skeleton only on first load or manual page change
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
    parseEmojis(card);
  });

  // 🔥 Mark first load finished
  this.firstLoadDone = true;

}, this.firstLoadDone ? 0 : 200);
},
buildPagination() {
  const total = this.cachedDocs.length;
  const pages = Math.ceil(total / this.pageSize);

  const wrap = document.getElementById("pagination");
  wrap.innerHTML = "";

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;

    if (i === this.currentPage) {
      btn.classList.add("active");
    }

    btn.onclick = () => {
      this.renderPage(i);
      this.buildPagination();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    wrap.appendChild(btn);
  }
},

  /* =========================
     CREATE OPINION CARD*/

getPreviewText(html, words = 20) {
  // Convert HTML → plain text for preview limit
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const text = temp.textContent || temp.innerText || "";

  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return html;

  const shortText = parts.slice(0, words).join(" ") + "...";

  // Return trimmed plain text (not raw html)
  return shortText;
},

  createOpinionCard(id, data) {
    const card = document.createElement("article");
    card.className = "opinion-card";

    const preview = this.getPreviewText(data.message, 20);
const formattedMessage = this.formatMessage(preview);
    const dateText = this.formatTimestamp(data.createdAt);

    const user = window.currentUser;
const uid = user ? user.uid : null;
const userVote = (uid && data.voters && data.voters[uid]) ? data.voters[uid] : null;

    card.innerHTML = `
      <div class="opinion-top">
        <div class="opinion-author">${this.escapeHTML(data.name || "Anonymous")}</div><h3 class="opinion-subject">${this.escapeHTML(data.subject)}</h3>

        <div class="menu">
          <i class="fa-solid fa-ellipsis"></i>
          <div class="menu-popup">
              <button class="report-btn">
    <i class="fa-regular fa-flag"></i> Report
  </button>

  <button class="hide-btn">
    <i class="fa-regular fa-eye-slash"></i> Hide
  </button>

  ${this.canDeleteOpinion(data) ? `
<button class="delete-btn">
  <i class="fa-regular fa-trash-can"></i> Delete
</button>
` : ""}
          </div>
        </div>
      </div>

      <p class="opinion-message">${formattedMessage}</p>

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

        <div class="opinion-time">
          Posted: <span>${dateText}</span>
        </div>
      </div>
    `;

    /* Bind card events */
    this.bindCardEvents(card, id, data);

    return card;
  },

  /* =========================
     FORMAT MESSAGE WITH SPACES
  ========================= */
formatMessage(message) {
  // message is already safe HTML from editor
  return message;
},

  /* =========================
     ESCAPE HTML SECURITY
  ========================= */
  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /* =========================
     FORMAT FIREBASE TIMESTAMP
  ========================= */
  formatTimestamp(ts) {
    if (!ts) return "Just now";
    const date = ts.toDate();
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  },

  /* =========================
     CARD EVENT BINDERS
  ========================= */
  bindCardEvents(card, id, data) {
    const menuBtn = card.querySelector(".menu");
    const menuPopup = card.querySelector(".menu-popup");
    const hideBtn = card.querySelector(".hide-btn");
    const reportBtn = card.querySelector(".report-btn");
    const upBtn = card.querySelector(".vote-btn.up");
    const downBtn = card.querySelector(".vote-btn.down");
    const deleteBtn = card.querySelector(".delete-btn");

if (deleteBtn) {
  deleteBtn.addEventListener("click", () => {
    console.log("🟡 Delete button clicked for ID:", id);

    menuPopup.classList.remove("show");

    showConfirmToast(
      "Delete this opinion permanently?",
      async () => {
        console.log("🟠 Confirm delete pressed for ID:", id);

        try {
          const ref = doc(db, "opinions", id);
          console.log("🔵 Firestore ref:", ref.path);

          await deleteDoc(ref);

          console.log("✅ Firestore delete successful:", id);

          card.remove();
          console.log("✅ Card removed from DOM");

        } catch (err) {
          console.error("❌ Delete Error:", err);
        }
      }
    );
  });
}
    /* Menu toggle */
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuPopup.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      menuPopup.classList.remove("show");
    });

    /* Hide Opinion */
    hideBtn.addEventListener("click", () => {
      this.hideOpinionLocal(id);
      card.remove();
    });
    /* Report Opinion */
    reportBtn.addEventListener("click", () => {
      this.currentReportTarget = {
        id: id,
        subject: data.subject,
        message: data.message
      };
      this.showModal(this.reportModal);
      menuPopup.classList.remove("show");
    });

    /* Voting */
    upBtn.addEventListener("click", () => {
      this.handleVote(id, "up");
    });

    downBtn.addEventListener("click", () => {
      this.handleVote(id, "down");
    });
    card.querySelector(".opinion-message").addEventListener("click", () => {
  this.openReader(id, data);
});
  },

  /* =========================
     HANDLE VOTES
  ========================= */

  /* =========================
   HANDLE VOTES WITH TOGGLE
========================= */
async handleVote(id, type) {

  // 🔒 Require login
  const user = window.currentUser;
  if (!user) {
    requireLoginToast();
    openAuth("login"); // uses your existing auth popup
    return;
  }

  try {
    const ref = doc(db, "opinions", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const voters = data.voters || {};

    const uid = user.uid; // 🔥 real authenticated UID
    const previousVote = voters[uid];

    let newUp = data.up || 0;
    let newDown = data.down || 0;

    // remove previous vote effect
    if (previousVote === "up") newUp--;
    if (previousVote === "down") newDown--;

    // toggle logic
    if (previousVote === type) {
      delete voters[uid]; // unvote
    } else {
      voters[uid] = type;
      if (type === "up") newUp++;
      if (type === "down") newDown++;
    }

    await updateDoc(ref, {
      up: newUp,
      down: newDown,
      voters: voters
    });

  } catch (err) {
    console.error("Vote Toggle Error:", err);
  }
},

  /* =========================
     SEND REPORT TO FIRESTORE
  ========================= */
  async sendReport() {
    const reason = this.reportReason.value.trim();
    if (!reason || !this.currentReportTarget) return;

    try {
      await addDoc(collection(db, "reports"), {
        opinionId: this.currentReportTarget.id,
        subject: this.currentReportTarget.subject,
        message: this.currentReportTarget.message,
        reason: reason,
        createdAt: serverTimestamp()
      });

      this.reportReason.value = "";
      this.currentReportTarget = null;
      this.hideModal(this.reportModal);

      alert("Report submitted successfully!");

    } catch (err) {
      console.error("Report Error:", err);
      alert("Failed to submit report.");
    }
  }
};