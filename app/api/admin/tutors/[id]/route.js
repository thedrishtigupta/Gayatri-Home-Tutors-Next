// // app/api/admin/tutors/[id]/route.js

// import { NextResponse } from "next/server";
// import { query, execute } from "@/lib/db";
// import { requireAdmin } from "@/lib/adminAuth";

// export const GET = requireAdmin(async (_req, { params }) => {
//   const [tutor] = await query("SELECT * FROM tutors WHERE id = ?", [parseInt(params.id)]);
//   if (!tutor) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   return NextResponse.json(tutor);
// });

// // PATCH — update status, verified, featured, commission_plan
// export const PATCH = requireAdmin(async (req, { params }) => {
//   const id = parseInt(params.id);
//   const body = await req.json();
//   const allowed = ["status", "verified", "featured", "commission_plan", "profile_image"];
//   const sets = [];
//   const vals = [];

//   for (const key of allowed) {
//     if (key in body) { sets.push(`${key} = ?`); vals.push(body[key]); }
//   }
//   if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

//   vals.push(id);
//   await execute(`UPDATE tutors SET ${sets.join(", ")}, updated_at=NOW() WHERE id = ?`, vals);
//   const [updated] = await query("SELECT * FROM tutors WHERE id = ?", [id]);
//   return NextResponse.json({ ok: true, data: updated });
// });

// export const DELETE = requireAdmin(async (_req, { params }) => {
//   await execute("DELETE FROM tutors WHERE id = ?", [parseInt(params.id)]);
//   return NextResponse.json({ ok: true });
// });

// app/api/admin/tutors/[id]/route.js

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

const STATUSES = ["pending", "active", "inactive", "blacklisted"];
const PLANS    = ["A", "B"];

function parseId(raw) {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function toBit(value) {
  return value === 1 || value === true || value === "1" || value === "true" ? 1 : 0;
}

export const GET = requireAdmin(async (_req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [tutor] = await query("SELECT * FROM tutors WHERE id = ?", [id]);
  if (!tutor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tutor);
});

// PATCH — update status, verified, featured, commission_plan
export const PATCH = requireAdmin(async (req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();
  const sets = [];
  const vals = [];

  // Values were previously forwarded to MySQL unchecked: a bad enum aborted the
  // query and the route answered with an empty 500.
  if ("status" in body) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    sets.push("status = ?"); vals.push(body.status);
  }
  if ("commission_plan" in body) {
    if (!PLANS.includes(body.commission_plan)) {
      return NextResponse.json({ error: `Invalid commission_plan: ${body.commission_plan}` }, { status: 400 });
    }
    sets.push("commission_plan = ?"); vals.push(body.commission_plan);
  }
  if ("verified" in body) { sets.push("verified = ?"); vals.push(toBit(body.verified)); }
  if ("featured" in body) { sets.push("featured = ?"); vals.push(toBit(body.featured)); }
  if ("profile_image" in body) {
    sets.push("profile_image = ?");
    vals.push(body.profile_image ? String(body.profile_image).slice(0, 255) : null);
  }

  if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  vals.push(id);
  const result = await execute(`UPDATE tutors SET ${sets.join(", ")}, updated_at=NOW() WHERE id = ?`, vals);
  if (!result.affectedRows) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await query("SELECT * FROM tutors WHERE id = ?", [id]);
  return NextResponse.json({ ok: true, data: updated });
});

export const DELETE = requireAdmin(async (_req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const result = await execute("DELETE FROM tutors WHERE id = ?", [id]);
  if (!result.affectedRows) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
});