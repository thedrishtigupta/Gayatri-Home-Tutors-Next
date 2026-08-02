// // app/api/admin/analytics/route.js

// import { NextResponse } from "next/server";
// import { query } from "@/lib/db";
// import { requireAdmin } from "@/lib/adminAuth";

// export const GET = requireAdmin(async () => {
//   const [
//     tutorStats,
//     demoStats,
//     assignmentStats,
//     topTutors,
//     recentVisits,
//     totalVisits,
//   ] = await Promise.all([
//     // Tutor counts by status
//     query(`SELECT status, COUNT(*) AS count FROM tutors GROUP BY status`),

//     // Demo request counts by assignment_status
//     query(`SELECT assignment_status, COUNT(*) AS count FROM demo_requests GROUP BY assignment_status`),

//     // Assignment success metrics
//     query(`
//       SELECT
//         COUNT(*) AS total_assigned,
//         SUM(status = 'accepted') AS accepted,
//         SUM(status = 'rejected') AS rejected,
//         SUM(status = 'dropped')  AS dropped
//       FROM class_assignments
//     `),

//     // Top 10 tutors by success rate (min 3 assignments)
//     query(`
//       SELECT id, first_name, last_name, subjects, areas,
//              total_classes_assigned, total_classes_accepted, success_rate
//       FROM tutors
//       WHERE total_classes_assigned >= 3
//       ORDER BY success_rate DESC, total_classes_accepted DESC
//       LIMIT 10
//     `),

//     // Page views last 30 days
//     query(`
//       SELECT path, SUM(visits) AS visits
//       FROM page_views
//       WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
//       GROUP BY path
//       ORDER BY visits DESC
//       LIMIT 20
//     `),

//     // Total visits all time
//     query(`SELECT SUM(visits) AS total FROM page_views`),
//   ]);

//   // Reshape demo stats into a map
//   const demoMap = {};
//   for (const r of demoStats) demoMap[r.assignment_status] = Number(r.count);

//   // Reshape tutor stats
//   const tutorMap = {};
//   for (const r of tutorStats) tutorMap[r.status] = Number(r.count);

//   return NextResponse.json({
//     tutors: {
//       total:      Object.values(tutorMap).reduce((a, b) => a + b, 0),
//       byStatus:   tutorMap,
//     },
//     demoRequests: {
//       total:      Object.values(demoMap).reduce((a, b) => a + b, 0),
//       byStatus:   demoMap,
//     },
//     assignments:    assignmentStats[0] || {},
//     topTutors,
//     pageViews: {
//       totalAllTime: Number(totalVisits[0]?.total || 0),
//       last30Days:   recentVisits,
//     },
//   });
// });

// app/api/admin/analytics/route.js — dashboard aggregate stats

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

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