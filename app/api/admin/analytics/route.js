
// app/api/admin/analytics/route.js — dashboard aggregate stats

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// mysql2 returns COUNT()/SUM() as strings for BIGINT/DECIMAL, so the dashboard
// was concatenating instead of adding ("12" + "7" -> "127"). Coerce here.
const num = (v) => (v == null ? 0 : Number(v) || 0);

function countsByKey(rows, key) {
  return rows.reduce((acc, r) => {
    acc[r[key]] = num(r.count);
    return acc;
  }, {});
}

export const GET = requireAdmin(async () => {
  const [
    tutorTotal,
    tutorStatus,
    demoTotal,
    demoStatus,
    assignmentStatus,
    topTutors,
    pvTotal,
    pvLast30,
  ] = await Promise.all([
    query("SELECT COUNT(*) AS count FROM tutors"),
    query("SELECT status, COUNT(*) AS count FROM tutors GROUP BY status"),
    query("SELECT COUNT(*) AS count FROM demo_requests"),
    query("SELECT assignment_status AS status, COUNT(*) AS count FROM demo_requests GROUP BY assignment_status"),
    query("SELECT status, COUNT(*) AS count FROM class_assignments GROUP BY status"),
    query(
      `SELECT id, first_name, last_name, subjects,
              total_classes_assigned, total_classes_accepted, success_rate
       FROM tutors
       WHERE total_classes_assigned >= 3
       ORDER BY success_rate DESC, total_classes_accepted DESC
       LIMIT 10`
    ),
    query("SELECT COALESCE(SUM(visits), 0) AS total FROM page_views"),
    query(
      `SELECT path, SUM(visits) AS visits
       FROM page_views
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY path
       ORDER BY visits DESC
       LIMIT 10`
    ),
  ]);

  const assignments = countsByKey(assignmentStatus, "status");

  return NextResponse.json({
    tutors: {
      total:    num(tutorTotal[0]?.count),
      byStatus: countsByKey(tutorStatus, "status"),
    },
    demoRequests: {
      total:    num(demoTotal[0]?.count),
      byStatus: countsByKey(demoStatus, "status"),
    },
    assignments: {
      ...assignments,
      accepted: assignments.accepted ?? 0,
      dropped:  assignments.dropped  ?? 0,
    },
    // success_rate is DECIMAL -> string; the dashboard calls .toFixed() on it.
    topTutors: topTutors.map((t) => ({
      ...t,
      total_classes_assigned: num(t.total_classes_assigned),
      total_classes_accepted: num(t.total_classes_accepted),
      success_rate:           num(t.success_rate),
    })),
    pageViews: {
      totalAllTime: num(pvTotal[0]?.total),
      last30Days:   pvLast30.map((r) => ({ path: r.path, visits: num(r.visits) })),
    },
  });
});