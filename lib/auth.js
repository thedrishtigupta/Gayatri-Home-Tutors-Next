// lib/auth.js — JWT signing/verification + bcrypt helpers

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-gayatri-home-tutors"
);
const COOKIE_NAME = "ght_admin_token";
const MAX_AGE     = 60 * 60 * 24; // 24 hours

// ─── Password helpers ────────────────────────────────────────────
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ─── JWT helpers ─────────────────────────────────────────────────
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers (server-side) ────────────────────────────────
export async function setAuthCookie(payload) {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   MAX_AGE,
    path:     "/",
  });
  return token;
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
