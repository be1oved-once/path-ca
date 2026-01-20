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
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!token) {
      return res.status(400).json({ error: "Captcha missing" });
    }

    /* =========================
       VERIFY CLOUDFLARE TURNSTILE
    ========================= */
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
  background:#0f172a;
  color:#e5e7eb;
  border-radius:14px;
  padding:26px;
  font-family:Arial,Helvetica,sans-serif;
">

  <!-- LOGO -->
  <div style="text-align:center;margin-bottom:18px;">
    <img src="https://pathca.vercel.app/assets/favicon/logo.png"
         alt="PathCA"
         width="110"
         style="display:inline-block;border-radius:6px;">
  </div>

  <hr style="border:none;border-top:1px solid #1e293b;margin:14px 0 18px;">

  <h3 style="
    margin:0 0 14px;
    font-size:17px;
    color:#f8fafc;
    letter-spacing:0.3px;
    text-align:center;
  ">
    New Contact Message
  </h3>

  <p style="margin:6px 0;font-size:14px;">
    <b>Name:</b> ${name}
  </p>

  <p style="margin:6px 0;font-size:14px;">
    <b>Email:</b>
    <a href="mailto:${email}" style="color:#93c5fd;text-decoration:none;">
      ${email}
    </a>
  </p>

  <p style="margin:6px 0;font-size:14px;">
    <b>Subject:</b> ${subject || "—"}
  </p>

  <div style="
    margin-top:14px;
    padding:14px;
    background:#020617;
    border:1px solid #1e293b;
    border-radius:10px;
    font-size:14px;
    line-height:1.6;
    color:#e2e8f0;
  ">
    ${message.replace(/\n/g, "<br>")}
  </div>

  <hr style="border:none;border-top:1px solid #1e293b;margin:18px 0;">

  <div style="
    font-size:12px;
    color:#94a3b8;
    text-align:center;
    letter-spacing:0.3px;
  ">
    Message received via <b style="color:#c7d2fe;">PathCA</b> Contact Form
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