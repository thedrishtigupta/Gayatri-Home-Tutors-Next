// app/admin/tutor-changes/page.js — review what tutors have asked to change.
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminJson } from "@/lib/adminFetch";
import { FIELD_BY_NAME } from "@/lib/tutorProfileFields";

const TABS = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["partial", "Partly approved"],
  ["rejected", "Rejected"],
  ["withdrawn", "Replaced"],
];

const fmt = (v) =>
  v ? new Date(v).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function TutorChangesPage() {
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { ok, data, error: err } = await adminJson(`/api/admin/tutor-changes?status=${status}`, {}, null);
    if (!ok) {
      setRows([]);
      setError(err || "Could not load the review queue.");
    } else {
      setRows(data?.data || []);
      setCounts(data?.counts || {});
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <div className="admin-breadcrumb">Management / Tutor changes</div>
            <h1>Tutor profile changes</h1>
            <p>
              {loading
                ? "Loading…"
                : `${rows.length} ${status} submission${rows.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
        </div>

        {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}

        <div className="admin-filter-chips" style={{ marginBottom: 20 }}>
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`admin-chip${status === value ? "" : " is-muted"}`}
              onClick={() => setStatus(value)}
              style={
                status === value
                  ? undefined
                  : { background: "var(--a-surface)", color: "var(--a-text-muted)", border: "1px solid var(--a-border)" }
              }
            >
              {label}
              {counts[value] ? ` · ${counts[value]}` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-table-wrap" style={{ padding: 16 }}>
            {[0, 1, 2].map((i) => <div className="skeleton skeleton-row" key={i} style={{ height: 72 }} />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-table-wrap">
            <div className="admin-empty">
              <span className="admin-empty-icon" aria-hidden="true">✓</span>
              <h3>Nothing {status === "pending" ? "waiting for review" : `marked ${status}`}</h3>
              <p>
                {status === "pending"
                  ? "Tutors' profile change requests will appear here."
                  : "Try another tab above."}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {rows.map((row) => (
              <ChangeCard
                key={row.id}
                row={row}
                open={openId === row.id}
                onToggle={() => setOpenId(openId === row.id ? null : row.id)}
                onReviewed={load}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ChangeCard({ row, open, onToggle, onReviewed }) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || `Tutor #${row.tutor_id}`;
  const [decisions, setDecisions] = useState({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = row.status === "pending";

  const decided = Object.keys(decisions).length;
  const allDecided = decided === row.fields.length;

  const setAll = (value) =>
    setDecisions(Object.fromEntries(row.fields.map((f) => [f.id, value])));

  async function submit() {
    if (!decided || busy) return;
    setBusy(true);
    setError("");

    const { ok, error: err } = await adminJson(`/api/admin/tutor-changes/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisions, note: note || undefined }),
    });

    setBusy(false);
    if (!ok) {
      setError(err || "Could not save your review.");
      return;
    }
    onReviewed();
  }

  return (
    <section className="admin-section" style={{ marginBottom: 0, padding: 0, overflow: "hidden" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 14, width: "100%",
          padding: "16px 20px", border: 0, background: "none", cursor: "pointer",
          font: "inherit", textAlign: "left",
        }}
      >
        <div className="tutor-admin-avatar">
          {row.profile_image ? <img src={row.profile_image} alt="" /> : name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 14 }}>{name}</strong>
          <div style={{ fontSize: 12, color: "var(--a-text-muted)", marginTop: 2 }}>
            {row.field_count} field{row.field_count === 1 ? "" : "s"} · submitted {fmt(row.submitted_at)}
          </div>
        </div>

        <span className={`admin-status-badge status-${row.tutor_status}`}>{row.tutor_status}</span>
        <span aria-hidden="true" style={{ color: "var(--a-text-muted)" }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--a-border)" }}>
          {error && <div className="admin-alert admin-alert-error" style={{ marginTop: 16 }} role="alert">{error}</div>}

          <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
            <Link href={`/admin/tutors/${row.tutor_id}`} className="admin-btn admin-btn-secondary admin-btn-xs">
              Open full profile
            </Link>
            {pending && (
              <>
                <button type="button" className="admin-btn admin-btn-secondary admin-btn-xs" onClick={() => setAll("approved")}>
                  Approve all
                </button>
                <button type="button" className="admin-btn admin-btn-secondary admin-btn-xs" onClick={() => setAll("rejected")}>
                  Reject all
                </button>
              </>
            )}
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Current</th>
                  <th>Requested</th>
                  <th style={{ width: 190 }}>{pending ? "Decision" : "Outcome"}</th>
                </tr>
              </thead>
              <tbody>
                {row.fields.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{FIELD_BY_NAME.get(f.field)?.label || f.field}</strong></td>
                    <td className="text-muted">{display(f.field, f.old_value)}</td>
                    <td><strong>{display(f.field, f.new_value)}</strong></td>
                    <td>
                      {pending ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className={`admin-btn admin-btn-xs ${decisions[f.id] === "approved" ? "admin-btn-primary" : "admin-btn-secondary"}`}
                            onClick={() => setDecisions((d) => ({ ...d, [f.id]: "approved" }))}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className={`admin-btn admin-btn-xs ${decisions[f.id] === "rejected" ? "admin-btn-red" : "admin-btn-secondary"}`}
                            onClick={() => setDecisions((d) => ({ ...d, [f.id]: "rejected" }))}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`admin-status-badge ${f.status === "approved" ? "status-active" : "status-blacklisted"}`}>
                          {f.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pending && (
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              <label className="admin-form-group">
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--a-text-muted)" }}>
                  Note to the tutor (optional)
                </span>
                <textarea
                  className="admin-input"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Explain anything you did not approve…"
                />
              </label>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--a-text-muted)" }}>
                  {decided} of {row.fields.length} decided
                  {decided > 0 && !allDecided && " — the rest stay pending"}
                </span>
                <button type="button" className="admin-btn admin-btn-primary" onClick={submit} disabled={!decided || busy}>
                  {busy ? "Saving…" : allDecided ? "Apply decisions" : "Apply these decisions"}
                </button>
              </div>
            </div>
          )}

          {!pending && row.admin_note && (
            <p style={{ marginTop: 14, fontSize: 13, color: "var(--a-text-muted)" }}>Note: “{row.admin_note}”</p>
          )}
        </div>
      )}
    </section>
  );
}

/** Render a stored change value for the admin table. */
function display(field, stored) {
  if (stored === null || stored === undefined || stored === "") return "—";
  const spec = FIELD_BY_NAME.get(field);

  if (spec?.type === "relation") {
    try {
      const arr = JSON.parse(stored);
      if (!arr.length) return "none";
      return field === "location_ids"
        ? `${arr.length} area${arr.length === 1 ? "" : "s"}`
        : `${arr.length} class/subject pair${arr.length === 1 ? "" : "s"}`;
    } catch {
      return stored;
    }
  }

  if (spec?.type === "bool") return stored === "1" ? "Yes" : "No";
  const s = String(stored);
  return s.length > 70 ? `${s.slice(0, 70)}…` : s;
}
