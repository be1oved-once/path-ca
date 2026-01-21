export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
    }

    const senderName = name?.trim() || "Anonymous";

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
        from: "PathCA Voice Feedback <onboarding@resend.dev>",
        to: ["contact.globalratings@gmail.com"],
        subject: "Voice Note Feedback - PathCA",
        html: `
<div style="
  max-width:520px;
  margin:20px auto;
  background:#ffffff;
  color:#111827;
  border-radius:14px;
  padding:22px;
  font-family:'Overpass', system-ui, Arial,sans-serif;
  border:1px solid #e5e7eb;
">

  <div style="text-align:center;margin-bottom:16px;">
    <img src="https://pathca.vercel.app/assets/favicon/logo.png" width="100">
  </div>

  <h3 style="text-align:center;margin:0 0 14px;">
    New Voice Note Feedback
  </h3>

  <div style="
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:10px;
    margin-bottom:10px;
    background:#f9fafb;
    font-size:14px;
  ">
    <b>Name:</b> ${senderName}
  </div>

  <div style="
    border:1px solid #e5e7eb;
    border-radius:10px;
    padding:14px;
    background:#ffffff;
    font-size:14px;
    line-height:1.6;
  ">
    ${message.replace(/\n/g, "<br>")}
  </div>

  <div style="
    text-align:center;
    font-size:12px;
    color:#6b7280;
    border-top:1px solid #e5e7eb;
    margin-top:14px;
    padding-top:10px;
  ">
    Voice feedback received from PathCA
  </div>

</div>
`
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Resend error:", err);
      return res.status(500).json({ error: "Email failed" });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Voice Feedback API Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}