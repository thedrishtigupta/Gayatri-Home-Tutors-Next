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

  // Duplicate suppression: same phone submitted within the last 10 minutes.
  const recent = await query(
    `SELECT id FROM demo_requests
      WHERE phone = ? AND created_at > (NOW() - INTERVAL 10 MINUTE)
      ORDER BY id DESC LIMIT 1`,
    [data.phone],
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
       (full_name, email, phone, student_class, preferred_time, subjects, area, message, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ],
  );

  return ok(
    { id: result.insertId, message: "Thanks! We will contact you shortly to schedule your free demo." },
    201,
  );
});
