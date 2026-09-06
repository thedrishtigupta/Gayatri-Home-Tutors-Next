// app/admin/tutors/[id]/page.js — admin tutor profile editor
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminJson } from "@/lib/adminFetch";
import "./tutor-profile.css";


// Option values mirror the `tutors` enums in database/ght-v3-schema.sql.
const GENDERS = ["Male", "Female", "Other"];
const MARITAL = ["Single", "Married", "Widowed", "Divorced", "Other"];
const RESIDENTIAL = [
  ["Own", "Own house"],
  ["Rented", "Rented accommodation"],
  ["Parental", "Parental home"],
  ["PG/Hostel", "PG / Hostel"],
  ["Other", "Other"],
];
const FLUENCY = [
  ["Yes", "Fluent (English medium)"],
  ["Average", "Average / conversational"],
  ["No", "Hindi / regional medium"],
];
const MODES = ["In-person", "Online", "Both"];
const SOURCES = ["Google", "Instagram", "Facebook", "Friend / Referral", "Other"];
const CUSTOM_STATUSES = ["pending", "approved", "rejected"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => String(CURRENT_YEAR - i));

const EMPTY_OPTIONS = { qualifications: [], specializations: [], classes: [], subjects: [], locations: [] };
const EMPTY_RELATED = { locations: [], teachingProfiles: [] };

const str = (value) => (value == null ? "" : String(value));
const truthy = (value) => value === true || value === 1 || value === "1" || value === "true";
const key = (value) => String(value);

function buildForm(t) {
  return {
    first_name: str(t.first_name),
    last_name: str(t.last_name),
    gender: str(t.gender),
    date_of_birth: str(t.date_of_birth).slice(0, 10),
    marital_status: str(t.marital_status),
    own_vehicle: truthy(t.own_vehicle),
    profile_image: str(t.profile_image),

    whatsapp: str(t.whatsapp),
    alternate_phone: str(t.alternate_phone),
    email: str(t.email),
    family_phone: str(t.family_phone),
    family_relation: str(t.family_relation),

    present_address: str(t.present_address),
    permanent_address: str(t.permanent_address),
    residential_status: str(t.residential_status),

    highest_qualification_id: str(t.highest_qualification_id),
    specialization_id: str(t.specialization_id),
    specialization_other: str(t.specialization_other),
    institution: str(t.institution),
    additional_qualification: str(t.additional_qualification),
    english_fluency: str(t.english_fluency),

    teaching_start_year: str(t.teaching_start_year),
    teaching_mode: str(t.teaching_mode) || "In-person",
    teaches_in_school: truthy(t.teaches_in_school),
    school_name_address: str(t.school_name_address),

    source_channel: str(t.source_channel),
    referred_by_name: str(t.referred_by_name),
    referral_phone: str(t.referral_phone),
    comment: str(t.comment),

    status: str(t.status) || "active",
    verified: truthy(t.verified),
    profile_completed: truthy(t.profile_completed),
  };
}

/*
 * Only class × subject pairs are stored. Classes that share an identical
 * subject set are shown together as one editing group; the grouping itself
 * is never persisted.
 */
function groupsFromProfiles(profiles) {
  const byClass = new Map();
  for (const p of profiles) {
    const c = key(p.class_id);
    if (!byClass.has(c)) byClass.set(c, new Set());
    byClass.get(c).add(key(p.subject_id));
  }

  const groups = new Map();
  for (const [classId, subjects] of byClass) {
    const subjectIds = [...subjects].sort((a, b) => a - b);
    const k = subjectIds.join(",");
    if (!groups.has(k)) groups.set(k, { classes: [], subjects: subjectIds });
    groups.get(k).classes.push(classId);
  }

  const list = [...groups.values()];
  return list.length ? list : [{ classes: [], subjects: [] }];
}

function pairsFromGroups(groups) {
  const seen = new Set();
  const pairs = [];
  for (const g of groups) {
    for (const c of g.classes) {
      for (const s of g.subjects) {
        const k = `${c}:${s}`;
        if (seen.has(k)) continue;
        seen.add(k);
        pairs.push({ class_id: Number(c), subject_id: Number(s) });
      }
    }
  }
  return pairs;
}

function fingerprint(state) {
  return JSON.stringify({
    form: state.form,
    groups: state.groups,
    locationIds: state.locationIds,
    custom: state.customSubjects.map((c) => [c.id, c.status]),
  });
}

function yearsSince(year) {
  const y = Number(year);
  return Number.isFinite(y) && y > 0 ? Math.max(0, CURRENT_YEAR - y) : null;
}

