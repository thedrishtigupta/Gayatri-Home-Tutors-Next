// scripts/discovery-density.js
// How many tutors would land on each kind of discovery page?
//
// Combination pages only earn their place when they have real depth. A page
// with two tutors is thin content: it ranks badly, and a visitor who lands on
// it leaves. This measures where the cut-off actually falls.
//
//   node scripts/discovery-density.js

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, "$2")]; })
);
const ssl = env.DB_SSL_CA_PATH
  ? { ca: fs.readFileSync(path.resolve(ROOT, env.DB_SSL_CA_PATH), "utf8"), rejectUnauthorized: true }
  : undefined;

// Only tutors a visitor could actually be matched with.
const LIVE = "t.status = 'active'";

const bar = (n, max, width = 26) => "█".repeat(Math.max(1, Math.round((n / max) * width)));

require("mysql2/promise")
  .createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME, ssl })
  .then(async (c) => {
    const q = async (sql, p = []) => (await c.query(sql, p))[0];

    const [[totals]] = [await q(`SELECT COUNT(*) AS n FROM tutors t WHERE ${LIVE}`)];
    console.log("=".repeat(66));
    console.log(`DISCOVERY PAGE DENSITY — ${totals.n} active tutors`);
    console.log("=".repeat(66));

    /* ── single-facet pages ───────────────────────────────────── */

    const subjects = await q(
      `SELECT s.name, s.slug, COUNT(DISTINCT t.id) AS n
       FROM subjects s
       JOIN tutor_teaching_profiles p ON p.subject_id = s.id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       GROUP BY s.id ORDER BY n DESC`
    );
    console.log(`\n── /subjects/[subject] — ${subjects.length} pages ${"─".repeat(24)}`);
    const smax = subjects[0]?.n || 1;
    subjects.forEach((r) => console.log(`   ${String(r.n).padStart(4)} ${bar(r.n, smax).padEnd(27)} ${r.name}`));

    const classes = await q(
      `SELECT cl.name, cl.slug, COUNT(DISTINCT t.id) AS n
       FROM classes cl
       JOIN tutor_teaching_profiles p ON p.class_id = cl.id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       GROUP BY cl.id ORDER BY cl.sort_order`
    );
    console.log(`\n── /classes/[class] — ${classes.length} pages ${"─".repeat(26)}`);
    const cmax = Math.max(...classes.map((r) => r.n), 1);
    classes.forEach((r) => console.log(`   ${String(r.n).padStart(4)} ${bar(r.n, cmax).padEnd(27)} ${r.name}`));

    const areas = await q(
      `SELECT l.name, l.slug, l.location_type, COUNT(DISTINCT t.id) AS n
       FROM locations l
       JOIN tutor_locations tl ON tl.location_id = l.id
       JOIN tutors t ON t.id = tl.tutor_id AND ${LIVE}
       GROUP BY l.id ORDER BY n DESC`
    );
    console.log(`\n── /areas/[area] — ${areas.length} with at least one tutor ${"─".repeat(10)}`);
    const amax = areas[0]?.n || 1;
    areas.slice(0, 18).forEach((r) => console.log(`   ${String(r.n).padStart(4)} ${bar(r.n, amax).padEnd(27)} ${r.name}`));
    console.log(`   … ${areas.length - 18} more`);

    const areaBuckets = [1, 3, 5, 10, 20].map((min) => [min, areas.filter((a) => a.n >= min).length]);
    console.log(`\n   areas by depth: ${areaBuckets.map(([m, n]) => `${n} with ${m}+`).join(" · ")}`);
    console.log(`   (${247 - areas.length} of 247 seeded areas have no active tutor at all)`);

    /* ── two-facet combinations ───────────────────────────────── */

    const subjectArea = await q(
      `SELECT s.name AS subject, l.name AS area, COUNT(DISTINCT t.id) AS n
       FROM tutor_teaching_profiles p
       JOIN subjects s ON s.id = p.subject_id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       JOIN tutor_locations tl ON tl.tutor_id = t.id
       JOIN locations l ON l.id = tl.location_id
       GROUP BY s.id, l.id HAVING n >= 1 ORDER BY n DESC`
    );

    const classArea = await q(
      `SELECT cl.name AS class, l.name AS area, COUNT(DISTINCT t.id) AS n
       FROM tutor_teaching_profiles p
       JOIN classes cl ON cl.id = p.class_id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       JOIN tutor_locations tl ON tl.tutor_id = t.id
       JOIN locations l ON l.id = tl.location_id
       GROUP BY cl.id, l.id HAVING n >= 1 ORDER BY n DESC`
    );

    const classSubject = await q(
      `SELECT cl.name AS class, s.name AS subject, COUNT(DISTINCT t.id) AS n
       FROM tutor_teaching_profiles p
       JOIN classes cl ON cl.id = p.class_id
       JOIN subjects s ON s.id = p.subject_id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       GROUP BY cl.id, s.id HAVING n >= 1 ORDER BY n DESC`
    );

    const depth = (rows) => [3, 5, 10].map((m) => `${rows.filter((r) => r.n >= m).length} with ${m}+`).join(" · ");

    console.log(`\n── two-facet combinations ${"─".repeat(37)}`);
    console.log(`   subject × area  : ${String(subjectArea.length).padStart(5)} possible — ${depth(subjectArea)}`);
    console.log(`   class × area    : ${String(classArea.length).padStart(5)} possible — ${depth(classArea)}`);
    console.log(`   class × subject : ${String(classSubject.length).padStart(5)} possible — ${depth(classSubject)}`);

    /* ── three-facet ──────────────────────────────────────────── */

    const triple = await q(
      `SELECT cl.name AS class, s.name AS subject, l.name AS area, COUNT(DISTINCT t.id) AS n
       FROM tutor_teaching_profiles p
       JOIN classes cl ON cl.id = p.class_id
       JOIN subjects s ON s.id = p.subject_id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       JOIN tutor_locations tl ON tl.tutor_id = t.id
       JOIN locations l ON l.id = tl.location_id
       GROUP BY cl.id, s.id, l.id HAVING n >= 1 ORDER BY n DESC`
    );

    console.log(`\n── three-facet: class × subject × area ${"─".repeat(25)}`);
    console.log(`   ${triple.length} combinations have at least one tutor`);
    console.log(`   ${depth(triple)}`);
    console.log("\n   deepest:");
    triple.slice(0, 8).forEach((r) => console.log(`     ${String(r.n).padStart(3)}  ${r.class} · ${r.subject} · ${r.area}`));
    const thin = triple.filter((r) => r.n <= 2).length;
    console.log(`\n   ${thin} of ${triple.length} (${Math.round((thin / triple.length) * 100)}%) would have 1–2 tutors`);

    await c.end();
  })
  .catch((e) => { console.error("failed:", e.sqlMessage || e.message); process.exit(1); });
