document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("aboutContactForm");
  if (!form) return;

  let locked = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (locked) return;

    const btn = form.querySelector("button");
    locked = true;

    btn.disabled = true;
    btn.innerText = "Sending...";

    const data = {
      name: document.getElementById("aboutName").value.trim(),
      email: document.getElementById("aboutEmail").value.trim(),
      subject: "About Page Contact",
      message: document.getElementById("aboutMessage").value.trim(),
      type: "about-page"
    };

    try {
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

      /* ✅ SHOW SAME POPUP */
      const successModal = document.getElementById("contactSuccess");
      successModal?.classList.add("active");

    } catch (err) {
      console.error("About contact error:", err);
      alert("Something went wrong. Try again.");
    }

    locked = false;
    btn.disabled = false;
    btn.innerHTML = "Send Message";
  });

  /* =========================
     SUCCESS MODAL CONTROL
  ========================= */
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
});