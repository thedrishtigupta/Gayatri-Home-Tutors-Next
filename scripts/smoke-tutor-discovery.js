// scripts/smoke-tutor-discovery.js
// Checks /tutors against the database: do the filters return what they claim,
// and does anything private leak into the HTML?
//
//   node scripts/smoke-tutor-discovery.js --port 3000

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

/**
 * Counts are no longer shown to visitors, so the result total is read from the
 * data attribute on the results container. That keeps every "does this filter
 * actually return the right people" assertion working.
 */
const statedTotal = (html) => {
  const m = html.match(/data-tutor-total="(\d+)"/);
  return m ? Number(m[1]) : null;
};
const cardCount = (html) => (html.match(/<article class="td-card">/g) || []).length;

const get = async (url) => {
  const res = await fetch(BASE + url);
  return { status: res.status, html: await res.text() };
};

(async () => {
  const conn = await require("mysql2/promise").createConnection({
    host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER,
    password: env.DB_PASSWORD, database: env.DB_NAME, ssl,
  });
  const q = async (sql, p = []) => (await conn.query(sql, p))[0];

  try {
    console.log("1. counts match the database");

    const [[all]] = [await q("SELECT COUNT(*) AS n FROM tutors WHERE status = 'active'")];
    const hub = await get("/tutors");
    check("hub loads", hub.status === 200);
    check("hub total matches active tutors", statedTotal(hub.html) === Number(all.n),
      `page ${statedTotal(hub.html)} vs db ${all.n}`);
    check("one page of cards rendered", cardCount(hub.html) === 12, `${cardCount(hub.html)} cards`);

    const [[rohini]] = [await q(
      `SELECT COUNT(DISTINCT t.id) AS n FROM tutors t
       JOIN tutor_locations tl ON tl.tutor_id = t.id
       JOIN locations l ON l.id = tl.location_id AND l.slug = 'rohini'
       WHERE t.status = 'active'`
    )];
    const area = await get("/tutors?area=rohini");
    check("area filter matches db", statedTotal(area.html) === Number(rohini.n),
      `page ${statedTotal(area.html)} vs db ${rohini.n}`);

    const [[mathsRohini]] = [await q(
      `SELECT COUNT(DISTINCT t.id) AS n FROM tutors t
       JOIN tutor_teaching_profiles p ON p.tutor_id = t.id
       JOIN subjects s ON s.id = p.subject_id AND s.slug = 'mathematics'
       JOIN tutor_locations tl ON tl.tutor_id = t.id
       JOIN locations l ON l.id = tl.location_id AND l.slug = 'rohini'
       WHERE t.status = 'active'`
    )];
    const two = await get("/tutors?subject=mathematics&area=rohini");
    check("subject + area matches db", statedTotal(two.html) === Number(mathsRohini.n),
      `page ${statedTotal(two.html)} vs db ${mathsRohini.n}`);

    // The pair must be satisfied by the same teaching row, not two separate ones.
    const [[c10Maths]] = [await q(
      `SELECT COUNT(DISTINCT t.id) AS n FROM tutors t
       JOIN tutor_teaching_profiles p ON p.tutor_id = t.id
       JOIN subjects s ON s.id = p.subject_id AND s.slug = 'mathematics'
       JOIN classes c ON c.id = p.class_id AND c.slug = 'class-10'
       JOIN tutor_locations tl ON tl.tutor_id = t.id
       JOIN locations l ON l.id = tl.location_id AND l.slug = 'rohini'
       WHERE t.status = 'active'`
    )];
    const three = await get("/tutors?class=class-10&subject=mathematics&area=rohini");
    check("class + subject + area matches db", statedTotal(three.html) === Number(c10Maths.n),
      `page ${statedTotal(three.html)} vs db ${c10Maths.n}`);
    check("narrowing actually narrows", Number(c10Maths.n) < Number(rohini.n),
      `${c10Maths.n} < ${rohini.n}`);

    console.log("");
    console.log("2. search by name");
    const [[someone]] = [await q(
      `SELECT first_name, last_name FROM tutors
       WHERE status = 'active' AND last_name IS NOT NULL AND LENGTH(last_name) > 3
       ORDER BY id LIMIT 1`
    )];
    const surname = someone.last_name;

    const [[byName]] = [await q(
      `SELECT COUNT(*) AS n FROM tutors
       WHERE status = 'active' AND CONCAT_WS(' ', first_name, last_name) LIKE ?`,
      [`%${surname}%`]
    )];
    const named = await get(`/tutors?q=${encodeURIComponent(surname)}`);
    check("name search matches db", statedTotal(named.html) === Number(byName.n),
      `"${surname}": page ${statedTotal(named.html)} vs db ${byName.n}`);
    check("name search narrows the list", Number(byName.n) < Number(all.n),
      `${byName.n} < ${all.n}`);

    const full = `${someone.first_name} ${someone.last_name}`;
    const exact = await get(`/tutors?q=${encodeURIComponent(full)}`);
    check("full name matches across both name columns", statedTotal(exact.html) >= 1,
      `"${full}" -> ${statedTotal(exact.html)}`);

    // A visitor typing "%" must not match everyone.
    const wildcard = await get("/tutors?q=%25");
    check("LIKE wildcards are escaped", statedTotal(wildcard.html) === 0,
      `got ${statedTotal(wildcard.html)}`);

    const nonsense = await get("/tutors?q=zzzznotarealname");
    check("no match shows the empty state", /Nothing matches yet/.test(nonsense.html));

    check("verified filter removed from the UI", !/Verified tutors only/.test(hub.html));

    console.log("");
    console.log("3. paging");
    const p1 = await get("/tutors?area=rohini");
    const p2 = await get("/tutors?area=rohini&page=2");
    const idsOf = (html) => (html.match(/\/book-demo\?tutor=(\d+)/g) || []).join(",");
    check("page 2 loads", p2.status === 200);
    check("page 2 shows different tutors", idsOf(p1.html) !== idsOf(p2.html));
    check("page 2 is full", cardCount(p2.html) === 12, `${cardCount(p2.html)} cards`);

    console.log("");
    console.log("4. nothing private in the HTML");
    // Take real contact details from the tutors actually on the page and make
    // sure none of them appear anywhere in the markup.
    // Server components emit each href twice — once in the HTML, once in the
    // RSC payload — so count distinct ids, not raw matches.
    const shown = [...new Set([...hub.html.matchAll(/\/book-demo\?tutor=(\d+)/g)].map((m) => Number(m[1])))];
    check("card links carry a tutor id", shown.length === 12, `${shown.length} distinct ids`);

    if (shown.length) {
      const rows = await q(
        `SELECT whatsapp, email, alternate_phone, family_phone, present_address
         FROM tutors WHERE id IN (${shown.map(() => "?").join(",")})`,
        shown
      );
      // Some tutors give a bare area name as their address ("Pitampura"), which
      // the page legitimately prints as a browse link. Those are not leaks, so
      // any value that is itself a location name is excluded.
      const locationNames = new Set(
        (await q("SELECT name FROM locations")).map((r) => r.name.toLowerCase())
      );

      const leaked = [];
      for (const r of rows) {
        for (const [field, value] of Object.entries(r)) {
          if (!value) continue;
          const v = String(value);
          if (v.length <= 5) continue;
          if (locationNames.has(v.toLowerCase())) continue;
          if (hub.html.includes(v)) leaked.push(`${field}=${v}`);
        }
      }
      check("no contact detail of any listed tutor appears", leaked.length === 0, leaked.slice(0, 3).join(", "));

      // Structural guarantee: the search layer must never select a contact column.
      const searchSrc = fs.readFileSync(path.join(ROOT, "lib", "tutorSearch.js"), "utf8");
      const forbidden = ["whatsapp", "alternate_phone", "family_phone", "present_address", "permanent_address"]
        .filter((col) => new RegExp(`t\.${col}\b`).test(searchSrc));
      check("search layer selects no contact columns", forbidden.length === 0, forbidden.join(", "));
    }

    console.log("");
    console.log("5. filters, empty state, edge cases");
    check("browse-by-area block present", /Browse by area/.test(hub.html));
    check("browse links are crawlable anchors", /href="\/tutors\?area=/.test(hub.html));
    check("subject multiselect rendered", /td-subject-opt/.test(hub.html));
    check("'All subjects' row inside the subject list", /td-subject-all/.test(hub.html));

    // "All subjects" means one tutor covering all five core subjects, so it
    // must return strictly fewer people than any single subject.
    const CORE = ["mathematics", "science", "social-science", "english", "hindi"];
    const [coreDb] = await q(
      `SELECT COUNT(*) AS n FROM tutors t WHERE t.status = 'active' AND ` +
        CORE.map(() => `EXISTS (SELECT 1 FROM tutor_teaching_profiles p
                                JOIN subjects s ON s.id = p.subject_id
                                WHERE p.tutor_id = t.id AND s.slug = ?)`).join(" AND "),
      CORE
    );
    const corePage = await get(`/tutors?subject=${CORE.join(",")}`);
    check("all-subjects matches db", statedTotal(corePage.html) === Number(coreDb.n),
      `page ${statedTotal(corePage.html)} vs db ${coreDb.n}`);

    const mathsOnly = await get("/tutors?subject=mathematics");
    check("multiple subjects mean AND, not OR",
      statedTotal(corePage.html) < statedTotal(mathsOnly.html),
      `${statedTotal(corePage.html)} < ${statedTotal(mathsOnly.html)}`);

    check("only one <h1> on the page", (hub.html.match(/<h1/g) || []).length === 1,
      `${(hub.html.match(/<h1/g) || []).length} found`);

    // No tutor counts anywhere a visitor can see them.
    const visible = hub.html
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/data-tutor-total="\d+"/g, "")
      .replace(/<[^>]+>/g, " ");
    check("no 'N tutors available' line", !/\d+\s+tutors?\s+available/i.test(visible));
    check("no counts beside facet names", !/\((\d+)\)\s*(Mathematics|Rohini|Class 10)/.test(visible));
    check("page info still shown", /Page\s+1\s+of\s+\d+/.test(visible));
    const empty = await get("/tutors?subject=mathematics&area=rohini&minExperience=60");
    check("impossible filter shows empty state", /Nothing matches yet/.test(empty.html));
    check("unknown slug is ignored, not fatal", (await get("/tutors?area=not-a-real-place")).status === 200);
  } catch (err) {
    console.error("\nunexpected error:", err.message);
    fail += 1;
  } finally {
    await conn.end();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
})();
