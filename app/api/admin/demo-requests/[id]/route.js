
// app/api/admin/demo-requests/[id]/route.js

import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// Statuses in which the request already counts as "assigned" to a tutor.
const ASSIGNED_STATES = ["assigned", "reassigned", "accepted", "rejected_by_tutor"];

function parseId(raw) {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

// PATCH /api/admin/demo-requests/:id
// Body: { action: "assign"|"accept"|"reject"|"reassign"|"drop"|"cancel", tutorId?, reason? }
export const PATCH = requireAdmin(async (req, { params }, user) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { action, tutorId, reason } = await req.json();

  const [dr] = await query("SELECT * FROM demo_requests WHERE id = ?", [id]);
  if (!dr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // accept / reject act on the tutor currently holding the request — bail out
  // early instead of running UPDATEs against `tutor_id = NULL`, which used to
  // match zero rows and report success.
  if (["accept", "reject"].includes(action) && !dr.assigned_tutor_id) {
    return NextResponse.json(
      { error: "This request has no assigned tutor yet" },
      { status: 400 }
    );
  }

  // Every action below writes to 2–3 tables; without a transaction a mid-way
  // failure left demo_requests, class_assignments and the tutor counters
  // permanently out of sync.
  try {
    await withTransaction(async (tx) => {
      const assignTo = async (nextStatus, newTutorId) => {
        const [tutor] = await tx.query("SELECT id FROM tutors WHERE id = ?", [newTutorId]);
        if (!tutor) {
          const e = new Error("Tutor not found");
          e.status = 400;
          throw e;
        }

        // Reassigning away from a tutor must give that tutor their assignment
        // count back, otherwise their success_rate is permanently depressed.
        if (dr.assigned_tutor_id && dr.assigned_tutor_id !== newTutorId &&
            ASSIGNED_STATES.includes(dr.assignment_status)) {
          await tx.execute(
            `UPDATE tutors SET total_classes_assigned = GREATEST(total_classes_assigned - 1, 0)
             WHERE id = ?`,
            [dr.assigned_tutor_id]
          );
        }

        await tx.execute(
          `UPDATE demo_requests SET assignment_status=?,
           assigned_tutor_id=?, assigned_at=NOW(), responded_at=NULL,
           rejection_reason=NULL, updated_at=NOW() WHERE id=?`,
          [nextStatus, newTutorId, id]
        );
        await tx.execute(
          `INSERT INTO class_assignments (demo_request_id, tutor_id, assigned_by, status)
           VALUES (?, ?, ?, 'assigned')`,
          [id, newTutorId, user.id]
        );
        // Re-assigning to the same tutor must not inflate their counter twice.
        if (dr.assigned_tutor_id !== newTutorId) {
          await tx.execute(
            "UPDATE tutors SET total_classes_assigned = total_classes_assigned + 1 WHERE id = ?",
            [newTutorId]
          );
        }
      };

      switch (action) {
        case "assign":
        case "reassign": {
          if (!tutorId) {
            const e = new Error("tutorId required");
            e.status = 400;
            throw e;
          }
          await assignTo(action === "assign" ? "assigned" : "reassigned", Number(tutorId));
          break;
        }
        case "accept": {
          await tx.execute(
            `UPDATE demo_requests SET assignment_status='accepted',
             responded_at=NOW(), updated_at=NOW() WHERE id=?`,
            [id]
          );
          await tx.execute(
            `UPDATE class_assignments SET status='accepted', responded_at=NOW()
             WHERE demo_request_id=? AND tutor_id=? ORDER BY assigned_at DESC LIMIT 1`,
            [id, dr.assigned_tutor_id]
          );
          // Guard against double-counting: pressing "Accept" twice used to add
          // two accepted classes and push success_rate over 100%.
          if (dr.assignment_status !== "accepted") {
            await tx.execute(
              "UPDATE tutors SET total_classes_accepted = total_classes_accepted + 1 WHERE id = ?",
              [dr.assigned_tutor_id]
            );
          }
          break;
        }
        case "reject": {
          await tx.execute(
            `UPDATE demo_requests SET assignment_status='rejected_by_tutor',
             rejection_reason=?, responded_at=NOW(), updated_at=NOW() WHERE id=?`,
            [reason || null, id]
          );
          await tx.execute(
            `UPDATE class_assignments SET status='rejected', rejection_reason=?, responded_at=NOW()
             WHERE demo_request_id=? AND tutor_id=? ORDER BY assigned_at DESC LIMIT 1`,
            [reason || null, id, dr.assigned_tutor_id]
          );
          // An accepted class that is later rejected must release the credit.
          if (dr.assignment_status === "accepted") {
            await tx.execute(
              `UPDATE tutors SET total_classes_accepted = GREATEST(total_classes_accepted - 1, 0)
               WHERE id = ?`,
              [dr.assigned_tutor_id]
            );
          }
          break;
        }
        case "drop": {
          await tx.execute(
            `UPDATE demo_requests SET assignment_status='dropped',
             rejection_reason=?, updated_at=NOW() WHERE id=?`,
            [reason || null, id]
          );
          if (dr.assigned_tutor_id) {
            await tx.execute(
              `UPDATE class_assignments SET status='dropped'
               WHERE demo_request_id=? ORDER BY assigned_at DESC LIMIT 1`,
              [id]
            );
            if (dr.assignment_status === "accepted") {
              await tx.execute(
                `UPDATE tutors SET total_classes_accepted = GREATEST(total_classes_accepted - 1, 0)
                 WHERE id = ?`,
                [dr.assigned_tutor_id]
              );
            }
          }
          break;
        }
        case "cancel": {
          await tx.execute(
            `UPDATE demo_requests SET assignment_status='cancelled',
             rejection_reason=?, updated_at=NOW() WHERE id=?`,
            [reason || null, id]
          );
          break;
        }
        default: {
          const e = new Error("Unknown action");
          e.status = 400;
          throw e;
        }
      }
    });
  } catch (err) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const [updated] = await query("SELECT * FROM demo_requests WHERE id = ?", [id]);
  return NextResponse.json({ ok: true, data: updated });
});

// GET single demo request
export const GET = requireAdmin(async (_req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [row] = await query(
    `SELECT dr.*, t.first_name AS tutor_first, t.last_name AS tutor_last,
            t.whatsapp AS tutor_whatsapp, t.email AS tutor_email
     FROM demo_requests dr
     LEFT JOIN tutors t ON t.id = dr.assigned_tutor_id
     WHERE dr.id = ?`,
    [id]
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
});