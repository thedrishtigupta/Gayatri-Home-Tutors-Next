// app/api/admin/tutor-impersonate/route.js
//
// Lets an admin open a tutor's own panel to see what that tutor sees.
//
// The session it issues is read-only and expires in 30 minutes — requireTutor
// refuses any non-GET request carrying it. Admins who need to change a tutor's
// details use /admin/tutors/[id], which writes directly and skips the approval
// queue that exists for tutors' own edits.
//
// The admin's own cookie is untouched, so leaving impersonation is just a
// matter of dropping the tutor cookie.

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { clearTutorCookie, setTutorCookie } from "@/lib/tutorAuth";

export const dynamic = "force-dynamic";

function clientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 45);
  return req.headers.get("x-real-ip")?.slice(0, 45) || null;
}

export const POST = requireAdmin(async (req, _ctx, admin) => {
  const body = await req.json().catch(() => ({}));
  const tutorId = Number.parseInt(body.tutorId, 10);

  if (!Number.isInteger(tutorId) || tutorId <= 0) {
    return NextResponse.json({ error: "Invalid tutor id" }, { status: 400 });
  }

  const [tutor] = await query(
    "SELECT id, first_name, last_name, email FROM tutors WHERE id = ?",
    [tutorId]
  );
  if (!tutor) return NextResponse.json({ error: "Tutor not found" }, { status: 404 });

  const adminName = admin?.username || "administrator";

  await query(
    `INSERT INTO tutor_impersonation_log (admin_id, admin_name, tutor_id, ip)
     VALUES (?, ?, ?, ?)`,
    [admin?.id ?? null, adminName, tutorId, clientIp(req)]
  );

  await setTutorCookie({
    tutorId: tutor.id,
    email: tutor.email,
    impersonatedBy: admin?.id ?? null,
    impersonatorName: adminName,
  });

  return NextResponse.json({
    ok: true,
    tutor: { id: tutor.id, name: [tutor.first_name, tutor.last_name].filter(Boolean).join(" ").trim() },
    redirectTo: "/tutor/dashboard",
  });
});

/** Leave the impersonated session. The admin cookie was never touched. */
export const DELETE = requireAdmin(async (_req, _ctx, admin) => {
  await query(
    `UPDATE tutor_impersonation_log SET ended_at = NOW()
     WHERE admin_name = ? AND ended_at IS NULL
     ORDER BY started_at DESC LIMIT 1`,
    [admin?.username || "administrator"]
  );

  clearTutorCookie();
  return NextResponse.json({ ok: true });
});
