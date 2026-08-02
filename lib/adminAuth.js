// // lib/adminAuth.js — middleware wrapper for admin API routes

// import { getAuthUser } from "./auth";
// import { NextResponse } from "next/server";

// /**
//  * Wrap an API route handler to require admin auth.
//  * Usage:
//  *   export const GET = requireAdmin(async (req, ctx, user) => { ... });
//  */
// export function requireAdmin(handler) {
//   return async function (req, ctx) {
//     const user = await getAuthUser();
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     return handler(req, ctx, user);
//   };
// }

// lib/adminAuth.js — middleware wrapper for admin API routes

import { getAuthUser } from "./auth";
import { NextResponse } from "next/server";

/**
 * Wrap an API route handler to require admin auth.
 *
 * Also guarantees a JSON body on every code path. Without this, an unhandled
 * throw (a MySQL error, a bad enum value, a dropped connection) makes Next
 * return a 500 with an EMPTY body, and the browser's `await res.json()`
 * blows up with "Unexpected end of JSON input" instead of showing the
 * real problem.
 *
 * Usage:
 *   export const GET = requireAdmin(async (req, ctx, user) => { ... });
 */
export function requireAdmin(handler) {
  return async function (req, ctx) {
    try {
      const user = await getAuthUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return await handler(req, ctx, user);
    } catch (err) {
      console.error("[admin api]", req?.method, req?.url, err);
      return NextResponse.json(
        {
          error: "Server error",
          // Surfaced in dev only so the actual SQL/driver message is visible.
          detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
        },
        { status: 500 }
      );
    }
  };
}