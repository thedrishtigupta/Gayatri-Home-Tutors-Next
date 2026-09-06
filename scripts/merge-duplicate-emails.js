// scripts/merge-duplicate-emails.js
// Resolves tutors sharing an email address so email can become the tutor
// panel's login identifier.
//
//   node scripts/merge-duplicate-emails.js            # write a plan to review
//   node scripts/merge-duplicate-emails.js --execute  # apply the reviewed plan
//
// Groups are only merged when the names agree. Anything else is reported as
// needing a human decision and is left untouched — two different people who
// happen to share an inbox must not be collapsed into one record.
//
// Merge rules match the original import: the newest registration is the
// survivor for scalar fields, relations are unioned, created_at keeps the
// earliest date so registration history is not lost.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PLAN_PATH = path.join(ROOT, "database", "migration", "email-merge-plan.json");
const REPORT_PATH = path.join(ROOT, "database", "migration", "email-merge-plan.txt");

/* ── connection ──────────────────────────────────────────────────── */

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

async function connect(env) {
  const ssl = env.DB_SSL_CA_PATH
    ? { ca: fs.readFileSync(path.resolve(ROOT, env.DB_SSL_CA_PATH), "utf8"), rejectUnauthorized: true }
    : env.DB_SSL === "true"
      ? { rejectUnauthorized: true }
      : undefined;

  return require("mysql2/promise").createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: "utf8mb4_unicode_ci",
    ssl,
  });
}

/* ── name comparison ─────────────────────────────────────────────── */

const normName = (first, last) =>
  `${first || ""} ${last || ""}`
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    // "Rakhi Rakhi" and "Keshaw nath manjhi Manjhi" repeat tokens; collapse them
    // and sort so word order does not matter.
    .filter((w, i, a) => a.indexOf(w) === i)
    .sort()
    .join(" ");

function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/** Same person? Tolerates typos and repeated tokens, rejects different names. */
function sameName(a, b) {
  const x = normName(a.first_name, a.last_name);
  const y = normName(b.first_name, b.last_name);
  if (!x || !y) return false;
  if (x === y) return true;
  // One name being a subset of the other: "Deepa Arora" vs "Deepa".
  const xs = new Set(x.split(" "));
  const ys = new Set(y.split(" "));
  const shared = [...xs].filter((w) => ys.has(w) && w.length > 2).length;
  if (shared >= Math.min(xs.size, ys.size)) return true;
  // Small typo: "Deepa Aror" vs "Deepa Arora".
  return editDistance(x, y) <= Math.max(1, Math.floor(Math.max(x.length, y.length) * 0.12));
}

/* ── plan ────────────────────────────────────────────────────────── */

