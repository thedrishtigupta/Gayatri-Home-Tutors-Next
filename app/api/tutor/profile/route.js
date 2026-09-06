// app/api/tutor/profile/route.js
//
// GET   the signed-in tutor's own profile, stats and any pending submission
// PATCH submit edits for admin review — this never writes to `tutors`

import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireTutor } from "@/lib/tutorAuth";
import {
  EDITABLE_NAMES,
  FIELD_BY_NAME,
  hasChanged,
  normaliseField,
  serialise,
} from "@/lib/tutorProfileFields";

export const dynamic = "force-dynamic";

/* ── read ────────────────────────────────────────────────────────── */

async function loadProfile(tutorId) {
  const [tutor] = await query(
    `SELECT t.*,
            DATE_FORMAT(t.date_of_birth, '%Y-%m-%d') AS dob_iso,
            q.name  AS qualification_name,
            sp.name AS specialization_name,
            a.status AS account_status,
            a.last_login_at,
            a.email_verified_at
     FROM tutors t
     LEFT JOIN qualifications q   ON q.id  = t.highest_qualification_id
     LEFT JOIN specializations sp ON sp.id = t.specialization_id
     -- LEFT, so an admin can preview the panel for a tutor who has no account.
     LEFT JOIN tutor_accounts a ON a.tutor_id = t.id
     WHERE t.id = ?`,
    [tutorId]
  );

  if (!tutor) return null;

  tutor.date_of_birth = tutor.dob_iso;
  delete tutor.dob_iso;
  // Never leave a hash where a template might render it.
  delete tutor.password_hash;

  const [locations, teachingProfiles, customSubjects] = await Promise.all([
    query(
      `SELECT l.id, l.name, l.location_type, l.parent_location_id
       FROM tutor_locations tl JOIN locations l ON l.id = tl.location_id
       WHERE tl.tutor_id = ? ORDER BY l.name`,
      [tutorId]
    ),
    query(
      `SELECT ttp.class_id, c.name AS class_name, ttp.subject_id, s.name AS subject_name
       FROM tutor_teaching_profiles ttp
       JOIN classes c  ON c.id = ttp.class_id
       JOIN subjects s ON s.id = ttp.subject_id
       WHERE ttp.tutor_id = ? ORDER BY c.sort_order, c.id, s.name`,
      [tutorId]
    ),
    query(
      `SELECT tcs.id, tcs.class_id, c.name AS class_name, tcs.subject_name, tcs.status
       FROM tutor_custom_subjects tcs JOIN classes c ON c.id = tcs.class_id
       WHERE tcs.tutor_id = ? ORDER BY tcs.id DESC`,
      [tutorId]
    ),
  ]);

  return { tutor, locations, teachingProfiles, customSubjects };
}

/** Assignment counters. Empty today; correct once the demo flow is in use. */
async function loadStats(tutorId) {
  const [[demo]] = [
    await query(
      `SELECT
         COUNT(*) AS total,
         SUM(assignment_status = 'assigned')          AS awaiting_response,
         SUM(assignment_status = 'accepted')          AS accepted,
         SUM(assignment_status = 'rejected_by_tutor') AS rejected,
         SUM(assignment_status = 'dropped')           AS dropped
       FROM demo_requests WHERE assigned_tutor_id = ?`,
      [tutorId]
    ),
  ];

  return {
    assignments: {
      total: Number(demo?.total || 0),
      awaitingResponse: Number(demo?.awaiting_response || 0),
      accepted: Number(demo?.accepted || 0),
      rejected: Number(demo?.rejected || 0),
      dropped: Number(demo?.dropped || 0),
    },
  };
}

/** The tutor's open submission, if any, with its per-field rows. */
async function loadPendingChange(tutorId) {
  const [change] = await query(
    `SELECT id, status, submitted_at FROM tutor_profile_changes
     WHERE tutor_id = ? AND status = 'pending'
     ORDER BY submitted_at DESC LIMIT 1`,
    [tutorId]
  );
  if (!change) return null;

  const fields = await query(
    "SELECT field, old_value, new_value, status FROM tutor_profile_change_fields WHERE change_id = ?",
    [change.id]
  );
  return { ...change, fields };
}

/** The last few reviewed submissions, so a tutor can see what happened. */
async function loadHistory(tutorId) {
  const changes = await query(
    `SELECT c.id, c.status, c.submitted_at, c.reviewed_at, c.admin_note,
            SUM(f.status = 'approved') AS approved,
            SUM(f.status = 'rejected') AS rejected
     FROM tutor_profile_changes c
     LEFT JOIN tutor_profile_change_fields f ON f.change_id = c.id
     WHERE c.tutor_id = ? AND c.status <> 'pending'
     GROUP BY c.id
     ORDER BY c.submitted_at DESC
     LIMIT 5`,
    [tutorId]
  );
  return changes.map((c) => ({ ...c, approved: Number(c.approved || 0), rejected: Number(c.rejected || 0) }));
}

