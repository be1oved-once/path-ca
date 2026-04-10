import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const listEl = document.querySelector(".correction-list");

auth.onAuthStateChanged(async user => {
  if (!user) {
    listEl.innerHTML = "<p>Please login</p>";
    return;
  }

  const snap = await getDocs(
    collection(db, "users", user.uid, "corrections")
  );

  if (snap.empty) {
    listEl.innerHTML =
      `<p style="opacity:.6;">No incorrect questions found.</p>`;
    return;
  }

  listEl.innerHTML = "";

  let index = 1;
  snap.forEach(docSnap => {
    const q = docSnap.data();

    const block = document.createElement("div");
    block.className = "question-block";

    block.innerHTML = `
      <div class="question-header">
        <span>Q${index}. ${q.text}</span>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>

      <div class="question-body">
        <p class="full-question">${q.text}</p>

        <div class="options">
          ${q.options.map(opt => {
  let cls = "";
  if (opt === q.correctAnswer) cls = "correct";
  if (opt === q.selectedOption) cls = "wrong";
            return `<div class="option ${cls}">${opt}</div>`;
          }).join("")}
        </div>
      </div>
    `;

    listEl.appendChild(block);
    index++;
  });

  // expand collapse
  document.querySelectorAll(".question-header").forEach(h => {
    h.onclick = () => h.parentElement.classList.toggle("active");
  });
});