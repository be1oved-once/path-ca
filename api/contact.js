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
       SEND EMAIL (RESEND)
       ✨ NEW PROFESSIONAL DESIGN ✨
    ========================= */
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "PathCA Contact <onboarding@resend.dev>",
        to: ["contact.globalratings@gmail.com"],
        reply_to: email,
        subject: `📬 ${subject || "New Contact Message"} — PathCA`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Contact Form Submission</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  
  <!-- Main Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        
        <!-- Email Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">
          
          <!-- Header Gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff 0%,#3b82f6 50%,#8b5cf6 100%);padding:32px 24px;text-align:center;">
              
              <!-- Logo Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:12px;">
                    <img src="https://pathca.vercel.app/assets/favicon/logo.png" alt="PathCA" width="48" height="48" style="display:block;border-radius:8px;">
                  </td>
                </tr>
              </table>
              
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">New Message Received</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Contact Form Submission</p>
              
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding:32px 24px;">
              
              <!-- Sender Info Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border-radius:12px;margin-bottom:20px;border-left:4px solid #6c63ff;">
                <tr>
                  <td style="padding:20px;">
                    
                    <!-- Name Row -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
                      <tr>
                        <td width="24" style="vertical-align:top;">
                          <span style="display:inline-block;width:24px;height:24px;background:linear-gradient(135deg,#6c63ff,#8b5cf6);border-radius:6px;text-align:center;line-height:24px;color:#ffffff;font-size:12px;">
                            <b>N</b>
                          </span>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">From</p>
                          <p style="margin:2px 0 0;font-size:15px;color:#111827;font-weight:600;">${name}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Email Row -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
                      <tr>
                        <td width="24" style="vertical-align:top;">
                          <span style="display:inline-block;width:24px;height:24px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:6px;text-align:center;line-height:24px;color:#ffffff;font-size:12px;">
                            <b>@</b>
                          </span>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Email</p>
                          <a href="mailto:${email}" style="margin:2px 0 0;font-size:15px;color:#2563eb;text-decoration:none;font-weight:500;display:inline-block;">${email}</a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Subject Row -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="24" style="vertical-align:top;">
                          <span style="display:inline-block;width:24px;height:24px;background:linear-gradient(135deg,#f59e0b,#f97316);border-radius:6px;text-align:center;line-height:24px;color:#ffffff;font-size:12px;">
                            <b>S</b>
                          </span>
                        </td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Subject</p>
                          <p style="margin:2px 0 0;font-size:15px;color:#111827;font-weight:600;">${subject || "General Inquiry"}</p>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
              
              <!-- Message Section -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Message</p>
                    
                    <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;font-size:14px;line-height:1.7;color:#374151;">
                      ${message.replace(/\n/g, "<br>").replace(/\*{2}(.*?)\*{2}/g, "<b>$1</b>").replace(/\*(.*?)\*/g, "<i>$1</i>")}
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Quick Actions -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 12px;font-size:12px;color:#6b7280;">Quick Actions</p>
                    
                    <a href="mailto:${email}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#3b82f6);color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;margin-right:8px;">Reply to Sender</a>
                    
                    <a href="https://pathca.vercel.app/admin" style="display:inline-block;background-color:#f3f4f6;color:#374151;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;">Open Dashboard</a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb;">
              
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
                <b style="color:#6c63ff;">PathCA</b> — Empowering Your Journey
              </p>
              
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                Received on ${new Date().toLocaleString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </p>
              
            </td>
          </tr>
          
        </table>
        
        <!-- Gmail Optimized Spacer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                This email was sent from your website contact form
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
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
