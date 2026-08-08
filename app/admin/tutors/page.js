// app/admin/tutors/page.js
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminJson } from "@/lib/adminFetch";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { successRateStyle } from "@/lib/statusColors";

const EMPTY_FILTERS = {
  search: "",
  subject: "",
  area: "",
  status: "",
  gender: "",
  minExp: "",
  class: "",
  featured: "",
};

const FILTER_LABELS = {
  search: "Search",
  subject: "Subject",
  area: "Area",
  status: "Status",
  gender: "Gender",
  minExp: "Min exp",
  class: "Class",
  featured: "Featured",
};

const PAGE_SIZE = 25;

function TableSkeleton() {
  return (
    <div className="admin-table-wrap" style={{ padding: 16 }} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading tutors…</span>
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="skeleton skeleton-row" key={i} />
      ))}
    </div>
  );
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [facets, setFacets] = useState({ subjects: [], areas: [], classes: [] });
  const [updating, setUpdating] = useState(null);

  // Typing in the search / area / experience boxes shouldn't fire a request
  // per keystroke.
  const debouncedFilters = useDebouncedValue(filters, 350);

  // Subject / class / area options come from the database, not a hardcoded list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { ok, data } = await adminJson("/api/admin/tutors/facets", {}, null);
      if (!cancelled && ok && data) {
        setFacets({
          subjects: data.subjects || [],
          areas: data.areas || [],
          classes: data.classes || [],
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const qs = new URLSearchParams();
    Object.entries(debouncedFilters).forEach(([k, v]) => {
      const value = typeof v === "string" ? v.trim() : v;
      if (value !== "" && value !== null && value !== undefined) qs.set(k, value);
    });
    qs.set("page", String(page));
    qs.set("limit", String(PAGE_SIZE));

    const { ok, data, error: err } = await adminJson(`/api/admin/tutors?${qs}`, {}, null);

    if (!ok) {
      setTutors([]);
      setTotal(0);
      setTotalPages(1);
      setError(err || "Could not load tutors");
    } else {
      // Accepts both the paginated shape and a bare array.
      const list = Array.isArray(data) ? data : data?.data || [];
      setTutors(list);
      setTotal(Array.isArray(data) ? list.length : Number(data?.total || list.length));
      setTotalPages(Array.isArray(data) ? 1 : Number(data?.totalPages || 1));
    }
    setLoading(false);
  }, [debouncedFilters, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  const activeFilters = useMemo(
    () => Object.entries(filters).filter(([, v]) => v !== ""),
    [filters]
  );

  function setFilter(key, val) {
    setFilters((f) => ({ ...f, [key]: val }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  async function updateTutor(id, patch) {
    setUpdating(id);
    // Optimistic update keeps the table from flashing on every toggle.
    setTutors((rows) => rows.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const { ok, error: err } = await adminJson(`/api/admin/tutors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setUpdating(null);
    if (!ok) setError(err || "Update failed");
    load();
  }

  async function deleteTutor(id, name) {
    if (!confirm(`Delete tutor ${name}? This cannot be undone.`)) return;
    setUpdating(id);
    const { ok, error: err } = await adminJson(`/api/admin/tutors/${id}`, { method: "DELETE" });
    setUpdating(null);
    if (!ok) setError(err || "Delete failed");
    load();
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <h1>Tutors</h1>
            <p>
              {loading
                ? "Loading…"
                : `${total} tutor${total !== 1 ? "s" : ""} found${
                    total > 0 ? ` · showing ${rangeStart}–${rangeEnd}` : ""
                  }`}
            </p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={load} disabled={loading}>
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div className="admin-alert admin-alert-error" role="alert">
            {error}
          </div>
        )}

        {/* ── Filter Panel ── */}
        <section className="admin-filter-panel" aria-label="Filter tutors">
          <h3>Filter tutors</h3>

          <div className="admin-filter-grid">
            <label className="admin-form-group">
              <span className="sr-only">Search tutors</span>
              <input
                className="admin-input"
                type="search"
                placeholder="Search name, subject, area, phone, email…"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </label>

            <select
              className="admin-select"
              aria-label="Subject"
              value={filters.subject}
              onChange={(e) => setFilter("subject", e.target.value)}
            >
              <option value="">All subjects</option>
              {facets.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              className="admin-input"
              list="tutor-areas"
              aria-label="Area"
              placeholder="Area (e.g. Rohini, Pitampura)"
              value={filters.area}
              onChange={(e) => setFilter("area", e.target.value)}
            />
            <datalist id="tutor-areas">
              {facets.areas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>

            <select
              className="admin-select"
              aria-label="Status"
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>

            <select
              className="admin-select"
              aria-label="Gender"
              value={filters.gender}
              onChange={(e) => setFilter("gender", e.target.value)}
            >
              <option value="">Any gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <input
              className="admin-input"
              type="number"
              aria-label="Minimum experience in years"
              placeholder="Min experience (yrs)"
              value={filters.minExp}
              onChange={(e) => setFilter("minExp", e.target.value)}
              min={0}
              max={99}
            />

            <select
              className="admin-select"
              aria-label="Class"
              value={filters.class}
              onChange={(e) => setFilter("class", e.target.value)}
            >
              <option value="">Any class</option>
              {facets.classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="admin-select"
              aria-label="Featured"
              value={filters.featured}
              onChange={(e) => setFilter("featured", e.target.value)}
            >
              <option value="">Featured &amp; non-featured</option>
              <option value="1">Featured only</option>
              <option value="0">Not featured</option>
            </select>
          </div>

          {activeFilters.length > 0 && (
            <div className="admin-filter-chips">
              {activeFilters.map(([key, value]) => (
                <span className="admin-chip" key={key}>
                  {FILTER_LABELS[key]}: {key === "featured" ? (value === "1" ? "Yes" : "No") : value}
                  <button
                    type="button"
                    aria-label={`Remove ${FILTER_LABELS[key]} filter`}
                    onClick={() => setFilter(key, "")}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="admin-filter-actions">
            <button className="admin-btn admin-btn-primary" onClick={load} disabled={loading}>
              Apply filters
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={clearFilters}
              disabled={activeFilters.length === 0}
            >
              Clear all
            </button>
          </div>
        </section>

        {loading ? (
          <TableSkeleton />
        ) : tutors.length === 0 ? (
          <div className="admin-table-wrap">
            <div className="admin-empty">
              <span className="admin-empty-icon" aria-hidden="true">
                🔎
              </span>
              <h3>No tutors match these filters</h3>
              <p>
                {activeFilters.length
                  ? "Try removing a filter or broadening your search."
                  : "No tutors have been added yet."}
              </p>
              {activeFilters.length > 0 && (
                <button className="admin-btn admin-btn-primary" onClick={clearFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption className="sr-only">Registered tutors</caption>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Subjects</th>
                    <th scope="col">Areas</th>
                    <th scope="col">Exp</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Status</th>
                    <th scope="col">Featured</th>
                    <th scope="col">Verified</th>
                    <th scope="col">Success %</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((t) => (
                    <tr key={t.id}>
                      <td className="text-muted">{t.id}</td>
                      <td>
                        <strong>
                          {t.first_name} {t.last_name}
                        </strong>
                        <div className="text-muted" style={{ fontSize: "12px" }}>
                          {[t.gender, t.qualification].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td>
                        <a href={`tel:${t.whatsapp}`}>{t.whatsapp}</a>
                        <div className="text-muted" style={{ fontSize: "12px" }}>
                          {t.email}
                        </div>
                      </td>
                      <td className="text-muted" style={{ fontSize: "12px", maxWidth: "160px" }}>
                        {t.subjects?.split(",").slice(0, 4).join(", ") || "—"}
                      </td>
                      <td className="text-muted" style={{ fontSize: "12px", maxWidth: "140px" }}>
                        {t.areas?.split(",").slice(0, 3).join(", ") || "—"}
                      </td>
                      <td>{t.experience_years || 0}y</td>
                      <td>
                        <span className={`plan-badge plan-${(t.commission_plan || "b").toLowerCase()}`}>
                          Plan {t.commission_plan || "B"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="admin-select admin-select-sm"
                          aria-label={`Status for ${t.first_name} ${t.last_name}`}
                          value={t.status || "pending"}
                          disabled={updating === t.id}
                          onChange={(e) => updateTutor(t.id, { status: e.target.value })}
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
                          aria-pressed={Boolean(t.featured)}
                          aria-label={
                            t.featured
                              ? `Remove ${t.first_name} from featured`
                              : `Add ${t.first_name} to featured`
                          }
                        >
                          {t.featured ? "⭐" : "☆"}
                        </button>
                      </td>
                      <td>
                        <button
                          className={`toggle-btn ${t.verified ? "on" : "off"}`}
                          onClick={() => updateTutor(t.id, { verified: t.verified ? 0 : 1 })}
                          disabled={updating === t.id}
                          aria-pressed={Boolean(t.verified)}
                          aria-label={t.verified ? `Unverify ${t.first_name}` : `Verify ${t.first_name}`}
                        >
                          {t.verified ? "✅" : "⬜"}
                        </button>
                      </td>
                      <td>
                        <span className="success-pill" style={successRateStyle(t.success_rate)}>
                          {t.total_classes_assigned > 0
                            ? `${Number(t.success_rate).toFixed(0)}%`
                            : "—"}
                        </span>
                        <div className="text-muted" style={{ fontSize: "11px" }}>
                          {t.total_classes_accepted}/{t.total_classes_assigned}
                        </div>
                      </td>
                      <td>
                        <div className="action-group">
                          <select
                            className="admin-select admin-select-sm"
                            aria-label={`Commission plan for ${t.first_name}`}
                            value={t.commission_plan || "B"}
                            onChange={(e) => updateTutor(t.id, { commission_plan: e.target.value })}
                            disabled={updating === t.id}
                          >
                            <option value="A">Plan A</option>
                            <option value="B">Plan B</option>
                          </select>
                          <button
                            className="admin-btn admin-btn-xs admin-btn-red"
                            onClick={() => deleteTutor(t.id, `${t.first_name} ${t.last_name}`)}
                            disabled={updating === t.id}
                            aria-label={`Delete ${t.first_name} ${t.last_name}`}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="admin-pagination" aria-label="Tutor pages">
              <span>
                Showing {rangeStart}–{rangeEnd} of {total}
              </span>
              <div className="admin-pagination-controls">
                <button
                  className="admin-btn admin-btn-secondary admin-btn-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  ← Previous
                </button>
                <span className="admin-page-indicator">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="admin-btn admin-btn-secondary admin-btn-xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next →
                </button>
              </div>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
