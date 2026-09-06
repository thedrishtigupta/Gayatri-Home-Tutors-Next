// app/api/admin/tutor-changes/[id]/route.js
//
// Reviewing one submission. This is the only place a tutor's own edits ever
// reach the `tutors` table, and only for the fields an admin approved.

import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { FIELD_BY_NAME } from "@/lib/tutorProfileFields";
import { changesReviewedTemplate, sendMail } from "@/lib/mailer";
import { siteUrl } from "@/lib/tutorAuth";

export const dynamic = "force-dynamic";

const parseId = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Turn a stored `new_value` string back into something writable. */
function deserialise(field, stored) {
  const spec = FIELD_BY_NAME.get(field);
  if (stored === null || stored === undefined) return null;
  if (spec?.type === "relation") {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  if (spec?.type === "bool" || spec?.type === "ref" || spec?.type === "year") {
    return stored === "" ? null : Number(stored);
  }
  return stored;
}

/* ── read one submission ─────────────────────────────────────────── */

export const GET = requireAdmin(async (_req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [change] = await query(
    `SELECT c.*, t.first_name, t.last_name, t.email, t.whatsapp, t.profile_image,
            t.status AS tutor_status, t.verified,
            u.username AS reviewed_by_name
     FROM tutor_profile_changes c
     JOIN tutors t ON t.id = c.tutor_id
     LEFT JOIN admin_users u ON u.id = c.reviewed_by
     WHERE c.id = ?`,
    [id]
  );
  if (!change) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = await query(
    "SELECT * FROM tutor_profile_change_fields WHERE change_id = ? ORDER BY id",
    [id]
  );

  // Names for the ids inside relation fields, so the admin sees "Class 8 /
  // Maths" rather than a pair of integers.
  const [classes, subjects, locations, qualifications, specializations] = await Promise.all([
    query("SELECT id, name FROM classes"),
    query("SELECT id, name FROM subjects"),
    query("SELECT id, name FROM locations"),
    query("SELECT id, name FROM qualifications"),
    query("SELECT id, name FROM specializations"),
  ]);

  return NextResponse.json({
    data: {
      change,
      fields: fields.map((f) => ({ ...f, label: FIELD_BY_NAME.get(f.field)?.label || f.field })),
      lookups: { classes, subjects, locations, qualifications, specializations },
    },
  });
});

/* ── apply a decision ────────────────────────────────────────────── */

/**
 * PATCH body:
 *   { decisions: { "<fieldRowId>": "approved" | "rejected", ... }, note?: string }
 *
 * Any field row not named is left pending, which keeps the submission open.
 */
export const PATCH = requireAdmin(async (req, { params }, admin) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const decisions = body?.decisions && typeof body.decisions === "object" ? body.decisions : null;
  if (!decisions || !Object.keys(decisions).length) {
    return NextResponse.json({ error: "No decisions were provided." }, { status: 400 });
  }

  const note = body.note ? String(body.note).slice(0, 2000) : null;

  const result = await withTransaction(async (tx) => {
    const [change] = await tx.query(
      "SELECT * FROM tutor_profile_changes WHERE id = ? FOR UPDATE",
      [id]
    );
    if (!change) throw Object.assign(new Error("Not found"), { statusCode: 404 });
    if (change.status !== "pending") {
      throw Object.assign(new Error("This submission has already been reviewed."), { statusCode: 409 });
    }

    const fields = await tx.query(
      "SELECT * FROM tutor_profile_change_fields WHERE change_id = ?",
      [id]
    );
    const byId = new Map(fields.map((f) => [String(f.id), f]));

    const approvedFields = [];
    for (const [rowId, decision] of Object.entries(decisions)) {
      if (decision !== "approved" && decision !== "rejected") {
        throw Object.assign(new Error(`Invalid decision "${decision}".`), { statusCode: 400 });
      }
      const row = byId.get(String(rowId));
      if (!row) {
        throw Object.assign(new Error("A decision referenced an unknown field."), { statusCode: 400 });
      }
      await tx.execute(
        "UPDATE tutor_profile_change_fields SET status = ?, reviewed_at = NOW() WHERE id = ?",
        [decision, row.id]
      );
      if (decision === "approved") approvedFields.push(row);
    }

    /* Write the approved fields onto the tutor. */
    const sets = [];
    const vals = [];

    for (const row of approvedFields) {
      const value = deserialise(row.field, row.new_value);

      if (row.field === "location_ids") {
        await tx.execute("DELETE FROM tutor_locations WHERE tutor_id = ?", [change.tutor_id]);
        if (value?.length) {
          await tx.execute(
            `INSERT INTO tutor_locations (tutor_id, location_id)
             VALUES ${value.map(() => "(?, ?)").join(",")}`,
            value.flatMap((locId) => [change.tutor_id, locId])
          );
        }
        continue;
      }

      if (row.field === "teaching_profiles") {
        await tx.execute("DELETE FROM tutor_teaching_profiles WHERE tutor_id = ?", [change.tutor_id]);
        if (value?.length) {
          await tx.execute(
            `INSERT INTO tutor_teaching_profiles (tutor_id, class_id, subject_id)
             VALUES ${value.map(() => "(?, ?, ?)").join(",")}`,
            value.flatMap((p) => [change.tutor_id, p.class_id, p.subject_id])
          );
        }
        continue;
      }

      sets.push(`${row.field} = ?`);
      vals.push(value);
    }

    if (sets.length) {
      await tx.execute(
        `UPDATE tutors SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`,
        [...vals, change.tutor_id]
      );
    }

    /* Close the submission if every field now has a decision. */
    const remaining = await tx.query(
      "SELECT COUNT(*) AS n FROM tutor_profile_change_fields WHERE change_id = ? AND status = 'pending'",
      [id]
    );
    const stillPending = Number(remaining[0]?.n || 0);

    const counts = await tx.query(
      `SELECT SUM(status = 'approved') AS approved, SUM(status = 'rejected') AS rejected
       FROM tutor_profile_change_fields WHERE change_id = ?`,
      [id]
    );
    const approved = Number(counts[0]?.approved || 0);
    const rejected = Number(counts[0]?.rejected || 0);

    let finalStatus = "pending";
    if (stillPending === 0) {
      finalStatus = rejected === 0 ? "approved" : approved === 0 ? "rejected" : "partial";
      await tx.execute(
        `UPDATE tutor_profile_changes
         SET status = ?, reviewed_at = NOW(), reviewed_by = ?, admin_note = ?
         WHERE id = ?`,
        [finalStatus, admin?.id || null, note, id]
      );
      // Approving a tutor's own edits is also a profile review.
      await tx.execute("UPDATE tutors SET last_profile_reviewed_at = NOW() WHERE id = ?", [change.tutor_id]);
    } else if (note) {
      await tx.execute("UPDATE tutor_profile_changes SET admin_note = ? WHERE id = ?", [note, id]);
    }

    return { tutorId: change.tutor_id, finalStatus, stillPending, approved, rejected };
  }).catch((err) => {
    if (err.statusCode) return { error: err.message, statusCode: err.statusCode };
    throw err;
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }

  // Tell the tutor once the whole submission is settled. Best effort: a mail
  // failure must not undo an applied approval.
  if (result.stillPending === 0) {
    const [tutor] = await query("SELECT first_name, email FROM tutors WHERE id = ?", [result.tutorId]);
    if (tutor?.email) {
      await sendMail({
        to: tutor.email,
        ...changesReviewedTemplate({
          name: tutor.first_name,
          url: siteUrl("/portal/profile"),
          approved: result.approved,
          rejected: result.rejected,
        }),
      });
    }
  }

  return NextResponse.json({ ok: true, ...result });
});
