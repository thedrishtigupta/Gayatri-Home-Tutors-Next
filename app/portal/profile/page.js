// app/portal/profile/page.js — the tutor edits their own profile.
//
// Nothing here writes to the database directly. Submitting sends the changed
// fields to the approval queue; the live profile only moves once an admin says
// so, and the form makes that plain rather than pretending the save landed.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import TutorHeader from "@/components/portal/TutorHeader";
import { FIELDS, FIELD_BY_NAME, GROUP_LABELS, hasChanged } from "@/lib/tutorProfileFields";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => String(CURRENT_YEAR - i));
const key = (v) => String(v);

/** Build the editable state from the loaded profile. */
function buildForm(data) {
  const { tutor, locations, teachingProfiles } = data;
  const form = {};

  for (const field of FIELDS) {
    if (field.name === "location_ids") {
      form.location_ids = locations.map((l) => l.id);
    } else if (field.name === "teaching_profiles") {
      form.teaching_profiles = teachingProfiles.map((p) => ({
        class_id: p.class_id,
        subject_id: p.subject_id,
      }));
    } else if (field.type === "bool") {
      form[field.name] = Boolean(tutor[field.name]);
    } else {
      form[field.name] = tutor[field.name] == null ? "" : String(tutor[field.name]);
    }
  }
  return form;
}

