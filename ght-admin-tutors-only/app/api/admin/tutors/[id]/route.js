// app/api/admin/tutors/[id]/route.js — v3 tutor admin actions

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

const STATUSES = ["active", "inactive", "blacklisted"];

function parseId(raw) {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function toBit(value) {
  return value === 1 || value === true || value === "1" || value === "true" ? 1 : 0;
}

export const GET = requireAdmin(async (_req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [tutor] = await query(`
    SELECT
      t.*,
      q.name AS qualification_name,
      sp.name AS specialization_name
    FROM tutors t
    LEFT JOIN qualifications q ON q.id = t.highest_qualification_id
    LEFT JOIN specializations sp ON sp.id = t.specialization_id
    WHERE t.id = ?
  `, [id]);

  if (!tutor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [locations, teachingProfiles, customSubjects] = await Promise.all([
    query(`
      SELECT l.id, l.name, l.slug, l.location_type, l.parent_location_id
      FROM tutor_locations tl
      INNER JOIN locations l ON l.id = tl.location_id
      WHERE tl.tutor_id = ?
      ORDER BY l.name
    `, [id]),
    query(`
      SELECT
        ttp.id,
        ttp.class_id,
        c.name AS class_name,
        ttp.subject_id,
        s.name AS subject_name
      FROM tutor_teaching_profiles ttp
      INNER JOIN classes c ON c.id = ttp.class_id
      INNER JOIN subjects s ON s.id = ttp.subject_id
      WHERE ttp.tutor_id = ?
      ORDER BY c.sort_order, c.id, s.name
    `, [id]),
    query(`
      SELECT
        tcs.id,
        tcs.class_id,
        c.name AS class_name,
        tcs.subject_name,
        tcs.status
      FROM tutor_custom_subjects tcs
      INNER JOIN classes c ON c.id = tcs.class_id
      WHERE tcs.tutor_id = ?
      ORDER BY tcs.id DESC
    `, [id]),
  ]);

  return NextResponse.json({ data: { tutor, locations, teachingProfiles, customSubjects } });
});

export const PATCH = requireAdmin(async (req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const sets = [];
  const vals = [];

  if ("status" in body) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    sets.push("status = ?");
    vals.push(body.status);
  }

  if ("verified" in body) {
    sets.push("verified = ?");
    vals.push(toBit(body.verified));
  }

  if ("profile_completed" in body) {
    sets.push("profile_completed = ?");
    vals.push(toBit(body.profile_completed));
  }

  if ("profile_image" in body) {
    sets.push("profile_image = ?");
    vals.push(body.profile_image ? String(body.profile_image).slice(0, 255) : null);
  }

  if (!sets.length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  vals.push(id);
  const result = await execute(
    `UPDATE tutors SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`,
    vals
  );

  if (!result.affectedRows) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await query("SELECT * FROM tutors WHERE id = ?", [id]);
  return NextResponse.json({ ok: true, data: updated });
});

export const DELETE = requireAdmin(async (_req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const result = await execute("DELETE FROM tutors WHERE id = ?", [id]);
  if (!result.affectedRows) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
});
