import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });
}

export async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[MAIL] SMTP not configured, skipping email to:", to);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log("[MAIL] Sent to:", to);
    return true;
  } catch (err) {
    console.error("[MAIL] Failed:", err.message);
    return false;
  }
}

// Pre-built email templates
export function transferPendingEmail({ name, amount, recipientName, transactionRef }) {
  return {
    subject: `Transfer Pending — ${transactionRef}`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0C4B3E;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;font-size:20px;margin:0">DNB</h1>
        </div>
        <div style="background:#fff;border:1px solid #E2E8E7;border-top:none;padding:32px;border-radius:0 0 12px 12px">
          <p style="color:#1A2B2A;font-size:15px;margin:0 0 20px">Hello ${name},</p>
          <p style="color:#5A6B6A;font-size:14px;line-height:1.6;margin:0 0 20px">
            Your SEPA transfer has been submitted and is pending approval.
          </p>
          <div style="background:#F8FAFB;border:1px solid #E2E8E7;border-radius:8px;padding:20px;margin:0 0 20px">
            <table style="width:100%;font-size:13px;color:#5A6B6A">
              <tr><td style="padding:4px 0">Amount</td><td style="text-align:right;color:#1A2B2A;font-weight:600">€${parseFloat(amount).toFixed(2)}</td></tr>
              <tr><td style="padding:4px 0">Recipient</td><td style="text-align:right;color:#1A2B2A">${recipientName}</td></tr>
              <tr><td style="padding:4px 0">Reference</td><td style="text-align:right;color:#1A2B2A;font-family:monospace">${transactionRef}</td></tr>
              <tr><td style="padding:4px 0">Status</td><td style="text-align:right"><span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">PENDING</span></td></tr>
            </table>
          </div>
          <p style="color:#8A9B9A;font-size:12px;margin:0">You will be notified once the transfer is processed.</p>
        </div>
        <p style="color:#8A9B9A;font-size:11px;text-align:center;margin:16px 0 0">DNB — Secure, Reliable Banking</p>
      </div>`,
  };
}

export function transferApprovedEmail({ name, amount, recipientName, transactionRef }) {
  return {
    subject: `Transfer Completed — ${transactionRef}`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0C4B3E;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;font-size:20px;margin:0">DNB</h1>
        </div>
        <div style="background:#fff;border:1px solid #E2E8E7;border-top:none;padding:32px;border-radius:0 0 12px 12px">
          <p style="color:#1A2B2A;font-size:15px;margin:0 0 20px">Hello ${name},</p>
          <p style="color:#5A6B6A;font-size:14px;line-height:1.6;margin:0 0 20px">
            Your SEPA transfer has been approved and completed successfully.
          </p>
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:20px;margin:0 0 20px">
            <table style="width:100%;font-size:13px;color:#5A6B6A">
              <tr><td style="padding:4px 0">Amount</td><td style="text-align:right;color:#1A2B2A;font-weight:600">€${parseFloat(amount).toFixed(2)}</td></tr>
              <tr><td style="padding:4px 0">Recipient</td><td style="text-align:right;color:#1A2B2A">${recipientName}</td></tr>
              <tr><td style="padding:4px 0">Reference</td><td style="text-align:right;color:#1A2B2A;font-family:monospace">${transactionRef}</td></tr>
              <tr><td style="padding:4px 0">Status</td><td style="text-align:right"><span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">COMPLETED</span></td></tr>
            </table>
          </div>
          <p style="color:#8A9B9A;font-size:12px;margin:0">The funds have been debited from your available balance.</p>
        </div>
        <p style="color:#8A9B9A;font-size:11px;text-align:center;margin:16px 0 0">DNB — Secure, Reliable Banking</p>
      </div>`,
  };
}

export function transferRejectedEmail({ name, amount, recipientName, transactionRef, reason }) {
  return {
    subject: `Transfer Declined — ${transactionRef}`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0C4B3E;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;font-size:20px;margin:0">DNB</h1>
        </div>
        <div style="background:#fff;border:1px solid #E2E8E7;border-top:none;padding:32px;border-radius:0 0 12px 12px">
          <p style="color:#1A2B2A;font-size:15px;margin:0 0 20px">Hello ${name},</p>
          <p style="color:#5A6B6A;font-size:14px;line-height:1.6;margin:0 0 20px">
            Your SEPA transfer has been declined.
          </p>
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:20px;margin:0 0 20px">
            <table style="width:100%;font-size:13px;color:#5A6B6A">
              <tr><td style="padding:4px 0">Amount</td><td style="text-align:right;color:#1A2B2A;font-weight:600">€${parseFloat(amount).toFixed(2)}</td></tr>
              <tr><td style="padding:4px 0">Recipient</td><td style="text-align:right;color:#1A2B2A">${recipientName}</td></tr>
              <tr><td style="padding:4px 0">Reference</td><td style="text-align:right;color:#1A2B2A;font-family:monospace">${transactionRef}</td></tr>
              <tr><td style="padding:4px 0">Status</td><td style="text-align:right"><span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">DECLINED</span></td></tr>
              ${reason ? `<tr><td style="padding:4px 0">Reason</td><td style="text-align:right;color:#991B1B">${reason}</td></tr>` : ""}
            </table>
          </div>
          <p style="color:#8A9B9A;font-size:12px;margin:0">No funds have been debited. Contact us if you have questions.</p>
        </div>
        <p style="color:#8A9B9A;font-size:11px;text-align:center;margin:16px 0 0">DNB — Secure, Reliable Banking</p>
      </div>`,
  };
}
