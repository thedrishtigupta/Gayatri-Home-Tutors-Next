// app/api/admin/analytics/route.js — dashboard aggregate stats

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// mysql2 returns COUNT()/SUM() as strings for BIGINT/DECIMAL.
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
    // ----------------------------------------------------------
    // TUTORS
    // ----------------------------------------------------------
    query(`
      SELECT COUNT(*) AS count
      FROM tutors
    `),

    query(`
      SELECT status, COUNT(*) AS count
      FROM tutors
      GROUP BY status
    `),

    // ----------------------------------------------------------
    // DEMO REQUESTS
    // ----------------------------------------------------------
    query(`
      SELECT COUNT(*) AS count
      FROM demo_requests
    `),

    query(`
      SELECT assignment_status AS status, COUNT(*) AS count
      FROM demo_requests
      GROUP BY assignment_status
    `),

    // ----------------------------------------------------------
    // CLASS ASSIGNMENTS
    // ----------------------------------------------------------
    query(`
      SELECT status, COUNT(*) AS count
      FROM class_assignments
      GROUP BY status
    `),

    // ----------------------------------------------------------
    // TOP TUTORS
    //
    // v3 no longer stores subjects directly on tutors and does
    // not have the old success-rate / assignment counters.
    //
    // We therefore calculate:
    //   - subjects from tutor_teaching_profiles
    //   - experience from teaching_start_year
    //
    // Ranking:
    //   1. verified
    //   2. profile completed
    //   3. experience
    // ----------------------------------------------------------
    query(`
      SELECT
        t.id,
        t.first_name,
        t.last_name,

        COALESCE(
          GROUP_CONCAT(
            DISTINCT s.name
            ORDER BY s.name
            SEPARATOR ', '
          ),
          ''
        ) AS subjects,

        CASE
          WHEN t.teaching_start_year IS NULL THEN 0
          WHEN t.teaching_start_year > YEAR(CURDATE()) THEN 0
          ELSE YEAR(CURDATE()) - t.teaching_start_year
        END AS experience_years,

        t.verified,
        t.profile_completed

      FROM tutors t

      LEFT JOIN tutor_teaching_profiles ttp
        ON ttp.tutor_id = t.id

      LEFT JOIN subjects s
        ON s.id = ttp.subject_id

      GROUP BY
        t.id,
        t.first_name,
        t.last_name,
        t.teaching_start_year,
        t.verified,
        t.profile_completed

      ORDER BY
        t.verified DESC,
        t.profile_completed DESC,
        experience_years DESC,
        t.id DESC

      LIMIT 10
    `),

    // ----------------------------------------------------------
    // PAGE VIEWS
    // ----------------------------------------------------------
    query(`
      SELECT COALESCE(SUM(visits), 0) AS total
      FROM page_views
    `),

    query(`
      SELECT
        path,
        SUM(visits) AS visits
      FROM page_views
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY path
      ORDER BY visits DESC
      LIMIT 10
    `),
  ]);

  const assignments = countsByKey(assignmentStatus, "status");

  return NextResponse.json({
    tutors: {
      total: num(tutorTotal[0]?.count),
      byStatus: countsByKey(tutorStatus, "status"),
    },

    demoRequests: {
      total: num(demoTotal[0]?.count),
      byStatus: countsByKey(demoStatus, "status"),
    },

    assignments: {
      ...assignments,
      accepted: assignments.accepted ?? 0,
      dropped: assignments.dropped ?? 0,
    },

    topTutors: topTutors.map((t) => ({
      id: t.id,
      first_name: t.first_name,
      last_name: t.last_name,
      subjects: t.subjects || "",
      experience_years: num(t.experience_years),
      verified: Boolean(t.verified),
      profile_completed: Boolean(t.profile_completed),

      // Kept for backwards compatibility with the existing
      // dashboard component. v3 does not currently calculate
      // success rate, so this is intentionally 0.
      total_classes_assigned: 0,
      total_classes_accepted: 0,
      success_rate: 0,
    })),

    pageViews: {
      totalAllTime: num(pvTotal[0]?.total),

      last30Days: pvLast30.map((r) => ({
        path: r.path,
        visits: num(r.visits),
      })),
    },
  });
});