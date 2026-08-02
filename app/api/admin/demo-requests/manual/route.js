// app/api/admin/demo-requests/manual/route.js
// POST: admin manually logs a demo request received via call/email/walk-in

import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export const POST = requireAdmin(async (req) => {
  try {
    const b = await req.json();
    const {
      fullName, phone, email, studentClass,
      time, subjects, area, message,
      source = "call", notes,
    } = b;

    if (!fullName || !phone) {
      return NextResponse.json({ error: "fullName and phone required" }, { status: 400 });
    }

    const subjectsJson = Array.isArray(subjects)
      ? JSON.stringify(subjects)
      : JSON.stringify(subjects ? [subjects] : []);

    const result = await execute(
      `INSERT INTO demo_requests
         (full_name, email, phone, student_class, preferred_time,
          subjects, area, message, source, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        fullName, email || null, phone,
        studentClass || null, time || "Any",
        subjectsJson, area || null, message || null,
        source, notes || null,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (err) {
    console.error("[manual demo POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});
