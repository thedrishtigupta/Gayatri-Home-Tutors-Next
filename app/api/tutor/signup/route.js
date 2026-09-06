// app/api/tutor/signup/route.js — a registered tutor claims their login.
//
// Accounts are never created from thin air: the email must already belong to
// exactly one tutor in the database. Tutors are added by the office, not here.

import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import {
  createToken,
  hashPassword,
  passwordProblem,
  siteUrl,
} from "@/lib/tutorAuth";
import { mailerConfigured, sendMail, verifyEmailTemplate } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const TOKEN_HOURS = 24;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const pwProblem = passwordProblem(password);
    if (pwProblem) return NextResponse.json({ error: pwProblem }, { status: 400 });

    const tutors = await query(
      `SELECT t.id, t.first_name, t.last_name, t.email, t.status,
              a.id AS account_id, a.status AS account_status
       FROM tutors t
       LEFT JOIN tutor_accounts a ON a.tutor_id = t.id
       WHERE LOWER(t.email) = ?`,
      [email]
    );

    if (tutors.length === 0) {
      return NextResponse.json(
        {
          error:
            "No tutor is registered with that email address. Please use the address you registered with, or contact the office on WhatsApp.",
        },
        { status: 404 }
      );
    }

    // Two tutors share this address, so it cannot identify one account. The
    // 004 migration adds a UNIQUE index once the last such pair is resolved;
    // this guard means an ambiguous address is refused either way.
    if (tutors.length > 1) {
      return NextResponse.json(
        {
          error:
            "That email address is registered to more than one tutor, so we cannot tell which account is yours. Please contact the office on WhatsApp to have it corrected.",
        },
        { status: 409 }
      );
    }

    const tutor = tutors[0];

    if (tutor.status === "blacklisted") {
      return NextResponse.json(
        { error: "This account cannot be used. Please contact the office." },
        { status: 403 }
      );
    }

    if (tutor.account_id && tutor.account_status === "active") {
      return NextResponse.json(
        { error: "An account already exists for this email. Try signing in, or reset your password." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const { raw, hash } = createToken();
    const canEmail = mailerConfigured();

    // Without a working mailer there is nothing to verify against, so the
    // request goes to the admin queue instead of leaving the tutor stranded.
    const status = canEmail ? "pending_verification" : "pending_approval";

    await withTransaction(async (tx) => {
      // Re-signup before verifying replaces the previous attempt, so a tutor
      // who mistyped their password is not locked out of trying again.
      await tx.execute(
        `INSERT INTO tutor_accounts (tutor_id, password_hash, status)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           status = VALUES(status),
           updated_at = NOW()`,
        [tutor.id, passwordHash, status]
      );

      await tx.execute(
        "DELETE FROM tutor_auth_tokens WHERE tutor_id = ? AND purpose = 'verify_email'",
        [tutor.id]
      );

      if (canEmail) {
        await tx.execute(
          `INSERT INTO tutor_auth_tokens (tutor_id, token_hash, purpose, expires_at)
           VALUES (?, ?, 'verify_email', DATE_ADD(NOW(), INTERVAL ? HOUR))`,
          [tutor.id, hash, TOKEN_HOURS]
        );
      }
    });

    if (!canEmail) {
      return NextResponse.json({
        ok: true,
        status: "pending_approval",
        message:
          "Your account request has been received. An administrator will review it shortly, and you can sign in once it is approved.",
      });
    }

    const template = verifyEmailTemplate({
      name: tutor.first_name,
      url: siteUrl(`/portal/verify?token=${raw}`),
      expiresHours: TOKEN_HOURS,
    });

    const sent = await sendMail({ to: tutor.email, ...template });

    if (!sent.ok) {
      // The account exists but the link never arrived. Route it to an admin so
      // a broken mailbox does not become a dead end.
      await query(
        "UPDATE tutor_accounts SET status = 'pending_approval' WHERE tutor_id = ?",
        [tutor.id]
      );
      return NextResponse.json({
        ok: true,
        status: "pending_approval",
        message:
          "Your account was created, but we could not send the confirmation email. An administrator will review your request instead.",
      });
    }

    return NextResponse.json({
      ok: true,
      status: "pending_verification",
      message: `We have sent a confirmation link to ${tutor.email}. Open it within ${TOKEN_HOURS} hours to finish setting up your account.`,
    });
  } catch (err) {
    console.error("[tutor/signup POST]", err);
    return NextResponse.json(
      {
        error: "Server error",
        detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
