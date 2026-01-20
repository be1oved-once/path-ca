import { auth, db } from "../assets/js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =========================
   ADMIN CONFIG
========================= */
const ADMIN_EMAILS = [
  "nicknow20@gmail.com",
  "saurabhjoshionly@gmail.com"
];

/* =========================
   UI
========================= */
const msgInput = document.getElementById("msgInput");
const sendBtn  = document.getElementById("sendBtn");
const list     = document.getElementById("list");

/* =========================
   ADMIN LOCAL HISTORY
========================= */
const ADMIN_HISTORY_KEY = "admin_notify_history";

function getAdminHistory() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAdminHistory(data) {
  localStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(data));
}

/* =========================
   AUTH CHECK
========================= */
onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = "/";
    return;
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
  location.href = "/";
}
});

/* =========================
   ADD NOTIFICATION
========================= */
sendBtn.addEventListener("click", async () => {
  const message = msgInput.value.trim();
  if (!message) return;

  try {
    await addDoc(collection(db, "notifications"), {
      message,
      createdAt: serverTimestamp()
    });

    // 🔐 Save to ADMIN LOCAL HISTORY
    const history = getAdminHistory();
    history.unshift({
      message,
      createdAt: Date.now(),
      deletedAt: null
    });
    saveAdminHistory(history);

    msgInput.value = "";
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   LIVE LIST
========================= */
const q = query(
  collection(db, "notifications"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, snap => {
  list.innerHTML = "";

  if (snap.empty) {
    list.innerHTML = "<p style='opacity:.6'>No notifications</p>";
    return;
  }

  snap.forEach(d => {
    const data = d.data();

    const row = document.createElement("div");
    row.className = "notification-row";

    row.innerHTML = `
      <span>${data.message}</span>
      <button class="delete-btn">Delete</button>
    `;

    row.querySelector(".delete-btn").onclick = () => {
      showConfirmToast(
        "Delete this notification permanently?",
        async () => {
          await deleteDoc(doc(db, "notifications", d.id));

          // 🔐 Update local history
          const history = getAdminHistory();
          const item = history.find(h =>
            h.message === data.message && !h.deletedAt
          );
          if (item) item.deletedAt = Date.now();
          saveAdminHistory(history);
          renderAdminHistory(); // ✅ ADD THIS
        }
      );
    };

    list.appendChild(row);
  });
});

/* =========================
   CONFIRM TOAST
========================= */
const confirmToast  = document.getElementById("confirmToast");
const confirmText   = document.getElementById("confirmText");
const confirmYes    = document.getElementById("confirmYes");
const confirmCancel = document.getElementById("confirmCancel");

let confirmAction = null;

function showConfirmToast(message, action) {
  confirmText.textContent = message;
  confirmAction = action;
  confirmToast.classList.add("show");
  document.getElementById("toastBackdrop")?.classList.add("show");
}

function hideConfirmToast() {
  confirmToast.classList.remove("show");
  confirmAction = null;
  document.getElementById("toastBackdrop")?.classList.remove("show");
}

confirmCancel.onclick = hideConfirmToast;

confirmYes.onclick = async () => {
  if (confirmAction) await confirmAction();
  hideConfirmToast();
};
/* =========================
   RENDER ADMIN HISTORY
========================= */
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

function renderAdminHistory() {
  if (!historyList) return;

  const history = getAdminHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML =
      "<p style='opacity:.6'>No local history</p>";
    return;
  }

  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item" + (item.deletedAt ? " deleted" : "");

    div.innerHTML = `
  <div class="history-row">
    <span>${item.message}</span>
    <button class="history-del">Delete</button>
  </div>

  <small>
    Sent: ${new Date(item.createdAt).toLocaleString()}
    ${item.deletedAt
      ? `<br>Deleted: ${new Date(item.deletedAt).toLocaleString()}`
      : ""}
  </small>
`;
div.querySelector(".history-del").onclick = () => {
  showConfirmToast(
    "Remove this notification from local history?",
    () => {
      const history = getAdminHistory().filter(
        h => h.createdAt !== item.createdAt
      );
      saveAdminHistory(history);
      renderAdminHistory();
    }
  );
};

    historyList.appendChild(div);
  });
}

/* Clear history */
clearHistoryBtn?.addEventListener("click", () => {
  if (!confirm("Clear admin local history?")) return;
  localStorage.removeItem(ADMIN_HISTORY_KEY);
  renderAdminHistory();
});

/* Initial render */
renderAdminHistory();
