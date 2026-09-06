// app/api/tutor/logout/route.js

import { NextResponse } from "next/server";
import { clearTutorCookie } from "@/lib/tutorAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  clearTutorCookie();
  return NextResponse.json({ ok: true });
}
