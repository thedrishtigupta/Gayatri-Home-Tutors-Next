// app/api/admin/tutors/facets/route.js
//
// Dropdown options are derived from live tutor data and normalised through the
// shared FACET_CONFIG (lib/facetNormalizer.js), so "math", "Maths" and
// "MATHEMATICS" collapse into a single "Mathematics" option.
// Database values are never modified.

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { buildFacets } from "@/lib/facetNormalizer";

export const GET = requireAdmin(async () => {
  const rows = await query(
    "SELECT subjects, areas, classes_taught FROM tutors LIMIT 5000"
  );

  // → { subjects: [], areas: [], classes: [] }
  return NextResponse.json(buildFacets(rows));
});
