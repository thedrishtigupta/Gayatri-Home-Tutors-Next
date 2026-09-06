// lib/mailer.js — transactional email over plain SMTP.
//
// Deliberately provider-agnostic: Gmail, Resend, Brevo and anything else that
// speaks SMTP are all just a different set of env vars. Nothing below knows or
// cares which one is configured.
//
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=465
//   SMTP_USER=you@gmail.com
//   SMTP_PASS=<16-character Google App Password, not your login password>
//   SMTP_FROM="Gayatri Home Tutors <you@gmail.com>"
//
// With none of these set, sending is disabled and every call reports that
// cleanly rather than throwing — the tutor signup flow falls back to admin
// approval, so an unconfigured mailer never blocks a tutor from being let in.

import nodemailer from "nodemailer";

let transport;
let transportError = null;

export function mailerConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (transport || transportError) return transport;

  if (!mailerConfigured()) {
    transportError = "SMTP is not configured";
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Gmail throttles aggressively on burst; keep one connection and pace it.
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  });

  return transport;
}

/**
 * Send one message.
 * Always resolves — callers decide what to do when mail is unavailable, and a
 * dead SMTP server must never take down a signup request.
 *
 * @returns {Promise<{ok: boolean, skipped?: boolean, error?: string}>}
 */
export async function sendMail({ to, subject, text, html }) {
  const tx = getTransport();

  if (!tx) {
    console.warn("[mailer] skipped, SMTP not configured:", subject);
    return { ok: false, skipped: true, error: transportError };
  }

  try {
    await tx.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    // Gmail blocks connections it finds suspicious, which is common from
    // serverless hosts with rotating outbound IPs. Log it and let the caller
    // fall back rather than surfacing SMTP internals to the tutor.
    console.error("[mailer] send failed:", err.message);
    return { ok: false, error: err.message };
  }
}

/** Verify credentials without sending anything. Used by the smoke-test script. */
export async function verifyMailer() {
  const tx = getTransport();
  if (!tx) return { ok: false, error: transportError };
  try {
    await tx.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* =========================================================================
   Templates

   Plain text plus a minimal HTML twin. Deliberately simple markup: bulk-styled
   HTML from an unknown-reputation sender is exactly what spam filters look for.
   ========================================================================= */

const BRAND = "Gayatri Home Tutors";

function layout(heading, bodyHtml, buttonUrl, buttonLabel) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px">
    <h1 style="margin:0 0 16px;font-size:19px;color:#0b2e6b">${heading}</h1>
    ${bodyHtml}
    ${
      buttonUrl
        ? `<p style="margin:24px 0"><a href="${buttonUrl}" style="display:inline-block;background:#0b2e6b;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600">${buttonLabel}</a></p>
           <p style="margin:0 0 8px;font-size:12px;color:#64748b">If the button does not work, copy this link into your browser:</p>
           <p style="margin:0;font-size:12px;color:#475569;word-break:break-all">${buttonUrl}</p>`
        : ""
    }
    <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="margin:0;font-size:12px;color:#64748b">${BRAND}</p>
  </div>
</body></html>`;
}

export function verifyEmailTemplate({ name, url, expiresHours }) {
  const hi = name ? `Hi ${name},` : "Hi,";
  return {
    subject: `Confirm your email · ${BRAND}`,
    text: `${hi}

Confirm your email address to finish setting up your tutor account:

${url}

This link expires in ${expiresHours} hours. If you did not request an account, ignore this email.

${BRAND}`,
    html: layout(
      "Confirm your email",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">${hi}</p>
       <p style="margin:0;font-size:14px;line-height:1.6">Confirm your email address to finish setting up your tutor account. This link expires in ${expiresHours} hours.</p>`,
      url,
      "Confirm email"
    ),
  };
}

export function resetPasswordTemplate({ name, url, expiresHours }) {
  const hi = name ? `Hi ${name},` : "Hi,";
  return {
    subject: `Reset your password · ${BRAND}`,
    text: `${hi}

Use this link to choose a new password:

${url}

This link expires in ${expiresHours} hours. If you did not ask to reset your password, ignore this email — your current password still works.

${BRAND}`,
    html: layout(
      "Reset your password",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">${hi}</p>
       <p style="margin:0;font-size:14px;line-height:1.6">Use the button below to choose a new password. This link expires in ${expiresHours} hours. If you did not ask for this, ignore this email — your current password still works.</p>`,
      url,
      "Choose a new password"
    ),
  };
}

export function accountApprovedTemplate({ name, url }) {
  const hi = name ? `Hi ${name},` : "Hi,";
  return {
    subject: `Your tutor account is ready · ${BRAND}`,
    text: `${hi}

Your tutor account has been approved. You can now sign in and manage your profile:

${url}

${BRAND}`,
    html: layout(
      "Your account is ready",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">${hi}</p>
       <p style="margin:0;font-size:14px;line-height:1.6">Your tutor account has been approved. You can sign in and manage your profile now.</p>`,
      url,
      "Sign in"
    ),
  };
}

export function changesReviewedTemplate({ name, url, approved, rejected }) {
  const hi = name ? `Hi ${name},` : "Hi,";
  const summary =
    rejected === 0
      ? `All ${approved} of your requested changes were approved.`
      : approved === 0
        ? `Your requested changes were not approved this time.`
        : `${approved} of your requested changes were approved and ${rejected} were not.`;

  return {
    subject: `Your profile changes were reviewed · ${BRAND}`,
    text: `${hi}

${summary}

See your profile: ${url}

${BRAND}`,
    html: layout(
      "Your profile changes were reviewed",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">${hi}</p>
       <p style="margin:0;font-size:14px;line-height:1.6">${summary}</p>`,
      url,
      "View my profile"
    ),
  };
}
