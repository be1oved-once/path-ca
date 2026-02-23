document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  let locked = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (locked) return;

    const token = document.querySelector(
      'input[name="cf-turnstile-response"]'
    )?.value;

    if (!token) {
      showToast("Please verify captcha");
      return;
    }

    locked = true;

    const btn = form.querySelector("button");
    btn.disabled = true;
    btn.innerText = "Sending...";

    const data = {
  name: document.getElementById("contactName").value.trim(),
  email: document.getElementById("contactEmail").value.trim(),
  subject: document.getElementById("contactSubject").value.trim(),
  message: document.getElementById("contactMessage").value.trim(),
  token
};

    try {
      /* =======================
         ONLY CALL YOUR API
      ======================= */
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      let result = {};
      try { result = await res.json(); } catch {}

      if (!res.ok) {
        throw new Error(result.error || "Server error");
      }

form.reset();

const successModal = document.getElementById("contactSuccess");
successModal?.classList.add("active");

if (window.turnstile) {
  turnstile.reset();
}

      if (window.turnstile) {
        turnstile.reset();
      }

    } catch (err) {
      console.error("Contact error:", err);
      showToast("Something went wrong. Try again.");
    }

    locked = false;
    btn.disabled = false;
    btn.innerHTML = `
      <i class="fa-solid fa-paper-plane"></i>
      <span>Send Message</span>
    `;
  });

  /* ===== TOAST ===== */
  function showToast(text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `
      <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ec.svg">
      <span>${text}</span>
    `;

    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 50);

    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, 2400);
  }
});

// ===== SUCCESS MODAL CONTROL =====
const contactSuccess = document.getElementById("contactSuccess");
const contactSuccessOk = document.getElementById("successOk");

contactSuccessOk?.addEventListener("click", () => {
  contactSuccess.classList.remove("active");
});

contactSuccess?.addEventListener("click", (e) => {
  if (e.target === contactSuccess) {
    contactSuccess.classList.remove("active");
  }
});