// app/admin/tutors/page.js
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminJson } from "@/lib/adminFetch";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

const EMPTY_FILTERS = {
  search: "",
  subjectId: "",
  classId: "",
  areaId: "",
  status: "",
  gender: "",
  verified: "",
  profileCompleted: "",
};

const PAGE_SIZE = 25;

const SORT_LABELS = {
  name: "name",
  experience: "experience",
  created: "date added",
  updated: "last updated",
};

function displayList(value, max = 2) {
  if (!value) return "—";
  const items = String(value).split(", ").filter(Boolean);
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} +${items.length - max}`;
}

function StatusBadge({ status }) {
  return <span className={`admin-status-badge status-${status}`}>{status}</span>;
}

function BooleanBadge({ value, label }) {
  return (
    <span className={`admin-boolean-badge ${value ? "is-yes" : "is-no"}`}>
      <span aria-hidden="true">{value ? "✓" : "—"}</span> {label || (value ? "Yes" : "No")}
    </span>
  );
}

/**
 * A column header that sorts. `aria-sort` tells screen readers the current
 * state; the arrow is decorative and hidden from them.
 */
function SortableTh({ label, sortKey, sort, onSort, initialDir = "desc" }) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <th aria-sort={ariaSort} className={active ? "is-sorted" : undefined}>
      <button
        type="button"
        className="admin-sort-btn"
        onClick={() => onSort(sortKey, initialDir)}
        title={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        <span className="admin-sort-arrow" aria-hidden="true">
          {active ? (sort.dir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
    </th>
  );
}

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
  // "relevance" is the server's default ordering: active first, then complete
  // and verified profiles. Any other key sorts on that column alone.
  const [sort, setSort] = useState({ key: "relevance", dir: "desc" });
  const [options, setOptions] = useState({
    subjects: [],
    classes: [],
    locations: [],
  });
  const [updating, setUpdating] = useState(null);

  const debouncedSearch = useDebouncedValue(filters.search, 350);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { ok, data, error: err } = await adminJson("/api/tutors/options", {}, null);
      if (cancelled) return;

      if (!ok) {
        setError(err || "Could not load tutor options");
        return;
      }

      setOptions({
        subjects: data?.subjects || [],
        classes: data?.classes || [],
        locations: data?.locations || [],
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const qs = new URLSearchParams();
    if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());

    Object.entries(filters).forEach(([key, value]) => {
      if (key === "search" || value === "") return;
      qs.set(key, value);
    });

    qs.set("page", String(page));
    qs.set("limit", String(PAGE_SIZE));
    qs.set("sort", sort.key);
    qs.set("dir", sort.dir);

    const { ok, data, error: err } = await adminJson(`/api/admin/tutors?${qs.toString()}`, {}, null);

    if (!ok) {
      setTutors([]);
      setTotal(0);
      setTotalPages(1);
      setError(err || "Could not load tutors");
    } else {
      setTutors(Array.isArray(data?.data) ? data.data : []);
      setTotal(Number(data?.total || 0));
      setTotalPages(Number(data?.totalPages || 1));
    }

    setLoading(false);
  }, [debouncedSearch, filters, page, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.subjectId, filters.classId, filters.areaId, filters.status, filters.gender, filters.verified, filters.profileCompleted, sort]);

  /**
   * Toggle direction when the same column is clicked again, otherwise switch to
   * the new column. Each column starts on the direction that is actually useful
   * — most experienced first, but names A→Z.
   */
  function toggleSort(key, initialDir = "desc") {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: initialDir }
    );
  }

  const activeFilters = useMemo(() => {
    const labels = {
      search: "Search",
      subjectId: "Subject",
      classId: "Class",
      areaId: "Area",
      status: "Status",
      gender: "Gender",
      verified: "Verified",
      profileCompleted: "Profile",
    };

    return Object.entries(filters)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => ({ key, label: labels[key], value }));
  }, [filters]);

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters({ ...EMPTY_FILTERS });
  }

  function optionName(list, id) {
    return list.find((item) => String(item.id) === String(id))?.name || id;
  }

  function filterDisplay(filter) {
    if (filter.key === "subjectId") return optionName(options.subjects, filter.value);
    if (filter.key === "classId") return optionName(options.classes, filter.value);
    if (filter.key === "areaId") return optionName(options.locations, filter.value);
    if (filter.key === "verified") return filter.value === "1" ? "Verified" : "Not verified";
    if (filter.key === "profileCompleted") return filter.value === "1" ? "Complete" : "Incomplete";
    return filter.value;
  }

  async function updateTutor(id, patch) {
    setUpdating(id);
    setError("");

    setTutors((rows) => rows.map((t) => (t.id === id ? { ...t, ...patch } : t)));

    const { ok, data, error: err } = await adminJson(`/api/admin/tutors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!ok) {
      setError(err || "Update failed");
      await load();
    } else if (data?.data?.tutor) {
      setTutors((rows) => rows.map((t) => (t.id === id ? { ...t, ...data.data.tutor } : t)));
    }

    setUpdating(null);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <div className="admin-breadcrumb">Management / Tutors</div>
            <h1>Tutors</h1>
            <p>
              {loading
                ? "Loading tutors…"
                : `${total} tutor${total !== 1 ? "s" : ""} found${total ? ` · showing ${rangeStart}–${rangeEnd}` : ""}`}
              {sort.key !== "relevance" && (
                <>
                  {" · "}
                  <span className="admin-sort-note">
                    sorted by {SORT_LABELS[sort.key]} ({sort.dir === "asc" ? "lowest" : "highest"} first)
                  </span>{" "}
                  <button
                    type="button"
                    className="admin-filter-clear"
                    onClick={() => setSort({ key: "relevance", dir: "desc" })}
                  >
                    reset
                  </button>
                </>
              )}
            </p>
          </div>

          <button className="admin-btn admin-btn-secondary" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && (
          <div className="admin-alert admin-alert-error" role="alert">
            {error}
          </div>
        )}

        <section className="admin-filter-panel" aria-label="Filter tutors">
          <div className="admin-filter-heading">
            <div>
              <h3>Find tutors</h3>
              <p>Search and filter the tutor database.</p>
            </div>
            {activeFilters.length > 0 && (
              <button type="button" className="admin-filter-clear" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>

          <div className="admin-filter-grid tutor-admin-filter-grid">
            <label className="admin-form-group tutor-search-field">
              <span>Search</span>
              <input
                className="admin-input"
                type="search"
                placeholder="Name, phone, email, subject or area"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </label>

            <label className="admin-form-group">
              <span>Subject</span>
              <select className="admin-select" value={filters.subjectId} onChange={(e) => setFilter("subjectId", e.target.value)}>
                <option value="">All subjects</option>
                {options.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>

            <label className="admin-form-group">
              <span>Class</span>
              <select className="admin-select" value={filters.classId} onChange={(e) => setFilter("classId", e.target.value)}>
                <option value="">All classes</option>
                {options.classes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label className="admin-form-group">
              <span>Area</span>
              <select className="admin-select" value={filters.areaId} onChange={(e) => setFilter("areaId", e.target.value)}>
                <option value="">All areas</option>
                {options.locations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}{item.location_type ? ` · ${item.location_type}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-group">
              <span>Status</span>
              <select className="admin-select" value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </label>

            <label className="admin-form-group">
              <span>Gender</span>
              <select className="admin-select" value={filters.gender} onChange={(e) => setFilter("gender", e.target.value)}>
                <option value="">Any gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="admin-form-group">
              <span>Verification</span>
              <select className="admin-select" value={filters.verified} onChange={(e) => setFilter("verified", e.target.value)}>
                <option value="">All tutors</option>
                <option value="1">Verified</option>
                <option value="0">Not verified</option>
              </select>
            </label>

            <label className="admin-form-group">
              <span>Profile</span>
              <select className="admin-select" value={filters.profileCompleted} onChange={(e) => setFilter("profileCompleted", e.target.value)}>
                <option value="">Any profile</option>
                <option value="1">Complete</option>
                <option value="0">Incomplete</option>
              </select>
            </label>
          </div>

          {activeFilters.length > 0 && (
            <div className="admin-filter-chips" aria-label="Active filters">
              {activeFilters.map((filter) => (
                <span className="admin-chip" key={filter.key}>
                  {filter.label}: {filterDisplay(filter)}
                  <button type="button" aria-label={`Remove ${filter.label} filter`} onClick={() => setFilter(filter.key, "")}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {loading ? (
          <TableSkeleton />
        ) : tutors.length === 0 ? (
          <div className="admin-table-wrap">
            <div className="admin-empty">
              <span className="admin-empty-icon" aria-hidden="true">⌕</span>
              <h3>No tutors found</h3>
              <p>{activeFilters.length ? "Try removing a filter or broadening your search." : "No tutors have been added yet."}</p>
              {activeFilters.length > 0 && (
                <button className="admin-btn admin-btn-primary" onClick={clearFilters}>Clear filters</button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table tutors-admin-table">
                <caption className="sr-only">Registered tutors</caption>
                <thead>
                  <tr>
                    <SortableTh label="Tutor" sortKey="name" initialDir="asc" sort={sort} onSort={toggleSort} />
                    <th>Contact</th>
                    <th>Teaching</th>
                    <th>Areas</th>
                    <SortableTh label="Experience" sortKey="experience" sort={sort} onSort={toggleSort} />
                    <th>Status</th>
                    <th>Profile</th>
                    <th>Verified</th>
                    <SortableTh label="Added" sortKey="created" sort={sort} onSort={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((tutor) => {
                    const fullName = [tutor.first_name, tutor.last_name].filter(Boolean).join(" ");
                    return (
                      <tr key={tutor.id}>
                        <td>
                          <div className="tutor-admin-name">
                            <div className="tutor-admin-avatar">
                              {tutor.profile_image ? (
                                <img src={tutor.profile_image} alt="" />
                              ) : (
                                fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/admin/tutors/${tutor.id}`}
                                className="tutor-admin-profile-link"
                              >
                                {fullName}
                              </Link>
                              <span>ID #{tutor.id}{tutor.gender ? ` · ${tutor.gender}` : ""}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="tutor-admin-contact">
                            {tutor.whatsapp ? <a href={`tel:${tutor.whatsapp}`}>{tutor.whatsapp}</a> : <span>—</span>}
                            {tutor.email && <span>{tutor.email}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="tutor-admin-teaching">
                            <strong>{displayList(tutor.subjects, 2)}</strong>
                            <span>{displayList(tutor.classes, 3)}</span>
                          </div>
                        </td>
                        <td className="tutor-admin-muted">{displayList(tutor.areas, 2)}</td>
                        <td>
                          <strong>{tutor.experience_years == null ? "—" : `${tutor.experience_years} yrs`}</strong>
                          {tutor.teaching_start_year && <span className="tutor-admin-subline">Since {tutor.teaching_start_year}</span>}
                        </td>
                        <td>
                          <select
                            className="admin-select admin-select-sm tutor-status-select"
                            value={tutor.status}
                            disabled={updating === tutor.id}
                            onChange={(e) => updateTutor(tutor.id, { status: e.target.value })}
                            aria-label={`Status for ${fullName}`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="blacklisted">Blacklisted</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="tutor-admin-toggle"
                            disabled={updating === tutor.id}
                            onClick={() => updateTutor(tutor.id, { profile_completed: tutor.profile_completed ? 0 : 1 })}
                            aria-pressed={Boolean(tutor.profile_completed)}
                            title="Toggle profile completion"
                          >
                            <BooleanBadge value={Boolean(tutor.profile_completed)} label={tutor.profile_completed ? "Complete" : "Incomplete"} />
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="tutor-admin-toggle"
                            disabled={updating === tutor.id}
                            onClick={() => updateTutor(tutor.id, { verified: tutor.verified ? 0 : 1 })}
                            aria-pressed={Boolean(tutor.verified)}
                            title="Toggle verification"
                          >
                            <BooleanBadge value={Boolean(tutor.verified)} label={tutor.verified ? "Verified" : "Verify"} />
                          </button>
                        </td>
                        <td className="tutor-admin-muted tutor-admin-subline">
                          {tutor.created_at
                            ? new Date(tutor.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <nav className="admin-pagination" aria-label="Tutor pages">
              <span>Showing {rangeStart}–{rangeEnd} of {total}</span>
              <div className="admin-pagination-controls">
                <button className="admin-btn admin-btn-secondary admin-btn-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                  Previous
                </button>
                <span className="admin-page-indicator">Page {page} of {totalPages}</span>
                <button className="admin-btn admin-btn-secondary admin-btn-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
                  Next
                </button>
              </div>
            </nav>
          </>
        )}
      </main>
    </div>
  );
}
