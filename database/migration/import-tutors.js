// database/migration/import-tutors.js
// Turns the legacy tutors.json export into SQL for the v3 schema.
//
//   node database/migration/import-tutors.js            # write import-tutors.sql
//   node database/migration/import-tutors.js --execute  # ...and run it
//
// Behaviour agreed with the project owner:
//   * duplicates      — one tutor per WhatsApp number, newest submission wins,
//                       classes/subjects/areas unioned across the group
//   * "all subjects"  — expanded to a core set based on the classes taught
//   * own_vehicle     — preserved (run 001_add_own_vehicle.sql first)
//   * status          — 'active' only when the row has a usable phone plus at
//                       least one class, subject and area; otherwise 'inactive'
//
// Reference rows are addressed by slug, never by hard-coded id, so the output
// stays valid whatever the auto-increment values happen to be.

const fs = require("fs");
const path = require("path");
const N = require("./normalize");

const SOURCE = path.join(__dirname, "..", "tutors.json");
const OUT_SQL = path.join(__dirname, "import-tutors.sql");
const OUT_REPORT = path.join(__dirname, "import-summary.txt");

const rows = JSON.parse(fs.readFileSync(SOURCE, "utf8"));

/* =========================================================================
   SQL helpers
   ========================================================================= */

function q(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

const num = (v) => (v === null || v === undefined || v === "" ? "NULL" : String(Number(v)));
const bool = (v) => (v ? "1" : "0");
const slugList = (slugs) => slugs.map((s) => q(s)).join(", ");

/* =========================================================================
   Pass 1 — normalise every legacy record
   ========================================================================= */

function normaliseRecord(r, index) {
  const submitted = N.clean(r.Submitted);
  const submittedYear = Number(submitted.slice(0, 4)) || 2026;

  const cls = N.parseClasses(r["Mention Classes"]);
  const sub = N.parseSubjects(r["Mention Subjects"]);
  const areas = N.parseAreas(r["Mention Areas"]);
  const qual = N.parseQualification(r["Highest Qualification"]);
  const dob = N.parseDob(r["Date of Birth"], submittedYear);
  const exp = N.parseExperienceYears(r["Teaching Experience"]);

  // "All subjects" only becomes concrete rows when nothing specific was named.
  const subjects = sub.allSubjects && !sub.slugs.length ? N.expandAllSubjects(cls.slugs) : sub.slugs;

  const teachesInSchool = N.key(r["Teaching in Any School"]) === "yes";

  return {
    index,
    submitted,
    submittedYear,

    first_name: N.clean(r["First Name"]).slice(0, 80) || null,
    last_name: N.clean(r["Last Name"]).slice(0, 80) || null,
    gender: N.mapEnum(r.Gender, N.GENDER),
    date_of_birth: dob.value,
    marital_status: N.mapEnum(r["Marital Status"], N.MARITAL),
    own_vehicle: N.key(r["Own Vehicle"]) === "yes",

    whatsapp: N.parsePhone(r["WhatsApp Number"]),
    alternate_phone: N.parsePhone(r["Alternative Number"]),
    email: N.parseEmail(r["Email Address"]),
    family_phone: N.parsePhone(r["Mobile No. of Family Member"]),
    family_relation: N.clean(r["Relation with Family Member"]).slice(0, 60) || null,

    present_address: N.clean(r["Present Address"]) || null,
    permanent_address: N.clean(r["Permanent Address"]) || null,
    residential_status: N.mapEnum(r["Residential Status"], N.RESIDENTIAL),

    qualification: qual.raw ? qual.raw.slice(0, 120) : null, // free text, always kept
    qualification_slug: qual.qualification, // FK when a specific degree was named
    specialization_slug: qual.specialization,
    additional_qualification: N.clean(r["Additional Qualification"]).slice(0, 120) || null,
    english_fluency: N.mapEnum(r["Fluency in English"], N.FLUENCY),

    teaching_start_year: exp.years === null ? null : submittedYear - exp.years,
    teaches_in_school: teachesInSchool,
    school_name_address: teachesInSchool ? N.clean(r["Name and Address of School"]) || null : null,

    source_channel: N.mapEnum(r["Where You have seen Our Advertisement"], N.SOURCE),
    referred_by_name: N.clean(r["Name of Friend Referred You"]).slice(0, 80) || null,
    referral_phone: N.parsePhone(r["Friend's Contact Number"]),
    comment: N.clean(r["Any Comment or Suggestion"]) || null,
    terms_accepted: Boolean(N.clean(r["Terms and Conditions"])),

    classes: cls.slugs,
    subjects,
    customSubjects: sub.custom,
    areas: areas.slugs,
  };
}

const normalised = rows.map(normaliseRecord);

/* =========================================================================
   Pass 2 — merge duplicate registrations
   ========================================================================= */

/**
 * Group by WhatsApp number, falling back to email, then to a unique key so
 * unidentifiable rows stay separate. Newest submission wins for scalar fields;
 * classes, subjects and areas are unioned so an earlier registration never
 * loses coverage.
 */
function mergeDuplicates(records) {
  const groups = new Map();

  for (const rec of records) {
    const identity = rec.whatsapp || (rec.email ? `email:${rec.email}` : `row:${rec.index}`);
    if (!groups.has(identity)) groups.set(identity, []);
    groups.get(identity).push(rec);
  }

  const merged = [];
  let mergedAway = 0;

  for (const [identity, group] of groups) {
    group.sort((a, b) => b.submitted.localeCompare(a.submitted)); // newest first
    const [newest, ...older] = group;
    mergedAway += older.length;

    const out = { ...newest, identity, mergedFrom: group.length };

    // Prefer the newest non-empty value, then fall back through older rows.
    const SCALARS = [
      "last_name", "gender", "date_of_birth", "marital_status", "alternate_phone", "email",
      "family_phone", "family_relation", "present_address", "permanent_address",
      "residential_status", "qualification", "qualification_slug", "specialization_slug",
      "additional_qualification", "english_fluency", "teaching_start_year",
      "school_name_address", "source_channel", "referred_by_name", "referral_phone", "comment",
    ];
    for (const field of SCALARS) {
      if (out[field] === null || out[field] === undefined) {
        const fallback = older.find((r) => r[field] !== null && r[field] !== undefined);
        if (fallback) out[field] = fallback[field];
      }
    }

    // A "yes" anywhere in the group wins for the boolean flags.
    out.own_vehicle = group.some((r) => r.own_vehicle);
    out.teaches_in_school = group.some((r) => r.teaches_in_school);
    out.terms_accepted = group.some((r) => r.terms_accepted);

    out.classes = [...new Set(group.flatMap((r) => r.classes))];
    out.subjects = [...new Set(group.flatMap((r) => r.subjects))];
    out.areas = [...new Set(group.flatMap((r) => r.areas))];
    out.customSubjects = [...new Set(group.flatMap((r) => r.customSubjects))];

    // Registered when they first appeared; updated when they last did.
    out.created_at = group[group.length - 1].submitted;
    out.updated_at = newest.submitted;

    merged.push(out);
  }

  return { merged, mergedAway };
}

const { merged, mergedAway } = mergeDuplicates(normalised);

// Keep the original submission order so the output diffs cleanly between runs.
merged.sort((a, b) => a.created_at.localeCompare(b.created_at));

/* =========================================================================
   Pass 3 — status and SQL emission
   ========================================================================= */

/** Complete enough to be matched against a live enquiry. */
function isComplete(t) {
  return Boolean(t.whatsapp && t.classes.length && t.subjects.length && t.areas.length);
}

const CLASS_ORDER = new Map(N.REF.classes.map((c) => [c.slug, c.sort_order]));

const sql = [];
const w = (line = "") => sql.push(line);

w("-- database/migration/import-tutors.sql");
w("-- GENERATED by import-tutors.js — do not edit by hand.");
w(`-- Source: database/tutors.json (${rows.length} records -> ${merged.length} tutors)`);
w(`-- Generated: ${new Date().toISOString()}`);
w("--");
w("-- Prerequisites, in order:");
w("--   1. database/ght-v3-schema.sql");
w("--   2. database/seed_reference_data_v3.sql + seed_education_reference_v3.sql");
w("--   3. database/migration/proposed-reference-additions.sql   (reviewed)");
w("--   4. database/migration/001_add_own_vehicle.sql");
w("");
w("SET NAMES utf8mb4;");
w("SET @OLD_AUTOCOMMIT = @@AUTOCOMMIT;");
w("SET AUTOCOMMIT = 0;");
w("START TRANSACTION;");
w("");

let stats = {
  active: 0,
  inactive: 0,
  pairs: 0,
  locations: 0,
  custom: 0,
  noPhone: 0,
  noClass: 0,
  noSubject: 0,
  noArea: 0,
  qualFk: 0,
  specFk: 0,
};

for (const t of merged) {
  const complete = isComplete(t);
  const status = complete ? "active" : "inactive";
  if (complete) stats.active += 1;
  else stats.inactive += 1;

  if (!t.whatsapp) stats.noPhone += 1;
  if (!t.classes.length) stats.noClass += 1;
  if (!t.subjects.length) stats.noSubject += 1;
  if (!t.areas.length) stats.noArea += 1;
  if (t.qualification_slug) stats.qualFk += 1;
  if (t.specialization_slug) stats.specFk += 1;

  const note = [`legacy import`, `row ${t.index}`, t.mergedFrom > 1 ? `merged ${t.mergedFrom} submissions` : null]
    .filter(Boolean)
    .join(", ");

  w(`-- ── ${t.first_name || "?"} ${t.last_name || ""} · ${note} ─────────`);
  w("INSERT INTO tutors (");
  w("  first_name, last_name, gender, date_of_birth, marital_status,");
  w("  whatsapp, alternate_phone, email, family_phone, family_relation,");
  w("  present_address, permanent_address, residential_status, own_vehicle,");
  w("  qualification, highest_qualification_id, specialization_id,");
  w("  additional_qualification, english_fluency,");
  w("  teaching_start_year, teaches_in_school, school_name_address, teaching_mode,");
  w("  source_channel, referred_by_name, referral_phone, comment,");
  w("  terms_accepted, status, verified, profile_completed, created_at, updated_at");
  w(") VALUES (");
  w(`  ${q(t.first_name)}, ${q(t.last_name)}, ${q(t.gender)}, ${q(t.date_of_birth)}, ${q(t.marital_status)},`);
  w(`  ${q(t.whatsapp)}, ${q(t.alternate_phone)}, ${q(t.email)}, ${q(t.family_phone)}, ${q(t.family_relation)},`);
  w(`  ${q(t.present_address)}, ${q(t.permanent_address)}, ${q(t.residential_status)}, ${bool(t.own_vehicle)},`);
  w(`  ${q(t.qualification)},`);
  w(
    `  ${t.qualification_slug ? `(SELECT id FROM qualifications WHERE slug = ${q(t.qualification_slug)})` : "NULL"},`
  );
  w(
    `  ${t.specialization_slug ? `(SELECT id FROM specializations WHERE slug = ${q(t.specialization_slug)})` : "NULL"},`
  );
  w(`  ${q(t.additional_qualification)}, ${q(t.english_fluency)},`);
  w(
    `  ${num(t.teaching_start_year)}, ${bool(t.teaches_in_school)}, ${q(t.school_name_address)}, 'In-person',`
  );
  w(`  ${q(t.source_channel)}, ${q(t.referred_by_name)}, ${q(t.referral_phone)}, ${q(t.comment)},`);
  w(`  ${bool(t.terms_accepted)}, ${q(status)}, 0, ${bool(complete)}, ${q(t.created_at)}, ${q(t.updated_at)}`);
  w(");");
  w("SET @tid = LAST_INSERT_ID();");

  if (t.classes.length && t.subjects.length) {
    // Cross join: every class the tutor named against every subject.
    w("INSERT IGNORE INTO tutor_teaching_profiles (tutor_id, class_id, subject_id)");
    w(`SELECT @tid, c.id, s.id FROM classes c JOIN subjects s`);
    w(`  WHERE c.slug IN (${slugList(t.classes)}) AND s.slug IN (${slugList(t.subjects)});`);
    stats.pairs += t.classes.length * t.subjects.length;
  }

  if (t.areas.length) {
    w("INSERT IGNORE INTO tutor_locations (tutor_id, location_id)");
    w(`SELECT @tid, id FROM locations WHERE slug IN (${slugList(t.areas)});`);
    stats.locations += t.areas.length;
  }

  if (t.customSubjects.length && t.classes.length) {
    // tutor_custom_subjects requires a class; attach to the lowest one named.
    const anchor = [...t.classes].sort((a, b) => (CLASS_ORDER.get(a) ?? 99) - (CLASS_ORDER.get(b) ?? 99))[0];
    for (const name of t.customSubjects) {
      w("INSERT IGNORE INTO tutor_custom_subjects (tutor_id, class_id, subject_name, status)");
      w(`SELECT @tid, id, ${q(name.slice(0, 100))}, 'pending' FROM classes WHERE slug = ${q(anchor)};`);
      stats.custom += 1;
    }
  }

  w("");
}

w("COMMIT;");
w("SET AUTOCOMMIT = @OLD_AUTOCOMMIT;");
w("");
w("-- Verify:");
w("--   SELECT status, COUNT(*) FROM tutors GROUP BY status;");
w("--   SELECT COUNT(*) FROM tutor_teaching_profiles;");
w("--   SELECT COUNT(*) FROM tutor_locations;");
w("--   SELECT COUNT(*) FROM tutor_custom_subjects;");

fs.writeFileSync(OUT_SQL, sql.join("\n"));

/* =========================================================================
   Summary
   ========================================================================= */

const pct = (n, d = merged.length) => `${((n / d) * 100).toFixed(1)}%`;
const R = [];
const say = (s = "") => R.push(s);

say("=".repeat(64));
say("LEGACY TUTOR IMPORT — SUMMARY");
say("=".repeat(64));
say("");
say(`source records            ${rows.length}`);
say(`merged duplicates away    ${mergedAway}`);
say(`tutors to insert          ${merged.length}`);
say("");
say(`  status = active         ${stats.active}  (${pct(stats.active)})`);
say(`  status = inactive       ${stats.inactive}  (${pct(stats.inactive)})`);
say("");
say("related rows");
say(`  tutor_teaching_profiles ${stats.pairs}`);
say(`  tutor_locations         ${stats.locations}`);
say(`  tutor_custom_subjects   ${stats.custom}`);
say("");
say("reasons a tutor is inactive (a row can have more than one)");
say(`  no usable phone         ${stats.noPhone}`);
say(`  no class parsed         ${stats.noClass}`);
say(`  no subject parsed       ${stats.noSubject}`);
say(`  no area parsed          ${stats.noArea}`);
say("");
say("reference links resolved");
say(`  highest_qualification_id set  ${stats.qualFk}  (${pct(stats.qualFk)})`);
say(`  specialization_id set         ${stats.specFk}  (${pct(stats.specFk)})`);
say(`  (every tutor keeps the original text in tutors.qualification)`);
say("");
say(`SQL written to database/migration/import-tutors.sql (${(fs.statSync(OUT_SQL).size / 1e6).toFixed(2)} MB)`);

const report = R.join("\n");
fs.writeFileSync(OUT_REPORT, report);
console.log(report);

/* =========================================================================
   Optional execution
   ========================================================================= */

/**
 * TLS options, mirroring lib/db.js. Duplicated rather than imported because
 * lib/db.js is an ES module and these migration scripts run under plain node.
 */
function sslOptions(env) {
  if (env.DB_SSL_CA) return { ca: env.DB_SSL_CA.replace(/\\n/g, "\n"), rejectUnauthorized: true };

  if (env.DB_SSL_CA_PATH) {
    const resolved = path.isAbsolute(env.DB_SSL_CA_PATH)
      ? env.DB_SSL_CA_PATH
      : path.join(process.cwd(), env.DB_SSL_CA_PATH);
    return { ca: fs.readFileSync(resolved, "utf8"), rejectUnauthorized: true };
  }

  if (env.DB_SSL === "true") return { rejectUnauthorized: true };
  return undefined;
}

/** Minimal .env.local reader — Next loads it for the app, plain node does not. */
function readEnv() {
  const file = path.join(__dirname, "..", "..", ".env.local");
  const env = {};
  if (!fs.existsSync(file)) return env;

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  }
  return env;
}

if (process.argv.includes("--execute")) {
  (async () => {
    const env = { ...readEnv(), ...process.env };
    const mysql = require("mysql2/promise");

    const conn = await mysql.createConnection({
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      charset: "utf8mb4_unicode_ci",
      multipleStatements: true,
      ...(sslOptions(env) ? { ssl: sslOptions(env) } : {}),
    });

    console.log("\nexecuting import-tutors.sql …");
    try {
      await conn.query(fs.readFileSync(OUT_SQL, "utf8"));
      const [[counts]] = await conn.query(
        `SELECT
           (SELECT COUNT(*) FROM tutors) AS tutors,
           (SELECT COUNT(*) FROM tutor_teaching_profiles) AS profiles,
           (SELECT COUNT(*) FROM tutor_locations) AS locations,
           (SELECT COUNT(*) FROM tutor_custom_subjects) AS custom_subjects`
      );
      console.log("done:", counts);
    } finally {
      await conn.end();
    }
  })().catch((err) => {
    console.error("\nimport failed:", err.message);
    process.exitCode = 1;
  });
}
