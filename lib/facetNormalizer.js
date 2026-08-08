// lib/facetNormalizer.js
//
// Single source of truth for facet (subject / area / class) normalisation.
//
// Tutor rows store free text comma lists typed by different admins:
//   subjects        → "Maths, math, PHYSICS,Physics"
//   areas           → "rohini, Rohini Sec-8, ROHINI SECTOR 8"
//   classes_taught  → "11, 11th, XI, Class XI"
//
// Everything in this file is *display / query* level only — database values are
// never rewritten. Both the facets endpoint (dropdown values) and the listing
// endpoint (filtering) are generated from FACET_CONFIG below, so adding an
// alias in one place fixes the dropdown and the filter at the same time.

/* ------------------------------------------------------------------ config */

/**
 * canonical display value → list of aliases (lowercase, already "keyified").
 * The canonical value itself is always treated as an alias too.
 */
export const FACET_CONFIG = {
  subject: {
    Mathematics: ["math", "maths", "mathematic", "mathematics", "mths", "applied maths", "applied mathematics"],
    Physics: ["physics", "phy", "physic"],
    Chemistry: ["chemistry", "chem"],
    Biology: ["biology", "bio", "bilogy"],
    Science: ["science", "sci", "general science", "evs", "environmental science"],
    English: ["english", "eng", "english literature", "english grammar"],
    Hindi: ["hindi", "hnd"],
    Sanskrit: ["sanskrit", "sanskrat"],
    Punjabi: ["punjabi"],
    Urdu: ["urdu"],
    French: ["french"],
    German: ["german"],
    Spanish: ["spanish"],
    "Social Science": ["social science", "sst", "s.st", "social studies", "social"],
    History: ["history", "hist"],
    Geography: ["geography", "geo"],
    "Political Science": ["political science", "pol science", "pol sci", "civics", "polsci"],
    Economics: ["economics", "eco", "econ"],
    Accountancy: ["accountancy", "accounts", "account", "accounting"],
    "Business Studies": ["business studies", "bst", "business study", "business"],
    "Computer Science": ["computer science", "computer", "computers", "cs", "comp sci", "computer sc"],
    "Information Technology": ["information technology", "it", "info tech"],
    Programming: ["programming", "coding", "python", "java", "c++", "c language"],
    "Physical Education": ["physical education", "pe", "phy edu", "sports"],
    Psychology: ["psychology", "psy"],
    Sociology: ["sociology", "socio"],
    Statistics: ["statistics", "stats", "stat"],
    Drawing: ["drawing", "art", "fine arts", "painting"],
    Music: ["music", "vocal", "singing"],
    Reasoning: ["reasoning", "mental ability", "logical reasoning"],
    "All Subjects": ["all subjects", "all subject", "all", "every subject"],
  },

  class: {
    Nursery: ["nursery", "nur", "play group", "playgroup", "pre nursery", "prenursery"],
    LKG: ["lkg", "l.k.g", "lower kg", "lower kindergarten"],
    UKG: ["ukg", "u.k.g", "upper kg", "upper kindergarten"],
    "Class 1": ["1", "1st", "i", "class 1", "class i", "first"],
    "Class 2": ["2", "2nd", "ii", "class 2", "class ii", "second"],
    "Class 3": ["3", "3rd", "iii", "class 3", "class iii", "third"],
    "Class 4": ["4", "4th", "iv", "class 4", "class iv", "fourth"],
    "Class 5": ["5", "5th", "v", "class 5", "class v", "fifth"],
    "Class 6": ["6", "6th", "vi", "class 6", "class vi", "sixth"],
    "Class 7": ["7", "7th", "vii", "class 7", "class vii", "seventh"],
    "Class 8": ["8", "8th", "viii", "class 8", "class viii", "eighth"],
    "Class 9": ["9", "9th", "ix", "class 9", "class ix", "ninth"],
    "Class 10": ["10", "10th", "x", "class 10", "class x", "tenth", "matric"],
    "Class 11": ["11", "11th", "xi", "class 11", "class xi", "eleventh"],
    "Class 12": ["12", "12th", "xii", "class 12", "class xii", "twelfth", "senior secondary"],
    Graduation: ["graduation", "bachelors", "ug", "college"],
  },

  // Areas are mostly open-ended (any locality name), so the config only pins
  // spellings that are commonly mistyped. Everything else falls through to the
  // generic title-case + sector normalisation below.
  area: {
    Rohini: ["rohini", "rohni", "rohini delhi"],
    Pitampura: ["pitampura", "pitam pura"],
    "Shalimar Bagh": ["shalimar bagh", "shalimarbagh"],
    "Ashok Vihar": ["ashok vihar", "ashokvihar"],
    "Model Town": ["model town", "modeltown"],
    "Paschim Vihar": ["paschim vihar", "pashchim vihar"],
    "Janakpuri": ["janakpuri", "janak puri"],
    "Dwarka": ["dwarka", "dwaraka"],
    "Karol Bagh": ["karol bagh", "karolbagh"],
    "Punjabi Bagh": ["punjabi bagh", "punjabibagh"],
    "Mangolpuri": ["mangolpuri", "mangol puri"],
    "Badli": ["badli"],
    "Narela": ["narela"],
    "Prashant Vihar": ["prashant vihar", "prashantvihar"],
    "Sector 8": ["sector 8", "sec 8", "sec-8", "sector-8"],
  },
};