export default function TutorProfilePage() {
  const router = useRouter();

  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ qualifications: [], specializations: [], classes: [], subjects: [], locations: [] });
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [picker, setPicker] = useState(null); // "classes" | "subjects" | "areas"

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [profileRes, optionsRes] = await Promise.all([
        fetch("/api/tutor/profile", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/tutors/options", { cache: "no-store" }),
      ]);

      const profileJson = await profileRes.json().catch(() => ({}));
      const optionsJson = await optionsRes.json().catch(() => ({}));

      if (!profileRes.ok || !profileJson.data) {
        setError(profileJson.error || "Could not load your profile.");
        setLoading(false);
        return;
      }

      setData(profileJson.data);
      setForm(buildForm(profileJson.data));
      setBaseline(buildForm(profileJson.data));
      setOptions({
        qualifications: optionsJson.qualifications || [],
        specializations: optionsJson.specializations || [],
        classes: optionsJson.classes || [],
        subjects: optionsJson.subjects || [],
        locations: optionsJson.locations || [],
      });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Which fields differ from what is currently approved. */
  const changedFields = useMemo(() => {
    if (!form || !baseline) return [];
    return FIELDS.filter((f) => hasChanged(f.name, baseline[f.name], form[f.name])).map((f) => f.name);
  }, [form, baseline]);

  // An admin viewing as the tutor may look but not submit; the API refuses it
  // too, so this only saves them a pointless round trip.
  const readOnly = Boolean(data?.impersonation?.readOnly);
  const dirty = changedFields.length > 0 && !readOnly;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function submit() {
    if (!dirty || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {};
    for (const name of changedFields) payload[name] = form[name];

    try {
      const res = await fetch("/api/tutor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || "Could not submit your changes.");
        setSaving(false);
        return;
      }

      setSuccess(json.message || "Your changes were submitted for approval.");
      setSaving(false);
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not reach the server.");
      setSaving(false);
    }
  }

  function discard() {
    setForm({ ...baseline });
    setError("");
    setSuccess("");
  }

  /* ── loading / error shells ────────────────────────────────── */

  if (loading) {
    return (
      <>
        <TutorHeader />
        <main className="tp-page">
          <div className="tp-skeleton" style={{ height: 90, marginBottom: 18 }} />
          <div className="tp-skeleton" style={{ height: 300, marginBottom: 18 }} />
          <div className="tp-skeleton" style={{ height: 240 }} />
        </main>
      </>
    );
  }

  if (!form) {
    return (
      <>
        <TutorHeader />
        <main className="tp-page">
          <div className="tp-alert tp-alert-error" role="alert">{error || "Profile unavailable."}</div>
          <Link href="/portal/dashboard" className="tp-btn tp-btn-secondary">Back to overview</Link>
        </main>
      </>
    );
  }

  const nameOf = (list, id) => list.find((x) => key(x.id) === key(id))?.name || `#${id}`;
  const selectedClassIds = [...new Set(form.teaching_profiles.map((p) => p.class_id))];
  const selectedSubjectIds = [...new Set(form.teaching_profiles.map((p) => p.subject_id))];

  /* Classes and subjects are stored as pairs; the form edits them as two lists
     and rebuilds the cross product, which is how tutors think about it. */
  function setTeachingSets(classIds, subjectIds) {
    const pairs = [];
    for (const c of classIds) for (const s of subjectIds) pairs.push({ class_id: c, subject_id: s });
    setField("teaching_profiles", pairs);
  }

  const grouped = FIELDS.filter((f) => f.type !== "relation").reduce((acc, f) => {
    (acc[f.group] ||= []).push(f);
    return acc;
  }, {});

  return (
    <>
      <TutorHeader name={data.tutor.first_name} impersonation={data.impersonation} />

      <main className="tp-page" style={dirty ? { paddingBottom: 120 } : undefined}>
        <div className="tp-page-head">
          <h1>My profile</h1>
          <p>
            Changes you make here are sent to the office for approval — your public profile updates once
            they are approved.
          </p>
        </div>

        {readOnly && (
          <div className="tp-alert tp-alert-warn" role="status">
            You are viewing this profile as an administrator. It is read-only here — use the admin panel
            to change this tutor&apos;s details.
          </div>
        )}

        {error && <div className="tp-alert tp-alert-error" role="alert">{error}</div>}
        {success && <div className="tp-alert tp-alert-success" role="status">{success}</div>}

        {data.pendingChange && !success && (
          <div className="tp-alert tp-alert-warn" role="status">
            You already have {data.pendingChange.fields.length} change
            {data.pendingChange.fields.length === 1 ? "" : "s"} waiting for approval. Submitting again will
            replace that request.
          </div>
        )}

        {Object.entries(grouped).map(([group, fields]) => (
          <section className="tp-card" key={group}>
            <h2>{GROUP_LABELS[group] || group}</h2>
            <div className="tp-grid" style={{ marginTop: 16 }}>
              {fields.map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  value={form[field.name]}
                  changed={changedFields.includes(field.name)}
                  options={options}
                  onChange={(v) => setField(field.name, v)}
                  visible={field.name !== "school_name_address" || form.teaches_in_school}
                />
              ))}
            </div>
          </section>
        ))}

        {/* ── Classes, subjects and areas ── */}
        <section className="tp-card">
          <div className="tp-card-head">
            <div>
              <h2>Classes, subjects &amp; areas</h2>
              <p>Every class you pick is paired with every subject you pick.</p>
            </div>
          </div>

          <ChipPicker
            label="Classes I teach"
            changed={changedFields.includes("teaching_profiles")}
            ids={selectedClassIds}
            nameOf={(id) => nameOf(options.classes, id)}
            onEdit={() => setPicker("classes")}
            onRemove={(id) => setTeachingSets(selectedClassIds.filter((c) => c !== id), selectedSubjectIds)}
            emptyText="No classes selected yet."
          />

          <ChipPicker
            label="Subjects I teach"
            gold
            changed={changedFields.includes("teaching_profiles")}
            ids={selectedSubjectIds}
            nameOf={(id) => nameOf(options.subjects, id)}
            onEdit={() => setPicker("subjects")}
            onRemove={(id) => setTeachingSets(selectedClassIds, selectedSubjectIds.filter((s) => s !== id))}
            emptyText="No subjects selected yet."
          />

          <ChipPicker
            label="Areas I can travel to"
            gold
            changed={changedFields.includes("location_ids")}
            ids={form.location_ids}
            nameOf={(id) => nameOf(options.locations, id)}
            onEdit={() => setPicker("areas")}
            onRemove={(id) => setField("location_ids", form.location_ids.filter((l) => l !== id))}
            emptyText="No areas selected yet."
          />

        </section>

        {!readOnly && (
          <section className="tp-card">
            <div className="tp-submit-row">
              <p>
                {dirty
                  ? `${changedFields.length} change${changedFields.length === 1 ? "" : "s"} ready to send`
                  : "No changes yet"}
                <span>
                  Nothing is sent to the office until you press Save changes. Leaving this page without
                  saving discards your edits.
                </span>
              </p>
              <div>
                <button type="button" className="tp-btn tp-btn-secondary" onClick={discard} disabled={!dirty || saving}>
                  Undo changes
                </button>
                <button type="button" className="tp-btn tp-btn-primary" onClick={submit} disabled={!dirty || saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {dirty && (
        <div className="tp-savebar" role="region" aria-label="Unsubmitted changes">
          <div className="tp-savebar-inner">
            <p>
              {changedFields.length} change{changedFields.length === 1 ? "" : "s"} not saved yet
              <span>Press Save changes to send them to the office for approval.</span>
            </p>
            <div>
              <button type="button" className="tp-btn tp-btn-secondary" onClick={discard} disabled={saving}>
                Undo
              </button>
              <button type="button" className="tp-btn tp-btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {picker && (
        <PickerModal
          kind={picker}
          options={options}
          selected={
            picker === "classes" ? selectedClassIds : picker === "subjects" ? selectedSubjectIds : form.location_ids
          }
          onToggle={(id) => {
            if (picker === "areas") {
              setField(
                "location_ids",
                form.location_ids.includes(id)
                  ? form.location_ids.filter((l) => l !== id)
                  : [...form.location_ids, id]
              );
              return;
            }
            if (picker === "classes") {
              const next = selectedClassIds.includes(id)
                ? selectedClassIds.filter((c) => c !== id)
                : [...selectedClassIds, id];
              setTeachingSets(next, selectedSubjectIds);
              return;
            }
            const next = selectedSubjectIds.includes(id)
              ? selectedSubjectIds.filter((s) => s !== id)
              : [...selectedSubjectIds, id];
            setTeachingSets(selectedClassIds, next);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}

/* ── field renderer ────────────────────────────────────────────── */

function Field({ field, value, changed, options, onChange, visible = true }) {
  if (!visible) return null;

  const wide = field.type === "textarea";
  const cls = `tp-field${changed ? " is-changed" : ""}${wide ? " tp-span-2" : ""}`;

  const label = (
    <span>
      {field.label}
      {field.required && <i className="tp-required" aria-hidden="true"> *</i>}
      {changed && <span className="tp-changed-tag"> · changed</span>}
    </span>
  );

  if (field.type === "bool") {
    return (
      <div className={cls}>
        {label}
        <label className="tp-check">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{field.checkboxLabel || "Yes"}</span>
        </label>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className={cls}>
        {label}
        <textarea className="tp-input" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }

  if (field.type === "select" || field.type === "ref" || field.type === "year") {
    const list =
      field.type === "year"
        ? YEARS.map((y) => [y, y])
        : field.type === "ref"
          ? (options[field.source] || []).map((o) => [key(o.id), o.name])
          : field.options.map((o) => (Array.isArray(o) ? o : [o, o]));

    const current = value == null ? "" : String(value);
    if (current && !list.some(([v]) => v === current)) list.push([current, `${current} (not in list)`]);

    return (
      <label className={cls}>
        {label}
        <select className="tp-input" value={current} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {list.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </label>
    );
  }

  const inputType = field.type === "date" ? "date" : field.type === "phone" ? "tel" : "text";

  return (
    <label className={cls}>
      {label}
      <input
        className="tp-input"
        type={inputType}
        value={value || ""}
        max={field.type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/* ── chip list with an edit button ─────────────────────────────── */

function ChipPicker({ label, ids, nameOf, onEdit, onRemove, emptyText, gold, changed }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-muted)" }}>
          {label} ({ids.length})
          {changed && <span className="tp-changed-tag"> · changed</span>}
        </span>
        <button type="button" className="tp-btn tp-btn-secondary tp-btn-sm" onClick={onEdit}>
          Edit
        </button>
      </div>

      {ids.length ? (
        <div className="tp-chips">
          {ids.map((id) => (
            <span className={`tp-chip${gold ? " gold" : ""}`} key={id}>
              {nameOf(id)}
              <button type="button" aria-label={`Remove ${nameOf(id)}`} onClick={() => onRemove(id)}>×</button>
            </span>
          ))}
        </div>
      ) : (
        <p className="tp-empty">{emptyText}</p>
      )}
    </div>
  );
}

/* ── picker modal ──────────────────────────────────────────────── */

function PickerModal({ kind, options, selected, onToggle, onClose }) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const items = kind === "classes" ? options.classes : kind === "subjects" ? options.subjects : options.locations;
  const title = kind === "classes" ? "Choose classes" : kind === "subjects" ? "Choose subjects" : "Choose areas";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,23,42,.5)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "min(560px, 100%)", maxHeight: "min(620px, calc(100vh - 40px))",
          display: "flex", flexDirection: "column", background: "#fff",
          border: "1px solid var(--t-border)", borderRadius: 16, overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--t-border)", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 16 }}>{title}</h2>
            <p className="tp-field-hint">{selected.length} selected</p>
          </div>
          <button type="button" className="tp-btn tp-btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--t-border)", background: "var(--t-surface-2)" }}>
          <input
            className="tp-input"
            type="search"
            autoFocus
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search options"
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "grid", gap: 4 }}>
          {filtered.map((item) => {
            const on = selected.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onToggle(item.id)}
                aria-pressed={on}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  font: "inherit", fontSize: 14, textAlign: "left",
                  border: on ? "1px solid rgba(11,46,107,.25)" : "1px solid transparent",
                  background: on ? "var(--t-primary-light)" : "none",
                  color: on ? "var(--t-primary-dark)" : "var(--t-text)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "grid", placeItems: "center", width: 18, height: 18, flexShrink: 0,
                    borderRadius: 5, fontSize: 11, color: "#fff",
                    border: on ? "1.5px solid var(--t-primary)" : "1.5px solid #cbd5e1",
                    background: on ? "var(--t-primary)" : "#fff",
                  }}
                >
                  {on ? "✓" : ""}
                </span>
                {item.name}
                {item.location_type && (
                  <small style={{ marginLeft: "auto", color: "var(--t-text-muted)", fontWeight: 400 }}>
                    {item.location_type}
                  </small>
                )}
              </button>
            );
          })}
          {!filtered.length && <p className="tp-empty">No matches for “{search}”.</p>}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--t-border)", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="tp-btn tp-btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
