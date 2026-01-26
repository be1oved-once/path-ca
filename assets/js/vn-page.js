import { db } from "/assets/js/firebase.js";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ----------------------------
   LOAD VOICE NOTES REALTIME
-----------------------------*/
/* =========================
   LOGIN REQUIRED TOAST
========================= */
// ===== GLOBAL AUDIO ENGINE =====
const globalAudio = new Audio();
let currentPlayingId = null;
let currentCardRef = null;
let lastOpenedCardId = null;
const INSTAGRAM_MODE = "D"; 

function requireLoginToast() {
  const confirmToast  = document.getElementById("confirmToast");
  const confirmText   = document.getElementById("confirmText");
  const confirmYes    = document.getElementById("confirmYes");
  const confirmCancel = document.getElementById("confirmCancel");
  const toastBackdrop = document.getElementById("toastBackdrop");

  confirmText.textContent = "Login required to continue";

  confirmCancel.textContent = "Login";
  confirmYes.textContent = "Sign Up";

  confirmToast.classList.add("show");
  toastBackdrop.classList.add("show");

  confirmCancel.onclick = () => {
    confirmToast.classList.remove("show");
    toastBackdrop.classList.remove("show");
    openAuth("login");
  };

  confirmYes.onclick = () => {
    confirmToast.classList.remove("show");
    toastBackdrop.classList.remove("show");
    openAuth("signup");
  };
}

const vnList = document.getElementById("vnList");

const q = query(
  collection(db,"voiceNotes"),
  orderBy("createdAt","desc")
);

let lastOpenId = null;
let lastAudioTime = 0;
const cardMap = {}; // id -> card reference

onSnapshot(q, (snap) => {
  snap.forEach(docSnap => {
    const id = docSnap.id;
    const data = docSnap.data();
    
    // --- If card does not exist → create once
    if (!cardMap[id]) {
      const card = createVoiceCard(data);
      card.dataset.id = id;
      vnList.appendChild(card);
      
      attachPlayerLogic(card);
      attachCommentsButton(card, id);
      
      cardMap[id] = card;
    }
    
    // --- Update only vote UI (no rebuild)
    attachVoteLogic(cardMap[id], id, data);
    
    // --- Update vote numbers text only
    cardMap[id].querySelector(".vote-btn.up span").textContent = data.up || 0;
    cardMap[id].querySelector(".vote-btn.down span").textContent = data.down || 0;
  });
});
function attachVoteLogic(card, id, data){

  const upBtn = card.querySelector(".vote-btn.up");
  const downBtn = card.querySelector(".vote-btn.down");

  const user = window.currentUser;
  const uid = user ? user.uid : null;
  const userVote =
    uid && data.voters && data.voters[uid]
      ? data.voters[uid]
      : null;

  // initial UI state
  if(userVote==="up"){
    upBtn.classList.add("active");
    upBtn.querySelector("i").className="fa-solid fa-thumbs-up";
  }
  if(userVote==="down"){
    downBtn.classList.add("active");
    downBtn.querySelector("i").className="fa-solid fa-thumbs-down";
  }

  upBtn.onclick = (e)=>{
  e.stopPropagation();
  handleVoiceVote(id,"up");
};

downBtn.onclick = (e)=>{
  e.stopPropagation();
  handleVoiceVote(id,"down");
};
}
function stopAllAudioInstances(){
  document.querySelectorAll(".vn-card").forEach(card=>{
    if(card.audioInstance){
      card.audioInstance.pause();
      card.audioInstance.src = ""; // release object
      card.audioInstance = null;
    }
  });
  currentlyPlayingCard = null;
}
/* ----------------------------
   CREATE CARD UI
-----------------------------*/

