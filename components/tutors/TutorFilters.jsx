// components/tutors/TutorFilters.jsx
//
// Filter controls for /tutors. Every choice is written to the URL, so a
// filtered view is shareable, bookmarkable and back-button friendly — and the
// page itself stays a server component that crawlers can read.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

const EXPERIENCE_STEPS = [
  ["", "Any experience"],
  ["2", "2+ years"],
  ["5", "5+ years"],
  ["10", "10+ years"],
];

const MODES = [
  ["", "Any mode"],
  ["In-person", "At my home"],
  ["Online", "Online"],
];

const GENDERS = [
  ["", "Any"],
  ["Female", "Female"],
  ["Male", "Male"],
];

const SORTS = [
  ["recommended", "Recommended"],
  ["experience", "Most experienced"],
  ["newest", "Recently joined"],
  ["name", "Name (A–Z)"],
];

export default function TutorFilters({ facets, active, coreSubjectSlugs = [] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  /** Rewrite one param and reset to page 1 — a filter change invalidates paging. */
  function setParam(key, value) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(next.toString() ? `/tutors?${next}` : "/tutors", { scroll: false });
  }

  /*
   * The name box keeps its own state so typing stays responsive, and only
   * writes to the URL once typing pauses — otherwise every keystroke would be a
   * server round trip and a history entry.
   */
  const [nameInput, setNameInput] = useState(params.get("q") || "");
  const debouncedName = useDebouncedValue(nameInput, 400);
  const lastPushed = useRef(params.get("q") || "");

  useEffect(() => {
    if (debouncedName === lastPushed.current) return;
    lastPushed.current = debouncedName;

    const next = new URLSearchParams(params.toString());
    if (debouncedName.trim()) next.set("q", debouncedName.trim());
    else next.delete("q");
    next.delete("page");
    // replace, not push: typing should not fill the back button with drafts.
    router.replace(next.toString() ? `/tutors?${next}` : "/tutors", { scroll: false });
  }, [debouncedName, params, router]);

  // Keep the box in step when the URL changes elsewhere (chip removed, reset).
  useEffect(() => {
    const fromUrl = params.get("q") || "";
    if (fromUrl !== lastPushed.current) {
      lastPushed.current = fromUrl;
      setNameInput(fromUrl);
    }
  }, [params]);

  // Subjects travel as one comma-separated param: ?subject=mathematics,science
  const selectedSubjects = String(params.get("subject") || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const toggleSubject = (slug) =>
    setParam(
      "subject",
      (selectedSubjects.includes(slug)
        ? selectedSubjects.filter((x) => x !== slug)
        : [...selectedSubjects, slug]
      ).join(",")
    );

  // Every core subject already chosen? Then the button clears them instead.
  const availableCore = coreSubjectSlugs.filter((slug) => facets.subjects.some((s) => s.slug === slug));
  const allCoreChosen =
    availableCore.length > 0 && availableCore.every((slug) => selectedSubjects.includes(slug));


  const activeCount = ["q", "subject", "class", "area", "gender", "mode", "minExperience"].filter(
    (k) => params.get(k)
  ).length;

  // Counts are no longer shown, but they still decide which options appear:
  // areas are long-tailed — 239 have a tutor, most have only one or two — and
  // a 239-item menu of mostly-empty choices is worse than a short useful one.
  const areaOptions = facets.areas.filter((a) => a.tutor_count >= 3);
  const subjectOptions = facets.subjects.filter((s) => s.tutor_count >= 3);
  const classOptions = facets.classes.filter((c) => c.tutor_count >= 3);

  return (
    <div className="td-filters">
      <button
        type="button"
        className="td-filter-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Filters{activeCount ? ` (${activeCount})` : ""}
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>

      <div className={`td-filter-body${open ? " is-open" : ""}`}>
        <label className="td-field">
          <span>Search by name</span>
          <input
            type="search"
            className="td-search-input"
            placeholder="Tutor name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </label>

        <div className="td-field">
          <span>
            Subjects
            {selectedSubjects.length > 0 && ` (${selectedSubjects.length})`}
          </span>

          {/* <p className="td-field-note">
            Pick more than one to find a tutor who teaches all of them.
          </p> */}

          <div className="td-subject-list" role="group" aria-label="Subjects">
            {/* "All subjects" sits at the top of the same list rather than
                beside it: it is a subject choice, not a different control. */}
            {availableCore.length > 0 && (
              <button
                type="button"
                className={`td-subject-opt td-subject-all${allCoreChosen ? " is-on" : ""}`}
                aria-pressed={allCoreChosen}
                onClick={() => setParam("subject", allCoreChosen ? "" : availableCore.join(","))}
                title="Maths, Science, Social Science, English and Hindi"
              >
                <span className="td-tick" aria-hidden="true">{allCoreChosen ? "✓" : ""}</span>
                All subjects
              </button>
            )}

            {subjectOptions.map((s) => {
              const on = selectedSubjects.includes(s.slug);
              return (
                <button
                  type="button"
                  key={s.slug}
                  className={`td-subject-opt${on ? " is-on" : ""}`}
                  aria-pressed={on}
                  onClick={() => toggleSubject(s.slug)}
                >
                  <span className="td-tick" aria-hidden="true">{on ? "✓" : ""}</span>
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <Select
          label="Class"
          value={params.get("class") || ""}
          onChange={(v) => setParam("class", v)}
          placeholder="All classes"
          options={classOptions.map((c) => [c.slug, c.name])}
        />

        <Select
          label="Area"
          value={params.get("area") || ""}
          onChange={(v) => setParam("area", v)}
          placeholder="All areas"
          options={areaOptions.map((a) => [a.slug, a.name])}
        />

        <Select
          label="Experience"
          value={params.get("minExperience") || ""}
          onChange={(v) => setParam("minExperience", v)}
          options={EXPERIENCE_STEPS}
          bare
        />

        <Select
          label="Teaching mode"
          value={params.get("mode") || ""}
          onChange={(v) => setParam("mode", v)}
          options={MODES}
          bare
        />

        <Select
          label="Tutor gender"
          value={params.get("gender") || ""}
          onChange={(v) => setParam("gender", v)}
          options={GENDERS}
          bare
        />

        <Select
          label="Sort by"
          value={params.get("sort") || "recommended"}
          onChange={(v) => setParam("sort", v === "recommended" ? "" : v)}
          options={SORTS}
          bare
        />

        {activeCount > 0 && (
          <button type="button" className="td-clear" onClick={() => router.push("/tutors")}>
            Clear all filters
          </button>
        )}
      </div>

      {active.length > 0 && (
        <div className="td-active-chips">
          {active.map((chip) => (
            <button
              key={`${chip.key}:${chip.value || ""}`}
              type="button"
              className="td-chip"
              onClick={() =>
                chip.key === "subject" && chip.value
                  ? toggleSubject(chip.value)
                  : setParam(chip.key, "")
              }
              aria-label={`Remove ${chip.label} filter`}
            >
              {chip.label} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder, bare = false }) {
  return (
    <label className="td-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {!bare && <option value="">{placeholder}</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
