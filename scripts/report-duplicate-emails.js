// scripts/report-duplicate-emails.js
// Lists tutors sharing an email address. Email is about to become the tutor
// panel's login identifier, so each of these must be resolved before a UNIQUE
// constraint can be added.
//
//   node scripts/report-duplicate-emails.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function readEnv() {
  const file = path.join(ROOT, ".env.local");
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return env;
}

(async () => {
  const env = { ...readEnv(), ...process.env };
  const ssl = env.DB_SSL_CA_PATH
    ? { ca: fs.readFileSync(path.resolve(ROOT, env.DB_SSL_CA_PATH), "utf8"), rejectUnauthorized: true }
    : undefined;

  const conn = await require("mysql2/promise").createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl,
  });

  const [rows] = await conn.query(`
    SELECT t.id, t.email, t.first_name, t.last_name, t.whatsapp, t.status,
           t.created_at, t.teaching_start_year,
           (SELECT COUNT(*) FROM tutor_teaching_profiles p WHERE p.tutor_id = t.id) AS pairs,
           (SELECT COUNT(*) FROM tutor_locations l WHERE l.tutor_id = t.id) AS areas
    FROM tutors t
    WHERE t.email IN (
      SELECT email FROM (
        SELECT email FROM tutors
        WHERE email IS NOT NULL AND LENGTH(email) > 0
        GROUP BY email HAVING COUNT(*) > 1
      ) AS d
    )
    ORDER BY t.email, t.created_at
  `);

  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.email)) groups.set(r.email, []);
    groups.get(r.email).push(r);
  }

  const L = [];
  const say = (s = "") => L.push(s);

  say("=".repeat(78));
  say("TUTORS SHARING AN EMAIL ADDRESS");
  say("=".repeat(78));
  say("");
  say(`${groups.size} address(es) shared by ${rows.length} tutors.`);
  say("");
  say("Email is the tutor panel's login identifier, so every group below needs");
  say("one owner. For the others: set their own address, or blank it and let an");
  say("admin add one. A UNIQUE index can be added once this list is empty.");
  say("");

  let n = 0;
  for (const [email, members] of groups) {
    n += 1;
    say(`${String(n).padStart(2)}. ${email}   (${members.length} tutors)`);
    for (const m of members) {
      const name = `${m.first_name || ""} ${m.last_name || ""}`.trim() || "(no name)";
      say(
        `      #${String(m.id).padEnd(5)} ${name.padEnd(26)} ` +
          `${(m.whatsapp || "no phone").padEnd(12)} ${m.status.padEnd(9)} ` +
          `${String(m.pairs).padStart(3)} pairs ${String(m.areas).padStart(2)} areas  ` +
          `joined ${new Date(m.created_at).toISOString().slice(0, 10)}`
      );
    }
    // Same person registering twice, or genuinely different people?
    const surnames = new Set(members.map((m) => (m.last_name || "").toLowerCase().trim()));
    const firsts = new Set(members.map((m) => (m.first_name || "").toLowerCase().trim()));
    if (firsts.size === 1) say("      ^ same first name — likely one person, consider merging");
    else if (surnames.size === 1) say("      ^ shared surname — likely family sharing one address");
    say("");
  }

  say("Admin panel links:");
  for (const [, members] of groups) {
    for (const m of members) say(`  /admin/tutors/${m.id}`);
  }

  const report = L.join("\n");
  console.log(report);

  const out = path.join(__dirname, "..", "database", "migration", "duplicate-emails.txt");
  fs.writeFileSync(out, report);
  console.log(`\nwritten: ${path.relative(ROOT, out)}`);

  await conn.end();
})().catch((err) => {
  console.error("failed:", err.sqlMessage || err.message);
  process.exit(1);
});