function createVoiceCard(data){

  const card = document.createElement("div");
  card.className="vn-card";
  card.dataset.id = data.id || "";
  card.dataset.audio = data.audioURL;

  const singer = data.name || "Unknown";
  const igText = data.ig ? "Get Instagram" : "Instagram not provided";

  card.innerHTML = `
    <div class="vn-collapsed">
      <div class="vn-left">
        <div class="vn-wave">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div class="vn-info">
        <h4>${escapeHTML(data.title)}</h4>
        <span class="vn-sub">Tap to listen</span>
      </div>
      <div class="vn-arrow">
        <i class="fa-solid fa-chevron-down"></i>
      </div>
    </div>

    <div class="vn-expanded">
      <div class="vn-player">
        <button class="vn-play-btn">
          <i class="fa-solid fa-play"></i>
        </button>

        <div class="vn-progress">
          <div class="vn-progress-bar">
            <div class="vn-progress-fill"></div>
            <div class="vn-progress-handle"></div>
          </div>
          <div class="vn-time">00:00 / 00:00</div>
        </div>
      </div>

      <div class="vn-caption">
        – By ${escapeHTML(singer)}
      </div>

      ${data.ig ? `
  <a class="vn-cta" target="_blank"
     href="https://instagram.com/${data.ig.replace('@','')}"
     rel="noopener">
     Get Her Instagram
     <i class="fa-brands fa-instagram"></i>
  </a>
` : `
  <div class="vn-cta vn-cta-disabled">
     Instagram not provided
  </div>
`}
<div class="vn-actions">

  <div class="vn-votes">
    <button class="vote-btn up">
      <i class="fa-regular fa-thumbs-up"></i>
      <span>${data.up || 0}</span>
    </button>

    <button class="vote-btn down">
      <i class="fa-regular fa-thumbs-down"></i>
      <span>${data.down || 0}</span>
    </button>
    <button class="vn-comment-btn">
    <i class="fa-regular fa-comment"></i>
  </button>
  </div>

  <!-- Comment Icon -->

</div>
    </div>
  `;

  return card;
}
function stopAllOtherPlayers(currentCard){
  document.querySelectorAll(".vn-card").forEach(c=>{
    if(c !== currentCard && c.audioInstance){
      c.audioInstance.pause();
      c.querySelector(".vn-play-btn i").className="fa-solid fa-play";
    }
  });
}
/* ----------------------------
   AUDIO PLAYER LOGIC
-----------------------------*/
let currentlyPlayingCard = null;

function attachPlayerLogic(card){

  const header = card.querySelector(".vn-collapsed");
  const playBtn = card.querySelector(".vn-play-btn");
  const playIcon = playBtn.querySelector("i");
  const progressFill = card.querySelector(".vn-progress-fill");
  const progressHandle = card.querySelector(".vn-progress-handle");
  const timeText = card.querySelector(".vn-time");

const audioSrc = card.dataset.audio;
// --- Preload duration once ---
const metaAudio = new Audio(audioSrc);
metaAudio.addEventListener("loadedmetadata", () => {
  timeText.textContent = "00:00 / " + formatTime(metaAudio.duration);
});

  globalAudio.addEventListener("loadedmetadata", ()=>{
  if(currentPlayingId === card.dataset.id){
    timeText.textContent="00:00 / "+formatTime(globalAudio.duration);
  }
});

header.addEventListener("click", () => {
  
  // Close others
  document.querySelectorAll(".vn-card.active").forEach(c => {
    if (c !== card) c.classList.remove("active");
  });
  
  // Toggle this one
  card.classList.toggle("active");
});
  
playBtn.addEventListener("click", e=>{
  e.stopPropagation();

  // If another song was playing → stop & reset it
  if(currentPlayingId && currentPlayingId !== card.dataset.id){
    const prevCard = document.querySelector(`.vn-card[data-id="${currentPlayingId}"]`);
    if(prevCard){
      const prevFill = prevCard.querySelector(".vn-progress-fill");
      const prevHandle = prevCard.querySelector(".vn-progress-handle");
      const prevTime = prevCard.querySelector(".vn-time");
      const prevIcon = prevCard.querySelector(".vn-play-btn i");

      prevFill.style.width="0%";
      prevHandle.style.left="0%";
      prevTime.textContent = prevTime.textContent.split("/")[0].replace(/.*/,"00:00")+" / "+prevTime.textContent.split("/")[1];
      prevIcon.className="fa-solid fa-play";
    }
  }

  // If new song clicked
  if(currentPlayingId !== card.dataset.id){
    globalAudio.src = audioSrc;
    globalAudio.currentTime = 0;
    currentPlayingId = card.dataset.id;
  }

  if(globalAudio.paused){
    globalAudio.play();
    playIcon.className="fa-solid fa-pause";
  } else {
    globalAudio.pause();
    playIcon.className="fa-solid fa-play";
    currentPlayingId = null;
  }
});

globalAudio.addEventListener("timeupdate", ()=>{
  if(currentPlayingId !== card.dataset.id) return;

  const p = (globalAudio.currentTime/globalAudio.duration)*100;
  progressFill.style.width = p + "%";
  progressHandle.style.left = p + "%";
  timeText.textContent =
    formatTime(globalAudio.currentTime)+" / "+
    formatTime(globalAudio.duration);
});

  globalAudio.addEventListener("ended", () => {
  if (currentPlayingId === card.dataset.id) {
    playIcon.className = "fa-solid fa-play";
    progressFill.style.width = "0%";
    progressHandle.style.left = "0%";
    currentPlayingId = null;
    currentCardRef = null;
  }
});
}

