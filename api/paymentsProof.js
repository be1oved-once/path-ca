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
       📩 SEND EMAIL VIA RESEND
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
        subject: `Payment Notification — ${type}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        
        <table role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-collapse:collapse;">
          
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e5e7eb;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="https://pathca.vercel.app/assets/favicon/logo.png" 
                         alt="PathCA" 
                         width="96" 
                         style="display:block;border-radius:6px;">
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Payment Alert</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              
              <h1 style="margin:0 0 24px 0;font-size:20px;font-weight:600;color:#111827;line-height:1.4;">
                New Payment Submission
              </h1>

              <!-- Details Grid -->
              <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <table role="presentation" style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="width:140px;padding-right:16px;vertical-align:top;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">Request Type</span>
                        </td>
                        <td style="vertical-align:top;">
                          <span style="font-size:14px;color:#111827;font-weight:500;">${type}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <table role="presentation" style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="width:140px;padding-right:16px;vertical-align:top;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">Title</span>
                        </td>
                        <td style="vertical-align:top;">
                          <span style="font-size:14px;color:#111827;">${title}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <table role="presentation" style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="width:140px;padding-right:16px;vertical-align:top;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">Contact</span>
                        </td>
                        <td style="vertical-align:top;">
                          <span style="font-size:14px;color:#111827;font-family:monospace;">${phone}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <table role="presentation" style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="width:140px;padding-right:16px;vertical-align:top;">
                          <span style="font-size:13px;color:#6b7280;font-weight:500;">Account Tier</span>
                        </td>
                        <td style="vertical-align:top;">
                          <span style="display:inline-block;padding:4px 12px;background-color:${isPremium ? '#ecfdf5' : '#f3f4f6'};color:${isPremium ? '#059669' : '#4b5563'};font-size:12px;font-weight:600;border-radius:4px;text-transform:uppercase;letter-spacing:0.3px;">
                            ${isPremium ? 'Premium' : 'Standard'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#fafafa;border-radius:6px;border-left:3px solid #4f46e5;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px 0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Description</p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-line;">${desc.replace(/\n/g, '<br>')}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="font-size:12px;color:#9ca3af;">PathCA Payment System</span>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <span style="font-size:12px;color:#d1d5db;">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Subtle Footer Note -->
        <table role="presentation" style="max-width:600px;width:100%;margin-top:16px;">
          <tr>
            <td style="text-align:center;padding:0 20px;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                This is an automated notification from PathCA.
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
