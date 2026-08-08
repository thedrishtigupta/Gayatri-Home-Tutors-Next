// app/api/admin/tutors/route.js — tutor listing + filtering
//
// Filtering rules (fixes the old behaviour):
//  • No filter selected → every tutor is returned.
//  • Subject / area / class matching is case-insensitive and forgiving:
//    the stored columns are free-text comma lists with inconsistent spacing
//    ("Maths, Physics" vs "maths,physics"), so we normalise both sides.
//  • Search covers first name, last name, subjects, areas, phone and email.
//  • Featured accepts 1/0/true/false/yes/no and filters both ways.
//  • Experience is clamped to a sane integer and never crashes on junk input.
//  • Unknown enum values (status/gender) are ignored instead of 500-ing.
//  • The response is always valid JSON, even on failure (requireAdmin wraps
//    the handler in try/catch and returns a JSON error body).

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { expandFacetAliases, facetKey } from "@/lib/facetNormalizer";

const STATUSES = ["pending", "active", "inactive", "blacklisted"];
const GENDERS = ["Male", "Female", "Other"];

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

/** Trim a query param and treat empty strings as "not provided". */
function param(searchParams, key) {
  const raw = searchParams.get(key);
  if (raw === null) return null;
  const value = String(raw).trim();
  return value === "" ? null : value;
}

/** Escape LIKE wildcards so a user typing "%" doesn't match everything. */
function like(value) {
  return `%${String(value).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * SQL expression that turns a stored free-text comma list into a canonical,
 * punctuation-free, comma-delimited haystack:
 *   "Maths, Physics / Chem-istry" → ",maths,physics,chemistry,"
 */
function listHaystack(column) {
  return `CONCAT(',', REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(COALESCE(${column}, '')), ' ', ''), '.', ''), '-', ''), '/', ','), ';', ','), ',')`;
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Alias key → needle used against listHaystack(). */
function needle(aliasKey) {
  return `%,${escapeLike(aliasKey.replace(/\s+/g, ""))},%`;
}

/**
 * Alias-aware filter for a comma-list column.
 * Selecting "Mathematics" matches stored "Math", "maths", "MATHEMATICS", ...
 * A loose substring match is kept as a fallback so partially typed or
 * sector-style values ("Rohini" → "Rohini Sector 8") still resolve.
 */
function facetFilter(column, value, type, { loose = false } = {}) {
  const aliases = expandFacetAliases(value, type);
  const clauses = [];
  const params = [];
  const haystack = listHaystack(column);

  for (const alias of aliases) {
    clauses.push(`${haystack} LIKE ?`);
    params.push(needle(alias));
  }

  if (loose) {
    for (const alias of aliases) {
      clauses.push(`${haystack} LIKE ?`);
      params.push(`%${escapeLike(alias.replace(/\s+/g, ""))}%`);
    }
  }

  if (!clauses.length) return null;
  return { sql: `(${clauses.join(" OR ")})`, params };
}

function parseBool(value) {
  if (value === null) return null;
  const v = String(value).toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return null;
}

function parseIntSafe(value, { min = 0, max = 99 } = {}) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
}

// GET /api/admin/tutors?subject=maths&area=rohini&status=active&gender=Female
//                      &minExp=2&class=9th&featured=1&search=ravi&page=1&limit=50
export const GET = requireAdmin(async (req) => {
  const p = new URL(req.url).searchParams;

  const subject = param(p, "subject");
  const area = param(p, "area");
  const status = param(p, "status");
  const gender = param(p, "gender");
  const minExp = param(p, "minExp");
  const maxExp = param(p, "maxExp");
  const cls = param(p, "class");
  const search = param(p, "search");
  const featured = parseBool(param(p, "featured"));
  const verified = parseBool(param(p, "verified"));

  const limit = parseIntSafe(param(p, "limit"), { min: 1, max: MAX_LIMIT }) ?? DEFAULT_LIMIT;
  const page = parseIntSafe(param(p, "page"), { min: 1, max: 100000 }) ?? 1;
  const offset = (page - 1) * limit;

  const where = ["1=1"];
  const params = [];

  const applyFacet = (column, value, type, opts) => {
    const f = facetFilter(column, value, type, opts);
    if (!f) return;
    where.push(f.sql);
    params.push(...f.params);
  };

  // Alias-aware: the selected canonical value expands to every stored variant.
  if (subject) applyFacet("subjects", subject, "subject", { loose: true });
  if (area) applyFacet("areas", area, "area", { loose: true });
  if (cls) applyFacet("classes_taught", cls, "class");

  // Unknown enum values are ignored rather than producing an empty/500 result.
  if (status && STATUSES.includes(status.toLowerCase())) {
    where.push("status = ?");
    params.push(status.toLowerCase());
  }

  if (gender) {
    const match = GENDERS.find((g) => g.toLowerCase() === gender.toLowerCase());
    if (match) {
      where.push("gender = ?");
      params.push(match);
    }
  }

  const min = minExp === null ? null : parseIntSafe(minExp);
  if (min !== null) {
    where.push("COALESCE(experience_years, 0) >= ?");
    params.push(min);
  }

  const max = maxExp === null ? null : parseIntSafe(maxExp);
  if (max !== null) {
    where.push("COALESCE(experience_years, 0) <= ?");
    params.push(max);
  }

  if (featured !== null) {
    where.push("COALESCE(featured, 0) = ?");
    params.push(featured ? 1 : 0);
  }

  if (verified !== null) {
    where.push("COALESCE(verified, 0) = ?");
    params.push(verified ? 1 : 0);
  }

  if (search) {
    const term = like(search.toLowerCase());
    where.push(`(
      LOWER(COALESCE(first_name, '')) LIKE ?
      OR LOWER(COALESCE(last_name, '')) LIKE ?
      OR LOWER(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) LIKE ?
      OR LOWER(COALESCE(subjects, '')) LIKE ?
      OR LOWER(COALESCE(areas, '')) LIKE ?
      OR LOWER(COALESCE(email, '')) LIKE ?
      OR COALESCE(whatsapp, '') LIKE ?
      OR COALESCE(alt_number, '') LIKE ?
    )`);
    params.push(term, term, term, term, term, term, term, term);

    // Alias-aware search: typing "maths" also finds "Mathematics", "XI" finds
    // "Class 11", "CS" finds "Computer Science" — without touching stored data.
    const aliasClauses = [];
    const aliasParams = [];
    for (const [column, type] of [
      ["subjects", "subject"],
      ["areas", "area"],
      ["classes_taught", "class"],
    ]) {
      const f = facetFilter(column, search, type);
      if (f) {
        aliasClauses.push(f.sql);
        aliasParams.push(...f.params);
      }
    }
    if (aliasClauses.length) {
      const last = where.pop();
      where.push(`(${last} OR ${aliasClauses.join(" OR ")})`);
      params.push(...aliasParams);
    }
  }

  const whereSql = where.join(" AND ");

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM tutors WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows?.[0]?.total || 0);

  // LIMIT/OFFSET are inlined as validated integers: mysql2's prepared
  // statement protocol rejects placeholders there under some server configs.
  const rows = await query(
    `SELECT * FROM tutors
      WHERE ${whereSql}
      ORDER BY featured DESC, success_rate DESC, total_classes_accepted DESC, id DESC
      LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return NextResponse.json({
    data: Array.isArray(rows) ? rows : [],
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});