/* ----------------------------
   HELPERS
-----------------------------*/

function formatTime(sec){
  sec=Math.floor(sec);
  const m=Math.floor(sec/60);
  const s=sec%60;
  return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
}

function escapeHTML(t){
  const d=document.createElement("div");
  d.textContent=t;
  return d.innerHTML;
}


/* =======================================================
   FLOATING "+ Sing Yours" + UPLOAD MODAL
=======================================================*/

const floatBtn = document.getElementById("vnFloatBtn");
const uploadModal = document.getElementById("vnUploadModal");
const closeUpload = document.getElementById("vnUploadClose");

floatBtn.addEventListener("click",()=>{
  uploadModal.classList.add("show");
  document.body.style.overflow="hidden";
});

closeUpload.addEventListener("click",()=>{
  uploadModal.classList.remove("show");
  document.body.style.overflow="";
});

/* Preview player */
const audioInput = document.getElementById("vnAudioFile");
const audioPreview = document.getElementById("vnPreviewAudio");

const previewWrap = document.getElementById("vnPreviewWrap");
const previewAudio = document.getElementById("vnPreviewAudio");
const previewPlayBtn = document.getElementById("vnPreviewPlayBtn");
const previewPlayIcon = previewPlayBtn.querySelector("i");
const previewFill = document.querySelector(".vn-preview-fill");
const previewHandle = document.querySelector(".vn-preview-handle");
const previewTime = document.getElementById("vnPreviewTime");

audioInput.addEventListener("change",()=>{
  const file = audioInput.files[0];
  if(!file) return;

  previewAudio.src = URL.createObjectURL(file);
  previewWrap.style.display="flex";

  previewAudio.addEventListener("loadedmetadata",()=>{
    previewTime.textContent =
      "00:00 / " + formatTime(previewAudio.duration);
  });
});

/* Play / Pause */
previewPlayBtn.addEventListener("click",()=>{
  if(previewAudio.paused){
    previewAudio.play();
    previewPlayIcon.className="fa-solid fa-pause";
  } else {
    previewAudio.pause();
    previewPlayIcon.className="fa-solid fa-play";
  }
});

/* Progress */
previewAudio.addEventListener("timeupdate",()=>{
  const p = (previewAudio.currentTime / previewAudio.duration)*100;
  previewFill.style.width = p + "%";
  previewHandle.style.left = p + "%";
  previewTime.textContent =
    formatTime(previewAudio.currentTime)+" / "+
    formatTime(previewAudio.duration);
});

previewAudio.addEventListener("ended",()=>{
  previewPlayIcon.className="fa-solid fa-play";
  previewFill.style.width="0%";
  previewHandle.style.left="0%";
});

/* ----------------------------
   PUBLISH VOICE NOTE
-----------------------------*/

const publishBtn = document.getElementById("vnPublishBtn");
const statusText = document.getElementById("vnUploadStatus");

