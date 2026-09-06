// app/api/tutor/verify/route.js — consume an emailed verification link.

import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { hashToken } from "@/lib/tutorAuth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = String(body.token || "").trim();

    if (!raw) {
      return NextResponse.json({ error: "This confirmation link is not valid." }, { status: 400 });
    }

    const rows = await query(
      `SELECT k.id, k.tutor_id, k.used_at, k.expires_at,
              t.first_name, t.email,
              a.status AS account_status
       FROM tutor_auth_tokens k
       JOIN tutors t ON t.id = k.tutor_id
       LEFT JOIN tutor_accounts a ON a.tutor_id = k.tutor_id
       WHERE k.token_hash = ? AND k.purpose = 'verify_email'`,
      [hashToken(raw)]
    );

    const token = rows[0];

    if (!token) {
      return NextResponse.json(
        { error: "This confirmation link is not valid. It may already have been used." },
        { status: 400 }
      );
    }

    if (token.used_at) {
      // Already verified — say so plainly rather than treating it as an error;
      // mail clients pre-fetch links and users click twice.
      return NextResponse.json({
        ok: true,
        alreadyVerified: true,
        message: "Your email is already confirmed. You can sign in.",
      });
    }

    if (new Date(token.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This confirmation link has expired. Sign up again to get a new one." },
        { status: 410 }
      );
    }

    await withTransaction(async (tx) => {
      await tx.execute("UPDATE tutor_auth_tokens SET used_at = NOW() WHERE id = ?", [token.id]);
      await tx.execute(
        `UPDATE tutor_accounts
         SET status = 'active', email_verified_at = NOW()
         WHERE tutor_id = ? AND status = 'pending_verification'`,
        [token.tutor_id]
      );
    });

    return NextResponse.json({
      ok: true,
      message: "Your email is confirmed. You can sign in now.",
      name: token.first_name,
    });
  } catch (err) {
    console.error("[tutor/verify POST]", err);
    return NextResponse.json(
      {
        error: "Server error",
        detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
