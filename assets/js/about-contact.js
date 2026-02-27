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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      let result = {};
      try { result = await res.json(); } catch {}

      if (!res.ok) {
        throw new Error(result.error || "Server error");
      }

      form.reset();

      showToast("Message sent successfully");

    } catch (err) {
      console.error("About contact error:", err);
      showToast("Failed to send message");
    }

    locked = false;
    btn.disabled = false;
    btn.innerHTML = "Send Message";
  });

  /* ===== toast ===== */
  function showToast(text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span>${text}</span>`;
    document.body.appendChild(t);

    setTimeout(() => t.classList.add("show"), 50);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, 2400);
  }
});