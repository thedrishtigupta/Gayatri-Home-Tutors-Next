// database/migration/extract-reference.js
// Pulls the canonical vocabulary out of the v3 seed files so the analysis and
// migration scripts match against exactly what the database will contain.
//
//   node database/migration/extract-reference.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "reference.json");

// The reviewed additions file is included once it exists, so re-running this
// script then import-tutors.js picks up the newly seeded localities/subjects.
const ADDITIONS = path.join(__dirname, "proposed-reference-additions.sql");

const sql =
  fs.readFileSync(path.join(ROOT, "seed_reference_data_v3.sql"), "utf8") +
  fs.readFileSync(path.join(ROOT, "seed_education_reference_v3.sql"), "utf8") +
  (fs.existsSync(ADDITIONS) ? stripComments(fs.readFileSync(ADDITIONS, "utf8")) : "");

/** Drop `-- ...` lines so commented-out proposals are not treated as seeded. */
function stripComments(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

const unquote = (s) => s.trim().replace(/^'|'$/g, "");

const out = { classes: [], subjects: [], qualifications: [], specializations: [], locations: [] };

for (const m of sql.matchAll(/INSERT INTO classes[^V]*VALUES \(([^)]+)\)/gi)) {
  const p = m[1].split(",").map(unquote);
  out.classes.push({ name: p[0], short_name: p[1], slug: p[2], sort_order: Number(p[3]) });
}

for (const m of sql.matchAll(/INSERT INTO subjects[^V]*VALUES \(([^)]+)\)/gi)) {
  const p = m[1].split(",").map(unquote);
  out.subjects.push({ name: p[0], slug: p[1] });
}

for (const m of sql.matchAll(/INSERT INTO qualifications[^V]*VALUES \(([^)]+)\)/gi)) {
  const p = m[1].split(",").map(unquote);
  out.qualifications.push({ name: p[0], slug: p[1] });
}

for (const m of sql.matchAll(/INSERT INTO specializations[^V]*VALUES \(([^)]+)\)/gi)) {
  const p = m[1].split(",").map(unquote);
  out.specializations.push({ name: p[0], slug: p[1] });
}

// States are inserted with VALUES; cities and localities with SELECT ... FROM locations.
for (const m of sql.matchAll(/INSERT INTO locations[^V]*VALUES \(([^)]+)\)/gi)) {
  const p = m[1].split(",").map(unquote);
  out.locations.push({ name: p[0], slug: p[1], location_type: p[2], parent_slug: null });
}
for (const m of sql.matchAll(
  /INSERT INTO locations[^;]*?SELECT '([^']+)', '([^']+)', '([^']+)', id FROM locations WHERE slug = '([^']+)'/gi
)) {
  out.locations.push({ name: m[1], slug: m[2], location_type: m[3], parent_slug: m[4] });
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

for (const k of Object.keys(out)) console.log(k.padEnd(16), out[k].length);
const byType = out.locations.reduce((a, l) => ({ ...a, [l.location_type]: (a[l.location_type] || 0) + 1 }), {});
console.log("location types  ", JSON.stringify(byType));
console.log("\nwritten:", path.relative(process.cwd(), OUT));
