
// app/admin/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminJson } from "@/lib/adminFetch";

function StatCard({ label, value, sub, color }) {
  return (
    <div className="admin-stat-card" style={{ borderTopColor: color }}>
      <div className="stat-value" style={{ color }}>{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    adminJson("/api/admin/analytics").then(({ ok, data, error }) => {
      if (ok) setData(data); else setError(error);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main"><div className="admin-loading">Loading dashboard…</div></main>
    </div>
  );

  // Previously this destructured `data` unconditionally; when the analytics
  // request failed, `data` stayed null and the whole dashboard crashed.
  if (!data) return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-error">Could not load dashboard{error ? `: ${error}` : ""}.</div>
      </main>
    </div>
  );

  const { tutors, demoRequests, assignments, topTutors, pageViews } = data;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-page-header">
          <h1>Dashboard</h1>
          <p>Overview of Gayatri Home Tutors</p>
        </div>

        {/* ── Key Stats ── */}
        <section className="admin-stats-grid">
          <StatCard label="Total Visitors"       value={pageViews.totalAllTime.toLocaleString()} color="var(--a-blue)"   />
          <StatCard label="Total Tutors"          value={tutors.total}                             color="var(--a-green)"  />
          <StatCard label="Active Tutors"         value={tutors.byStatus?.active ?? 0}             color="var(--a-green)"  sub="Verified & active" />
          <StatCard label="Pending Registrations" value={tutors.byStatus?.pending ?? 0}            color="var(--a-yellow)" sub="Awaiting review" />
          <StatCard label="Total Enquiries"       value={demoRequests.total}                       color="var(--a-purple)" />
          <StatCard label="Pending Assignment"    value={demoRequests.byStatus?.pending ?? 0}      color="var(--a-orange)" sub="Need tutor" />
          <StatCard label="Classes Accepted"      value={assignments.accepted ?? 0}                color="var(--a-green)"  sub="All time" />
          <StatCard label="Classes Dropped"       value={assignments.dropped ?? 0}                 color="var(--a-red)"    />
        </section>

        {/* ── Pipeline Breakdown ── */}
        <section className="admin-section">
          <h2>Enquiry Pipeline</h2>
          <div className="admin-pipeline">
            {[
              ["pending",           "⏳ Pending",            "var(--a-orange)"],
              ["assigned",          "📤 Assigned",           "var(--a-blue)"],
              ["accepted",          "✅ Accepted",           "var(--a-green)"],
              ["rejected_by_tutor", "❌ Rejected by Tutor",  "var(--a-red)"],
              ["reassigned",        "🔁 Reassigned",         "var(--a-purple)"],
              ["dropped",           "🗑 Dropped",            "var(--a-red)"],
              ["cancelled",         "⛔ Cancelled",          "var(--a-gray)"],
            ].map(([key, label, color]) => (
              <div key={key} className="pipeline-item">
                <span className="pipeline-dot" style={{ background: color }} />
                <span className="pipeline-label">{label}</span>
                <span className="pipeline-count" style={{ color }}>
                  {demoRequests.byStatus?.[key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Top Performers ── */}
        <section className="admin-section">
          <h2>🏆 Top Performing Tutors</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th><th>Name</th><th>Subjects</th>
                  <th>Assigned</th><th>Accepted</th><th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {topTutors.map((t, i) => (
                  <tr key={t.id}>
                    <td><span className="rank-badge">#{i + 1}</span></td>
                    <td><strong>{t.first_name} {t.last_name}</strong></td>
                    <td className="text-muted">{t.subjects?.split(",").slice(0,3).join(", ")}</td>
                    <td>{t.total_classes_assigned}</td>
                    <td>{t.total_classes_accepted}</td>
                    <td>
                      <span className="success-pill" style={{
                        background: t.success_rate >= 70 ? "var(--a-green-light)" : "var(--a-orange-light)",
                        color:      t.success_rate >= 70 ? "var(--a-green)"       : "var(--a-orange)",
                      }}>
                        {Number(t.success_rate).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {!topTutors.length && (
                  <tr><td colSpan={6} className="text-muted text-center">No data yet (min 3 assignments required)</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Page Views ── */}
        <section className="admin-section">
          <h2>📄 Top Pages (Last 30 Days)</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Page</th><th>Visits</th></tr></thead>
              <tbody>
                {pageViews.last30Days.map(r => (
                  <tr key={r.path}>
                    <td><code>{r.path}</code></td>
                    <td>{Number(r.visits).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}