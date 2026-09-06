// lib/tutorAuth.js — sessions and credentials for the tutor panel.
//
// Deliberately independent of lib/auth.js: a different cookie, a different JWT
// audience and a different wrapper. An admin token must never authenticate a
// tutor request, and a tutor token must never reach an admin route, even if one
// is somehow presented to the other.

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { query } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-gayatri-home-tutors"
);

export const TUTOR_COOKIE = "ght_tutor_token";
const AUDIENCE = "tutor-panel";
const MAX_AGE = 60 * 60 * 24 * 7; // a week
const IMPERSONATION_MAX_AGE = 60 * 30; // 30 minutes

/* ── passwords ───────────────────────────────────────────────────── */

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

/** Minimum bar for a tutor password. Returns an error string, or null. */
export function passwordProblem(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 200) return "Password is too long.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}

/* ── tokens for email links ──────────────────────────────────────── */

/**
 * A single-use link token. The raw value goes in the email; only its SHA-256
 * is stored, so a leaked database cannot be replayed to seize accounts.
 */
export function createToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

/* ── session ─────────────────────────────────────────────────────── */

export async function setTutorCookie({ tutorId, email, impersonatedBy = null, impersonatorName = null }) {
  // An impersonated session is short-lived and read-only: it exists so an admin
  // can see the panel through the tutor's eyes, not act as them.
  const impersonating = Boolean(impersonatedBy || impersonatorName);
  const lifetime = impersonating ? IMPERSONATION_MAX_AGE : MAX_AGE;

  const token = await new SignJWT({
    tutorId,
    email,
    ...(impersonating ? { impersonatedBy, impersonatorName, readOnly: true } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience(AUDIENCE)
    .setExpirationTime(impersonating ? "30m" : "7d")
    .sign(SECRET);

  cookies().set(TUTOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: lifetime,
    path: "/",
  });

  return token;
}

export function clearTutorCookie() {
  cookies().delete(TUTOR_COOKIE);
}

/** Decoded tutor session, or null. Verifies the audience claim. */
export async function getTutorSession() {
  try {
    const token = cookies().get(TUTOR_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET, { audience: AUDIENCE });
    return payload?.tutorId ? payload : null;
  } catch {
    return null;
  }
}

/**
 * The signed-in tutor with their account row, or null.
 * Re-read on every request so a suspension takes effect immediately rather
 * than when the week-long cookie happens to expire.
 */
export async function getTutorUser() {
  const session = await getTutorSession();
  if (!session) return null;

  // LEFT JOIN, because an admin can preview the panel for a tutor who has not
  // signed up yet — there is no account row in that case.
  const rows = await query(
    `SELECT t.id, t.first_name, t.last_name, t.email, t.status AS tutor_status,
            a.id AS account_id, a.status AS account_status
     FROM tutors t
     LEFT JOIN tutor_accounts a ON a.tutor_id = t.id
     WHERE t.id = ?`,
    [session.tutorId]
  );

  const user = rows[0];
  if (!user) return null;

  if (session.impersonatedBy || session.readOnly) {
    return {
      ...user,
      impersonation: {
        by: session.impersonatedBy ?? null,
        byName: session.impersonatorName ?? "an administrator",
        readOnly: true,
      },
    };
  }

  // A real tutor session needs a live, active account. Re-checked on every
  // request so a suspension takes effect at once, not when the cookie expires.
  if (user.account_status !== "active") return null;
  return { ...user, impersonation: null };
}

/**
 * Wrap a tutor API route so it only runs for a signed-in, active tutor.
 * Mirrors requireAdmin: guarantees a JSON body on every path, so a thrown
 * driver error cannot reach the browser as an empty 500.
 *
 *   export const GET = requireTutor(async (req, ctx, tutor) => { ... });
 */
export function requireTutor(handler) {
  return async function (req, ctx) {
    try {
      const tutor = await getTutorUser();
      if (!tutor) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
      }

      // An impersonating admin may look, never touch. Acting as the tutor would
      // put words in their mouth and produce a change request the same admin
      // then approves. Admins edit tutors directly at /admin/tutors/[id].
      if (tutor.impersonation?.readOnly && req.method !== "GET" && req.method !== "HEAD") {
        return NextResponse.json(
          {
            error:
              "You are viewing this profile as an administrator, so it is read-only. Edit the tutor from the admin panel instead.",
          },
          { status: 403 }
        );
      }

      return await handler(req, ctx, tutor);
    } catch (err) {
      console.error("[tutor api]", req?.method, req?.url, err);
      return NextResponse.json(
        {
          error: "Server error",
          detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
        },
        { status: 500 }
      );
    }
  };
}

/* ── rate limiting ───────────────────────────────────────────────── */

const LOCK_AFTER = 5;
const LOCK_MINUTES = 15;

export function isLocked(account) {
  return Boolean(account?.locked_until && new Date(account.locked_until) > new Date());
}

export async function recordFailedLogin(accountId) {
  await query(
    `UPDATE tutor_accounts
     SET failed_attempts = failed_attempts + 1,
         locked_until = CASE WHEN failed_attempts + 1 >= ?
                             THEN DATE_ADD(NOW(), INTERVAL ? MINUTE)
                             ELSE locked_until END
     WHERE id = ?`,
    [LOCK_AFTER, LOCK_MINUTES, accountId]
  );
}

export async function recordSuccessfulLogin(accountId) {
  await query(
    "UPDATE tutor_accounts SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?",
    [accountId]
  );
}

/** Absolute URL for links in outbound email. */
export function siteUrl(pathname = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${pathname}`;
}
