export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, title, desc, phone, isPremium } = req.body;

    if (!type || !title || !desc || !phone) {
      return res.status(400).json({ error: "Missing fields" });
    }

    /* =========================
       SEND EMAIL (RESEND)
    ========================= */

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "PathCA Support <onboarding@resend.dev>",
        to: ["contact.globalratings@gmail.com"],
        subject: `New Support Request — ${type}`,
        html: `
<div style="
  max-width:560px;
  margin:20px auto;
  background:#ffffff;
  color:#111827;
  border-radius:14px;
  padding:26px;
  font-family: Arial, Helvetica, sans-serif;
  border:1px solid #e5e7eb;
">

  <div style="text-align:center;margin-bottom:18px;">
    <img src="https://pathca.vercel.app/assets/favicon/logo.png"
         width="110"
         style="border-radius:6px;">
  </div>

  <h3 style="text-align:center;margin-bottom:18px;">
    New Support Request
  </h3>

  <div style="background:#f9fafb;padding:12px;border-radius:10px;margin-bottom:10px;">
    <b>Request Type:</b> ${type}
  </div>

  <div style="background:#f9fafb;padding:12px;border-radius:10px;margin-bottom:10px;">
    <b>Title:</b> ${title}
  </div>

  <div style="background:#f9fafb;padding:12px;border-radius:10px;margin-bottom:10px;">
    <b>Phone:</b> ${phone}
  </div>

  <div style="background:#f9fafb;padding:12px;border-radius:10px;margin-bottom:10px;">
    <b>User Tier:</b> ${isPremium ? "⭐ Premium" : "Free"}
  </div>

  <div style="
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:14px;
    margin-top:14px;
    line-height:1.6;
  ">
    ${desc.replace(/\n/g, "<br>")}
  </div>

  <div style="
    text-align:center;
    font-size:12px;
    color:#6b7280;
    margin-top:18px;
    border-top:1px solid #e5e7eb;
    padding-top:12px;
  ">
    Sent via <b style="color:#4f46e5;">PathCA Request Support</b>
  </div>

</div>
`
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error("Resend error:", txt);
      return res.status(500).json({ error: "Email failed" });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}