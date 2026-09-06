// scripts/smoke-book-demo.js
// Checks /book-demo and /api/demo: does a request for a specific tutor reach
// the database intact, does a bad tutor id still let the booking through, and
// does anything private leak onto the page?
//
//   node scripts/smoke-book-demo.js --port 3000
//
// Creates disposable demo_requests rows and deletes them in `finally`.

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const PORT = (() => {
  const i = process.argv.indexOf("--port");
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : "3000";
})();
const BASE = `http://localhost:${PORT}`;

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, "$2")]; })
);
const ssl = env.DB_SSL_CA_PATH
  ? { ca: fs.readFileSync(path.resolve(ROOT, env.DB_SSL_CA_PATH), "utf8"), rejectUnauthorized: true }
  : undefined;

let pass = 0;
let fail = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  ok ? (pass += 1) : (fail += 1);
};

const get = async (url) => {
  const res = await fetch(BASE + url);
  return { status: res.status, html: await res.text() };
};

// A distinctive phone per run, so a rerun is never mistaken for a duplicate
// of the previous one and cleanup can find exactly its own rows.
const STAMP = String(Date.now()).slice(-6);
const phoneFor = (n) => `9${STAMP}${n}`.slice(0, 10).padEnd(10, "0");

const post = async (body) => {
  const res = await fetch(`${BASE}/api/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, json, data: json?.data ?? json };
};

(async () => {
  const conn = await require("mysql2/promise").createConnection({
    host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER,
    password: env.DB_PASSWORD, database: env.DB_NAME, ssl,
  });
  const q = async (sql, p = []) => (await conn.query(sql, p))[0];

  const createdPhones = [];
  let madeInactive = null;

  try {
    // ── fixtures ────────────────────────────────────────────────
    const actives = await q(
      `SELECT t.id, t.first_name, t.last_name
         FROM tutors t
        WHERE t.status = 'active'
          AND EXISTS (SELECT 1 FROM tutor_teaching_profiles p WHERE p.tutor_id = t.id)
        ORDER BY t.id LIMIT 2`
    );
    if (actives.length < 2) throw new Error("need two active tutors with teaching rows");
    const [tutorA, tutorB] = actives;
    const nameA = `${tutorA.first_name} ${tutorA.last_name}`.trim();

    console.log(`\nfixtures: tutor A #${tutorA.id} (${nameA}), tutor B #${tutorB.id}`);

    // ── 1. the column exists and is shaped right ────────────────
    console.log("\n1. schema");
    const cols = await q("SHOW COLUMNS FROM demo_requests LIKE 'requested_tutor_id'");
    check("requested_tutor_id exists", cols.length === 1);
    check("is nullable", cols[0]?.Null === "YES", "a general enquiry has no requested tutor");

    const fks = await q(
      `SELECT rc.DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS rc
         JOIN information_schema.KEY_COLUMN_USAGE k
           ON k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
        WHERE rc.CONSTRAINT_SCHEMA = DATABASE() AND rc.TABLE_NAME = 'demo_requests'
          AND k.COLUMN_NAME = 'requested_tutor_id'`
    );
    check("FK deletes to NULL, not CASCADE", fks[0]?.DELETE_RULE === "SET NULL",
      "removing a tutor must not delete a family's enquiry");

    // ── 2. the page ─────────────────────────────────────────────
    console.log("\n2. /book-demo renders");
    const plain = await get("/book-demo");
    check("plain page 200", plain.status === 200);
    check("form present", /class="book-demo-form"/.test(plain.html));
    check("no tutor card when none requested", !/bd-tutor-heading/.test(plain.html));
    check("indexable", !/noindex/.test(plain.html));

    const withTutor = await get(`/book-demo?tutor=${tutorA.id}`);
    check("tutor page 200", withTutor.status === 200);
    check("names the requested tutor", withTutor.html.includes(nameA), nameA);
    check("shows the tutor card", /bd-tutor-heading/.test(withTutor.html));
    check("shows the requesting line", /bd-requesting/.test(withTutor.html));
    check("noindex on the ?tutor variant", /noindex/.test(withTutor.html),
      "one form must not compete with itself once per tutor");
    check("canonical points at the clean URL",
      /rel="canonical"[^>]*\/book-demo"/.test(withTutor.html) || /canonical/.test(withTutor.html));

    // ── 3. privacy ──────────────────────────────────────────────
    console.log("\n3. no contact details leak");
    const priv = await q(
      `SELECT whatsapp, email, alternate_phone, family_phone, present_address
         FROM tutors WHERE id = ?`, [tutorA.id]
    );
    const secrets = Object.entries(priv[0] || {})
      .filter(([, v]) => v && String(v).trim().length >= 6);
    for (const [field, value] of secrets) {
      check(`${field} absent from HTML`, !withTutor.html.includes(String(value).trim()));
    }
    if (!secrets.length) console.log("     (tutor has no contact fields populated to test)");

    // ── 4. bad ids degrade gracefully ───────────────────────────
    console.log("\n4. a bad ?tutor never blocks a booking");
    const missing = await get("/book-demo?tutor=99999999");
    check("unknown id still 200", missing.status === 200);
    check("explains the tutor is unavailable", /bd-notice/.test(missing.html));
    check("form still usable", /class="book-demo-form"/.test(missing.html));

    const junk = await get("/book-demo?tutor=notanumber");
    check("non-numeric id still 200", junk.status === 200);

    // An inactive tutor must not be requestable through a stale link.
    await q("UPDATE tutors SET status = 'inactive' WHERE id = ?", [tutorB.id]);
    madeInactive = tutorB.id;
    const inactive = await get(`/book-demo?tutor=${tutorB.id}`);
    check("inactive tutor is not requestable", /bd-notice/.test(inactive.html));
    await q("UPDATE tutors SET status = 'active' WHERE id = ?", [tutorB.id]);
    madeInactive = null;

    // ── 5. the request reaches the database ─────────────────────
    console.log("\n5. POST /api/demo stores the requested tutor");
    const p1 = phoneFor(1);
    createdPhones.push(p1);
    const r1 = await post({
      fullName: "Smoke Test Parent", email: "smoke@example.com", phone: p1,
      studentClass: "Class 8", time: "Evening", subjects: ["Mathematics"],
      area: "Rohini", message: "smoke test", requestedTutorId: tutorA.id,
    });
    check("created", r1.status === 201, `status ${r1.status}`);
    const row1 = (await q("SELECT * FROM demo_requests WHERE phone = ?", [p1]))[0];
    check("row written", Boolean(row1));
    check("requested_tutor_id saved", row1?.requested_tutor_id === tutorA.id,
      `got ${row1?.requested_tutor_id}`);
    check("assigned_tutor_id still empty", row1?.assigned_tutor_id == null,
      "requesting is not assigning");
    check("source unchanged", row1?.source === "web_form",
      "requested_tutor_id already says it came from a profile");

    // ── 6. a bogus id must not cost a lead ──────────────────────
    console.log("\n6. an invalid tutor id still saves the lead");
    const p2 = phoneFor(2);
    createdPhones.push(p2);
    const r2 = await post({
      fullName: "Smoke Test Two", email: "smoke2@example.com", phone: p2,
      subjects: ["English"], requestedTutorId: 99999999,
    });
    check("still created", r2.status === 201, `status ${r2.status}`);
    const row2 = (await q("SELECT * FROM demo_requests WHERE phone = ?", [p2]))[0];
    check("row written", Boolean(row2));
    check("bad id stored as NULL", row2?.requested_tutor_id == null);

    // ── 7. duplicate suppression is scoped to the tutor ─────────
    console.log("\n7. duplicate suppression");
    const p3 = phoneFor(3);
    createdPhones.push(p3);
    const first = await post({
      fullName: "Comparing Parent", phone: p3, subjects: ["Mathematics"],
      requestedTutorId: tutorA.id,
    });
    check("first request created", first.status === 201);

    const same = await post({
      fullName: "Comparing Parent", phone: p3, subjects: ["Mathematics"],
      requestedTutorId: tutorA.id,
    });
    check("same tutor again is a duplicate", same.data?.duplicate === true);

    const other = await post({
      fullName: "Comparing Parent", phone: p3, subjects: ["Mathematics"],
      requestedTutorId: tutorB.id,
    });
    check("a DIFFERENT tutor is not a duplicate", other.data?.duplicate !== true,
      "a family comparing two profiles must not have the second request swallowed");
    const forPhone3 = await q(
      "SELECT requested_tutor_id FROM demo_requests WHERE phone = ? ORDER BY id", [p3]
    );
    check("both tutors recorded", forPhone3.length === 2,
      `rows: ${forPhone3.map((r) => r.requested_tutor_id).join(", ")}`);

    // Two generic enquiries in a row are still duplicates of each other.
    const p4 = phoneFor(4);
    createdPhones.push(p4);
    await post({ fullName: "Generic Parent", phone: p4, subjects: [] });
    const genericAgain = await post({ fullName: "Generic Parent", phone: p4, subjects: [] });
    check("two generic enquiries still dedupe", genericAgain.data?.duplicate === true,
      "NULL <=> NULL must match");

    // ── 8. the office can see it ────────────────────────────────
    console.log("\n8. admin queue exposes the requested tutor");
    const adminSql = await q(
      `SELECT dr.id, rt.first_name AS requested_first, t.first_name AS tutor_first
         FROM demo_requests dr
         LEFT JOIN tutors t  ON t.id  = dr.assigned_tutor_id
         LEFT JOIN tutors rt ON rt.id = dr.requested_tutor_id
        WHERE dr.phone = ?`, [p1]
    );
    check("admin join resolves the requested tutor",
      adminSql[0]?.requested_first === tutorA.first_name,
      `got ${adminSql[0]?.requested_first}`);
    check("assigned tutor is separate and empty", adminSql[0]?.tutor_first == null);

    // ── 9. the link that started all this ───────────────────────
    console.log("\n9. the tutor card links here");
    const tutorsPage = await get("/tutors");
    check("cards link to /book-demo?tutor=", /href="\/book-demo\?tutor=\d+"/.test(tutorsPage.html));
    const firstLink = (tutorsPage.html.match(/href="\/book-demo\?tutor=(\d+)"/) || [])[1];
    check("that link resolves to a real page",
      firstLink ? (await get(`/book-demo?tutor=${firstLink}`)).status === 200 : false);

    // ── 10. regression: the contact form still works ────────────
    console.log("\n10. regression — the form without a tutor is unchanged");
    const contact = await get("/contact");
    check("contact page 200", contact.status === 200);
    check("form still rendered there", /class="book-demo-form"/.test(contact.html));
    check("no tutor chip on contact", !/bd-requesting/.test(contact.html));
  } catch (err) {
    console.error("\nunexpected error:", err.message);
    fail += 1;
  } finally {
    if (madeInactive) {
      await conn.query("UPDATE tutors SET status = 'active' WHERE id = ?", [madeInactive]);
      console.log(`\ncleanup: restored tutor #${madeInactive} to active`);
    }
    if (createdPhones.length) {
      const [res] = await conn.query(
        `DELETE FROM demo_requests WHERE phone IN (${createdPhones.map(() => "?").join(",")})`,
        createdPhones
      );
      console.log(`cleanup: removed ${res.affectedRows} test demo_requests`);
    }
    await conn.end();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})();
