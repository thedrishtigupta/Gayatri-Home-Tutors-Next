// // middleware.js — runs on Edge; tracks page views + protects /admin/*

// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// const SECRET = new TextEncoder().encode(
//   process.env.JWT_SECRET || "change-me-in-production-gayatri-home-tutors"
// );

// export async function middleware(request) {
//   const { pathname } = request.nextUrl;

//   // ── 1. Track public page views (skip API, _next, static) ──────
//   if (
//     !pathname.startsWith("/api/") &&
//     !pathname.startsWith("/_next/") &&
//     !pathname.startsWith("/admin") &&
//     !pathname.includes(".")
//   ) {
//     // Fire-and-forget analytics via our own API route
//     // (Edge can't import mysql2, so we ping our API)
//     fetch(new URL("/api/analytics/track", request.url), {
//       method:  "POST",
//       headers: { "Content-Type": "application/json", "x-internal": "1" },
//       body:    JSON.stringify({ path: pathname }),
//     }).catch(() => {});
//   }

//   // ── 2. Protect /admin/* routes (except /admin/login) ──────────
//   if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
//     const token = request.cookies.get("ght_admin_token")?.value;
//     let valid = false;
//     if (token) {
//       try { await jwtVerify(token, SECRET); valid = true; } catch {}
//     }
//     if (!valid) {
//       const loginUrl = new URL("/admin/login", request.url);
//       loginUrl.searchParams.set("from", pathname);
//       return NextResponse.redirect(loginUrl);
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// };


// middleware.js — runs on Edge; tracks page views + protects /admin/*

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-gayatri-home-tutors"
);

export async function middleware(request, event) {
  const { pathname } = request.nextUrl;

  // ── 1. Track public page views (skip API, _next, static) ──────
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/admin") &&
    !pathname.includes(".")
  ) {
    // Fire-and-forget analytics via our own API route
    // (Edge can't import mysql2, so we ping our API)
    // waitUntil keeps the request alive after the response is returned —
    // a bare floating fetch() was frequently killed and the visit lost.
    const track = fetch(new URL("/api/analytics/track", request.url), {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal":   process.env.ANALYTICS_INTERNAL_TOKEN || "1",
      },
      body:    JSON.stringify({ path: pathname }),
    }).catch(() => {});

    if (event?.waitUntil) event.waitUntil(track);
  }

  // ── 2. Protect /admin/* routes (except /admin/login) ──────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("ght_admin_token")?.value;
    let valid = false;
    if (token) {
      try { await jwtVerify(token, SECRET); valid = true; } catch {}
    }
    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes and static assets entirely — the middleware did no work for
  // them but still ran on every request (including the analytics ping itself).
  matcher: ["/((?!api/|_next/static|_next/image|assets/|favicon.ico).*)"],
};