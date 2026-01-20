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
  max-width:520px;
  margin:20px auto;
  background:#0f172a;
  color:#e5e7eb;
  border-radius:14px;
  padding:22px;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="font-size:22px;font-weight:600;letter-spacing:0.5px;">
    <span style="color:#ffffff;">TIC</span>
    <span style="color:#6366f1;font-weight:700;">.</span>
    <span style="font-size:13px;color:#c7d2fe;">Kar</span>
  </div>

  <hr style="border:none;border-top:1px solid #1e293b;margin:14px 0;">

  <h3 style="margin:10px 0 16px;font-size:16px;color:#f8fafc;">
    New Contact Message
  </h3>

  <p style="margin:6px 0;"><b>Name:</b> ${name}</p>
  <p style="margin:6px 0;">
    <b>Email:</b>
    <a href="mailto:${email}" style="color:#93c5fd;text-decoration:none;">
      ${email}
    </a>
  </p>
  <p style="margin:6px 0;"><b>Subject:</b> ${subject || "—"}</p>

  <div style="
    margin-top:14px;
    padding:12px;
    background:#020617;
    border-radius:10px;
    font-size:14px;
    line-height:1.5;
  ">
    ${message.replace(/\n/g, "<br>")}
  </div>

  <hr style="border:none;border-top:1px solid #1e293b;margin:16px 0;">

  <div style="font-size:12px;color:#94a3b8;text-align:center;">
    Sent via <b>TIC.Kar</b> Contact Form
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