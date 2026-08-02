// // app/api/tutors/featured/route.js — public endpoint for Our Expert Tutors page

// import { NextResponse } from "next/server";
// import { query } from "@/lib/db";

// export async function GET() {
//   const tutors = await query(
//     `SELECT id, first_name, last_name, qualification, subjects,
//             classes_taught, areas, experience_years, success_rate,
//             total_classes_accepted, profile_image
//      FROM tutors
//      WHERE featured = 1 AND status = 'active' AND verified = 1
//      ORDER BY success_rate DESC, total_classes_accepted DESC
//      LIMIT 12`
//   );
//   return NextResponse.json(tutors);
// }

// app/api/tutors/featured/route.js — public endpoint for Our Expert Tutors page

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const tutors = await query(
      `SELECT id, first_name, last_name, qualification, subjects,
              classes_taught, areas, experience_years, success_rate,
              total_classes_accepted, profile_image
       FROM tutors
       WHERE featured = 1 AND status = 'active' AND verified = 1
       ORDER BY success_rate DESC, total_classes_accepted DESC
       LIMIT 12`
    );
    return NextResponse.json(tutors);
  } catch (err) {
    // Without this the public page received an empty 500 body and crashed on
    // res.json(). An empty list degrades gracefully instead.
    console.error("[tutors/featured GET]", err);
    return NextResponse.json([], { status: 200 });
  }
}
