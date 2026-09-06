// scripts/test-smtp.js
// Checks the SMTP settings in .env.local, and optionally sends a real message.
//
//   node scripts/test-smtp.js                    # verify credentials only
//   node scripts/test-smtp.js --to me@gmail.com  # ...and send a test email

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  const k = t.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = t.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
}

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
};

const mask = (v) => (v ? `${v.slice(0, 2)}${"•".repeat(Math.max(0, v.length - 4))}${v.slice(-2)}` : "(unset)");

(async () => {
  console.log("SMTP configuration");
  console.log(`  SMTP_HOST  ${process.env.SMTP_HOST || "(unset)"}`);
  console.log(`  SMTP_PORT  ${process.env.SMTP_PORT || "(unset, defaults to 587)"}`);
  console.log(`  SMTP_USER  ${process.env.SMTP_USER || "(unset)"}`);
  console.log(`  SMTP_PASS  ${mask(process.env.SMTP_PASS)}`);
  console.log(`  SMTP_FROM  ${process.env.SMTP_FROM || "(unset, will use SMTP_USER)"}`);
  console.log("");

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("✗ Incomplete — email sending is disabled.");
    console.log("  Tutor signups will route to the admin approval queue instead.");
    process.exitCode = 1;
    return;
  }

  // Google App Passwords are 16 characters; pasting them with the spaces
  // Google displays is the single most common reason auth fails.
  if (/gmail|google/i.test(process.env.SMTP_HOST) && /\s/.test(process.env.SMTP_PASS)) {
    console.log("! SMTP_PASS contains spaces. Google shows App Passwords in groups of");
    console.log("  four, but the value must be entered without spaces.\n");
  }

  const nodemailer = require("nodemailer");
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transport.verify();
    console.log(`✓ Connected and authenticated (port ${port}, ${port === 465 ? "implicit TLS" : "STARTTLS"})`);
  } catch (err) {
    console.log(`✗ ${err.message}`);
    if (/username and password not accepted|invalid login|535/i.test(err.message)) {
      console.log("\n  Authentication was rejected. For Gmail:");
      console.log("   - 2-Step Verification must be on for the account");
      console.log("   - use an App Password, not the account password");
      console.log("   - remove the spaces Google shows between the four groups");
      console.log("   - Google Workspace accounts cannot use App Passwords at all;");
      console.log("     they need OAuth 2.0, so use Resend or Brevo instead");
    }
    process.exitCode = 1;
    return;
  }

  const to = arg("--to");
  if (!to) {
    console.log("\nCredentials work. Add --to you@example.com to send a real test message.");
    return;
  }

  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "SMTP test · Gayatri Home Tutors",
      text: "This is a test message from the tutor panel. If you can read this, email delivery is working.",
      html: '<p style="font-family:system-ui,sans-serif">This is a test message from the tutor panel. If you can read this, email delivery is working.</p>',
    });
    console.log(`\n✓ Sent to ${to}`);
    console.log(`  message id ${info.messageId}`);
    console.log("\n  Check the spam folder too — a new sending address often lands there");
    console.log("  for the first few messages.");
  } catch (err) {
    console.log(`\n✗ Send failed: ${err.message}`);
    process.exitCode = 1;
  }
})();