publishBtn.addEventListener("click",async ()=>{
const user = window.currentUser;
if (!user){
  requireLoginToast();
  return;
}

  const songName = document.getElementById("vnSongName").value.trim();
  const singerName = document.getElementById("vnSingerName").value.trim();
  const igId = document.getElementById("vnIg").value.trim();
  const file = audioInput.files[0];

  if(!songName || !file){
    statusText.textContent="Song name & audio required";
    return;
  }

  statusText.textContent="Uploading audio...";

  const audioURL = await uploadAudioToCloudinary(file);

  statusText.textContent="Publishing...";

  await addDoc(collection(db,"voiceNotes"),{
  title: songName,
  name: singerName || "Anonymous",
  ig: igId || "",
  audioURL: audioURL,
  createdAt: serverTimestamp(),

  // 🔥 voting fields
  up: 0,
  down: 0,
  voters: {}
});

  statusText.textContent="Published";
  statusText.style.color="green";

  setTimeout(()=>{
    uploadModal.classList.remove("show");
    document.body.style.overflow="";
    resetUploadForm();
  },1000);
});


/* ----------------------------
   RESET FORM
-----------------------------*/

function resetUploadForm(){
  document.getElementById("vnSongName").value="";
  document.getElementById("vnSingerName").value="";
  document.getElementById("vnIg").value="";
  audioInput.value="";
  audioPreview.style.display="none";
  statusText.textContent="";
  previewWrap.style.display="none";
previewAudio.src="";
previewPlayIcon.className="fa-solid fa-play";
previewFill.style.width="0%";
previewHandle.style.left="0%";
}


/* ----------------------------
   CLOUDINARY UPLOAD
-----------------------------*/

const CLOUD_NAME="dhjjtjbur";
const UPLOAD_PRESET="VoiceNotes";