async function buildPlan(conn) {
  const [rows] = await conn.query(`
    SELECT t.id, t.email, t.first_name, t.last_name, t.whatsapp, t.status,
           t.created_at, t.updated_at, t.verified, t.profile_completed,
           (SELECT COUNT(*) FROM tutor_teaching_profiles p WHERE p.tutor_id = t.id) AS pairs,
           (SELECT COUNT(*) FROM tutor_locations l WHERE l.tutor_id = t.id) AS areas,
           (SELECT COUNT(*) FROM tutor_custom_subjects s WHERE s.tutor_id = t.id) AS custom
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

  const merges = [];
  const manual = [];

  for (const [email, members] of groups) {
    const allSame = members.every((m) => sameName(members[0], m));

    if (!allSame) {
      manual.push({ email, members });
      continue;
    }

    // Newest registration survives, matching the original import's rule.
    const ordered = [...members].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const [survivor, ...absorbed] = ordered;

    merges.push({
      email,
      survivorId: survivor.id,
      survivorName: `${survivor.first_name || ""} ${survivor.last_name || ""}`.trim(),
      absorbedIds: absorbed.map((a) => a.id),
      // Earliest registration date is kept so history is preserved.
      keepCreatedAt: ordered[ordered.length - 1].created_at,
      members: ordered,
    });
  }

  return { merges, manual };
}

/* ── report ──────────────────────────────────────────────────────── */

function writeReport({ merges, manual }) {
  const L = [];
  const say = (s = "") => L.push(s);

  const absorbedTotal = merges.reduce((a, m) => a + m.absorbedIds.length, 0);

  say("=".repeat(78));
  say("EMAIL MERGE PLAN — review before running with --execute");
  say("=".repeat(78));
  say("");
  say(`${merges.length} group(s) will be merged, removing ${absorbedTotal} duplicate tutor row(s).`);
  say(`${manual.length} group(s) need a human decision and will NOT be touched.`);
  say("");
  say("Rule: newest registration survives; subjects, classes, areas and custom");
  say("subject requests are moved onto it; created_at keeps the earliest date.");
  say("");
  say("-".repeat(78));
  say("TO BE MERGED");
  say("-".repeat(78));

  let n = 0;
  for (const m of merges) {
    n += 1;
    say("");
    say(`${String(n).padStart(2)}. ${m.email}`);
    for (const t of m.members) {
      const keep = t.id === m.survivorId;
      const name = `${t.first_name || ""} ${t.last_name || ""}`.trim();
      say(
        `      ${keep ? "KEEP  " : "merge "}#${String(t.id).padEnd(5)} ${name.padEnd(26)} ` +
          `${(t.whatsapp || "-").padEnd(12)} ${String(t.pairs).padStart(3)} pairs ` +
          `${String(t.areas).padStart(2)} areas ${String(t.custom).padStart(2)} custom  ` +
          `${new Date(t.created_at).toISOString().slice(0, 10)}`
      );
    }
    say(`      -> keeps created_at ${new Date(m.keepCreatedAt).toISOString().slice(0, 10)}`);

    const survivor = m.members.find((t) => t.id === m.survivorId);
    if (survivor.status === "inactive" && m.members.some((t) => t.pairs > 0)) {
      say("      -> survivor is inactive but gains teaching data; will be reactivated");
    }
  }

  if (manual.length) {
    say("");
    say("-".repeat(78));
    say("NEEDS A HUMAN DECISION — names do not match, left untouched");
    say("-".repeat(78));
    for (const g of manual) {
      say("");
      say(`  ${g.email}`);
      for (const t of g.members) {
        const name = `${t.first_name || ""} ${t.last_name || ""}`.trim();
        say(`      #${String(t.id).padEnd(5)} ${name.padEnd(26)} ${(t.whatsapp || "-").padEnd(12)} /admin/tutors/${t.id}`);
      }
      say("      ^ give one of them their own address in the admin panel");
    }
    say("");
    say("  The UNIQUE index on tutors.email cannot be added until these are fixed.");
  }

  const report = L.join("\n");
  fs.writeFileSync(REPORT_PATH, report);
  fs.writeFileSync(
    PLAN_PATH,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), merges: merges.map(({ members, ...m }) => m), manual: manual.map((g) => ({ email: g.email, ids: g.members.map((t) => t.id) })) },
      null,
      1
    )
  );
  return report;
}

/* ── execute ─────────────────────────────────────────────────────── */

