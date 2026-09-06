// lib/tutorProfileFields.js
//
// The single definition of what a tutor may change about their own profile.
// The tutor API validates against it, the admin review queue renders labels
// from it, and both UIs build their forms from it — so a field can never be
// editable in one place and unknown in another.
//
// Anything absent here is not tutor-editable, by construction. That includes
// `email` (it is the login identifier and changing it needs re-verification),
// `status`, `verified`, `profile_completed`, and the referral fields, which are
// the office's record of how the tutor was acquired.

export const GENDERS = ["Male", "Female", "Other"];
export const MARITAL = ["Single", "Married", "Widowed", "Divorced", "Other"];
export const RESIDENTIAL = [
  ["Own", "Own house"],
  ["Rented", "Rented accommodation"],
  ["Parental", "Parental home"],
  ["PG/Hostel", "PG / Hostel"],
  ["Other", "Other"],
];
export const FLUENCY = [
  ["Yes", "Fluent (English medium)"],
  ["Average", "Average / conversational"],
  ["No", "Hindi / regional medium"],
];
export const MODES = ["In-person", "Online", "Both"];

const CURRENT_YEAR = new Date().getFullYear();

/**
 * type drives both validation and which control the form renders.
 *   text | textarea | date | year | select | ref | bool | relation
 * `ref` fields hold an id from a reference table named by `source`.
 * `relation` fields are JSON arrays reviewed as a whole, not per element.
 *
 * `checkboxLabel` is the text beside a `bool` field's tick box. It answers the
 * question the label asks, so the two never read as the same word twice.
 */
export const FIELDS = [
  { name: "first_name", label: "First name", type: "text", max: 80, required: true, group: "personal" },
  { name: "last_name", label: "Last name", type: "text", max: 80, group: "personal" },
  { name: "gender", label: "Gender", type: "select", options: GENDERS, group: "personal" },
  { name: "date_of_birth", label: "Date of birth", type: "date", group: "personal" },
  { name: "marital_status", label: "Marital status", type: "select", options: MARITAL, group: "personal" },
  { name: "own_vehicle", label: "Own vehicle", type: "bool", checkboxLabel: "Yes, I have my own vehicle", group: "personal" },

  { name: "whatsapp", label: "WhatsApp number", type: "phone", group: "contact" },
  { name: "alternate_phone", label: "Alternate phone", type: "phone", group: "contact" },
  { name: "family_phone", label: "Family contact number", type: "phone", group: "contact" },
  { name: "family_relation", label: "Family contact relation", type: "text", max: 60, group: "contact" },

  { name: "present_address", label: "Present address", type: "textarea", group: "address" },
  { name: "permanent_address", label: "Permanent address", type: "textarea", group: "address" },
  { name: "residential_status", label: "Residential status", type: "select", options: RESIDENTIAL, group: "address" },

  { name: "highest_qualification_id", label: "Highest qualification", type: "ref", source: "qualifications", group: "education" },
  { name: "specialization_id", label: "Specialization", type: "ref", source: "specializations", group: "education" },
  { name: "specialization_other", label: "Specialization (other)", type: "text", max: 150, group: "education" },
  { name: "institution", label: "Institution", type: "text", max: 200, group: "education" },
  { name: "additional_qualification", label: "Additional qualification", type: "text", max: 120, group: "education" },
  { name: "english_fluency", label: "English teaching comfort", type: "select", options: FLUENCY, group: "education" },

  { name: "teaching_start_year", label: "Teaching since (year)", type: "year", group: "teaching" },
  { name: "teaching_mode", label: "Teaching mode", type: "select", options: MODES, required: true, group: "teaching" },
  { name: "teaches_in_school", label: "School teaching", type: "bool", checkboxLabel: "Yes, I currently teach in a school or institute", group: "teaching" },
  { name: "school_name_address", label: "School name & address", type: "textarea", group: "teaching" },

  { name: "comment", label: "About me / notes", type: "textarea", group: "about" },

  { name: "teaching_profiles", label: "Classes & subjects", type: "relation", group: "teaching" },
  { name: "location_ids", label: "Teaching areas", type: "relation", group: "teaching" },
];

export const FIELD_BY_NAME = new Map(FIELDS.map((f) => [f.name, f]));
export const EDITABLE_NAMES = FIELDS.map((f) => f.name);

