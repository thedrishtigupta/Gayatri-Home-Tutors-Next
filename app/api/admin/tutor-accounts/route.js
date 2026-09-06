// app/api/admin/tutor-accounts/route.js
//
// Tutor login accounts: listing, and approve / suspend / reactivate. Accounts
// land here when a tutor signs up but the verification email could not be sent,
// so an unreachable mailbox never becomes a dead end.

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { accountApprovedTemplate, sendMail } from "@/lib/mailer";
import { siteUrl } from "@/lib/tutorAuth";

export const dynamic = "force-dynamic";

const STATUSES = ["pending_verification", "pending_approval", "active", "suspended"];

export const GET = requireAdmin(async (req) => {
  const p = new URL(req.url).searchParams;
  const status = STATUSES.includes(p.get("status")) ? p.get("status") : null;

  const where = status ? "WHERE a.status = ?" : "";
  const params = status ? [status] : [];

  const accounts = await query(
    `SELECT a.id, a.tutor_id, a.status, a.email_verified_at, a.approved_at,
            a.last_login_at, a.created_at, a.locked_until, a.failed_attempts,
            t.first_name, t.last_name, t.email, t.whatsapp,
            t.status AS tutor_status, t.verified,
            u.username AS approved_by_name
     FROM tutor_accounts a
     JOIN tutors t ON t.id = a.tutor_id
     LEFT JOIN admin_users u ON u.id = a.approved_by
     ${where}
     ORDER BY a.created_at DESC
     LIMIT 200`,
    params
  );

  const counts = await query("SELECT status, COUNT(*) AS n FROM tutor_accounts GROUP BY status");

  return NextResponse.json({
    data: accounts,
    counts: Object.fromEntries(counts.map((r) => [r.status, Number(r.n)])),
  });
});

/**
 * PATCH body: { accountId, action: "approve" | "suspend" | "reactivate" | "unlock" }
 */
export const PATCH = requireAdmin(async (req, _ctx, admin) => {
  const body = await req.json().catch(() => ({}));
  const accountId = Number.parseInt(body.accountId, 10);
  const action = String(body.action || "");

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
  }

  const [account] = await query(
    `SELECT a.id, a.status, a.tutor_id, t.first_name, t.email
     FROM tutor_accounts a JOIN tutors t ON t.id = a.tutor_id
     WHERE a.id = ?`,
    [accountId]
  );
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  switch (action) {
    case "approve":
      await query(
        `UPDATE tutor_accounts
         SET status = 'active', approved_at = NOW(), approved_by = ?,
             email_verified_at = COALESCE(email_verified_at, NOW()),
             failed_attempts = 0, locked_until = NULL
         WHERE id = ?`,
        [admin?.id || null, accountId]
      );
      if (account.email) {
        await sendMail({
          to: account.email,
          ...accountApprovedTemplate({ name: account.first_name, url: siteUrl("/tutor/login") }),
        });
      }
      break;

    case "suspend":
      await query("UPDATE tutor_accounts SET status = 'suspended' WHERE id = ?", [accountId]);
      break;

    case "reactivate":
      await query(
        "UPDATE tutor_accounts SET status = 'active', failed_attempts = 0, locked_until = NULL WHERE id = ?",
        [accountId]
      );
      break;

    case "unlock":
      await query(
        "UPDATE tutor_accounts SET failed_attempts = 0, locked_until = NULL WHERE id = ?",
        [accountId]
      );
      break;

    default:
      return NextResponse.json({ error: `Unknown action "${action}".` }, { status: 400 });
  }

  const [updated] = await query("SELECT * FROM tutor_accounts WHERE id = ?", [accountId]);
  return NextResponse.json({ ok: true, data: updated });
});
