// database/migration/validate-sql.js
// Static checks on the generated import, run without a database connection.
// Catches the failure mode that would otherwise be silent: a slug referenced by
// an INSERT ... SELECT that does not exist, which inserts nothing and reports
// no error.
//
//   node database/migration/validate-sql.js

const fs = require("fs");
const path = require("path");

const REF = JSON.parse(fs.readFileSync(path.join(__dirname, "reference.json"), "utf8"));
const sql = fs.readFileSync(path.join(__dirname, "import-tutors.sql"), "utf8");

const known = {
  classes: new Set(REF.classes.map((c) => c.slug)),
  subjects: new Set(REF.subjects.map((s) => s.slug)),
  locations: new Set(REF.locations.map((l) => l.slug)),
  qualifications: new Set(REF.qualifications.map((q) => q.slug)),
  specializations: new Set(REF.specializations.map((s) => s.slug)),
};

const problems = [];
const used = { classes: new Set(), subjects: new Set(), locations: new Set(), qualifications: new Set(), specializations: new Set() };

const collect = (table, slugs) => {
  for (const slug of slugs) {
    used[table].add(slug);
    if (!known[table].has(slug)) problems.push(`unknown ${table} slug: ${slug}`);
  }
};

const slugsIn = (fragment) => [...fragment.matchAll(/'([^']+)'/g)].map((m) => m[1]);

for (const m of sql.matchAll(/WHERE c\.slug IN \(([^)]*)\) AND s\.slug IN \(([^)]*)\)/g)) {
  collect("classes", slugsIn(m[1]));
  collect("subjects", slugsIn(m[2]));
}
for (const m of sql.matchAll(/FROM locations WHERE slug IN \(([^)]*)\)/g)) {
  collect("locations", slugsIn(m[1]));
}
for (const m of sql.matchAll(/FROM classes WHERE slug = '([^']+)'/g)) {
  collect("classes", [m[1]]);
}
for (const m of sql.matchAll(/FROM qualifications WHERE slug = '([^']+)'/g)) {
  collect("qualifications", [m[1]]);
}
for (const m of sql.matchAll(/FROM specializations WHERE slug = '([^']+)'/g)) {
  collect("specializations", [m[1]]);
}

/* Structural checks */
const inserts = (sql.match(/^INSERT INTO tutors \($/gm) || []).length;
const lastIds = (sql.match(/^SET @tid = LAST_INSERT_ID\(\);$/gm) || []).length;
if (inserts !== lastIds) problems.push(`tutor INSERTs (${inserts}) != LAST_INSERT_ID captures (${lastIds})`);

const begins = (sql.match(/^START TRANSACTION;$/gm) || []).length;
const commits = (sql.match(/^COMMIT;$/gm) || []).length;
if (begins !== 1 || commits !== 1) problems.push(`expected exactly one transaction, found ${begins} START / ${commits} COMMIT`);

// Every child insert must reference @tid, never a literal id.
const childInserts = sql.match(/^INSERT (?:IGNORE )?INTO tutor_(teaching_profiles|locations|custom_subjects)[\s\S]*?;$/gm) || [];
for (const stmt of childInserts) {
  if (!stmt.includes("@tid")) problems.push(`child insert without @tid: ${stmt.slice(0, 80)}`);
}

// Unescaped quote check: an odd number of quotes on a VALUES line means broken escaping.
let lineNo = 0;
for (const line of sql.split("\n")) {
  lineNo += 1;
  if (!line.trim() || line.trim().startsWith("--")) continue;
  const quotes = (line.match(/'/g) || []).length;
  if (quotes % 2 !== 0) problems.push(`line ${lineNo}: odd quote count — ${line.trim().slice(0, 90)}`);
}

console.log("=".repeat(60));
console.log("IMPORT SQL VALIDATION");
console.log("=".repeat(60));
console.log(`tutor INSERT statements   ${inserts}`);
console.log(`child INSERT statements   ${childInserts.length}`);
console.log("");
console.log("distinct reference slugs used (all must exist):");
for (const table of Object.keys(used)) {
  console.log(`  ${table.padEnd(16)} ${String(used[table].size).padStart(4)} / ${known[table].size} known`);
}
console.log("");

if (problems.length) {
  console.log(`FAILED — ${problems.length} problem(s):`);
  problems.slice(0, 40).forEach((p) => console.log("  ✗ " + p));
  process.exitCode = 1;
} else {
  console.log("PASSED — every referenced slug exists, structure is consistent.");
}