export const GROUP_LABELS = {
  personal: "Personal details",
  contact: "Contact details",
  address: "Address",
  education: "Education",
  teaching: "Teaching",
  about: "About",
};

/* =========================================================================
   Normalisation and validation
   ========================================================================= */

const digitsOnly = (v) => String(v).replace(/[\s-]/g, "");

/**
 * Coerce a submitted value into what the column stores.
 * Returns { value } or { error }. Empty means "clear it", except where the
 * field is required.
 */
export function normaliseField(field, raw) {
  const spec = FIELD_BY_NAME.get(field);
  if (!spec) return { error: `${field} cannot be edited.` };

  switch (spec.type) {
    case "bool":
      return { value: raw === true || raw === 1 || raw === "1" || raw === "true" ? 1 : 0 };

    case "relation": {
      if (!Array.isArray(raw)) return { error: `${spec.label} must be a list.` };
      if (field === "location_ids") {
        const ids = [...new Set(raw.map((n) => Number.parseInt(n, 10)).filter((n) => Number.isInteger(n) && n > 0))];
        return { value: ids };
      }
      // teaching_profiles: [{class_id, subject_id}, ...]
      const seen = new Set();
      const pairs = [];
      for (const row of raw) {
        const c = Number.parseInt(row?.class_id, 10);
        const s = Number.parseInt(row?.subject_id, 10);
        if (!Number.isInteger(c) || c <= 0 || !Number.isInteger(s) || s <= 0) continue;
        const k = `${c}:${s}`;
        if (seen.has(k)) continue;
        seen.add(k);
        pairs.push({ class_id: c, subject_id: s });
      }
      return { value: pairs };
    }

    case "ref": {
      if (raw === null || raw === undefined || raw === "") return { value: null };
      const id = Number.parseInt(raw, 10);
      if (!Number.isInteger(id) || id <= 0) return { error: `${spec.label} is not valid.` };
      return { value: id };
    }

    case "year": {
      if (raw === null || raw === undefined || raw === "") return { value: null };
      const y = Number.parseInt(raw, 10);
      if (!Number.isInteger(y) || y < 1950 || y > CURRENT_YEAR) {
        return { error: `${spec.label} must be between 1950 and ${CURRENT_YEAR}.` };
      }
      return { value: y };
    }

    case "date": {
      const s = String(raw ?? "").trim();
      if (!s) return { value: null };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
        return { error: `${spec.label} must be a valid date.` };
      }
      if (Date.parse(s) > Date.now()) return { error: `${spec.label} cannot be in the future.` };
      return { value: s };
    }

    case "phone": {
      const s = String(raw ?? "").trim();
      if (!s) return { value: null };
      const d = digitsOnly(s);
      if (!/^\+?\d{10,15}$/.test(d) && !/^[6-9]\d{9}$/.test(d)) {
        return { error: `${spec.label} must be a valid phone number.` };
      }
      return { value: d.replace(/^\+?91(?=\d{10}$)/, "").slice(0, 15) };
    }

    case "select": {
      const s = String(raw ?? "").trim();
      if (!s) {
        if (spec.required) return { error: `${spec.label} is required.` };
        return { value: null };
      }
      const allowed = spec.options.map((o) => (Array.isArray(o) ? o[0] : o));
      if (!allowed.includes(s)) return { error: `${spec.label} is not valid.` };
      return { value: s };
    }

    case "text":
    case "textarea":
    default: {
      const s = String(raw ?? "").trim();
      if (!s) {
        if (spec.required) return { error: `${spec.label} is required.` };
        return { value: null };
      }
      return { value: spec.max ? s.slice(0, spec.max) : s };
    }
  }
}

/** Stable string form, so comparisons and storage agree on what "changed" means. */
export function serialise(field, value) {
  const spec = FIELD_BY_NAME.get(field);
  if (value === null || value === undefined) return null;

  if (spec?.type === "relation") {
    const arr = field === "location_ids"
      ? [...value].map(Number).sort((a, b) => a - b)
      : [...value]
          .map((p) => ({ class_id: Number(p.class_id), subject_id: Number(p.subject_id) }))
          .sort((a, b) => a.class_id - b.class_id || a.subject_id - b.subject_id);
    return JSON.stringify(arr);
  }

  return String(value);
}

/** Did the tutor actually change this field? Compares serialised forms. */
export function hasChanged(field, currentValue, newValue) {
  return serialise(field, currentValue) !== serialise(field, newValue);
}
