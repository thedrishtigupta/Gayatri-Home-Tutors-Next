// app/api/tutor/login/route.js

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  isLocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  setTutorCookie,
  verifyPassword,
} from "@/lib/tutorAuth";

export const dynamic = "force-dynamic";

// One message for "no such account" and "wrong password" alike, so the form
// cannot be used to discover which addresses belong to tutors.
const BAD_CREDENTIALS = "Email or password is incorrect.";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const rows = await query(
      `SELECT t.id, t.first_name, t.email, t.status AS tutor_status,
              a.id AS account_id, a.password_hash, a.status AS account_status,
              a.failed_attempts, a.locked_until
       FROM tutors t
       JOIN tutor_accounts a ON a.tutor_id = t.id
       WHERE LOWER(t.email) = ?`,
      [email]
    );

    const account = rows[0];

    if (!account) {
      // Spend roughly the same time as a real check so timing does not reveal
      // whether the address exists.
      await verifyPassword(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
      return NextResponse.json({ error: BAD_CREDENTIALS }, { status: 401 });
    }

    if (isLocked(account)) {
      const minutes = Math.max(1, Math.ceil((new Date(account.locked_until) - Date.now()) / 60000));
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }

    const ok = await verifyPassword(password, account.password_hash);
    if (!ok) {
      await recordFailedLogin(account.account_id);
      return NextResponse.json({ error: BAD_CREDENTIALS }, { status: 401 });
    }

    if (account.account_status === "pending_verification") {
      return NextResponse.json(
        { error: "Please confirm your email first — check your inbox for the link we sent." },
        { status: 403 }
      );
    }

    if (account.account_status === "pending_approval") {
      return NextResponse.json(
        { error: "Your account is waiting for approval by an administrator." },
        { status: 403 }
      );
    }

    if (account.account_status === "suspended") {
      return NextResponse.json(
        { error: "This account has been suspended. Please contact the office." },
        { status: 403 }
      );
    }

    if (account.tutor_status === "blacklisted") {
      return NextResponse.json(
        { error: "This account cannot be used. Please contact the office." },
        { status: 403 }
      );
    }

    await recordSuccessfulLogin(account.account_id);
    await setTutorCookie({ tutorId: account.id, email: account.email });

    return NextResponse.json({ ok: true, name: account.first_name });
  } catch (err) {
    console.error("[tutor/login POST]", err);
    return NextResponse.json(
      {
        error: "Server error",
        detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
