// app/api/admin/tutors/route.js — v3 tutor listing + filtering

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

const STATUSES = ["active", "inactive", "blacklisted"];
const GENDERS = ["Male", "Female", "Other"];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

function param(searchParams, key) {
  const raw = searchParams.get(key);
  if (raw === null) return null;
  const value = String(raw).trim();
  return value === "" ? null : value;
}

function parseId(value) {
  if (value === null) return null;
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseBool(value) {
  if (value === null) return null;
  const normalized = String(value).toLowerCase();
  if (["1", "true", "yes"].includes(normalized)) return 1;
  if (["0", "false", "no"].includes(normalized)) return 0;
  return null;
}

function like(value) {
  return `%${String(value).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function parseIntSafe(value, min, max) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
}

export const GET = requireAdmin(async (req) => {
  const p = new URL(req.url).searchParams;

  const search = param(p, "search");
  const subjectId = parseId(param(p, "subjectId"));
  const classId = parseId(param(p, "classId"));
  const areaId = parseId(param(p, "areaId"));
  const status = param(p, "status");
  const gender = param(p, "gender");
  const verified = parseBool(param(p, "verified"));
  const profileCompleted = parseBool(param(p, "profileCompleted"));

  const limit = parseIntSafe(param(p, "limit"), 1, MAX_LIMIT) ?? DEFAULT_LIMIT;
  const page = parseIntSafe(param(p, "page"), 1, 100000) ?? 1;
  const offset = (page - 1) * limit;

  const where = ["1=1"];
  const params = [];

  if (search) {
    const term = like(search);
    where.push(`(
      CONCAT_WS(' ', t.first_name, t.last_name) LIKE ?
      OR t.email LIKE ?
      OR t.whatsapp LIKE ?
      OR t.alternate_phone LIKE ?
      OR EXISTS (
        SELECT 1
        FROM tutor_teaching_profiles stp
        INNER JOIN subjects ss ON ss.id = stp.subject_id
        WHERE stp.tutor_id = t.id AND ss.name LIKE ?
      )
      OR EXISTS (
        SELECT 1
        FROM tutor_locations sla
        INNER JOIN locations sl ON sl.id = sla.location_id
        WHERE sla.tutor_id = t.id AND sl.name LIKE ?
      )
    )`);
    params.push(term, term, term, term, term, term);
  }

  if (subjectId !== null) {
    where.push(`EXISTS (
      SELECT 1 FROM tutor_teaching_profiles fsp
      WHERE fsp.tutor_id = t.id AND fsp.subject_id = ?
    )`);
    params.push(subjectId);
  }

  if (classId !== null) {
    where.push(`EXISTS (
      SELECT 1 FROM tutor_teaching_profiles fcp
      WHERE fcp.tutor_id = t.id AND fcp.class_id = ?
    )`);
    params.push(classId);
  }

  if (areaId !== null) {
    where.push(`EXISTS (
      SELECT 1 FROM tutor_locations fal
      WHERE fal.tutor_id = t.id AND fal.location_id = ?
    )`);
    params.push(areaId);
  }

  if (status && STATUSES.includes(status)) {
    where.push("t.status = ?");
    params.push(status);
  }

  if (gender && GENDERS.includes(gender)) {
    where.push("t.gender = ?");
    params.push(gender);
  }

  if (verified !== null) {
    where.push("t.verified = ?");
    params.push(verified);
  }

  if (profileCompleted !== null) {
    where.push("t.profile_completed = ?");
    params.push(profileCompleted);
  }

  const whereSql = where.join(" AND ");

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM tutors t WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows?.[0]?.total || 0);

  const rows = await query(
    `
      SELECT
        t.id,
        t.first_name,
        t.last_name,
        t.gender,
        t.date_of_birth,
        t.marital_status,
        t.whatsapp,
        t.alternate_phone,
        t.email,
        t.highest_qualification_id,
        q.name AS qualification_name,
        t.specialization_id,
        sp.name AS specialization_name,
        t.specialization_other,
        t.teaching_start_year,
        CASE
          WHEN t.teaching_start_year IS NULL THEN NULL
          ELSE GREATEST(0, YEAR(CURDATE()) - t.teaching_start_year)
        END AS experience_years,
        t.teaching_mode,
        t.status,
        t.verified,
        t.profile_completed,
        t.profile_image,
        t.last_profile_reviewed_at,
        t.created_at,
        t.updated_at,
        GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS subjects,
        GROUP_CONCAT(DISTINCT c.name ORDER BY c.sort_order, c.id SEPARATOR ', ') AS classes,
        GROUP_CONCAT(DISTINCT l.name ORDER BY l.name SEPARATOR ', ') AS areas
      FROM tutors t
      LEFT JOIN qualifications q ON q.id = t.highest_qualification_id
      LEFT JOIN specializations sp ON sp.id = t.specialization_id
      LEFT JOIN tutor_teaching_profiles ttp ON ttp.tutor_id = t.id
      LEFT JOIN subjects s ON s.id = ttp.subject_id
      LEFT JOIN classes c ON c.id = ttp.class_id
      LEFT JOIN tutor_locations tl ON tl.tutor_id = t.id
      LEFT JOIN locations l ON l.id = tl.location_id
      WHERE ${whereSql}
      GROUP BY t.id
      ORDER BY
        CASE t.status
          WHEN 'active' THEN 0
          WHEN 'inactive' THEN 1
          ELSE 2
        END,
        t.profile_completed DESC,
        t.verified DESC,
        t.last_name ASC,
        t.first_name ASC,
        t.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
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
