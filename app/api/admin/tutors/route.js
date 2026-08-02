// app/api/admin/tutors/route.js

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/admin/tutors?subject=Maths&area=Rohini&status=active&gender=Female&minExp=2&class=9th
export const GET = requireAdmin(async (req) => {
  const p = new URL(req.url).searchParams;
  const subject  = p.get("subject");
  const area     = p.get("area");
  const status   = p.get("status");
  const gender   = p.get("gender");
  const minExp   = p.get("minExp");
  const cls      = p.get("class");
  const search   = p.get("search");
  const featured = p.get("featured");

  let sql = "SELECT * FROM tutors WHERE 1=1";
  const params = [];

  if (subject)  { sql += " AND FIND_IN_SET(?, REPLACE(subjects, ', ', ','))";   params.push(subject); }
  if (area)     { sql += " AND areas LIKE ?";                                    params.push(`%${area}%`); }
  if (status)   { sql += " AND status = ?";                                      params.push(status); }
  if (gender)   { sql += " AND gender = ?";                                      params.push(gender); }
  if (minExp)   { sql += " AND experience_years >= ?";                           params.push(parseInt(minExp)); }
  if (cls)      { sql += " AND classes_taught LIKE ?";                           params.push(`%${cls}%`); }
  if (featured) { sql += " AND featured = 1"; }
  if (search)   {
    sql += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR whatsapp LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += " ORDER BY success_rate DESC, total_classes_accepted DESC LIMIT 500";

  const rows = await query(sql, params);
  return NextResponse.json(rows);
});