async function uploadAudioToCloudinary(file){
  const form=new FormData();
  form.append("file",file);
  form.append("upload_preset",UPLOAD_PRESET);

  const res = await fetch(
   `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
   {method:"POST",body:form}
  );

  const data = await res.json();
  return data.secure_url;
}
async function handleVoiceVote(docId, type){

  const user = window.currentUser;
  if (!user){
    requireLoginToast(); 
    return;
  }

  const uid = user.uid;
  const ref = doc(db,"voiceNotes",docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const voters = data.voters || {};
  let up = data.up || 0;
  let down = data.down || 0;
  const prev = voters[uid];

  // remove previous counts
  if (prev === "up") up--;
  if (prev === "down") down--;

  // toggle
  if (prev === type){
    delete voters[uid];
  } else {
    voters[uid] = type;
    if (type === "up") up++;
    if (type === "down") down++;
  }

  // 🔥 UPDATE UI INSTANTLY
  const card = document.querySelector(`.vn-card[data-id="${docId}"]`);
  if(card){
    const upBtn = card.querySelector(".vote-btn.up");
    const downBtn = card.querySelector(".vote-btn.down");

    upBtn.classList.toggle("active", voters[uid]==="up");
    downBtn.classList.toggle("active", voters[uid]==="down");

    upBtn.querySelector("i").className =
      voters[uid]==="up" ? "fa-solid fa-thumbs-up" : "fa-regular fa-thumbs-up";

    downBtn.querySelector("i").className =
      voters[uid]==="down" ? "fa-solid fa-thumbs-down" : "fa-regular fa-thumbs-down";

    upBtn.querySelector("span").textContent = up;
    downBtn.querySelector("span").textContent = down;
  }

  // 🔥 BACKGROUND FIRESTORE UPDATE
  await updateDoc(ref,{ up, down, voters });
}
/* =======================================================
   VOICE NOTE COMMENTS SYSTEM (WITH REPLIES + REAL USERNAME)
=======================================================*/

let currentVoiceId = null;

const vnCommentsPanel = document.getElementById("vnCommentsPanel");
const vnCommentsClose = document.getElementById("vnCommentsClose");
const vnCommentsList  = document.getElementById("vnCommentsList");
const vnCommentInput  = document.getElementById("vnCommentInput");
const vnCommentSendBtn = document.getElementById("vnCommentSendBtn");
const vnCommentNameDisplay = document.getElementById("vnCommentNameDisplay");

vnCommentsClose.onclick = ()=>{
  vnCommentsPanel.classList.remove("show");
  document.body.style.overflow="";
};

/* ---------- Get real username from Firestore ---------- */
async function getCurrentUsername(){
  const user = window.currentUser;
  if(!user) return "Anonymous";

  const ref = doc(db,"users",user.uid);
  const snap = await getDoc(ref);
  if(!snap.exists()) return "Anonymous";

  return snap.data().username || "Anonymous";
}

/* ---------- Open comments panel ---------- */
function attachCommentsButton(card, voiceId){
  const btn = card.querySelector(".vn-comment-btn");
  btn.onclick = async ()=>{
    currentVoiceId = voiceId;
    vnCommentsPanel.classList.add("show");
    document.body.style.overflow="hidden";

    // Set real username in input header
    vnCommentNameDisplay.textContent = await getCurrentUsername();

    loadVoiceCommentsRealtime();
  };
}

/* ---------- Send primary comment ---------- */
vnCommentSendBtn.onclick = async ()=>{

  const user = window.currentUser;
  if(!user){
    requireLoginToast();
    return;
  }

  const text = vnCommentInput.value.trim();
  if(!text) return;

  const name = await getCurrentUsername();

  await addDoc(
    collection(db,"voiceNotes",currentVoiceId,"comments"),
    {
      uid: user.uid,
      name,
      text,
      parent: null,
      createdAt: serverTimestamp()
    }
  );

  vnCommentInput.value="";
};

/* ---------- Load comments realtime ---------- */
function loadVoiceCommentsRealtime(){

  const q = query(
    collection(db,"voiceNotes",currentVoiceId,"comments"),
    orderBy("createdAt","asc")
  );

  onSnapshot(q,(snap)=>{

    vnCommentsList.innerHTML="";
    const all=[];

    snap.forEach(d=>{
      all.push({id:d.id,...d.data()});
    });

    // Render only primary comments
    all.filter(c=>!c.parent).forEach(c=>{
      const el = renderVoiceComment(c, all);
      vnCommentsList.appendChild(el);
    });
  });
}

/* ---------- Render comment + replies ---------- */
function renderVoiceComment(comment, all){

  const div = document.createElement("div");
  div.className="comment-item";

  div.innerHTML = `
    <div class="comment-author">${escapeHTML(comment.name)}</div>
    <div class="comment-text">${escapeHTML(comment.text).replace(/\n/g,"<br>")}</div>
    <div class="comment-reply-btn">Reply</div>
    <div class="comment-replies"></div>
  `;

  const replyBtn = div.querySelector(".comment-reply-btn");
  const repliesBox = div.querySelector(".comment-replies");

  /* ---- Reply input box ---- */
  replyBtn.onclick = async ()=>{

    if(repliesBox.querySelector(".comment-write-box")) return;

    const box = document.createElement("div");
    box.className="comment-write-box reply";

    const username = await getCurrentUsername();

    box.innerHTML = `
      <div class="reply-name-display">${escapeHTML(username)}</div>
      <div class="comment-input-wrap">
        <textarea class="reply-textarea" placeholder="Write a reply..."></textarea>
        <button class="reply-send-btn">
          <i class="fa-solid fa-arrow-up"></i>
        </button>
      </div>
    `;

    repliesBox.prepend(box);

    const textarea = box.querySelector(".reply-textarea");
    const sendBtn = box.querySelector(".reply-send-btn");

    sendBtn.onclick = async ()=>{

      const user = window.currentUser;
      if(!user){
        requireLoginToast();
        return;
      }

      const text = textarea.value.trim();
      if(!text) return;

      const name = await getCurrentUsername();

      await addDoc(
        collection(db,"voiceNotes",currentVoiceId,"comments"),
        {
          uid:user.uid,
          name,
          text,
          parent: comment.id,
          createdAt: serverTimestamp()
        }
      );
    };
  };

  /* ---- Render existing replies ---- */
  all.filter(r=>r.parent === comment.id).forEach(r=>{
    const rDiv = document.createElement("div");
    rDiv.className="comment-item reply";
    rDiv.innerHTML = `
      <div class="comment-author">${escapeHTML(r.name)}</div>
      <div class="comment-text">${escapeHTML(r.text).replace(/\n/g,"<br>")}</div>
    `;
    repliesBox.appendChild(rDiv);
  });

  return div;
}
/* =====================================================
   INSTAGRAM CTA → LOGIN OR SUBSCRIPTION
===================================================== */

document.addEventListener("click", (e)=>{

  const igBtn = e.target.closest(".vn-cta");
  if(!igBtn) return;

  e.preventDefault();

  const user = window.currentUser;

  // Not logged → login
  if(!user){
    requireLoginToast();
    return;
  }

  // ===== MODE SWITCH =====
  if(INSTAGRAM_MODE === "D"){
    // Directly open Instagram link
    window.open(igBtn.href, "_blank");
    return;
  }

  // Default → Subscription Flow
  openSubModal();
});


/* =====================================================
   SUBSCRIPTION MODAL LOGIC
===================================================== */

const subModal      = document.getElementById("subModal");
const subClose      = document.getElementById("subClose");
const subPayBtn     = document.getElementById("subPayBtn");
const subPayFlow    = document.getElementById("subPayFlow");
const paymentFile   = document.getElementById("paymentFile");
const fileNameLabel = document.getElementById("fileName");
const submitPayBtn  = document.getElementById("submitPaymentBtn");
const subStatus     = document.getElementById("subStatus");

function openSubModal(){
  subModal.classList.add("show");
  document.body.style.overflow="hidden";
}

function closeSubModal(){
  subModal.classList.remove("show");
  document.body.style.overflow="";
  
  // reset UI
  subPayFlow.classList.remove("show");
  subPayBtn.style.display="block";
  subStatus.textContent="";
  paymentFile.value="";
  fileNameLabel.textContent="No file chosen";
}

/* close by X */
subClose.onclick = closeSubModal;

/* close by clicking outside card */
subModal.addEventListener("click",(e)=>{
  if(e.target === subModal){
    closeSubModal();
  }
});


/* =====================================================
   SUBSCRIBE NOW → SHOW QR FLOW
===================================================== */

subPayBtn.onclick = ()=>{
  subPayBtn.style.display="none";
  subPayFlow.classList.add("show");
};


/* =====================================================
   FILE PICKER NAME SHOW
===================================================== */

paymentFile.addEventListener("change",()=>{
  if(paymentFile.files[0]){
    fileNameLabel.textContent = paymentFile.files[0].name;
  } else {
    fileNameLabel.textContent = "No file chosen";
  }
});


/* =====================================================
   SUBMIT PAYMENT → CLOUDINARY UPLOAD
===================================================== */

submitPayBtn.onclick = async ()=>{

  const file = paymentFile.files[0];
  if(!file){
    subStatus.textContent = "Please select screenshot";
    return;
  }

  subStatus.textContent = "Submitting...";

  try{
    const user = window.currentUser;
    const uid = user.uid;
    const email = user.email;

    const userSnap = await getDoc(doc(db,"users",uid));
    const username = userSnap.exists() ? userSnap.data().username : "unknown";

    // 🔥 Upload to Cloudinary PaymentsScreenshots folder
    const imgURL = await uploadImageToCloudinary(file, username, email);

    // 🔥 Save in Firestore
    await addDoc(collection(db,"paymentProofs"),{
      uid,
      username,
      email,
      screenshot: imgURL,
      createdAt: serverTimestamp()
    });

    subStatus.textContent = "Submitted ✔";

    setTimeout(()=>{
      closeSubModal();
    },1200);

  } catch(err){
    console.error(err);
    subStatus.textContent = "Upload failed";
  }
};

/* =====================================================
   CLOUDINARY IMAGE UPLOAD
===================================================== */

async function uploadImageToCloudinary(file, username, email){

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  // 🔥 Cloudinary options
  form.append("folder", "PaymentsScreenshots");

  // clean filename
  const cleanUser = username.replace(/\s+/g,"_");
  const cleanEmail = email.replace(/[@.]/g,"_");
  form.append("public_id", `${cleanUser}_${cleanEmail}_${Date.now()}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method:"POST", body:form }
  );

  const data = await res.json();
  return data.secure_url;
}