// app/tutor/dashboard/page.js — the tutor's overview.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TutorHeader from "@/components/tutor/TutorHeader";
import { FIELD_BY_NAME } from "@/lib/tutorProfileFields";

/* Fields that make a profile useful for matching. Completeness is measured
   against these rather than every column, so a tutor is not told their profile
   is incomplete over an optional second phone number. */
const COMPLETENESS = [
  ["first_name", "Your name"],
  ["whatsapp", "WhatsApp number"],
  ["date_of_birth", "Date of birth"],
  ["gender", "Gender"],
  ["present_address", "Present address"],
  ["highest_qualification_id", "Highest qualification"],
  ["english_fluency", "English comfort level"],
  ["teaching_start_year", "Teaching since"],
  ["teaching_profiles", "Classes & subjects"],
  ["location_ids", "Teaching areas"],
];

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "—";

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function TutorDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/tutor/profile", { credentials: "same-origin", cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok) setError(json.error || "Could not load your profile.");
        else setData(json.data);
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <>
        <TutorHeader />
        <main className="tp-page">
          <div className="tp-skeleton" style={{ height: 120, marginBottom: 18 }} />
          <div className="tp-skeleton" style={{ height: 180, marginBottom: 18 }} />
          <div className="tp-skeleton" style={{ height: 220 }} />
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TutorHeader />
        <main className="tp-page">
          <div className="tp-alert tp-alert-error" role="alert">
            {error || "Your profile could not be loaded."}
          </div>
          <Link href="/tutor/login" className="tp-btn tp-btn-secondary">Back to sign in</Link>
        </main>
      </>
    );
  }

  const { tutor, locations, teachingProfiles, customSubjects, stats, pendingChange, history, impersonation } = data;

  const fullName = [tutor.first_name, tutor.last_name].filter(Boolean).join(" ").trim();
  const initials = ((tutor.first_name?.[0] || "") + (tutor.last_name?.[0] || "")).toUpperCase() || "?";

  const has = (key) => {
    if (key === "teaching_profiles") return teachingProfiles.length > 0;
    if (key === "location_ids") return locations.length > 0;
    const v = tutor[key];
    return v !== null && v !== undefined && String(v).trim() !== "";
  };
  const missing = COMPLETENESS.filter(([key]) => !has(key));
  const filledCount = COMPLETENESS.length - missing.length;
  const percent = Math.round((filledCount / COMPLETENESS.length) * 100);

  const experience =
    tutor.teaching_start_year != null
      ? Math.max(0, new Date().getFullYear() - Number(tutor.teaching_start_year))
      : null;

  const classCount = new Set(teachingProfiles.map((p) => p.class_id)).size;
  const subjectCount = new Set(teachingProfiles.map((p) => p.subject_id)).size;
  const pendingCustom = customSubjects.filter((c) => c.status === "pending").length;

  return (
    <>
      <TutorHeader name={tutor.first_name} impersonation={impersonation} />

      <main className="tp-page">
        <div className="tp-page-head">
          <h1>Welcome back{tutor.first_name ? `, ${tutor.first_name}` : ""}</h1>
          <p>Your profile as it appears to the Gayatri Home Tutors team.</p>
        </div>

        {/* ── Pending submission ── */}
        {pendingChange && (
          <div className="tp-alert tp-alert-warn" role="status">
            <strong>You have {plural(pendingChange.fields.length, "change")} awaiting approval.</strong>
            <div style={{ marginTop: 4, fontSize: 13 }}>
              Submitted {fmtDateTime(pendingChange.submitted_at)}. Your profile below still shows the
              current approved details.
            </div>
            <div className="tp-pending-list">
              {pendingChange.fields.map((f) => (
                <dl className="tp-pending-item" key={f.field}>
                  <dt>{FIELD_BY_NAME.get(f.field)?.label || f.field}</dt>
                  <dd>
                    <span className="tp-diff-old">{summarise(f.field, f.old_value) || "empty"}</span>
                    <span className="tp-diff-arrow">→</span>
                    <span className="tp-diff-new">{summarise(f.field, f.new_value) || "empty"}</span>
                  </dd>
                </dl>
              ))}
            </div>
          </div>
        )}

        {/* ── Identity ── */}
        <section className="tp-card">
          <div className="tp-identity">
            <div className="tp-avatar">
              {tutor.profile_image ? <img src={tutor.profile_image} alt="" /> : initials}
            </div>

            <div className="tp-identity-body">
              <h2>
                {fullName || "Your profile"}
                {tutor.verified ? (
                  <span className="tp-badge ok">✓ Verified</span>
                ) : (
                  <span className="tp-badge neutral">Not yet verified</span>
                )}
                <span className={`tp-badge ${tutor.status === "active" ? "brand" : "warn"}`}>{tutor.status}</span>
              </h2>
              <div className="tp-identity-meta">
                <span>Tutor #{tutor.id}</span>
                <span>{tutor.email}</span>
                {experience != null && <span>{plural(experience, "year")} teaching</span>}
              </div>
            </div>

            {impersonation ? (
              <Link href={`/admin/tutors/${tutor.id}`} className="tp-btn tp-btn-secondary">
                Edit in admin panel
              </Link>
            ) : (
              <Link href="/tutor/profile" className="tp-btn tp-btn-primary">Edit my profile</Link>
            )}
          </div>
        </section>

        {/* ── Completeness ── */}
        <section className="tp-card">
          <h2>Profile completeness</h2>
          <p>A complete profile makes it easier to match you with families near you.</p>

          <div className="tp-meter" role="img" aria-label={`${percent} percent complete`}>
            <i style={{ width: `${percent}%` }} />
          </div>
          <div className="tp-meter-note">
            {filledCount} of {COMPLETENESS.length} key details filled in · <strong>{percent}%</strong>
          </div>

          {missing.length > 0 && (
            <>
              <div className="tp-missing">
                {missing.map(([key, label]) => (
                  <span className="tp-chip gold" key={key}>{label}</span>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 13 }}>
                <Link href="/tutor/profile" style={{ color: "var(--t-primary)", fontWeight: 600 }}>
                  Add the missing details →
                </Link>
              </p>
            </>
          )}
        </section>

        {/* ── Teaching ── */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div>
              <h2>My teaching</h2>
              <p>What you have told us you can teach, and where.</p>
            </div>
          </div>

          <div className="tp-stats" style={{ marginBottom: 18 }}>
            <div className="tp-stat"><span>Classes</span><strong>{classCount}</strong></div>
            <div className="tp-stat"><span>Subjects</span><strong>{subjectCount}</strong></div>
            <div className="tp-stat"><span>Areas</span><strong>{locations.length}</strong></div>
            <div className="tp-stat">
              <span>Experience</span>
              <strong>{experience == null ? "—" : experience}</strong>
              <small>{experience == null ? "not set" : "years"}</small>
            </div>
          </div>

          <dl className="tp-rows">
            <Row label="Teaching mode" value={tutor.teaching_mode} />
            <Row
              label="Subjects"
              value={
                subjectCount ? (
                  <div className="tp-chips">
                    {[...new Map(teachingProfiles.map((p) => [p.subject_id, p.subject_name])).values()].map((n) => (
                      <span className="tp-chip" key={n}>{n}</span>
                    ))}
                  </div>
                ) : null
              }
            />
            <Row
              label="Classes"
              value={
                classCount ? (
                  <div className="tp-chips">
                    {[...new Map(teachingProfiles.map((p) => [p.class_id, p.class_name])).values()].map((n) => (
                      <span className="tp-chip" key={n}>{n}</span>
                    ))}
                  </div>
                ) : null
              }
            />
            <Row
              label="Teaching areas"
              value={
                locations.length ? (
                  <div className="tp-chips">
                    {locations.map((l) => <span className="tp-chip gold" key={l.id}>{l.name}</span>)}
                  </div>
                ) : null
              }
            />
          </dl>

          {customSubjects.length > 0 && (
            <>
              <h2 style={{ marginTop: 22, marginBottom: 10, fontSize: 15 }}>
                Custom subject requests
                {pendingCustom > 0 && <span className="tp-badge warn" style={{ marginLeft: 8 }}>{pendingCustom} pending</span>}
              </h2>
              <dl className="tp-rows">
                {customSubjects.map((c) => (
                  <div className="tp-row" key={c.id}>
                    <dt>{c.subject_name}</dt>
                    <dd>
                      {c.class_name}{" "}
                      <span className={`tp-badge ${c.status === "approved" ? "ok" : c.status === "rejected" ? "danger" : "warn"}`}>
                        {c.status}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        {/* ── Assignments ── */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div>
              <h2>Class assignments</h2>
              <p>Demo requests the office has sent your way.</p>
            </div>
          </div>

          <div className="tp-stats">
            <div className="tp-stat"><span>Total received</span><strong>{stats.assignments.total}</strong></div>
            <div className="tp-stat"><span>Awaiting your reply</span><strong>{stats.assignments.awaitingResponse}</strong></div>
            <div className="tp-stat"><span>Accepted</span><strong>{stats.assignments.accepted}</strong></div>
            <div className="tp-stat"><span>Declined</span><strong>{stats.assignments.rejected}</strong></div>
          </div>

          {stats.assignments.total === 0 && (
            <p className="tp-empty" style={{ marginTop: 14 }}>
              No class assignments yet. When the office matches you with a family, it will appear here.
            </p>
          )}
        </section>

        {/* ── Account ── */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div>
              <h2>Account</h2>
              <p>Your record with us.</p>
            </div>
          </div>

          <dl className="tp-rows">
            <Row label="Registered" value={fmtDate(tutor.created_at)} />
            <Row label="Profile last updated" value={fmtDateTime(tutor.updated_at)} />
            <Row label="Last reviewed by office" value={fmtDateTime(tutor.last_profile_reviewed_at)} />
            <Row label="Last sign in" value={fmtDateTime(tutor.last_login_at)} />
            <Row
              label="Email confirmed"
              value={tutor.email_verified_at ? fmtDate(tutor.email_verified_at) : "Not confirmed"}
            />
          </dl>

          {history.length > 0 && (
            <>
              <h2 style={{ marginTop: 22, marginBottom: 10, fontSize: 15 }}>Recent change requests</h2>
              <dl className="tp-rows">
                {history.map((h) => (
                  <div className="tp-row" key={h.id}>
                    <dt>{fmtDate(h.submitted_at)}</dt>
                    <dd>
                      <span className={`tp-badge ${h.status === "approved" ? "ok" : h.status === "rejected" ? "danger" : h.status === "partial" ? "warn" : "neutral"}`}>
                        {h.status}
                      </span>{" "}
                      {h.status !== "withdrawn" && `${h.approved} approved, ${h.rejected} not approved`}
                      {h.admin_note && <div style={{ marginTop: 4, fontSize: 13, color: "var(--t-text-muted)" }}>“{h.admin_note}”</div>}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>
      </main>
    </>
  );
}

function Row({ label, value }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="tp-row">
      <dt>{label}</dt>
      <dd className={empty ? "empty" : undefined}>{empty ? "Not set" : value}</dd>
    </div>
  );
}

/** Short human form of a stored change value, for the pending diff. */
function summarise(field, stored) {
  if (stored === null || stored === undefined || stored === "") return "";
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
  return String(stored).length > 60 ? `${String(stored).slice(0, 60)}…` : String(stored);
}
