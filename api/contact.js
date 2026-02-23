export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, subject, message, token, type } = req.body;

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
  border-radius:16px;
  padding:28px 26px 26px;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
  border:1px solid #e5e7eb;
  box-shadow:0 10px 28px rgba(0,0,0,0.06);
">

  <!-- LOGO (UNCHANGED GOOD) -->
  <div style="text-align:center;margin-bottom:18px;">
    <img src="https://pathca.vercel.app/assets/favicon/logo.png"
         alt="PathCA"
         width="110"
         style="display:inline-block;border-radius:6px;">
  </div>

  <h3 style="
    margin:0 0 20px;
    font-size:19px;
    color:#111827;
    text-align:center;
    letter-spacing:0.2px;
    font-weight:700;
  ">
    📬 New Contact Message
  </h3>

  <!-- INFO GRID -->
  <div style="
    background:#f8fafc;
    border:1px solid #e5e7eb;
    border-radius:12px;
    padding:16px;
    margin-bottom:18px;
  ">

    <div style="margin-bottom:10px;font-size:14px;">
      <span style="color:#6b7280;font-weight:600;">Name</span><br>
      <span style="color:#111827;font-weight:600;">${name}</span>
    </div>

    <div style="margin-bottom:10px;font-size:14px;">
      <span style="color:#6b7280;font-weight:600;">Email</span><br>
      <a href="mailto:${email}" style="
        color:#2563eb;
        text-decoration:none;
        font-weight:600;
      ">${email}</a>
    </div>

    <div style="font-size:14px;">
      <span style="color:#6b7280;font-weight:600;">Subject</span><br>
      <span style="color:#111827;font-weight:600;">
        ${subject || "—"}
      </span>
    </div>
<div style="
  border:1px solid #e5e7eb;
  border-radius:10px;
  padding:12px;
  margin-bottom:10px;
  background:#f9fafb;
  font-size:14px;
">
  <b>Contact Type:</b> ${type || "—"}
</div>
  </div>

  <!-- ✨ PREMIUM MESSAGE BOX ✨ -->
  <div style="
    border:1px solid #e5e7eb;
    border-radius:14px;
    padding:18px 18px;
    background:linear-gradient(180deg,#ffffff,#fafbff);
    font-size:15px;
    line-height:1.7;
    color:#1f2937;
    white-space:pre-wrap;
    word-break:break-word;
    position:relative;
  ">

    <!-- message label -->
    <div style="
      font-size:11px;
      letter-spacing:0.6px;
      font-weight:700;
      color:#6366f1;
      margin-bottom:8px;
      text-transform:uppercase;
    ">
      Message
    </div>

    <div>
      ${message.replace(/\n/g, "<br>")}
    </div>

  </div>

  <!-- FOOTER (YOUR GOOD PART KEPT) -->
  <div style="
    text-align:center;
    font-size:12px;
    color:#6b7280;
    border-top:1px solid #e5e7eb;
    padding-top:16px;
    margin-top:22px;
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