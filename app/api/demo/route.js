// app/api/demo/route.js — POST: submit a new demo request

import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      fullName, email, phone, studentClass,
      time, subjects, area, message,
      source = "web_form",
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full name and phone are required" },
        { status: 400 }
      );
    }

    const subjectsJson = Array.isArray(subjects)
      ? JSON.stringify(subjects)
      : subjects || "[]";

    const result = await execute(
      `INSERT INTO demo_requests
         (full_name, email, phone, student_class, preferred_time, subjects, area, message, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullName, email || null, phone, studentClass || null,
       time || "Any", subjectsJson, area || null, message || null, source]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (err) {
    console.error("[demo POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