async function execute(conn, merges) {
  let movedPairs = 0;
  let movedAreas = 0;
  let movedCustom = 0;
  let deleted = 0;

  await conn.beginTransaction();
  try {
    for (const m of merges) {
      for (const loserId of m.absorbedIds) {
        // INSERT IGNORE because the survivor may already cover the same pair.
        const [p] = await conn.query(
          `INSERT IGNORE INTO tutor_teaching_profiles (tutor_id, class_id, subject_id)
           SELECT ?, class_id, subject_id FROM tutor_teaching_profiles WHERE tutor_id = ?`,
          [m.survivorId, loserId]
        );
        movedPairs += p.affectedRows;

        const [a] = await conn.query(
          `INSERT IGNORE INTO tutor_locations (tutor_id, location_id)
           SELECT ?, location_id FROM tutor_locations WHERE tutor_id = ?`,
          [m.survivorId, loserId]
        );
        movedAreas += a.affectedRows;

        const [c] = await conn.query(
          `INSERT IGNORE INTO tutor_custom_subjects (tutor_id, class_id, subject_name, status)
           SELECT ?, class_id, subject_name, status FROM tutor_custom_subjects WHERE tutor_id = ?`,
          [m.survivorId, loserId]
        );
        movedCustom += c.affectedRows;

        // Repoint anything that references the row about to disappear. Both
        // tables are empty today, but the merge must stay correct once they
        // are in use.
        await conn.query("UPDATE demo_requests SET assigned_tutor_id = ? WHERE assigned_tutor_id = ?", [
          m.survivorId,
          loserId,
        ]);
        await conn.query("UPDATE class_assignments SET tutor_id = ? WHERE tutor_id = ?", [m.survivorId, loserId]);

        // Child rows cascade from the tutors delete.
        const [d] = await conn.query("DELETE FROM tutors WHERE id = ?", [loserId]);
        deleted += d.affectedRows;
      }

      await conn.query("UPDATE tutors SET created_at = ? WHERE id = ?", [m.keepCreatedAt, m.survivorId]);
    }

    /*
     * A survivor can end up inactive while holding the absorbed record's data —
     * #865 was newer but empty, #207 had 15 class/subject pairs. Re-apply the
     * import's completeness rule so the merged record is judged on what it now
     * holds. Only inactive is promoted: blacklisted is a deliberate decision and
     * is never overridden here.
     */
    const [promoted] = await conn.query(
      `UPDATE tutors t
       SET t.status = 'active', t.profile_completed = 1
       WHERE t.id IN (${merges.map(() => "?").join(",") || "NULL"})
         AND t.status = 'inactive'
         AND t.whatsapp IS NOT NULL AND LENGTH(t.whatsapp) > 0
         AND EXISTS (SELECT 1 FROM tutor_teaching_profiles p WHERE p.tutor_id = t.id)
         AND EXISTS (SELECT 1 FROM tutor_locations l WHERE l.tutor_id = t.id)`,
      merges.map((m) => m.survivorId)
    );

    await conn.commit();
    return { movedPairs, movedAreas, movedCustom, deleted, promoted: promoted.affectedRows };
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

/* ── main ────────────────────────────────────────────────────────── */

(async () => {
  const env = { ...readEnv(), ...process.env };
  const conn = await connect(env);
  const doExecute = process.argv.includes("--execute");

  try {
    const plan = await buildPlan(conn);

    if (!plan.merges.length && !plan.manual.length) {
      console.log("No tutors share an email address — nothing to do.");
      const [[dup]] = await conn.query(
        `SELECT COUNT(*) AS n FROM (SELECT email FROM tutors WHERE email IS NOT NULL AND LENGTH(email) > 0 GROUP BY email HAVING COUNT(*) > 1) AS d`
      );
      if (dup.n === 0) console.log("tutors.email is unique — safe to add the UNIQUE index.");
      return;
    }

    const report = writeReport(plan);
    console.log(report);
    console.log("");
    console.log(`written: ${path.relative(ROOT, REPORT_PATH)}`);
    console.log(`written: ${path.relative(ROOT, PLAN_PATH)}`);

    if (!doExecute) {
      console.log("\nDry run — nothing changed. Re-run with --execute to apply.");
      return;
    }

    console.log("\napplying…");
    const result = await execute(conn, plan.merges);
    console.log(`  teaching pairs moved   ${result.movedPairs}`);
    console.log(`  areas moved            ${result.movedAreas}`);
    console.log(`  custom subjects moved  ${result.movedCustom}`);
    console.log(`  duplicate rows deleted ${result.deleted}`);
    console.log(`  reactivated after merge ${result.promoted}`);

    const [[after]] = await conn.query("SELECT COUNT(*) AS n FROM tutors");
    const [[still]] = await conn.query(
      `SELECT COUNT(*) AS n FROM (SELECT email FROM tutors WHERE email IS NOT NULL AND LENGTH(email) > 0 GROUP BY email HAVING COUNT(*) > 1) AS d`
    );
    console.log(`\n  tutors now             ${after.n}`);
    console.log(`  emails still shared    ${still.n}`);
    if (still.n === 0) {
      console.log("\n  tutors.email is now unique — run 003_tutor_accounts.sql to add the index.");
    } else {
      console.log("\n  Resolve the remaining group(s) in the admin panel before adding the index.");
    }
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error("\nfailed:", err.sqlMessage || err.message);
  process.exit(1);
});
