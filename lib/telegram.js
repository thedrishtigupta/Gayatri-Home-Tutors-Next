// // lib/telegram.js — Telegram Bot API helper

// const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
// const CHANNEL_ID   = process.env.TELEGRAM_CHANNEL_ID; // e.g. "@ght_tutors" or "-100xxxxxxxxxx"
// const BASE_URL     = `https://api.telegram.org/bot${BOT_TOKEN}`;

// /**
//  * Format a demo_request row into a broadcast-ready Telegram message.
//  * @param {object} req - demo_request row from DB
//  * @returns {string} Markdown-formatted message
//  */
// export function formatClassBroadcast(req) {
//   const subjects = (() => {
//     try { return JSON.parse(req.subjects).join(", "); }
//     catch { return req.subjects || "Not specified"; }
//   })();

//   const time = req.preferred_time || "Flexible";
//   const area = req.area           || "Not specified";
//   const cls  = req.student_class  || "Not specified";

//   return (
// `📚 *NEW TUITION REQUIREMENT*
// ━━━━━━━━━━━━━━━━━━━━━━
// 👤 *Student/Parent:* ${req.full_name}
// 📞 *Contact:* ${req.phone}
// 🏫 *Class:* ${cls}
// 📖 *Subjects:* ${subjects}
// 📍 *Area:* ${area}
// 🕐 *Preferred Time:* ${time}
// ${req.message ? `💬 *Note:* ${req.message}` : ""}
// ━━━━━━━━━━━━━━━━━━━━━━
// _Interested tutors, please contact the bureau._
// 📱 *Gayatri Home Tutors:* +91 85059 52700`
//   );
// }

// /**
//  * Send a message to the Telegram channel.
//  * @param {string} text - Markdown-formatted message text
//  * @returns {Promise<{ok: boolean, result?: object, error?: string}>}
//  */
// export async function sendToChannel(text) {
//   if (!BOT_TOKEN || !CHANNEL_ID) {
//     return { ok: false, error: "Telegram bot not configured (check env vars)" };
//   }

//   try {
//     const res = await fetch(`${BASE_URL}/sendMessage`, {
//       method:  "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         chat_id:    CHANNEL_ID,
//         text,
//         parse_mode: "Markdown",
//       }),
//     });
//     const data = await res.json();
//     if (!data.ok) return { ok: false, error: data.description };
//     return { ok: true, result: data.result };
//   } catch (err) {
//     return { ok: false, error: err.message };
//   }
// }


// lib/telegram.js — Telegram Bot API helper

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID   = process.env.TELEGRAM_CHANNEL_ID; // e.g. "@ght_tutors" or "-100xxxxxxxxxx"
const BASE_URL     = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Telegram rejects the whole message with "can't parse entities" when a name,
// area or note contains _ * [ ` — very common in free-text fields. HTML mode
// only needs three characters escaped, so we use that instead of Markdown.
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Format a demo_request row into a broadcast-ready Telegram message.
 * @param {object} req - demo_request row from DB
 * @returns {string} HTML-formatted message
 */
export function formatClassBroadcast(req) {
  const subjects = (() => {
    try {
      const parsed = JSON.parse(req.subjects);
      return Array.isArray(parsed) ? parsed.join(", ") : String(parsed);
    } catch { return req.subjects || "Not specified"; }
  })();

  const time = req.preferred_time || "Flexible";
  const area = req.area           || "Not specified";
  const cls  = req.student_class  || "Not specified";

  return (
`📚 <b>NEW TUITION REQUIREMENT</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Student/Parent:</b> ${esc(req.full_name)}
📞 <b>Contact:</b> ${esc(req.phone)}
🏫 <b>Class:</b> ${esc(cls)}
📖 <b>Subjects:</b> ${esc(subjects)}
📍 <b>Area:</b> ${esc(area)}
🕐 <b>Preferred Time:</b> ${esc(time)}
${req.message ? `💬 <b>Note:</b> ${esc(req.message)}` : ""}
━━━━━━━━━━━━━━━━━━━━━━
<i>Interested tutors, please contact the bureau.</i>
📱 <b>Gayatri Home Tutors:</b> +91 85059 52700`
  );
}

/**
 * Send a message to the Telegram channel.
 * @param {string} text - HTML-formatted message text
 * @returns {Promise<{ok: boolean, result?: object, error?: string}>}
 */
export async function sendToChannel(text) {
  if (!BOT_TOKEN || !CHANNEL_ID) {
    return { ok: false, error: "Telegram bot not configured (check env vars)" };
  }

  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    CHANNEL_ID,
        // Telegram hard-caps messages at 4096 characters.
        text:       text.slice(0, 4096),
        parse_mode: "HTML",
      }),
    });
    // A non-2xx reply can be plain text; res.json() would throw here.
    const raw  = await res.text();
    let data;
    try { data = JSON.parse(raw); }
    catch { return { ok: false, error: `Telegram returned ${res.status}: ${raw.slice(0, 200)}` }; }

    if (!data.ok) return { ok: false, error: data.description };
    return { ok: true, result: data.result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}