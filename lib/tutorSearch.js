// lib/tutorSearch.js
//
// Public tutor discovery. Server-side only — the pages call this directly so
// results are in the HTML for crawlers, with no client round trip.
//
// PRIVACY: these tutors are real people. Nothing here selects whatsapp, email,
// alternate_phone, family_phone or addresses, and nothing should be added.
// Families reach a tutor by requesting a demo, never by calling them directly.

import { query } from "./db";

export const PAGE_SIZE = 12;

/**
 * What a family means by "all subjects": one tutor who can cover the whole
 * school workload. Selecting these five requires a tutor to teach every one.
 */
export const CORE_SUBJECT_SLUGS = ["mathematics", "science", "social-science", "english", "hindi"];

/** Only tutors a family could actually be matched with. */
const LIVE = "t.status = 'active'";

const toInt = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const clean = (v) => (v == null ? "" : String(v).trim());

/* =========================================================================
   Vocabulary
   ========================================================================= */

/**
 * The facets a visitor can browse, each with a live tutor count.
 * Counts drive both the UI and the decision of which pages are worth indexing,
 * so they are always measured against active tutors.
 */
export async function getFacets() {
  const [subjects, classes, areas] = await Promise.all([
    query(
      `SELECT s.id, s.name, s.slug, COUNT(DISTINCT t.id) AS tutor_count
       FROM subjects s
       JOIN tutor_teaching_profiles p ON p.subject_id = s.id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       WHERE s.is_active = 1
       GROUP BY s.id
       ORDER BY tutor_count DESC`
    ),
    query(
      `SELECT c.id, c.name, c.slug, c.sort_order, COUNT(DISTINCT t.id) AS tutor_count
       FROM classes c
       JOIN tutor_teaching_profiles p ON p.class_id = c.id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY c.sort_order`
    ),
    query(
      `SELECT l.id, l.name, l.slug, l.location_type, COUNT(DISTINCT t.id) AS tutor_count
       FROM locations l
       JOIN tutor_locations tl ON tl.location_id = l.id
       JOIN tutors t ON t.id = tl.tutor_id AND ${LIVE}
       WHERE l.is_active = 1
       GROUP BY l.id
       ORDER BY tutor_count DESC`
    ),
  ]);

  // Counts are not displayed any more, but they still gate which facets are
  // offered as filters and browse links, so they are still fetched.
  return {
    subjects: subjects.map(normaliseFacet),
    classes: classes.map(normaliseFacet),
    areas: areas.map(normaliseFacet),
  };
}

const normaliseFacet = (row) => ({ ...row, tutor_count: Number(row.tutor_count) });

/** Resolve a slug to its facet row, or null. Used by the faceted routes. */
export async function resolveFacetSlug(slug) {
  const s = clean(slug).toLowerCase();
  if (!s) return null;

  const [subject] = await query("SELECT id, name, slug FROM subjects WHERE slug = ? AND is_active = 1", [s]);
  if (subject) return { kind: "subject", ...subject };

  const [cls] = await query("SELECT id, name, slug FROM classes WHERE slug = ? AND is_active = 1", [s]);
  if (cls) return { kind: "class", ...cls };

  const [area] = await query(
    "SELECT id, name, slug, location_type FROM locations WHERE slug = ? AND is_active = 1",
    [s]
  );
  if (area) return { kind: "area", ...area };

  return null;
}

/* =========================================================================
   Search
   ========================================================================= */

const SORTS = {
  // Default: the tutors most likely to convert — verified and experienced,
  // with a complete profile — rather than whoever registered last.
  recommended: `t.verified DESC,
                t.profile_completed DESC,
                t.teaching_start_year IS NULL,
                t.teaching_start_year ASC`,
  experience: `t.teaching_start_year IS NULL, t.teaching_start_year ASC`,
  newest: "t.created_at DESC",
  name: "t.first_name ASC, t.last_name ASC",
};

/**
 * Find tutors matching the given facets.
 *
 * @param {object} filters
 * @param {number} [filters.subjectId]
 * @param {number} [filters.classId]
 * @param {number} [filters.areaId]
 * @param {string} [filters.name]      matches first + last name
 * @param {string} [filters.gender]
 * @param {string} [filters.mode]        In-person | Online | Both
 * @param {number} [filters.minExperience]
 * @param {boolean}[filters.verifiedOnly]
 * @param {string} [filters.sort]
 * @param {number} [filters.page]
 */