function ageFrom(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * First problem found, or null. `section` is the id of the section holding it,
 * so the caller can scroll there — it matches the Section `id` prop.
 */
function validate(form) {
  if (!form.first_name.trim()) return { section: "personal", message: "First name is required." };

  if (form.date_of_birth && new Date(form.date_of_birth) > new Date()) {
    return { section: "personal", message: "Date of birth cannot be in the future." };
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return { section: "contact", message: "Email address looks invalid." };
  }

  const phones = [
    ["whatsapp", "WhatsApp number", "contact"],
    ["alternate_phone", "Alternate phone", "contact"],
    ["family_phone", "Family phone", "contact"],
    ["referral_phone", "Referral phone", "source"],
  ];
  for (const [field, label, section] of phones) {
    const digits = form[field].replace(/[\s-]/g, "");
    if (digits && !/^\+?\d{6,15}$/.test(digits)) {
      return { section, message: `${label} must be 6–15 digits.` };
    }
  }

  if (form.teaches_in_school && !form.school_name_address.trim()) {
    return { section: "teaching", message: "Add the school name and address, or untick school teaching." };
  }

  return null;
}

/* ========================================================================
   Page
   ======================================================================== */

export default function TutorProfilePage() {
  const params = useParams();
  const tutorId = params?.id;

  const [tutor, setTutor] = useState(null);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [related, setRelated] = useState(EMPTY_RELATED);

  // Editable state + the last persisted copy (for dirty checks and discard).
  const [form, setForm] = useState(null);
  const [groups, setGroups] = useState([]);
  const [locationIds, setLocationIds] = useState([]);
  const [customSubjects, setCustomSubjects] = useState([]);
  const [saved, setSaved] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [picker, setPicker] = useState(null); // { kind: "classes" | "subjects" | "locations", group?: index }
  const [viewingAs, setViewingAs] = useState(false);

  const ready = !loading && Boolean(form && tutor);

  const applyLoaded = useCallback((data) => {
    const next = {
      form: buildForm(data.tutor),
      groups: groupsFromProfiles(data.teachingProfiles || []),
      locationIds: (data.locations || []).map((l) => key(l.id)),
      customSubjects: data.customSubjects || [],
    };
    setTutor(data.tutor);
    setRelated({ locations: data.locations || [], teachingProfiles: data.teachingProfiles || [] });
    setForm(next.form);
    setGroups(next.groups);
    setLocationIds(next.locationIds);
    setCustomSubjects(next.customSubjects);
    setSaved(next);
  }, []);

  /* ── Load ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!tutorId) return undefined;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError("");

      const [profile, opts] = await Promise.all([
        adminJson(`/api/admin/tutors/${tutorId}`, { cache: "no-store" }, null),
        adminJson("/api/tutors/options", { cache: "no-store" }, null),
      ]);
      if (cancelled) return;

      if (!profile.ok || !profile.data?.data?.tutor) {
        setLoadError(profile.error || "Tutor not found.");
        setLoading(false);
        return;
      }

      const o = opts.data || {};
      setOptions({
        qualifications: o.qualifications || [],
        specializations: o.specializations || [],
        classes: o.classes || [],
        subjects: o.subjects || [],
        locations: o.locations || [],
      });
      if (!opts.ok) setError(opts.error || "Reference lists could not be loaded; some dropdowns may be empty.");

      applyLoaded(profile.data.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tutorId, applyLoaded]);

  /* ── Derived ──────────────────────────────────────────────────────── */
  const dirty = Boolean(saved && form) && fingerprint({ form, groups, locationIds, customSubjects }) !== fingerprint(saved);

  // Name lookups. Rows the tutor already has stay resolvable even if that
  // reference row was deactivated since (the options endpoint only lists active rows).
  const lookup = useMemo(() => {
    const toMap = (list) => new Map(list.map((item) => [key(item.id), item]));
    const classes = toMap(options.classes);
    const subjects = toMap(options.subjects);
    const locations = toMap(options.locations);

    for (const p of related.teachingProfiles) {
      if (!classes.has(key(p.class_id))) classes.set(key(p.class_id), { id: p.class_id, name: p.class_name, inactive: true });
      if (!subjects.has(key(p.subject_id))) subjects.set(key(p.subject_id), { id: p.subject_id, name: p.subject_name, inactive: true });
    }
    for (const l of related.locations) {
      if (!locations.has(key(l.id))) locations.set(key(l.id), { ...l, inactive: true });
    }
    return { classes, subjects, locations };
  }, [options, related]);

  const nameOf = useCallback((kind, id) => lookup[kind].get(key(id))?.name || `#${id}`, [lookup]);

  const sorted = useCallback(
    (kind, ids) =>
      [...ids].sort((a, b) => {
        const A = lookup[kind].get(key(a));
        const B = lookup[kind].get(key(b));
        return (A?.sort_order ?? 0) - (B?.sort_order ?? 0) || (A?.name || "").localeCompare(B?.name || "");
      }),
    [lookup]
  );

  const locationDetail = useCallback(
    (item) => {
      const parent = item.parent_location_id ? lookup.locations.get(key(item.parent_location_id)) : null;
      return parent ? parent.name : item.location_type;
    },
    [lookup]
  );

  const specializationName = form
    ? options.specializations.find((s) => key(s.id) === form.specialization_id)?.name || tutor?.specialization_name || ""
    : "";
  const specializationIsOther = /^other$/i.test(specializationName.trim());

  const qualificationName = form
    ? options.qualifications.find((q) => key(q.id) === form.highest_qualification_id)?.name || tutor?.qualification_name || ""
    : "";

  const pairs = useMemo(() => pairsFromGroups(groups), [groups]);
  const incompleteGroups = groups.filter((g) => Boolean(g.classes.length) !== Boolean(g.subjects.length)).length;

  /* ── Effects ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  /* ── Editing helpers ──────────────────────────────────────────────── */
  function touch() {
    setError("");
    setSuccess("");
  }

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    touch();
  }

  function addGroup() {
    setGroups((current) => [...current, { classes: [], subjects: [] }]);
    touch();
  }

  function removeGroup(index) {
    setGroups((current) => current.filter((_, i) => i !== index));
    touch();
  }

  function toggleGroupValue(index, kind, id) {
    setGroups((current) => current.map((g, i) => (i === index ? { ...g, [kind]: toggleIn(g[kind], key(id)) } : g)));
    touch();
  }

  function toggleLocation(id) {
    setLocationIds((current) => toggleIn(current, key(id)));
    touch();
  }

  function setCustomStatus(id, status) {
    setCustomSubjects((current) => current.map((c) => (c.id === id ? { ...c, status } : c)));
    touch();
  }

  /**
   * Open this tutor's own panel as they see it. The session it issues is
   * read-only and expires in 30 minutes; every use is logged.
   */
  async function viewAsTutor() {
    if (viewingAs) return;
    setViewingAs(true);

    const { ok, data, error: err } = await adminJson("/api/admin/tutor-impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId: tutor.id }),
    });

    if (!ok) {
      setError(err || "Could not open the tutor's panel.");
      setViewingAs(false);
      return;
    }
    window.location.href = data?.redirectTo || "/portal/dashboard";
  }

  /** Used by save validation to bring the offending section into view. */
  function jumpTo(id) {
    document.getElementById(`tp-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function discard() {
    if (!saved) return;
    setForm(saved.form);
    setGroups(saved.groups);
    setLocationIds(saved.locationIds);
    setCustomSubjects(saved.customSubjects);
    touch();
  }

  /* ── Picker ───────────────────────────────────────────────────────── */
  const pickerState = useMemo(() => {
    if (!picker) return null;

    if (picker.kind === "locations") {
      return {
        title: "Teaching areas",
        subtitle: "Localities this tutor can travel to",
        items: options.locations,
        selected: new Set(locationIds),
        grouped: true,
        detail: locationDetail,
      };
    }

    const group = groups[picker.group];
    if (!group) return null;
    const isClasses = picker.kind === "classes";
    return {
      title: `Group ${picker.group + 1} · ${isClasses ? "Classes" : "Subjects"}`,
      subtitle: isClasses ? "Every class here is paired with every subject in the group" : "Every subject here is paired with every class in the group",
      items: isClasses ? options.classes : options.subjects,
      selected: new Set(group[picker.kind]),
      grouped: false,
      detail: isClasses ? (item) => (item.short_name && item.short_name !== item.name ? item.short_name : null) : null,
    };
  }, [picker, options, groups, locationIds, locationDetail]);

  const closePicker = useCallback(() => setPicker(null), []);

  function togglePicked(id) {
    if (!picker) return;
    if (picker.kind === "locations") toggleLocation(id);
    else toggleGroupValue(picker.group, picker.kind, id);
  }

  function clearPicked() {
    if (!picker) return;
    if (picker.kind === "locations") setLocationIds([]);
    else setGroups((current) => current.map((g, i) => (i === picker.group ? { ...g, [picker.kind]: [] } : g)));
    touch();
  }

  /* ── Save ─────────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!form || saving || !dirty) return;

    const problem = validate(form);
    if (problem) {
      setError(problem.message);
      jumpTo(problem.section);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      specialization_other: specializationIsOther ? form.specialization_other : "",
      school_name_address: form.teaches_in_school ? form.school_name_address : "",
      location_ids: locationIds.map(Number),
      teaching_profiles: pairsFromGroups(groups),
      custom_subjects: customSubjects.map((c) => ({ id: c.id, status: c.status })),
      mark_reviewed: true,
    };

    const { ok, data, error: err } = await adminJson(
      `/api/admin/tutors/${tutorId}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      null
    );

    if (!ok || !data?.data?.tutor) {
      setError(err || "Could not save the tutor profile.");
      setSaving(false);
      return;
    }

    applyLoaded(data.data);
    setSuccess("Profile saved.");
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, saving, dirty, specializationIsOther, locationIds, groups, customSubjects, tutorId, applyLoaded]);

  // Ctrl/Cmd + S saves.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  /* ── Loading / error shells ───────────────────────────────────────── */
  if (loading) {
    return (
      <Shell>
        <div className="admin-page-header">
          <div>
            <div className="admin-breadcrumb">
              <Link href="/admin/tutors">Tutors</Link> / Tutor #{tutorId}
            </div>
            <h1>Tutor profile</h1>
            <p>Loading profile…</p>
          </div>
        </div>
        <div className="tp-skeleton" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading tutor profile…</span>
          <div className="skeleton" style={{ height: 128 }} />
          <div className="skeleton" style={{ height: 280 }} />
          <div className="skeleton" style={{ height: 280 }} />
        </div>
      </Shell>
    );
  }

  if (!ready) {
    return (
      <Shell>
        <div className="admin-page-header">
          <div>
            <div className="admin-breadcrumb">
              <Link href="/admin/tutors">Tutors</Link> / Tutor #{tutorId}
            </div>
            <h1>Tutor profile</h1>
          </div>
        </div>
        <div className="admin-table-wrap">
          <div className="admin-empty" role="alert">
            <span className="admin-empty-icon" aria-hidden="true">⚠</span>
            <h3>Unable to load this tutor</h3>
            <p>{loadError || "The requested tutor could not be found."}</p>
            <Link href="/admin/tutors" className="admin-btn admin-btn-primary">Back to tutors</Link>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Main render ──────────────────────────────────────────────────── */
  const fullName = [form.first_name, form.last_name].filter(Boolean).join(" ").trim();
  const initials = (form.first_name.charAt(0) + form.last_name.charAt(0)).toUpperCase() || "?";
  const experience = yearsSince(form.teaching_start_year);
  const age = ageFrom(form.date_of_birth);
  const whatsappDigits = form.whatsapp.replace(/\D/g, "");
  const waLink = whatsappDigits ? `https://wa.me/${whatsappDigits.length === 10 ? `91${whatsappDigits}` : whatsappDigits}` : null;
  const needsAreas = form.teaching_mode !== "Online" && locationIds.length === 0;
  const pendingCustom = customSubjects.filter((c) => c.status === "pending").length;

  return (
    <Shell mainClass={dirty ? "has-savebar" : ""}>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/tutors">Tutors</Link> / Tutor #{tutor.id}
          </div>
          <h1>{fullName || "Unnamed tutor"}</h1>
          <p>Edit the tutor&apos;s profile. Changes are written to the database when you save.</p>
        </div>

        <div className="tp-header-actions">
          {dirty && <span className="tp-unsaved">Unsaved changes</span>}
          <Link href="/admin/tutors" className="admin-btn admin-btn-secondary">Back to tutors</Link>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={viewAsTutor}
            disabled={viewingAs || dirty}
            title={dirty ? "Save or discard your changes first" : "Open this tutor's own panel, read-only"}
          >
            {viewingAs ? "Opening…" : "View as tutor"}
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" role="alert">{error}</div>
      )}
      {success && (
        <div className="admin-alert admin-alert-success" role="status">{success}</div>
      )}

      {/* ── Overview ── */}
      <section className="admin-section tp-overview" aria-label="Tutor overview">
        <div className="tp-avatar">
          {form.profile_image ? <img src={form.profile_image} alt="" /> : initials}
        </div>

        <div className="tp-identity">
          <h2>
            {fullName || "Unnamed tutor"}
            <span className={`admin-status-badge status-${form.status}`}>{form.status}</span>
            {form.verified && <span className="admin-boolean-badge is-yes">✓ Verified</span>}
          </h2>

          <div className="tp-meta">
            <span>ID #{tutor.id}</span>
            {form.gender && <span>{form.gender}</span>}
            {age != null && <span>{age} yrs old</span>}
            <span>{experience == null ? "Experience not set" : `${plural(experience, "yr")} experience`}</span>
            <span>Joined {formatDate(tutor.created_at)}</span>
          </div>

          <div className="tp-tags">
            {qualificationName && <span className="tp-tag">{qualificationName}</span>}
            {specializationName && (
              <span className="tp-tag">
                {specializationIsOther && form.specialization_other ? form.specialization_other : specializationName}
              </span>
            )}
            <span className="tp-tag">{form.teaching_mode}</span>
            {form.english_fluency && (
              <span className="tp-tag">English: {FLUENCY.find(([v]) => v === form.english_fluency)?.[1] || form.english_fluency}</span>
            )}
          </div>

          {(waLink || form.email) && (
            <div className="tp-quick-links">
              {waLink && (
                <a className="admin-btn admin-btn-secondary admin-btn-xs" href={waLink} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              )}
              {form.whatsapp && (
                <a className="admin-btn admin-btn-secondary admin-btn-xs" href={`tel:${form.whatsapp}`}>Call</a>
              )}
              {form.email && (
                <a className="admin-btn admin-btn-secondary admin-btn-xs" href={`mailto:${form.email}`}>Email</a>
              )}
            </div>
          )}
        </div>

        <div className="tp-controls">
          <h3>Account controls</h3>

          <label className="admin-form-group tp-field">
            <span>Status</span>
            <select className="admin-select" value={form.status} onChange={(e) => setField("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </label>

          <label className="tp-check">
            <input type="checkbox" checked={form.verified} onChange={(e) => setField("verified", e.target.checked)} />
            <span>
              Verified tutor
              <small>Shows the verified badge on the site</small>
            </span>
          </label>

          <label className="tp-check">
            <input type="checkbox" checked={form.profile_completed} onChange={(e) => setField("profile_completed", e.target.checked)} />
            <span>
              Profile completed
              <small>All mandatory details are filled in</small>
            </span>
          </label>
        </div>
      </section>

      <div className="tp-layout">
        <div className="tp-content">
          {/* ── Personal ── */}
          <Section id="personal" title="Personal details" description="Identity details maintained for this tutor.">
            <div className="tp-grid">
              <TextField label="First name" required value={form.first_name} onChange={(v) => setField("first_name", v)} />
              <TextField label="Last name" value={form.last_name} onChange={(v) => setField("last_name", v)} />
              <SelectField label="Gender" value={form.gender} options={GENDERS} onChange={(v) => setField("gender", v)} />
              <TextField
                label="Date of birth"
                type="date"
                value={form.date_of_birth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(v) => setField("date_of_birth", v)}
                hint={age != null ? `${age} years old` : undefined}
              />
              <SelectField label="Marital status" value={form.marital_status} options={MARITAL} onChange={(v) => setField("marital_status", v)} />
              <Field as="div" label="Own vehicle">
                <label className="tp-check">
                  <input
                    type="checkbox"
                    checked={form.own_vehicle}
                    onChange={(e) => setField("own_vehicle", e.target.checked)}
                  />
                  <span>
                    Has their own vehicle
                    <small>Affects how far they can reasonably travel to teach</small>
                  </span>
                </label>
              </Field>
              <TextField
                label="Profile image URL"
                type="url"
                value={form.profile_image}
                onChange={(v) => setField("profile_image", v)}
                placeholder="https://…"
              />
            </div>
          </Section>

          {/* ── Contact ── */}
          <Section id="contact" title="Contact details" description="Numbers and email used to coordinate classes.">
            <div className="tp-grid">
              <TextField label="WhatsApp number" type="tel" value={form.whatsapp} onChange={(v) => setField("whatsapp", v)} placeholder="10-digit mobile" />
              <TextField label="Alternate phone" type="tel" value={form.alternate_phone} onChange={(v) => setField("alternate_phone", v)} />
              <TextField label="Email address" type="email" value={form.email} onChange={(v) => setField("email", v)} />
              <TextField label="Family contact number" type="tel" value={form.family_phone} onChange={(v) => setField("family_phone", v)} />
              <TextField label="Family contact relation" value={form.family_relation} onChange={(v) => setField("family_relation", v)} placeholder="e.g. Father, Spouse" />
            </div>
          </Section>

          {/* ── Address ── */}
          <Section id="address" title="Address & residence" description="Where the tutor lives; used to judge travel range.">
            <div className="tp-grid">
              <TextArea label="Present address" value={form.present_address} onChange={(v) => setField("present_address", v)} />
              <TextArea label="Permanent address" value={form.permanent_address} onChange={(v) => setField("permanent_address", v)} />
              <SelectField label="Residential status" value={form.residential_status} options={RESIDENTIAL} onChange={(v) => setField("residential_status", v)} />
            </div>
          </Section>

          {/* ── Education ── */}
          <Section id="education" title="Education & expertise" description="Academic credentials and language comfort.">
            <div className="tp-grid">
              <SelectField label="Highest qualification" value={form.highest_qualification_id} options={options.qualifications} onChange={(v) => setField("highest_qualification_id", v)} />
              <SelectField label="Specialization" value={form.specialization_id} options={options.specializations} onChange={(v) => setField("specialization_id", v)} />
              {specializationIsOther && (
                <TextField
                  label="Specialization (other)"
                  required
                  value={form.specialization_other}
                  onChange={(v) => setField("specialization_other", v)}
                  hint="Shown because the specialization is set to Other."
                />
              )}
              <TextField label="Institution" value={form.institution} onChange={(v) => setField("institution", v)} placeholder="University / college" />
              <TextField label="Additional qualification" value={form.additional_qualification} onChange={(v) => setField("additional_qualification", v)} placeholder="e.g. B.Ed, CTET" />
              <SelectField label="English teaching comfort" value={form.english_fluency} options={FLUENCY} onChange={(v) => setField("english_fluency", v)} />
            </div>
          </Section>

          {/* ── Teaching ── */}
          <Section id="teaching" title="Teaching profile" description="Experience, mode of teaching and current school employment.">
            <div className="tp-stats">
              <Stat label="Experience" value={experience == null ? "—" : plural(experience, "year")} />
              <Stat label="Class–subject pairs" value={pairs.length} />
              <Stat label="Teaching areas" value={locationIds.length} />
              <Stat label="Teaching mode" value={form.teaching_mode} />
            </div>

            <div className="tp-grid">
              <SelectField label="Teaching since (year)" value={form.teaching_start_year} options={YEARS} placeholder="Select year" onChange={(v) => setField("teaching_start_year", v)} />
              <SelectField label="Teaching mode" value={form.teaching_mode} options={MODES} placeholder={null} onChange={(v) => setField("teaching_mode", v)} />

              <Field as="div" label="School teaching">
                <label className="tp-check">
                  <input type="checkbox" checked={form.teaches_in_school} onChange={(e) => setField("teaches_in_school", e.target.checked)} />
                  <span>
                    Currently teaches in a school / institute
                    <small>{form.teaches_in_school ? "Add the school details alongside" : "Full-time private tutor / freelance"}</small>
                  </span>
                </label>
              </Field>

              {form.teaches_in_school && (
                <TextArea label="School name & address" required value={form.school_name_address} onChange={(v) => setField("school_name_address", v)} />
              )}
            </div>
          </Section>

          {/* ── Classes & subjects ── */}
          <Section
            id="subjects"
            title="Classes & subjects"
            description="Each group pairs every selected class with every selected subject."
            action={<button type="button" className="admin-btn admin-btn-secondary" onClick={addGroup}>+ Add group</button>}
          >
            <div className="tp-groups">
              {groups.map((group, index) => {
                const incomplete = Boolean(group.classes.length) !== Boolean(group.subjects.length);
                return (
                  <div className="tp-group" key={index}>
                    <div className="tp-group-head">
                      <div>
                        <strong>Group {index + 1}</strong>
                        <span>
                          {plural(group.classes.length, "class")} · {plural(group.subjects.length, "subject")} ·{" "}
                          {plural(group.classes.length * group.subjects.length, "pair")}
                        </span>
                      </div>
                      <button type="button" className="tp-link-btn danger" onClick={() => removeGroup(index)}>
                        Remove group
                      </button>
                    </div>

                    <div className="tp-group-body">
                      <ChipColumn
                        title="Classes"
                        ids={sorted("classes", group.classes)}
                        nameOf={(id) => nameOf("classes", id)}
                        emptyText="No classes selected"
                        onEdit={() => setPicker({ kind: "classes", group: index })}
                        onRemove={(id) => toggleGroupValue(index, "classes", id)}
                      />
                      <ChipColumn
                        title="Subjects"
                        gold
                        ids={sorted("subjects", group.subjects)}
                        nameOf={(id) => nameOf("subjects", id)}
                        emptyText="No subjects selected"
                        onEdit={() => setPicker({ kind: "subjects", group: index })}
                        onRemove={(id) => toggleGroupValue(index, "subjects", id)}
                      />
                    </div>

                    {incomplete && (
                      <div className="tp-warning" role="note">
                        <span aria-hidden="true">⚠</span>
                        This group needs at least one class and one subject — otherwise it is ignored on save.
                      </div>
                    )}
                  </div>
                );
              })}

              {groups.length === 0 && (
                <button type="button" className="tp-add-group" onClick={addGroup}>
                  + Add the first class &amp; subject group
                </button>
              )}
            </div>

            <div className="tp-note">
              <span aria-hidden="true">ℹ</span>
              <p>
                Saving stores <b>{plural(pairs.length, "class–subject pair")}</b>
                {incompleteGroups ? ` (${plural(incompleteGroups, "incomplete group")} skipped)` : ""}. Example: Classes 8, 9 with Maths, Science
                creates four pairs.
              </p>
            </div>
          </Section>

          {/* ── Teaching areas ── */}
          <Section
            id="areas"
            title="Teaching areas"
            description="Localities the tutor can travel to for in-person classes."
            action={<button type="button" className="admin-btn admin-btn-secondary" onClick={() => setPicker({ kind: "locations" })}>+ Add areas</button>}
          >
            <div className="tp-chips">
              {locationIds.length ? (
                sorted("locations", locationIds).map((id) => (
                  <span className="admin-chip tp-chip-gold" key={id}>
                    {nameOf("locations", id)}
                    <button type="button" aria-label={`Remove ${nameOf("locations", id)}`} onClick={() => toggleLocation(id)}>×</button>
                  </span>
                ))
              ) : (
                <span className="tp-empty-text">
                  {form.teaching_mode === "Online" ? "Online-only tutor — no areas required." : "No teaching areas selected."}
                </span>
              )}
            </div>
            {needsAreas && (
              <p className="tp-hint" style={{ marginTop: 10 }}>
                This tutor teaches in person but has no areas, so they will not appear in location-based matching.
              </p>
            )}
          </Section>

          {/* ── Custom subjects ── */}
          <Section
            id="custom"
            title="Custom subjects"
            description="Subjects the tutor typed in that are not in the catalogue. Approve or reject them here."
            action={
              pendingCustom > 0 ? (
                <span className="tp-unsaved">{plural(pendingCustom, "pending request")}</span>
              ) : null
            }
          >
            {customSubjects.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table tp-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Class</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customSubjects.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.subject_name}</strong></td>
                        <td>{item.class_name}</td>
                        <td>
                          <select
                            className="admin-select admin-select-sm tp-status-select"
                            value={item.status}
                            onChange={(e) => setCustomStatus(item.id, e.target.value)}
                            aria-label={`Status for ${item.subject_name}`}
                          >
                            {CUSTOM_STATUSES.map((status) => (
                              <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="tp-readonly">No custom subject requests for this tutor.</div>
            )}
          </Section>

          {/* ── Source & notes ── */}
          <Section id="source" title="Source & notes" description="How the tutor found us, referral details and internal remarks.">
            <div className="tp-grid">
              <SelectField label="How did they hear about us?" value={form.source_channel} options={SOURCES} onChange={(v) => setField("source_channel", v)} />
              <Field as="div" label="Terms & conditions">
                <div className="tp-readonly">
                  {truthy(tutor.terms_accepted) ? "✓ Accepted at registration" : "Not accepted"}
                </div>
              </Field>
              <TextField label="Referred by (name)" value={form.referred_by_name} onChange={(v) => setField("referred_by_name", v)} />
              <TextField label="Referrer contact number" type="tel" value={form.referral_phone} onChange={(v) => setField("referral_phone", v)} />
              <TextArea label="Comments / notes" value={form.comment} onChange={(v) => setField("comment", v)} placeholder="Achievements, teaching philosophy, preferred hours, internal remarks…" />
            </div>
          </Section>

          <div className="tp-record">
            <span>Created <b>{formatDateTime(tutor.created_at)}</b></span>
            <span>Last updated <b>{formatDateTime(tutor.updated_at)}</b></span>
            <span>Last reviewed by admin <b>{formatDateTime(tutor.last_profile_reviewed_at)}</b></span>
          </div>
        </div>
      </div>

      {dirty && (
        <div className="tp-savebar" role="region" aria-label="Unsaved changes">
          <p>
            You have unsaved changes
            <span>Saving writes directly to the database and marks the profile as reviewed.</span>
          </p>
          <div>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={discard} disabled={saving}>Discard</button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}

      {pickerState && (
        <PickerModal
          {...pickerState}
          onToggle={togglePicked}
          onClear={clearPicked}
          onClose={closePicker}
        />
      )}
    </Shell>
  );
}

/* ========================================================================
   Layout pieces
   ======================================================================== */

function Shell({ mainClass = "", children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className={`admin-main tp-main ${mainClass}`}>{children}</main>
    </div>
  );
}

function Section({ id, title, description, action, children }) {
  return (
    <section id={`tp-${id}`} className="admin-section tp-section" aria-labelledby={`tp-${id}-title`}>
      <div className="tp-section-head">
        <div>
          <h2 id={`tp-${id}-title`}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="tp-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChipColumn({ title, ids, nameOf, emptyText, gold, onEdit, onRemove }) {
  return (
    <div className="tp-group-col">
      <div className="tp-col-head">
        <div>
          <strong>{title}</strong>
          <small>{ids.length} selected</small>
        </div>
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-xs" onClick={onEdit}>
          Edit
        </button>
      </div>
      <div className="tp-chips">
        {ids.length ? (
          ids.map((id) => (
            <span className={`admin-chip${gold ? " tp-chip-gold" : ""}`} key={id}>
              {nameOf(id)}
              <button type="button" aria-label={`Remove ${nameOf(id)}`} onClick={() => onRemove(id)}>×</button>
            </span>
          ))
        ) : (
          <span className="tp-empty-text">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
   Form fields
   ======================================================================== */

function Field({ as: Tag = "label", label, required, hint, span, children }) {
  return (
    <Tag className={`admin-form-group tp-field${span ? " tp-span-2" : ""}`}>
      <span>
        {label}
        {required && <i className="tp-required" aria-hidden="true"> *</i>}
      </span>
      {children}
      {hint && <small className="tp-hint">{hint}</small>}
    </Tag>
  );
}

function TextField({ label, value, onChange, type = "text", required, hint, span, ...inputProps }) {
  return (
    <Field label={label} required={required} hint={hint} span={span}>
      <input className="admin-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} {...inputProps} />
    </Field>
  );
}

function TextArea({ label, value, onChange, required, hint, span, ...inputProps }) {
  return (
    <Field label={label} required={required} hint={hint} span={span}>
      <textarea className="admin-input" value={value} onChange={(e) => onChange(e.target.value)} {...inputProps} />
    </Field>
  );
}

const toOption = (item) =>
  typeof item === "string"
    ? { value: item, label: item }
    : Array.isArray(item)
      ? { value: item[0], label: item[1] }
      : { value: key(item.id), label: item.name };

function SelectField({ label, value, onChange, options, placeholder, required, hint, span }) {
  const list = options.map(toOption);
  // A stored value missing from the option list (legacy / inactive) still shows instead of silently blanking.
  if (value && !list.some((o) => o.value === value)) list.push({ value, label: `${value} (not in list)` });

  return (
    <Field label={label} required={required} hint={hint} span={span}>
      <select className="admin-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder !== null && <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>}
        {list.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

/* ========================================================================
   Picker modal (classes / subjects / locations)
   ======================================================================== */

const LOCATION_GROUPS = [
  ["locality", "Localities"],
  ["city", "Cities"],
  ["state", "States"],
];

function PickerModal({ title, subtitle, items, selected, grouped, detail, onToggle, onClear, onClose }) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((item) => item.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const sections = useMemo(() => {
    if (!grouped) return [{ id: "all", label: null, items: filtered }];
    return LOCATION_GROUPS.map(([type, label]) => ({
      id: type,
      label,
      items: filtered.filter((item) => item.location_type === type),
    })).filter((section) => section.items.length);
  }, [filtered, grouped]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-card tp-picker" role="dialog" aria-modal="true" aria-labelledby="tp-picker-title">
        <div className="modal-header">
          <div>
            <h2 id="tp-picker-title">{title}</h2>
            <p className="tp-hint">
              {subtitle} · {selected.size} selected
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="tp-picker-tools">
          <input
            className="admin-input"
            type="search"
            autoFocus
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search options"
          />
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClear} disabled={!selected.size}>
            Clear
          </button>
        </div>

        <div className="modal-body">
          {sections.map((section) => (
            <div key={section.id}>
              {section.label && <div className="tp-picker-group">{section.label}</div>}
              <div className="tp-picker-list">
                {section.items.map((item) => {
                  const on = selected.has(key(item.id));
                  const extra = detail ? detail(item) : null;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`tp-option${on ? " selected" : ""}`}
                      aria-pressed={on}
                      onClick={() => onToggle(item.id)}
                    >
                      <span className="tp-option-check" aria-hidden="true">{on ? "✓" : ""}</span>
                      <span>{item.name}</span>
                      {extra && <small>{extra}</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="tp-picker-empty">
              {items.length ? `No matches for “${search}”.` : "Nothing to choose from yet."}
            </div>
          )}
        </div>

        <div className="tp-picker-footer">
          <span className="tp-hint">Click an item to select or deselect it.</span>
          <button type="button" className="admin-btn admin-btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