export const GET = requireTutor(async (_req, _ctx, tutor) => {
  const profile = await loadProfile(tutor.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const [stats, pendingChange, history] = await Promise.all([
    loadStats(tutor.id),
    loadPendingChange(tutor.id),
    loadHistory(tutor.id),
  ]);

  return NextResponse.json({
    data: { ...profile, stats, pendingChange, history, impersonation: tutor.impersonation || null },
  });
});

/* ── submit changes ──────────────────────────────────────────────── */

/** Current value of an editable field, in the shape the tutor submits. */
function currentValue(field, profile) {
  if (field === "location_ids") return profile.locations.map((l) => l.id);
  if (field === "teaching_profiles") {
    return profile.teachingProfiles.map((p) => ({ class_id: p.class_id, subject_id: p.subject_id }));
  }
  return profile.tutor[field];
}

async function assertReferencesExist(tx, field, value) {
  if (value === null || value === undefined) return null;

  if (field === "highest_qualification_id" || field === "specialization_id") {
    const table = field === "highest_qualification_id" ? "qualifications" : "specializations";
    const rows = await tx.query(`SELECT id FROM ${table} WHERE id = ? AND is_active = 1`, [value]);
    return rows.length ? null : `That ${table === "qualifications" ? "qualification" : "specialization"} is not available.`;
  }

  if (field === "location_ids" && value.length) {
    const rows = await tx.query(
      `SELECT id FROM locations WHERE is_active = 1 AND id IN (${value.map(() => "?").join(",")})`,
      value
    );
    return rows.length === value.length ? null : "One or more selected areas are not available.";
  }

  if (field === "teaching_profiles" && value.length) {
    const classIds = [...new Set(value.map((p) => p.class_id))];
    const subjectIds = [...new Set(value.map((p) => p.subject_id))];
    const [cls, subs] = await Promise.all([
      tx.query(`SELECT id FROM classes WHERE is_active = 1 AND id IN (${classIds.map(() => "?").join(",")})`, classIds),
      tx.query(`SELECT id FROM subjects WHERE is_active = 1 AND id IN (${subjectIds.map(() => "?").join(",")})`, subjectIds),
    ]);
    if (cls.length !== classIds.length) return "One or more selected classes are not available.";
    if (subs.length !== subjectIds.length) return "One or more selected subjects are not available.";
  }

  return null;
}

export const PATCH = requireTutor(async (req, _ctx, tutor) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const profile = await loadProfile(tutor.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const submitted = Object.keys(body).filter((k) => EDITABLE_NAMES.includes(k));
  if (!submitted.length) {
    return NextResponse.json({ error: "No editable fields were submitted." }, { status: 400 });
  }

  const unknown = Object.keys(body).filter((k) => !EDITABLE_NAMES.includes(k));
  if (unknown.length) {
    return NextResponse.json(
      { error: `These fields cannot be changed here: ${unknown.join(", ")}.` },
      { status: 400 }
    );
  }

  // Normalise and keep only what actually differs from the live profile.
  const changes = [];
  for (const field of submitted) {
    const { value, error } = normaliseField(field, body[field]);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const current = currentValue(field, profile);
    if (!hasChanged(field, current, value)) continue;

    changes.push({ field, oldValue: serialise(field, current), newValue: serialise(field, value), value });
  }

  if (!changes.length) {
    return NextResponse.json({ ok: true, noChanges: true, message: "Nothing has changed." });
  }

  // Cross-field rule the admin form applies too.
  const teachesInSchool = changes.find((c) => c.field === "teaches_in_school");
  const schoolDetails = changes.find((c) => c.field === "school_name_address");
  const willTeachInSchool = teachesInSchool ? teachesInSchool.value === 1 : Boolean(profile.tutor.teaches_in_school);
  const willHaveDetails = schoolDetails ? schoolDetails.value : profile.tutor.school_name_address;
  if (willTeachInSchool && !willHaveDetails) {
    return NextResponse.json(
      { error: "Add your school name and address, or untick that you teach in a school." },
      { status: 400 }
    );
  }

  let changeId;
  try {
    changeId = await withTransaction(async (tx) => {
      for (const c of changes) {
        const problem = await assertReferencesExist(tx, c.field, c.value);
        if (problem) throw Object.assign(new Error(problem), { statusCode: 400 });
      }

      // A tutor has at most one open submission: re-submitting replaces it, so
      // the admin queue never fills with successive drafts from one person.
      const open = await tx.query(
        "SELECT id FROM tutor_profile_changes WHERE tutor_id = ? AND status = 'pending'",
        [tutor.id]
      );
      for (const row of open) {
        await tx.execute("UPDATE tutor_profile_changes SET status = 'withdrawn' WHERE id = ?", [row.id]);
      }

      const result = await tx.execute(
        "INSERT INTO tutor_profile_changes (tutor_id, status) VALUES (?, 'pending')",
        [tutor.id]
      );

      for (const c of changes) {
        await tx.execute(
          `INSERT INTO tutor_profile_change_fields (change_id, field, old_value, new_value)
           VALUES (?, ?, ?, ?)`,
          [result.insertId, c.field, c.oldValue, c.newValue]
        );
      }

      return result.insertId;
    });
  } catch (err) {
    // A reference that vanished between form load and submit is the tutor's
    // problem to fix, not a server fault — report it as such.
    if (err.statusCode === 400) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  return NextResponse.json({
    ok: true,
    changeId,
    submitted: changes.map((c) => ({ field: c.field, label: FIELD_BY_NAME.get(c.field).label })),
    message: `${changes.length} change${changes.length === 1 ? "" : "s"} submitted for approval.`,
  });
});
