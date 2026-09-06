// app/api/demo/route.js — POST: submit a new demo request.
// Hardened: strict validation, duplicate suppression, consistent JSON envelope.

import { execute, query } from "@/lib/db";
import { ok, fail, safeRoute, readJson } from "@/lib/apiResponse";
import { validateDemoRequest } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const POST = safeRoute("demo POST", async (req) => {
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.", 400);

  const { valid, errors, data } = validateDemoRequest(body);
  if (!valid) {
    return fail("Please correct the highlighted fields.", 422, { fields: errors });
  }

  /*
   * Resolve the requested tutor, if the family came from a tutor's profile.
   *
   * An id that no longer resolves to an active tutor is dropped to NULL rather
   * than rejected. A stale bookmark, a tutor who left last week, or a
   * hand-edited query string must never cost the business a real enquiry — the
   * office can still call back and suggest someone else. The FK would refuse
   * the insert anyway, so this check is what keeps a valid lead from being
   * turned away by a 500.
   */
  let requestedTutorId = null;
  if (data.requestedTutorId) {
    const rows = await query(
      "SELECT id FROM tutors WHERE id = ? AND status = 'active' LIMIT 1",
      [data.requestedTutorId],
    );
    if (rows.length) requestedTutorId = rows[0].id;
  }

  /*
   * Duplicate suppression: the same phone within 10 minutes.
   *
   * Scoped to the requested tutor as well, because a family comparing two
   * profiles will quite reasonably request Anjali and then Meera a minute
   * apart. Matching on phone alone would silently swallow the second request
   * and report success — losing a lead in the least visible way possible.
   * <=> is used rather than = so that two generic enquiries (both NULL) still
   * count as duplicates of each other.
   */
  const recent = await query(
    `SELECT id FROM demo_requests
      WHERE phone = ?
        AND requested_tutor_id <=> ?
        AND created_at > (NOW() - INTERVAL 10 MINUTE)
      ORDER BY id DESC LIMIT 1`,
    [data.phone, requestedTutorId],
  );
  if (Array.isArray(recent) && recent.length > 0) {
    return ok(
      {
        id: recent[0].id,
        duplicate: true,
        message: "We already received your request — our team will call you shortly.",
      },
      200,
    );
  }

  const result = await execute(
    `INSERT INTO demo_requests
       (full_name, email, phone, student_class, preferred_time, subjects, area, message, source, requested_tutor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.fullName,
      data.email,
      data.phone,
      data.studentClass,
      data.time,
      JSON.stringify(data.subjects),
      data.area,
      data.message,
      data.source,
      requestedTutorId,
    ],
  );

  return ok(
    {
      id: result.insertId,
      // Tells the form whether the tutor it displayed was actually honoured, so
      // it never promises a specific tutor the office has no record of.
      requestedTutorId,
      message: "Thanks! We will contact you shortly to schedule your free demo.",
    },
    201,
  );
});
