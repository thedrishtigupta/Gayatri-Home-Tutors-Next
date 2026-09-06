// database/migration/normalize.js
// Pure functions that turn one legacy tutors.json record into v3-shaped values.
// Everything here is deterministic and side-effect free so the analysis report
// and the actual import share exactly the same interpretation of the data.

const fs = require("fs");
const path = require("path");

const REF = JSON.parse(fs.readFileSync(path.join(__dirname, "reference.json"), "utf8"));

/* =========================================================================
   Text helpers
   ========================================================================= */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

/** Decode the HTML entities the legacy form saved, collapse whitespace. */
function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/gi, (_, e) => ENTITIES[e.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lowercase, strip punctuation — the key used for vocabulary lookups. */
function key(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[._'’`""(),\-/\\&+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a free-text list on commas, slashes, "and", "&", newlines. */
function splitList(value) {
  return clean(value)
    .split(/[,;|\n]+|\band\b|&|\+|\//gi)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* =========================================================================
   Scalars
   ========================================================================= */

const GENDER = { male: "Male", female: "Female", other: "Other" };

const MARITAL = {
  unmarried: "Single",
  single: "Single",
  married: "Married",
  divorce: "Divorced",
  divorced: "Divorced",
  widow: "Widowed",
  widowed: "Widowed",
};

const RESIDENTIAL = {
  own: "Own",
  rented: "Rented",
  parental: "Parental",
  "pg hostel": "PG/Hostel",
  pg: "PG/Hostel",
  hostel: "PG/Hostel",
};

const FLUENCY = { yes: "Yes", average: "Average", no: "No" };

const SOURCE = {
  "google search": "Google",
  website: "Website",
  "referred by a friend": "Friend / Referral",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  "flex banner": "Flex Banner",
};

function mapEnum(value, table) {
  return table[key(value)] ?? null;
}

/**
 * Legacy numbers are stored as "+91XXXXXXXXXX"; "+91" alone is an empty
 * placeholder. Returns 10 digits, or null when nothing usable is present.
 */
function parsePhone(value) {
  let d = clean(value).replace(/\D/g, "");
  if (!d) return null;
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2); // country code
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1); // trunk prefix
  while (d.length > 10 && d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 || !/^[6-9]/.test(d)) return null;
  return d;
}

function parseEmail(value) {
  const v = clean(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v.slice(0, 120) : null;
}

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Date of birth. Accepts ISO plus the handful of stray formats in the export.
 * Anything implying an age outside 16–80 is rejected as a typo.
 */
function parseDob(value, submittedYear = 2026) {
  const v = clean(value);
  if (!v) return { value: null, reason: "empty" };

  let y = null;
  let m = null;
  let d = null;

  let match;
  if ((match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    [, y, m, d] = match.map(Number);
  } else if ((match = v.match(/^(\d{1,2})[/\-_.](\d{1,2})[/\-_.](\d{4})$/))) {
    [, d, m, y] = match.map(Number); // Indian forms are day-first
  } else if ((match = v.match(/^(\d{1,2})\s*([a-z]+)\s*(\d{4})$/i))) {
    d = Number(match[1]);
    m = MONTHS[match[2].slice(0, 3).toLowerCase()];
    y = Number(match[3]);
  } else if ((match = v.match(/^([a-z]+)\s+(\d{1,2}),?\s*(\d{4})$/i))) {
    m = MONTHS[match[1].slice(0, 3).toLowerCase()];
    d = Number(match[2]);
    y = Number(match[3]);
  } else {
    return { value: null, reason: "unparseable" };
  }

  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
    return { value: null, reason: "unparseable" };
  }

  const age = submittedYear - y;
  if (age < 16 || age > 80) return { value: null, reason: `implausible age ${age}` };

  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { value: iso, reason: null };
}

/**
 * "Teaching Experience" is free text ("2 years", "Fresher", "6 months", "3+").
 * v3 stores a start year, so years are subtracted from the submission year.
 */
function parseExperienceYears(value) {
  const v = key(value);
  if (!v) return { years: null, reason: "empty" };

  if (/^(no|nil|none|fresher|nan|na|n a|new|0)$/.test(v)) return { years: 0, reason: null };

  const months = v.match(/^(\d+(?:\.\d+)?)\s*(?:month|months|mnth|mos)\b/);
  if (months) return { years: Math.round(Number(months[1]) / 12), reason: null };

  const num = v.match(/(\d+(?:\.\d+)?)/);
  if (!num) return { years: null, reason: "unparseable" };

  const years = Math.round(Number(num[1]));
  if (years < 0 || years > 60) return { years: null, reason: `implausible ${years}` };
  return { years, reason: null };
}

/* =========================================================================
   Classes
   ========================================================================= */

const CLASS_BY_SLUG = new Map(REF.classes.map((c) => [c.slug, c]));

const NUMBERED = new Map(); // 1..12 -> slug
for (let n = 1; n <= 12; n += 1) NUMBERED.set(n, `class-${n}`);

const WORD_CLASSES = [
  [/\b(play\s*(school|way|group)|pre\s*nursery|creche)\b/, ["nursery"]],
  [/\bnursery\b/, ["nursery"]],
  [/\bl\.?\s*k\.?\s*g\b/, ["lkg"]],
  [/\bu\.?\s*k\.?\s*g\b/, ["ukg"]],
  [/\b(kg|kindergarten)\b/, ["lkg", "ukg"]],
  [/\bpre\s*(primary|school)\b/, ["nursery", "lkg", "ukg"]],
  [/\bprimary\b/, ["primary"]],
  [/\bneet\b/, ["neet-prep"]],
  [/\b(jee|iit)\b/, ["jee-prep"]],
  [/\bcuet\b/, ["cuet-prep"]],
  [/\bupsc\b/, ["upsc-prep"]],
  [/\bca\b/, ["ca-prep"]],
];

/** Words that mean "how often", not "which class" — e.g. "4 class in a week". */
const FREQUENCY_NOISE = /\b(in a week|per week|a week|weekly|days?\s*(a|per)\s*week|hours?|per day|month)\b/;

const ALL_CLASSES_1_12 = Array.from({ length: 12 }, (_, i) => `class-${i + 1}`);

/** Roman numerals and ordinal words are common in this dataset ("IX,X,XI,XII"). */
const ROMAN = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12,
};
const WORD_NUMBERS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6,
  seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, twelth: 12,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

/**
 * Rewrite Roman numerals and ordinal words as digits so the numeric range and
 * list logic below handles "I to Xth" and "Second to tenth" unchanged.
 */
function digitiseClassWords(text) {
  let v = text;

  for (const [word, n] of Object.entries(WORD_NUMBERS)) {
    v = v.replace(new RegExp(`\\b${word}\\b`, "g"), String(n));
  }

  // Roman numerals, optionally carrying an ordinal suffix ("Xth", "IXth").
  // "x" alone is ambiguous in general but in a class field it means 10.
  v = v.replace(/\b(x?i{1,3}|i[vx]|vi{0,3}|xi{1,2}|x)(st|nd|rd|th)?\b/g, (word, roman) => {
    const n = ROMAN[roman];
    return n ? String(n) : word;
  });

  return v;
}

/**
 * The schooling ladder, in order. Ranges expand along this so "Nursery to 5th"
 * and "LKG-8" fill in everything between the two endpoints.
 * "Primary" and the exam-prep classes sit outside it deliberately.
 */
const LADDER = ["nursery", "lkg", "ukg", ...Array.from({ length: 12 }, (_, i) => `class-${i + 1}`)];
const LADDER_INDEX = new Map(LADDER.map((slug, i) => [slug, i]));

/** Words that name a rung of the ladder, longest first so "lkg" beats "kg". */
const LADDER_WORDS = [
  [/\b(pre\s*nursery|play\s*(?:school|way|group)|creche)\b/, "nursery"],
  [/\bnursery\b|\bnur\b/, "nursery"],
  [/\bl\s*k\s*g\b/, "lkg"],
  [/\bu\s*k\s*g\b/, "ukg"],
  [/\bkg\b|\bkindergarten\b/, "lkg"],
  [/\bpre\s*(?:primary|school)\b/, "nursery"],
];

/** Lowercase but keep -, _ and – so range separators survive. */
function classKey(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[.'’`""(),/\\&+]/g, " ")
    // `_` is a word character, so \b never fires beside it ("5 _8 th").
    .replace(/[–—_]/g, "-")
    // "class10" / "grade7" — split the word off so the number is addressable.
    .replace(/\b(class|grade|std|standard)(\d)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Rewrite ladder words as `@n` tokens so one numeric range rule covers all. */
function tokeniseLadder(text) {
  let v = text;
  for (const [re, slug] of LADDER_WORDS) {
    v = v.replace(new RegExp(re.source, "g"), ` @${LADDER_INDEX.get(slug)} `);
  }
  // Plain class numbers become ladder positions too (class 1 -> index 3).
  // The lookbehind keeps this off the `@n` tokens just written above.
  v = v.replace(/(?<!@)\b(\d{1,2})\s*(?:st|nd|rd|th)?\b/g, (whole, digits) => {
    const n = Number(digits);
    return n >= 1 && n <= 12 ? ` @${LADDER_INDEX.get(`class-${n}`)} ` : whole;
  });
  return v.replace(/\s+/g, " ");
}

/**
 * Parse "Mention Classes" free text into canonical class slugs.
 * Handles ranges ("3rd-12th", "9 to 12", "Nursery to 5th", "up to 10"),
 * lists ("9, 10,11,12"), Roman numerals, ordinal words and mixed forms.
 */
function parseClasses(value) {
  const raw = clean(value);
  const notes = [];
  if (!raw) return { slugs: [], notes: ["empty"] };

  let v = classKey(raw);
  const found = new Set();

  if (FREQUENCY_NOISE.test(v)) {
    notes.push("frequency-text");
    v = v.replace(FREQUENCY_NOISE, " ");
  }

  // Exam-prep classes sit outside the ladder; take them out before tokenising.
  for (const [re, slugs] of WORD_CLASSES) {
    if (!slugs.some((s) => s.endsWith("-prep"))) continue;
    if (re.test(v)) {
      slugs.forEach((s) => found.add(s));
      v = v.replace(new RegExp(re.source, "g"), " ");
    }
  }

  if (/\bprimary\b/.test(v) && !/\bpre\s*primary\b/.test(v)) found.add("primary");

  v = digitiseClassWords(v);
  v = tokeniseLadder(v);

  const addRange = (a, b) => {
    for (let i = Math.min(a, b); i <= Math.max(a, b); i += 1) found.add(LADDER[i]);
  };

  // "@0 to @7", "@3-@14", "@5 _ @8"
  const rangeRe = /@(\d{1,2})\s*(?:to|till|until|upto|up to|through|onwards?|[-_])\s*@(\d{1,2})/g;
  let m;
  while ((m = rangeRe.exec(v))) {
    addRange(Number(m[1]), Number(m[2]));
    v = v.replace(m[0], " ");
    rangeRe.lastIndex = 0;
  }

  // Open-ended downward: "up to @7", "till @9"
  const upto = v.match(
    /\b(?:up\s*to|upto|till|until|below|under|max|maximum)\s*(?:class|grade|std|standard)?\s*@(\d{1,2})/
  );
  if (upto) {
    addRange(0, Number(upto[1]));
    v = v.replace(upto[0], " ");
  }

  // Open-ended upward: "@8 onwards", "@6 and above"
  const onwards = v.match(/@(\d{1,2})\s*(?:onwards?|and above|above|plus|\+)/);
  if (onwards) {
    addRange(Number(onwards[1]), LADDER.length - 1);
    v = v.replace(onwards[0], " ");
  }

  if (/\ball\b/.test(v) || /\ball\b/.test(classKey(raw))) {
    // "All classes" / "All standards" — the school range, not the prep classes.
    if (/\b(class|classes|standard|standards|grade|grades|level|subject)\b/.test(classKey(raw)) || classKey(raw).trim() === "all") {
      addRange(LADDER_INDEX.get("class-1"), LADDER_INDEX.get("class-12"));
      notes.push("all-classes");
    }
  }

  // Whatever ladder positions remain are individual mentions.
  for (const token of v.matchAll(/@(\d{1,2})/g)) {
    const i = Number(token[1]);
    if (i >= 0 && i < LADDER.length) found.add(LADDER[i]);
  }

  const slugs = [...found].filter((s) => CLASS_BY_SLUG.has(s));
  slugs.sort((a, b) => CLASS_BY_SLUG.get(a).sort_order - CLASS_BY_SLUG.get(b).sort_order);

  if (!slugs.length) notes.push("no-match");
  return { slugs, notes };
}


/* =========================================================================
   Subjects
   ========================================================================= */

const SUBJECT_ALIASES = new Map(
  Object.entries({
    // Mathematics
    math: "mathematics", maths: "mathematics", mathematic: "mathematics", mathematics: "mathematics",
    mathmatics: "mathematics", mathematics2: "mathematics", "applied mathematics": "mathematics",
    "vedic maths": "mathematics", algebra: "mathematics", geometry: "mathematics", calculus: "mathematics",
    trigonometry: "mathematics", statistics: "mathematics", "maths2": "mathematics",
    // Science
    science: "science", sci: "science", "general science": "science", "gen science": "science",
    evs: "environmental-science", "environmental science": "environmental-science", "environment science": "environmental-science",
    physics: "physics", phy: "physics", chemistry: "chemistry", chem: "chemistry",
    biology: "biology", bio: "biology", botany: "biology", zoology: "biology", "life science": "biology",
    // Social
    sst: "social-science", "s st": "social-science", "social science": "social-science",
    "social studies": "social-science", social: "social-science", "socail science": "social-science",
    history: "history", geography: "geography", geo: "geography",
    civics: "civics", "political science": "political-science", "pol science": "political-science",
    "pol sci": "political-science", "political sci": "political-science", polity: "political-science",
    // Languages
    english: "english", eng: "english", "spoken english": "english", "english literature": "english",
    "english grammar": "english", hindi: "hindi", sanskrit: "sanskrit", sanskrit2: "sanskrit",
    french: "french", german: "german", spanish: "spanish",
    // Commerce
    accounts: "accounts", account: "accounts", accountancy: "accounts", accounting: "accounts",
    "business studies": "business-studies", bst: "business-studies", business: "business-studies",
    economics: "economics", eco: "economics", "eco nomics": "economics",
    commerce: "accounts",
    // Computing
    computer: "computer-science", "computer science": "computer-science", cs: "computer-science",
    "computer application": "computer-science", "computer applications": "computer-science",
    it: "information-practices", "information practices": "information-practices", ip: "information-practices",
    "information technology": "information-practices", coding: "computer-science", python: "computer-science",
    // Other
    psychology: "psychology", art: "art", drawing: "art", craft: "art", painting: "art",
    "physical education": "physical-education", pe: "physical-education", sports: "physical-education",
  })
);

const SUBJECT_BY_SLUG = new Map(REF.subjects.map((s) => [s.slug, s]));
for (const s of REF.subjects) SUBJECT_ALIASES.set(key(s.name), s.slug);

/** Core sets used to expand "all subjects", which is meaningless as 25 rows. */
const CORE_PRIMARY = ["english", "hindi", "mathematics", "environmental-science"];
const CORE_MIDDLE = ["english", "hindi", "mathematics", "science", "social-science"];
const ALL_SUBJECTS_RE = /\ball\b(?!\s*(?:india|rounder))/;

/**
 * Parse "Mention Subjects" into canonical subject slugs plus leftovers.
 * `allSubjects` marks rows that said "all subjects" so the caller can expand
 * them against the class range instead of inventing 25 pairings.
 */
function parseSubjects(value) {
  const raw = clean(value);
  const notes = [];
  if (!raw) return { slugs: [], custom: [], allSubjects: false, notes: ["empty"] };

  const found = new Set();
  const custom = [];
  let allSubjects = false;

  const normalized = key(raw);
  if (ALL_SUBJECTS_RE.test(normalized) && /\b(subject|subjects|sub|subj)\b/.test(normalized)) allSubjects = true;
  if (/^all$/.test(normalized.trim())) allSubjects = true;

  for (const part of splitList(raw)) {
    const k = key(part);
    if (!k) continue;

    if (ALL_SUBJECTS_RE.test(k) && k.split(" ").length <= 3) {
      allSubjects = true;
      continue;
    }

    if (SUBJECT_ALIASES.has(k)) {
      found.add(SUBJECT_ALIASES.get(k));
      continue;
    }

    // Try the individual words — "Maths upto 10th", "Physics for 11th"
    let matchedInside = false;
    for (const [alias, slug] of SUBJECT_ALIASES) {
      if (alias.length < 3) continue;
      if (new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(k)) {
        found.add(slug);
        matchedInside = true;
      }
    }

    if (!matchedInside) {
      const trimmed = clean(part).slice(0, 100);
      // Drop obvious noise: bare numbers, class references, single letters
      if (trimmed.length > 2 && !/^\d/.test(trimmed) && !/^(class|upto|up to|for|to|th|st|nd|rd)\b/i.test(trimmed)) {
        custom.push(trimmed);
      }
    }
  }

  const slugs = [...found].filter((s) => SUBJECT_BY_SLUG.has(s));
  if (!slugs.length && !allSubjects && !custom.length) notes.push("no-match");
  return { slugs, custom, allSubjects, notes };
}

/** Expand "all subjects" into a sensible core set for the classes taught. */
function expandAllSubjects(classSlugs) {
  const nums = classSlugs.map((s) => Number((s.match(/^class-(\d+)$/) || [])[1])).filter(Boolean);
  const hasSenior = nums.some((n) => n >= 9) || classSlugs.some((s) => s.endsWith("-prep"));
  const hasPrimaryOnly = nums.length > 0 && nums.every((n) => n <= 5);

  if (hasPrimaryOnly) return [...CORE_PRIMARY];
  if (hasSenior) return [...new Set([...CORE_MIDDLE])];
  return [...CORE_MIDDLE];
}

/* =========================================================================
   Areas
   ========================================================================= */

const LOCATION_BY_KEY = new Map();
for (const loc of REF.locations) {
  LOCATION_BY_KEY.set(key(loc.name), loc);
}

/** Hand-written aliases for the spellings that appear in the legacy data. */
const AREA_ALIASES = {
  "pitam pura": "pitampura", pitampura: "pitampura", "pitam  pura": "pitampura",
  "model town": "model town", "modal town": "model town", "mukherjee nagar": "mukherjee nagar",
  "mujharjee nagar": "mukherjee nagar", "mukherji nagar": "mukherjee nagar", "gtb nagar": "gtb nagar",
  "gtb nager": "gtb nagar", "dwarka more": "dwarka", "dwarka mor": "dwarka",
  "uttam nagar": "uttam nagar", "vikas puri": "vikaspuri", vikaspuri: "vikaspuri",
  "janak puri": "janakpuri", janakpuri: "janakpuri", "tilak nagar": "tilak nagar",
  "rani bagh": "rani bagh", "ranibagh": "rani bagh", "shalimar bagh": "shalimar bagh",
  "ashok vihar": "ashok vihar", "keshav puram": "keshav puram", "keshavpuram": "keshav puram",
  "malviya nagar": "malviya nagar", malviyanagar: "malviya nagar", "chattarpur": "chhatarpur",
  chhtarpur: "chhatarpur", chatarpur: "chhatarpur", "mehrauli": "mehrauli", "neb sarai": "neb sarai",
  nebsarai: "neb sarai", "saket": "saket", "budh vihar": "budh vihar", "rohini": "rohini",
  "civil lines": "civil lines", "kamla nagar": "kamla nagar", "timarpur": "timarpur",
  "sainik vihar": "sainik vihar", "raja park": "raja park", "paschim vihar": "paschim vihar",
  "punjabi bagh": "punjabi bagh", "hari nagar": "hari nagar", "subhash nagar": "subhash nagar",
  "lajpat nagar": "lajpat nagar", "greater kailash": "greater kailash", gk: "greater kailash",
  "new delhi": "delhi", delhi: "delhi", "north west delhi": "delhi", "west delhi": "delhi",
  "south delhi": "delhi", "east delhi": "delhi", "north delhi": "delhi", "central delhi": "delhi",
  noida: "noida", "greater noida": "greater noida", ghaziabad: "ghaziabad", gurgaon: "gurugram",
  gurugram: "gurugram", faridabad: "faridabad", kundli: "kundli",
  // Abbreviations used locally
  nsp: "Netaji Subash Palace", "netaji subhash place": "Netaji Subash Palace",
  "netaji subhash palace": "Netaji Subash Palace", gtb: "GTB Nagar",
  "c r park": "CR Park", "cr park": "CR Park", "chittaranjan park": "CR Park",
  "ip extension": "IP Extension", "i p extension": "IP Extension",
  "north campus": "Mukherjee Nagar", "kohat": "Kohat Enclave",
  // Spellings corrected by CANONICAL in propose-reference-additions.js — the
  // raw forms still have to resolve to the name that was actually inserted.
  "mp enclave": "MP Enclave", "m p enclave": "MP Enclave",
  "smarat enclave": "Samrat Enclave", "samrat enclave": "Samrat Enclave",
  "gujrawala town": "Gujranwala Town", "gujrawala town part 1": "Gujranwala Town",
  "gujranwala town": "Gujranwala Town",
  yojnavihar: "Yojna Vihar", "yojna vihar": "Yojna Vihar",
  "chandar nagar": "Chander Nagar", "chander nagar": "Chander Nagar",
  rajdhani: "Rajdhani Enclave", "rajdhani enclave": "Rajdhani Enclave",
  chanderlok: "Chander Lok", "chander lok": "Chander Lok",
};

/** Phrases that carry no location information. */
const AREA_NOISE = /^(near me|nearby|near by|anywhere|any where|all|any|any area|home|online|na|n a|nil|none|etc|and near by|near my home|as per requirement|all over|everywhere|yes|no|at my place|at my own home|my home|near my place)$/;

/** Bare city / region wording that should still resolve to the city row. */
const CITY_FALLBACK = [
  [/\b(delhi|ncr|new delhi|delhi ncr)\b/, "delhi-city"],
  [/\bnoida\b/, "noida-city"],
  [/\bgreater noida\b/, "greater-noida-city"],
  [/\bghaziabad\b/, "ghaziabad-city"],
  [/\b(gurgaon|gurugram)\b/, "gurugram-city"],
  [/\bfaridabad\b/, "faridabad-city"],
  [/\b(kundli|kundali)\b/, "kundli-city"],
];

/** Levenshtein distance, capped — used only to absorb small spelling slips. */
function editDistance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      best = Math.min(best, row[j]);
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/** Closest vocabulary entry within a small edit distance, or null. */
function fuzzyLocation(candidate) {
  if (candidate.length < 5) return null;
  const budget = candidate.length >= 9 ? 2 : 1;
  let best = null;
  for (const [name, loc] of LOCATION_BY_KEY) {
    if (name.length < 5) continue;
    const d = editDistance(candidate, name, budget);
    if (d <= budget && (!best || d < best.d)) best = { loc, d };
  }
  // Also try with spaces removed: "budhvihar" vs "budh vihar", "pritam pura".
  if (!best) {
    const squashed = candidate.replace(/\s+/g, "");
    for (const [name, loc] of LOCATION_BY_KEY) {
      if (name.length < 5) continue;
      if (name.replace(/\s+/g, "") === squashed) return loc;
    }
  }
  return best ? best.loc : null;
}

/**
 * Parse "Mention Areas" into canonical location slugs.
 * Sector numbers are stripped ("Rohini Sector 20,21" -> Rohini) because the
 * reference table has no sector granularity.
 */
function parseAreas(value) {
  const raw = clean(value);
  const notes = [];
  if (!raw) return { slugs: [], unmatched: [], notes: ["empty"] };

  const found = new Set();
  const unmatched = [];

  // "Rohini sec 23, 24 or 25" -> the numbers are sectors, not separate areas
  const withoutSectors = raw.replace(/\b(sector|sec|phase|block|pkt|pocket)\s*[-.:]?\s*[\d,\s&/]+/gi, " ");

  for (const part of splitList(withoutSectors)) {
    const partKey = key(part);
    if (!partKey || AREA_NOISE.test(partKey)) {
      if (AREA_NOISE.test(partKey)) notes.push("noise");
      continue;
    }

    // Direct alias / exact vocabulary hit before any stripping.
    const directAlias = AREA_ALIASES[partKey];
    if (directAlias && LOCATION_BY_KEY.has(key(directAlias))) {
      found.add(LOCATION_BY_KEY.get(key(directAlias)).slug);
      continue;
    }
    if (LOCATION_BY_KEY.has(partKey)) {
      found.add(LOCATION_BY_KEY.get(partKey).slug);
      continue;
    }

    const k = partKey
      .replace(/\b(area|areas|colony|extn|extension|nearby|near|and|or|etc|all|any|in|of|my|at|the)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!k) continue;

    const alias = AREA_ALIASES[k];
    const lookupKey = alias ? key(alias) : k;

    if (LOCATION_BY_KEY.has(lookupKey)) {
      found.add(LOCATION_BY_KEY.get(lookupKey).slug);
      continue;
    }

    // Longest containing vocabulary entry ("rohini sec 20" -> "rohini")
    let hit = null;
    for (const [name, loc] of LOCATION_BY_KEY) {
      if (name.length < 4) continue;
      if (
        lookupKey === name ||
        lookupKey.startsWith(`${name} `) ||
        lookupKey.endsWith(` ${name}`) ||
        lookupKey.includes(` ${name} `)
      ) {
        if (!hit || name.length > hit.matchedLength) hit = { loc, matchedLength: name.length };
      }
    }
    if (hit) {
      found.add(hit.loc.slug);
      continue;
    }

    // The reverse: the text is a shortened form of a vocabulary entry
    // ("Kohat" -> "Kohat Enclave"). Only accepted when exactly one entry
    // starts with it, so "Shalimar" stays ambiguous and is left unmatched.
    if (lookupKey.length >= 4) {
      const prefixHits = [];
      for (const [name, loc] of LOCATION_BY_KEY) {
        if (name === lookupKey || name.startsWith(`${lookupKey} `)) prefixHits.push(loc);
      }
      if (prefixHits.length === 1) {
        found.add(prefixHits[0].slug);
        notes.push("prefix");
        continue;
      }
      if (prefixHits.length > 1) {
        notes.push("ambiguous-prefix");
        unmatched.push(clean(part).slice(0, 120));
        continue;
      }
    }

    const near = fuzzyLocation(lookupKey);
    if (near) {
      found.add(near.slug);
      notes.push("fuzzy");
      continue;
    }

    // Last resort: the row at least names a city / region.
    const city = CITY_FALLBACK.find(([re]) => re.test(lookupKey));
    if (city) {
      found.add(city[1]);
      notes.push("city-only");
      continue;
    }

    const trimmed = clean(part).slice(0, 120);
    if (trimmed.length > 2) unmatched.push(trimmed);
  }

  if (!found.size) notes.push("no-match");
  return { slugs: [...found], unmatched, notes };
}

/* =========================================================================
   Qualifications
   ========================================================================= */

const QUAL_BY_SLUG = new Map(REF.qualifications.map((q) => [q.slug, q]));

/** Ordered longest-first so "m.sc" wins over "sc" and "b.tech" over "b". */
const QUAL_PATTERNS = [
  [/\b(ph\s*d|doctorate|phd)\b/, "phd"],
  [/\bm\s*phil\b/, "mphil"],
  [/\bmbbs\b/, "mbbs"],
  [/\bbds\b/, "bds"],
  [/\bll\s*m\b/, "llm"],
  [/\bll\s*b|\blaw\b/, "llb"],
  [/\bm\s*tech\b/, "mtech"],
  [/\bm\s*ed\b/, "med"],
  [/\bmca\b/, "mca"],
  [/\bmba\b/, "mba"],
  [/\bm\s*com\b/, "mcom"],
  [/\bm\s*sc\b|\bmsc\b|\bm\s*s\s*c\b/, "msc"],
  [/\bm\s*a\b|\bma\b(?!\w)/, "ma"],
  [/\bb\s*tech\b|\bbtech\b/, "btech"],
  [/\bb\s*e\b(?!\w)/, "be"],
  [/\bb\s*ed\b|\bbed\b/, "bed"],
  [/\bbca\b/, "bca"],
  [/\bbba\b/, "bba"],
  [/\bb\s*com\b|\bbcom\b/, "bcom"],
  [/\bb\s*sc\b|\bbsc\b|\bb\s*s\s*c\b/, "bsc"],
  [/\bb\s*a\b|\bba\b(?!\w)/, "ba"],
  [/\bd\s*el\s*ed\b|\bdeled\b/, "deled"],
  [/\bdiploma\b|\bntt\b|\bnptt\b/, "diploma"],
  [/\bca\b|chartered accountant/, "ca"],
  [/\bcs\b|company secretary/, "cs"],
  [/\b12\s*th\b|\bintermediate\b|\bhigher secondary\b|\bsenior secondary\b/, "12th"],
  [/\b10\s*th\b|\bmatric\b|\bhigh school\b/, "10th"],
];

/** Generic wording that names a level but not a degree. */
const GENERIC_QUAL = [
  [/\b(post\s*grad|postgraduate|pg|masters?|master s|master's)\b/, "masters"],
  [/\b(graduate|graduation|under\s*grad|undergraduate|bachelors?|bachelor s|bachelor's|ug)\b/, "bachelors"],
];

const SPEC_BY_SLUG = new Map(REF.specializations.map((s) => [s.slug, s]));
const SPEC_ALIASES = new Map(REF.specializations.map((s) => [key(s.name), s.slug]));
Object.entries({
  maths: "mathematics", math: "mathematics", eco: "economics", "pol science": "political-science",
  "political sci": "political-science", zoology: "biology", botany: "biology", bio: "biology",
  chem: "chemistry", phy: "physics", cs: "computer-science", it: "information-technology",
  accounts: "accounting", accountancy: "accounting", bst: "business-studies", psy: "psychology",
  socio: "sociology", geo: "geography", "comp science": "computer-science",
}).forEach(([k, v]) => SPEC_ALIASES.set(k, v));

/**
 * Map "Highest Qualification" onto the reference list and, when the text names
 * a field ("M.Sc Zoology", "B.A in psychology"), pull out the specialization.
 */
function parseQualification(value) {
  const raw = clean(value);
  if (!raw) return { qualification: null, specialization: null, generic: null, raw: "", note: "empty" };

  const k = key(raw);
  let qualification = null;
  for (const [re, slug] of QUAL_PATTERNS) {
    if (re.test(k)) {
      qualification = slug;
      break;
    }
  }

  let generic = null;
  if (!qualification) {
    for (const [re, level] of GENERIC_QUAL) {
      if (re.test(k)) {
        generic = level;
        break;
      }
    }
  }

  let specialization = null;
  for (const [alias, slug] of SPEC_ALIASES) {
    if (alias.length < 4) continue;
    if (new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(k)) {
      specialization = slug;
      break;
    }
  }

  return {
    qualification,
    specialization,
    generic,
    raw,
    note: qualification ? null : generic ? "generic-level" : "no-match",
  };
}

module.exports = {
  REF,
  clean,
  key,
  splitList,
  mapEnum,
  GENDER,
  MARITAL,
  RESIDENTIAL,
  FLUENCY,
  SOURCE,
  parsePhone,
  parseEmail,
  parseDob,
  parseExperienceYears,
  parseClasses,
  parseSubjects,
  expandAllSubjects,
  parseAreas,
  parseQualification,
  QUAL_BY_SLUG,
  SUBJECT_BY_SLUG,
  CLASS_BY_SLUG,
  SPEC_BY_SLUG,
  LOCATION_BY_KEY,
};
