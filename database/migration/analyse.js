// database/migration/analyse.js
// Dry-run report: how cleanly does tutors.json map onto the v3 schema?
// Writes a machine-readable summary plus leftover lists for manual review.
//
//   node database/migration/analyse.js

const fs = require("fs");
const path = require("path");
const N = require("./normalize");

const rows = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "tutors.json"), "utf8"));
const OUT_DIR = __dirname;

const pct = (n) => `${((n / rows.length) * 100).toFixed(1)}%`;
const bump = (map, k, n = 1) => map.set(k, (map.get(k) || 0) + n);
const top = (map, n = 20) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

const stats = {
  gender: new Map(), marital: new Map(), residential: new Map(), fluency: new Map(), source: new Map(),
  dob: new Map(), phone: new Map(), experience: new Map(), classes: new Map(), subjects: new Map(),
  areas: new Map(), qualification: new Map(),
};

const unmatchedAreas = new Map();
const customSubjects = new Map();
const unmatchedQuals = new Map();
const noClassRows = [];
const noAreaRows = [];

let pairTotal = 0;
let locationTotal = 0;
const seenWhatsapp = new Map();
const seenEmail = new Map();

const parsed = rows.map((r, index) => {
  const submittedYear = Number(String(r.Submitted || "").slice(0, 4)) || 2026;

  const whatsapp = N.parsePhone(r["WhatsApp Number"]);
  const email = N.parseEmail(r["Email Address"]);
  const dob = N.parseDob(r["Date of Birth"], submittedYear);
  const exp = N.parseExperienceYears(r["Teaching Experience"]);
  const cls = N.parseClasses(r["Mention Classes"]);
  const sub = N.parseSubjects(r["Mention Subjects"]);
  const areas = N.parseAreas(r["Mention Areas"]);
  const qual = N.parseQualification(r["Highest Qualification"]);

  // Enum coverage
  bump(stats.gender, N.mapEnum(r.Gender, N.GENDER) || "UNMAPPED");
  bump(stats.marital, N.mapEnum(r["Marital Status"], N.MARITAL) || "UNMAPPED");
  bump(stats.residential, N.mapEnum(r["Residential Status"], N.RESIDENTIAL) || "UNMAPPED");
  bump(stats.fluency, N.mapEnum(r["Fluency in English"], N.FLUENCY) || "UNMAPPED");
  bump(stats.source, N.mapEnum(r["Where You have seen Our Advertisement"], N.SOURCE) || "UNMAPPED");

  bump(stats.dob, dob.value ? "parsed" : dob.reason);
  bump(stats.phone, whatsapp ? "parsed" : "MISSING/INVALID");
  bump(stats.experience, exp.years !== null ? "parsed" : exp.reason);
  bump(stats.qualification, qual.qualification ? "mapped" : qual.generic ? `generic:${qual.generic}` : "UNMAPPED");

  if (!qual.qualification) bump(unmatchedQuals, qual.raw || "(empty)");

  // Teaching profile
  const effectiveSubjects = sub.allSubjects && !sub.slugs.length ? N.expandAllSubjects(cls.slugs) : sub.slugs;
  bump(stats.classes, cls.slugs.length ? `${Math.min(cls.slugs.length, 12)} classes` : "NONE");
  bump(stats.subjects, effectiveSubjects.length ? "mapped" : sub.custom.length ? "custom-only" : "NONE");
  bump(stats.areas, areas.slugs.length ? `${Math.min(areas.slugs.length, 10)} areas` : "NONE");

  if (!cls.slugs.length) noClassRows.push({ index, raw: N.clean(r["Mention Classes"]) });
  if (!areas.slugs.length) noAreaRows.push({ index, raw: N.clean(r["Mention Areas"]) });

  areas.unmatched.forEach((a) => bump(unmatchedAreas, a.toLowerCase()));
  sub.custom.forEach((c) => bump(customSubjects, c.toLowerCase()));

  pairTotal += cls.slugs.length * effectiveSubjects.length;
  locationTotal += areas.slugs.length;

  if (whatsapp) {
    if (!seenWhatsapp.has(whatsapp)) seenWhatsapp.set(whatsapp, []);
    seenWhatsapp.get(whatsapp).push(index);
  }
  if (email) {
    if (!seenEmail.has(email)) seenEmail.set(email, []);
    seenEmail.get(email).push(index);
  }

  return { index, submittedYear, whatsapp, email, dob, exp, cls, sub, effectiveSubjects, areas, qual };
});

