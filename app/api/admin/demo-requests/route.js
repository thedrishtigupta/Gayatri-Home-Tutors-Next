// app/api/admin/demo-requests/route.js

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/admin/demo-requests?status=pending&search=xyz
export const GET = requireAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let sql = `
    SELECT dr.*,
           t.first_name AS tutor_first, t.last_name AS tutor_last,
           t.whatsapp AS tutor_whatsapp
    FROM demo_requests dr
    LEFT JOIN tutors t ON t.id = dr.assigned_tutor_id
    WHERE 1=1
  `;
  const params = [];

  if (status) { sql += " AND dr.assignment_status = ?"; params.push(status); }
  if (search) {
    sql += " AND (dr.full_name LIKE ? OR dr.phone LIKE ? OR dr.area LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += " ORDER BY dr.created_at DESC LIMIT 200";
  const rows = await query(sql, params);
  return NextResponse.json(rows);
});