export async function searchTutors(filters = {}) {
  const where = [LIVE];
  const params = [];

  // Subjects are a list: a parent usually needs ONE tutor who covers every
  // subject their child struggles with, so several selections mean AND, not OR.
  // "All core subjects" is simply all five selected at once.
  const subjectIds = [...new Set((Array.isArray(filters.subjectIds) ? filters.subjectIds : [filters.subjectId])
    .map(toInt)
    .filter(Boolean))];
  const classId = toInt(filters.classId);
  const areaId = toInt(filters.areaId);

  // Subject and class must be satisfied by the SAME row when both are given —
  // a tutor who teaches Class 10 History and Class 2 Maths is not a Class 10
  // Maths tutor, and matching them separately would wrongly include them.
  for (const subjectId of subjectIds) {
    if (classId) {
      where.push(`EXISTS (SELECT 1 FROM tutor_teaching_profiles tp
                          WHERE tp.tutor_id = t.id AND tp.subject_id = ? AND tp.class_id = ?)`);
      params.push(subjectId, classId);
    } else {
      where.push("EXISTS (SELECT 1 FROM tutor_teaching_profiles tp WHERE tp.tutor_id = t.id AND tp.subject_id = ?)");
      params.push(subjectId);
    }
  }

  if (classId && !subjectIds.length) {
    where.push("EXISTS (SELECT 1 FROM tutor_teaching_profiles tp WHERE tp.tutor_id = t.id AND tp.class_id = ?)");
    params.push(classId);
  }

  if (areaId) {
    where.push("EXISTS (SELECT 1 FROM tutor_locations tl WHERE tl.tutor_id = t.id AND tl.location_id = ?)");
    params.push(areaId);
  }

  // Name search. Matches across first and last name together, so "anjali
  // sharma" works as well as either half on its own.
  const name = clean(filters.name);
  if (name) {
    // Escape LIKE wildcards, or a visitor typing "%" matches everyone.
    const term = `%${name.replace(/[\%_]/g, (ch) => `\${ch}`)}%`;
    where.push("CONCAT_WS(' ', t.first_name, t.last_name) LIKE ?");
    params.push(term);
  }

  if (["Male", "Female", "Other"].includes(filters.gender)) {
    where.push("t.gender = ?");
    params.push(filters.gender);
  }

  if (["In-person", "Online", "Both"].includes(filters.mode)) {
    // "Both" tutors satisfy a request for either specific mode.
    where.push(filters.mode === "Both" ? "t.teaching_mode = ?" : "(t.teaching_mode = ? OR t.teaching_mode = 'Both')");
    params.push(filters.mode);
  }

  const minExp = toInt(filters.minExperience);
  if (minExp) {
    where.push("t.teaching_start_year IS NOT NULL AND (YEAR(CURDATE()) - t.teaching_start_year) >= ?");
    params.push(minExp);
  }

  if (filters.verifiedOnly) where.push("t.verified = 1");

  const whereSql = where.join(" AND ");
  const orderBy = SORTS[filters.sort] || SORTS.recommended;
  const page = Math.max(1, toInt(filters.page) || 1);
  const limit = toInt(filters.limit) || PAGE_SIZE;
  const offset = (page - 1) * limit;

  const [countRows] = [await query(`SELECT COUNT(*) AS total FROM tutors t WHERE ${whereSql}`, params)];
  const total = Number(countRows[0]?.total || 0);

  if (total === 0) {
    return { tutors: [], total: 0, page, totalPages: 1, pageSize: limit };
  }

  // Two steps on purpose: pick the page of tutor ids first, then gather their
  // subjects and areas. Doing it in one GROUP_CONCAT query makes the LIMIT
  // apply after a 30,000-row join.
  const idRows = await query(
    `SELECT t.id FROM tutors t WHERE ${whereSql} ORDER BY ${orderBy}, t.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const ids = idRows.map((r) => r.id);
  if (!ids.length) return { tutors: [], total, page, totalPages: Math.ceil(total / limit), pageSize: limit };

  const placeholders = ids.map(() => "?").join(",");

  const [rows, subjectRows, classRows, areaRows] = await Promise.all([
    query(
      `SELECT t.id, t.first_name, t.last_name, t.gender, t.profile_image,
              t.teaching_mode, t.teaching_start_year, t.verified, t.institution,
              q.name AS qualification_name,
              sp.name AS specialization_name,
              t.specialization_other
       FROM tutors t
       LEFT JOIN qualifications q   ON q.id  = t.highest_qualification_id
       LEFT JOIN specializations sp ON sp.id = t.specialization_id
       WHERE t.id IN (${placeholders})`,
      ids
    ),
    query(
      `SELECT DISTINCT p.tutor_id, s.name, s.slug
       FROM tutor_teaching_profiles p JOIN subjects s ON s.id = p.subject_id
       WHERE p.tutor_id IN (${placeholders}) ORDER BY s.name`,
      ids
    ),
    query(
      `SELECT DISTINCT p.tutor_id, c.name, c.slug, c.sort_order
       FROM tutor_teaching_profiles p JOIN classes c ON c.id = p.class_id
       WHERE p.tutor_id IN (${placeholders}) ORDER BY c.sort_order`,
      ids
    ),
    query(
      `SELECT DISTINCT tl.tutor_id, l.name, l.slug
       FROM tutor_locations tl JOIN locations l ON l.id = tl.location_id
       WHERE tl.tutor_id IN (${placeholders}) ORDER BY l.name`,
      ids
    ),
  ]);

  const group = (list) => {
    const m = new Map();
    for (const r of list) {
      if (!m.has(r.tutor_id)) m.set(r.tutor_id, []);
      m.get(r.tutor_id).push({ name: r.name, slug: r.slug, sort_order: r.sort_order });
    }
    return m;
  };

  const bySubject = group(subjectRows);
  const byClass = group(classRows);
  const byArea = group(areaRows);
  const byId = new Map(rows.map((r) => [r.id, r]));

  // Preserve the ordered ids from the first query.
  const tutors = ids.map((id) => shapeTutor(byId.get(id), bySubject, byClass, byArea)).filter(Boolean);

  return { tutors, total, page, totalPages: Math.ceil(total / limit), pageSize: limit };
}

/** Public-safe card data. Nothing here is a contact detail. */
function shapeTutor(row, bySubject, byClass, byArea) {
  if (!row) return null;

  const classes = byClass.get(row.id) || [];
  const subjects = bySubject.get(row.id) || [];
  const areas = byArea.get(row.id) || [];

  return {
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
    gender: row.gender,
    image: row.profile_image || null,
    verified: Boolean(row.verified),
    mode: row.teaching_mode,
    experienceYears:
      row.teaching_start_year == null
        ? null
        : Math.max(0, new Date().getFullYear() - Number(row.teaching_start_year)),
    qualification: row.qualification_name || null,
    specialization: row.specialization_other || row.specialization_name || null,
    institution: row.institution || null,
    subjects,
    classes,
    areas,
    classRange: describeClassRange(classes),
  };
}

/**
 * "Class 1 – Class 10" rather than a list of sixteen chips. Contiguous school
 * classes collapse to a range; anything outside that is named separately.
 */
function describeClassRange(classes) {
  if (!classes.length) return null;

  const numbered = classes
    .map((c) => ({ ...c, n: Number((c.slug.match(/^class-(\d+)$/) || [])[1]) }))
    .filter((c) => Number.isFinite(c.n))
    .sort((a, b) => a.n - b.n);

  const others = classes.filter((c) => !/^class-\d+$/.test(c.slug)).map((c) => c.name);

  if (!numbered.length) return others.join(", ") || null;

  const contiguous = numbered.every((c, i) => i === 0 || c.n === numbered[i - 1].n + 1);
  const span =
    numbered.length === 1
      ? numbered[0].name
      : contiguous
        ? `${numbered[0].name} – ${numbered[numbered.length - 1].name}`
        : numbered.map((c) => c.n).join(", ").replace(/^/, "Class ");

  return [span, ...others].join(" · ");
}

/* =========================================================================
   Related links

   The internal-linking mesh that makes a directory discoverable: from any
   page, offer the neighbouring combinations that actually have tutors.
   ========================================================================= */

export async function getRelatedLinks({ subjectId = null, classId = null, areaId = null, limit = 8 } = {}) {
  const links = [];

  if (areaId && !subjectId) {
    const rows = await query(
      `SELECT s.name, s.slug, COUNT(DISTINCT t.id) AS n
       FROM tutor_teaching_profiles p
       JOIN subjects s ON s.id = p.subject_id
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       JOIN tutor_locations tl ON tl.tutor_id = t.id AND tl.location_id = ?
       GROUP BY s.id HAVING n >= 3 ORDER BY n DESC LIMIT ${limit}`,
      [areaId]
    );
    links.push({ heading: "Popular subjects here", items: rows.map((r) => ({ ...r, n: Number(r.n) })) });
  }

  if (subjectId && !areaId) {
    const rows = await query(
      `SELECT l.name, l.slug, COUNT(DISTINCT t.id) AS n
       FROM tutor_teaching_profiles p
       JOIN tutors t ON t.id = p.tutor_id AND ${LIVE}
       JOIN tutor_locations tl ON tl.tutor_id = t.id
       JOIN locations l ON l.id = tl.location_id
       WHERE p.subject_id = ?
       GROUP BY l.id HAVING n >= 3 ORDER BY n DESC LIMIT ${limit}`,
      [subjectId]
    );
    links.push({ heading: "Areas with these tutors", items: rows.map((r) => ({ ...r, n: Number(r.n) })) });
  }

  return links;
}
