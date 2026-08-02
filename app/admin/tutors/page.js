// app/admin/tutors/page.js
"use client";

import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminFetch } from "@/lib/adminFetch";

const SUBJECTS = [
  "Mathematics","English","Science","Physics","Chemistry","Biology",
  "Social Studies","Hindi","Accounts","Economics","Business Studies","Computer Science",
];

const CLASSES = [
  "Class 1–5","Class 6–8","Class 9–10","Class 11–12","B.Com","B.Sc","B.A",
];

export default function TutorsPage() {
  const [tutors, setTutors]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "", subject: "", area: "", status: "",
    gender: "", minExp: "", class: "", featured: "",
  });
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) qs.set(k, v);
    });

    try {
      const res = await adminFetch(`/api/admin/tutors?${qs}`);
      if (!res.ok) {
        setTutors([]);
        return;
      }

      const data = await res.json();
      setTutors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tutors", err);
      setTutors([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }));
  }

  async function updateTutor(id, patch) {
    setUpdating(id);
    await adminFetch(`/api/admin/tutors/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(patch),
    });
    setUpdating(null);
    load();
  }

  async function deleteTutor(id, name) {
    if (!confirm(`Delete tutor ${name}? This cannot be undone.`)) return;
    await adminFetch(`/api/admin/tutors/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-page-header">
          <h1>Tutors</h1>
          <p>{tutors.length} tutor{tutors.length !== 1 ? "s" : ""} found</p>
        </div>

        {/* ── Filter Panel ── */}
        <div className="admin-filter-panel">
          <h3>🔍 Filter Tutors</h3>
          <div className="admin-filter-grid">
            <input
              className="admin-input"
              placeholder="Search name / phone / email…"
              value={filters.search}
              onChange={e => setFilter("search", e.target.value)}
            />
            <select className="admin-select" value={filters.subject} onChange={e => setFilter("subject", e.target.value)}>
              <option value="">All Subjects</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <input
              className="admin-input"
              placeholder="Area (e.g. Rohini, Pitampura)"
              value={filters.area}
              onChange={e => setFilter("area", e.target.value)}
            />
            <select className="admin-select" value={filters.status} onChange={e => setFilter("status", e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
            <select className="admin-select" value={filters.gender} onChange={e => setFilter("gender", e.target.value)}>
              <option value="">Any Gender</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
            <input
              className="admin-input"
              type="number"
              placeholder="Min experience (yrs)"
              value={filters.minExp}
              onChange={e => setFilter("minExp", e.target.value)}
              min={0}
            />
            <select className="admin-select" value={filters.class} onChange={e => setFilter("class", e.target.value)}>
              <option value="">Any Class</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="admin-select" value={filters.featured} onChange={e => setFilter("featured", e.target.value)}>
              <option value="">All</option>
              <option value="1">Featured Only</option>
            </select>
          </div>
          <div className="admin-filter-actions">
            <button className="admin-btn admin-btn-primary" onClick={load}>Apply Filters</button>
            <button className="admin-btn admin-btn-secondary" onClick={() => {
              setFilters({ search:"",subject:"",area:"",status:"",gender:"",minExp:"",class:"",featured:"" });
            }}>Clear</button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading tutors…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Contact</th><th>Subjects</th>
                  <th>Areas</th><th>Exp</th><th>Plan</th>
                  <th>Status</th><th>Featured</th><th>Verified</th>
                  <th>Success %</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tutors.map(t => (
                  <tr key={t.id}>
                    <td className="text-muted">{t.id}</td>
                    <td>
                      <strong>{t.first_name} {t.last_name}</strong>
                      <div className="text-muted" style={{fontSize:"12px"}}>{t.gender} · {t.qualification}</div>
                    </td>
                    <td>
                      <a href={`tel:${t.whatsapp}`}>{t.whatsapp}</a>
                      <div className="text-muted" style={{fontSize:"12px"}}>{t.email}</div>
                    </td>
                    <td className="text-muted" style={{fontSize:"12px", maxWidth:"140px"}}>
                      {t.subjects?.split(",").slice(0,4).join(", ")}
                    </td>
                    <td className="text-muted" style={{fontSize:"12px", maxWidth:"120px"}}>
                      {t.areas?.split(",").slice(0,3).join(", ")}
                    </td>
                    <td>{t.experience_years}y</td>
                    <td>
                      <span className={`plan-badge plan-${t.commission_plan?.toLowerCase()}`}>
                        Plan {t.commission_plan}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-select admin-select-sm"
                        value={t.status}
                        disabled={updating === t.id}
                        onChange={e => updateTutor(t.id, { status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="blacklisted">Blacklisted</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${t.featured ? "on" : "off"}`}
                        onClick={() => updateTutor(t.id, { featured: t.featured ? 0 : 1 })}
                        disabled={updating === t.id}
                        title={t.featured ? "Remove from featured" : "Add to featured"}
                      >{t.featured ? "⭐" : "☆"}</button>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${t.verified ? "on" : "off"}`}
                        onClick={() => updateTutor(t.id, { verified: t.verified ? 0 : 1 })}
                        disabled={updating === t.id}
                        title={t.verified ? "Unverify" : "Verify"}
                      >{t.verified ? "✅" : "⬜"}</button>
                    </td>
                    <td>
                      <span className="success-pill" style={{
                        background: t.success_rate >= 70 ? "#10b98122" : t.success_rate > 0 ? "#f59e0b22" : "#6b728022",
                        color:      t.success_rate >= 70 ? "#10b981"   : t.success_rate > 0 ? "#f59e0b"   : "#6b7280",
                      }}>
                        {t.total_classes_assigned > 0
                          ? `${Number(t.success_rate).toFixed(0)}%`
                          : "—"}
                      </span>
                      <div className="text-muted" style={{fontSize:"11px"}}>
                        {t.total_classes_accepted}/{t.total_classes_assigned}
                      </div>
                    </td>
                    <td>
                      <div className="action-group">
                        <select
                          className="admin-select admin-select-sm"
                          value={t.commission_plan || "B"}
                          onChange={e => updateTutor(t.id, { commission_plan: e.target.value })}
                          disabled={updating === t.id}
                        >
                          <option value="A">Plan A</option>
                          <option value="B">Plan B</option>
                        </select>
                        <button
                          className="admin-btn admin-btn-xs admin-btn-red"
                          onClick={() => deleteTutor(t.id, `${t.first_name} ${t.last_name}`)}
                        >🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!tutors.length && (
                  <tr><td colSpan={12} className="text-center text-muted">No tutors match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
