// // app/api/analytics/track/route.js — called by middleware to record page views

// import { NextResponse } from "next/server";
// import { execute } from "@/lib/db";

// export async function POST(req) {
//   // Only accept internal calls from our middleware
//   if (req.headers.get("x-internal") !== "1") {
//     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//   }

//   try {
//     const { path } = await req.json();
//     const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

//     await execute(
//       `INSERT INTO page_views (path, visits, date) VALUES (?, 1, ?)
//        ON DUPLICATE KEY UPDATE visits = visits + 1`,
//       [path || "/", today]
//     );
//     return NextResponse.json({ ok: true });
//   } catch {
//     return NextResponse.json({ ok: false });
//   }
// }


// app/api/analytics/track/route.js — called by middleware to record page views

import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

// A hardcoded "1" let anyone inflate the counters by POSTing this endpoint.
// Set ANALYTICS_INTERNAL_TOKEN to a random string in production.
const INTERNAL_TOKEN = process.env.ANALYTICS_INTERNAL_TOKEN || "1";

export async function POST(req) {
  // Only accept internal calls from our middleware
  if (req.headers.get("x-internal") !== INTERNAL_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { path } = await req.json();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    await execute(
      `INSERT INTO page_views (path, visits, date) VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE visits = visits + 1`,
      // path is VARCHAR(255); a longer URL aborted the INSERT under strict mode.
      [String(path || "/").slice(0, 255), today]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[analytics/track POST]", err);
    return NextResponse.json({ ok: false });
  }
}