const TYPE_ALIASES = { subjects: "subject", areas: "area", classes: "class" };

/* --------------------------------------------------------------- utilities */

/** Loose key: lowercase, punctuation stripped, whitespace collapsed. */
export function facetKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[._]/g, " ")
    .replace(/[-–—]/g, " ")
    .replace(/[^a-z0-9+# ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SMALL_WORDS = new Set(["of", "and", "the", "in", "de"]);

export function titleCase(value) {
  return String(value)
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      if (/^[ivx]+$/.test(lower) && lower.length <= 4) return word.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/** Build { aliasKey → canonical } lookup maps once per type. */
const LOOKUP = Object.fromEntries(
  Object.entries(FACET_CONFIG).map(([type, groups]) => {
    const map = new Map();
    for (const [canonical, aliases] of Object.entries(groups)) {
      map.set(facetKey(canonical), canonical);
      for (const alias of aliases) map.set(facetKey(alias), canonical);
    }
    return [type, map];
  })
);

function resolveType(type) {
  const t = String(type || "").toLowerCase();
  return TYPE_ALIASES[t] || t;
}

/**
 * Normalise sector-style area names:
 *   "rohini sec-8" / "rohini sector8" → "Rohini Sector 8"
 */
function normalizeSectors(key) {
  return key
    .replace(/\bsect?o?r?\b\.?\s*[-#]?\s*(\d+)/g, "sector $1")
    .replace(/\bsec\s*(\d+)/g, "sector $1")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------- core  */

/**
 * normalizeFacetValue(value, type) → canonical display value (or null).
 * type: "subject" | "area" | "class" (plurals accepted).
 */
export function normalizeFacetValue(value, type) {
  const t = resolveType(type);
  let key = facetKey(value);
  if (!key) return null;

  if (t === "area") key = normalizeSectors(key);
  if (t === "class") key = key.replace(/^class\s+/, "class ").replace(/^std\s+/, "class ");

  const lookup = LOOKUP[t];
  if (lookup?.has(key)) return lookup.get(key);

  if (t === "area") {
    // "rohini sector 8" → canonical base + sector suffix when the base is known.
    const m = key.match(/^(.*?)\s+sector\s+(\d+)$/);
    if (m) {
      const base = lookup?.get(facetKey(m[1])) || titleCase(m[1]);
      return `${base} Sector ${m[2]}`;
    }
    return titleCase(key);
  }

  if (t === "class") {
    const num = key.match(/^(?:class\s+)?(\d{1,2})(?:st|nd|rd|th)?$/);
    if (num) {
      const canonical = `Class ${Number(num[1])}`;
      return lookup?.get(facetKey(canonical)) || canonical;
    }
  }

  return titleCase(key);
}

/** Split a stored free-text comma list into raw parts. */
export function splitFacetList(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,|;/\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Normalise a whole stored cell → unique canonical values. */
export function normalizeFacetList(raw, type) {
  const out = new Set();
  for (const part of splitFacetList(raw)) {
    const v = normalizeFacetValue(part, type);
    if (v) out.add(v);
  }
  return [...out];
}

/**
 * All raw aliases that should match a given (possibly canonical) value.
 * Used to build alias-aware SQL filters.
 */
export function expandFacetAliases(value, type) {
  const t = resolveType(type);
  const canonical = normalizeFacetValue(value, t);
  const out = new Set();

  const add = (v) => {
    const k = facetKey(v);
    if (k) out.add(k);
  };

  add(value);
  if (canonical) add(canonical);

  const groups = FACET_CONFIG[t] || {};
  if (canonical && groups[canonical]) {
    for (const alias of groups[canonical]) add(alias);
  }

  if (t === "class" && canonical) {
    const m = canonical.match(/^Class (\d{1,2})$/);
    if (m) [m[1], `${m[1]}th`, `class ${m[1]}`].forEach(add);
  }

  if (t === "area" && canonical) {
    const m = canonical.match(/^(.*) Sector (\d+)$/);
    if (m) {
      [`${m[1]} sec ${m[2]}`, `${m[1]} sec-${m[2]}`, `${m[1]} sector-${m[2]}`].forEach(add);
    }
  }

  return [...out];
}

/**
 * Build the facet lists from raw tutor rows.
 * rows: [{ subjects, areas, classes_taught }]
 */
export function buildFacets(rows, columns = {
  subject: "subjects",
  area: "areas",
  class: "classes_taught",
}) {
  const sets = { subject: new Set(), area: new Set(), class: new Set() };

  for (const row of Array.isArray(rows) ? rows : []) {
    for (const type of Object.keys(sets)) {
      for (const value of normalizeFacetList(row?.[columns[type]], type)) {
        sets[type].add(value);
      }
    }
  }

  const sort = (set) => [...set].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  return {
    subjects: sort(sets.subject),
    areas: sort(sets.area),
    classes: sort(sets.class),
  };
}