/* ── Report ─────────────────────────────────────────────────────────── */

const L = [];
const say = (s = "") => L.push(s);

say("=".repeat(72));
say(`TUTORS.JSON -> GHT V3 MIGRATION ANALYSIS   (${rows.length} source records)`);
say("=".repeat(72));

const section = (title, map, { showPct = true } = {}) => {
  say(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
  for (const [k, c] of top(map, 15)) {
    say(`   ${String(c).padStart(5)}  ${showPct ? pct(c).padStart(6) : "      "}  ${k}`);
  }
};

section("Gender", stats.gender);
section("Marital status", stats.marital);
section("Residential status", stats.residential);
section("English fluency", stats.fluency);
section("Source channel", stats.source);
section("Date of birth", stats.dob);
section("WhatsApp number", stats.phone);
section("Teaching experience -> start year", stats.experience);
section("Highest qualification", stats.qualification);
section("Classes parsed", stats.classes);
section("Subjects parsed", stats.subjects);
section("Areas parsed", stats.areas);

/* Duplicates */
const dupWa = [...seenWhatsapp.entries()].filter(([, ix]) => ix.length > 1);
const dupEm = [...seenEmail.entries()].filter(([, ix]) => ix.length > 1);
say(`\n── Duplicates ${"─".repeat(48)}`);
say(`   WhatsApp numbers used by >1 record : ${dupWa.length} groups, ${dupWa.reduce((a, [, ix]) => a + ix.length - 1, 0)} extra rows`);
say(`   Emails used by >1 record           : ${dupEm.length} groups, ${dupEm.reduce((a, [, ix]) => a + ix.length - 1, 0)} extra rows`);

/* Volume */
say(`\n── Rows the import will write ${"─".repeat(32)}`);
say(`   tutors                    : ${rows.length}`);
say(`   tutor_teaching_profiles   : ~${pairTotal}  (class x subject pairs)`);
say(`   tutor_locations           : ~${locationTotal}`);
say(`   tutor_custom_subjects     : ~${[...customSubjects.values()].reduce((a, c) => a + c, 0)} (from ${customSubjects.size} distinct strings)`);

/* Leftovers */
say(`\n── Top unmatched AREA strings (${unmatchedAreas.size} distinct) ${"─".repeat(16)}`);
top(unmatchedAreas, 30).forEach(([a, c]) => say(`   ${String(c).padStart(4)}  ${a.slice(0, 70)}`));

say(`\n── Top leftover SUBJECT strings (${customSubjects.size} distinct) ${"─".repeat(14)}`);
top(customSubjects, 25).forEach(([a, c]) => say(`   ${String(c).padStart(4)}  ${a.slice(0, 70)}`));

say(`\n── Top unmapped QUALIFICATION strings ${"─".repeat(24)}`);
top(unmatchedQuals, 25).forEach(([a, c]) => say(`   ${String(c).padStart(4)}  ${a.slice(0, 70)}`));

say(`\n── Records with NO parseable class (${noClassRows.length}) ${"─".repeat(20)}`);
noClassRows.slice(0, 20).forEach((r) => say(`   #${String(r.index).padStart(4)}  ${JSON.stringify(r.raw).slice(0, 70)}`));

say(`\n── Records with NO parseable area (${noAreaRows.length}) ${"─".repeat(21)}`);
noAreaRows.slice(0, 20).forEach((r) => say(`   #${String(r.index).padStart(4)}  ${JSON.stringify(r.raw).slice(0, 70)}`));

const report = L.join("\n");
console.log(report);

fs.writeFileSync(path.join(OUT_DIR, "analysis-report.txt"), report);
fs.writeFileSync(
  path.join(OUT_DIR, "review-unmatched.json"),
  JSON.stringify(
    {
      unmatchedAreas: top(unmatchedAreas, 400),
      customSubjects: top(customSubjects, 200),
      unmatchedQualifications: top(unmatchedQuals, 200),
      noClassRows: noClassRows.slice(0, 200),
      noAreaRows: noAreaRows.slice(0, 200),
      duplicateWhatsapp: dupWa.slice(0, 200),
    },
    null,
    1
  )
);

console.log("\nwritten: database/migration/analysis-report.txt");
console.log("written: database/migration/review-unmatched.json");
