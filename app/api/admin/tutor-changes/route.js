// app/api/admin/tutor-changes/route.js — the review queue listing.

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { FIELD_BY_NAME } from "@/lib/tutorProfileFields";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "approved", "rejected", "partial", "withdrawn"];

export const GET = requireAdmin(async (req) => {
  const p = new URL(req.url).searchParams;
  const status = STATUSES.includes(p.get("status")) ? p.get("status") : "pending";
  const limit = Math.min(Math.max(Number.parseInt(p.get("limit") || "25", 10) || 25, 1), 100);
  const page = Math.max(Number.parseInt(p.get("page") || "1", 10) || 1, 1);

  const [countRow] = await query(
    "SELECT COUNT(*) AS total FROM tutor_profile_changes WHERE status = ?",
    [status]
  );
  const total = Number(countRow?.total || 0);

  const changes = await query(
    `SELECT c.id, c.tutor_id, c.status, c.submitted_at, c.reviewed_at, c.admin_note,
            t.first_name, t.last_name, t.email, t.whatsapp, t.profile_image,
            t.status AS tutor_status, t.verified,
            COUNT(f.id) AS field_count
     FROM tutor_profile_changes c
     JOIN tutors t ON t.id = c.tutor_id
     LEFT JOIN tutor_profile_change_fields f ON f.change_id = c.id
     WHERE c.status = ?
     GROUP BY c.id
     ORDER BY c.submitted_at ASC
     LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    [status]
  );

  // Field rows for the listed submissions, so the queue can show a diff inline
  // without a request per row.
  let fields = [];
  if (changes.length) {
    const ids = changes.map((c) => c.id);
    fields = await query(
      `SELECT id, change_id, field, old_value, new_value, status
       FROM tutor_profile_change_fields
       WHERE change_id IN (${ids.map(() => "?").join(",")})
       ORDER BY id`,
      ids
    );
  }

  const byChange = new Map();
  for (const f of fields) {
    if (!byChange.has(f.change_id)) byChange.set(f.change_id, []);
    byChange.get(f.change_id).push({ ...f, label: FIELD_BY_NAME.get(f.field)?.label || f.field });
  }

  // Counts for the queue's status tabs.
  const counts = await query(
    "SELECT status, COUNT(*) AS n FROM tutor_profile_changes GROUP BY status"
  );

  return NextResponse.json({
    data: changes.map((c) => ({ ...c, fields: byChange.get(c.id) || [] })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    counts: Object.fromEntries(counts.map((r) => [r.status, Number(r.n)])),
  });
});
