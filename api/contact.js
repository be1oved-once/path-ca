export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, subject, message, token } = req.body;

    // Basic validation
    if (!name || !message) {
  return res.status(400).json({ error: "Missing fields" });
}

// If this is normal contact form → require email + captcha
const isVoiceFeedback = subject === "Voice Note Feedback";

// Normal contact form validation
/* =========================
   VERIFY CLOUDFLARE TURNSTILE
   (ONLY for normal contact form)
========================= */
if (!isVoiceFeedback) {
  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET,
        response: token
      })
    }
  );

  const verifyData = await verifyRes.json();

  if (!verifyData.success) {
    return res.status(403).json({ error: "Captcha failed" });
  }
}

    /* =========================
       VERIFY CLOUDFLARE TURNSTILE
    ========================= *

    /* =========================
       SEND EMAIL (RESEND)
       ✨ STYLING UNCHANGED ✨
    ========================= */
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Contact Form <onboarding@resend.dev>",
        to: ["contact.globalratings@gmail.com"],
        reply_to: email,
        subject: subject || "New Contact Message",
html: `
<div style="
  max-width:560px;
  margin:20px auto;
  background:#ffffff;
  color:#111827;
  border-radius:14px;
  padding:26px;
  font-family: 'Overpass', Arial, Helvetica, sans-serif;
  border:1px solid #e5e7eb;
">

  <!-- LOGO -->
  <div style="text-align:center;margin-bottom:18px;">
    <img src="https://pathca.vercel.app/assets/favicon/logo.png"
         alt="PathCA"
         width="110"
         style="display:inline-block;border-radius:6px;">
  </div>

  <h3 style="
    margin:0 0 18px;
    font-size:18px;
    color:#111827;
    text-align:center;
    letter-spacing:0.3px;
  ">
    New Contact Message
  </h3>

  <!-- FIELD BOXES -->
  <div style="
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:12px;
    margin-bottom:10px;
    background:#f9fafb;
    font-size:14px;
  ">
    <b>Name:</b> ${name}
  </div>

  <div style="
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:12px;
    margin-bottom:10px;
    background:#f9fafb;
    font-size:14px;
  ">
    <b>Email:</b>
    <a href="mailto:${email}" style="color:#2563eb;text-decoration:none;">
      ${email}
    </a>
  </div>

  <div style="
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:12px;
    margin-bottom:10px;
    background:#f9fafb;
    font-size:14px;
  ">
    <b>Subject:</b> ${subject || "—"}
  </div>

  <div style="
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:14px;
    margin-bottom:16px;
    background:#ffffff;
    font-size:14px;
    line-height:1.6;
    color:#111827;
  ">
    ${message.replace(/\n/g, "<br>")}
  </div>

  <div style="
    text-align:center;
    font-size:12px;
    color:#6b7280;
    border-top:1px solid #e5e7eb;
    padding-top:14px;
    letter-spacing:0.2px;
  ">
    Message received via <b style="color:#4f46e5;">PathCA</b> Contact Form
  </div>

</div>
`
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend error:", errText);
      return res.status(500).json({ error: "Email failed" });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}