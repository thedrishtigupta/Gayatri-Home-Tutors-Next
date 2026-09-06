// app/api/admin/tutors/[id]/route.js — load + edit a single tutor (admin)

import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// Enum values mirror the `tutors` table in database/ght-v3-schema.sql.
const STATUSES = ["active", "inactive", "blacklisted"];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL = ["Single", "Married", "Widowed", "Divorced", "Other"];
const RESIDENTIAL = ["Own", "Rented", "Parental", "PG/Hostel", "Other"];
const FLUENCY = ["Yes", "Average", "No"];
const MODES = ["In-person", "Online", "Both"];
const CUSTOM_SUBJECT_STATUSES = ["pending", "approved", "rejected"];

const CURRENT_YEAR = new Date().getFullYear();

class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function parseId(raw) {
  const id = Number.parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/* -------------------------------------------------------------------------
   Field converters

   Every converter returns `undefined` when the key was not sent at all, so a
   partial PATCH (the tutors list toggling `verified`) never touches any other
   column. An empty string means "clear this field".
   ------------------------------------------------------------------------- */

function text(value, max) {
  if (value === undefined) return undefined;
  const s = value === null ? "" : String(value).trim();
  if (!s) return null;
  return max ? s.slice(0, max) : s;
}

function bit(value) {
  if (value === undefined) return undefined;
  return value === true || value === 1 || value === "1" || value === "true" ? 1 : 0;
}

function oneOf(value, allowed, label, { nullable = true } = {}) {
  if (value === undefined) return undefined;
  if (value === null || value === "") {
    // NOT NULL columns keep their current value when cleared.
    return nullable ? null : undefined;
  }
  if (!allowed.includes(value)) throw new ValidationError(`Invalid ${label}.`);
  return value;
}

function foreignId(value, label) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const id = parseId(value);
  if (!id) throw new ValidationError(`Invalid ${label}.`);
  return id;
}

function phone(value, label) {
  const s = text(value, 20);
  if (!s) return s;
  const compact = s.replace(/[\s-]/g, "");
  if (!/^\+?\d{6,15}$/.test(compact)) {
    throw new ValidationError(`${label} must be 6–15 digits.`);
  }
  return compact.slice(0, 15);
}

function email(value) {
  const s = text(value, 120);
  if (!s) return s;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    throw new ValidationError("Email address is invalid.");
  }
  return s;
}

function isoDate(value, label) {
  const s = text(value, 10);
  if (!s) return s;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
    throw new ValidationError(`${label} must be a valid date.`);
  }
  if (Date.parse(s) > Date.now()) {
    throw new ValidationError(`${label} cannot be in the future.`);
  }
  return s;
}

function year(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const y = Number.parseInt(value, 10);
  if (!Number.isInteger(y) || y < 1950 || y > CURRENT_YEAR) {
    throw new ValidationError(`Teaching start year must be between 1950 and ${CURRENT_YEAR}.`);
  }
  return y;
}

function idList(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(parseId).filter(Boolean))];
}

/** Deduplicated [classId, subjectId] pairs. */
function teachingPairs(values) {
  const seen = new Set();
  const pairs = [];
  for (const row of Array.isArray(values) ? values : []) {
    const classId = parseId(row?.class_id);
    const subjectId = parseId(row?.subject_id);
    if (!classId || !subjectId) continue;
    const k = `${classId}:${subjectId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    pairs.push([classId, subjectId]);
  }
  return pairs;
}

function customSubjectUpdates(values) {
  return (Array.isArray(values) ? values : []).map((row) => {
    const rowId = parseId(row?.id);
    if (!rowId) throw new ValidationError("Invalid custom subject.");
    if (!CUSTOM_SUBJECT_STATUSES.includes(row?.status)) {
      throw new ValidationError("Invalid custom subject status.");
    }
    return { id: rowId, status: row.status };
  });
}

/* -------------------------------------------------------------------------
   Reads
   ------------------------------------------------------------------------- */

async function loadTutor(id, run = query) {
  const rows = await run(
    `SELECT
       t.*,
       DATE_FORMAT(t.date_of_birth, '%Y-%m-%d') AS dob_iso,
       q.name  AS qualification_name,
       sp.name AS specialization_name
     FROM tutors t
     LEFT JOIN qualifications q  ON q.id  = t.highest_qualification_id
     LEFT JOIN specializations sp ON sp.id = t.specialization_id
     WHERE t.id = ?`,
    [id]
  );

  const tutor = rows[0];
  if (!tutor) return null;

  // DATE columns come back as JS Dates and shift a day when serialised to UTC.
  tutor.date_of_birth = tutor.dob_iso;
  delete tutor.dob_iso;
  return tutor;
}

async function related(id) {
  const [locations, teachingProfiles, customSubjects] = await Promise.all([
    query(
      `SELECT l.id, l.name, l.slug, l.location_type, l.parent_location_id
       FROM tutor_locations tl
       JOIN locations l ON l.id = tl.location_id
       WHERE tl.tutor_id = ?
       ORDER BY l.name`,
      [id]
    ),
    // tutor_teaching_profiles has no id column: rows are keyed by tutor + class + subject.
    query(
      `SELECT ttp.class_id, c.name AS class_name, ttp.subject_id, s.name AS subject_name
       FROM tutor_teaching_profiles ttp
       JOIN classes c  ON c.id = ttp.class_id
       JOIN subjects s ON s.id = ttp.subject_id
       WHERE ttp.tutor_id = ?
       ORDER BY c.sort_order, c.id, s.name`,
      [id]
    ),
    query(
      `SELECT tcs.id, tcs.class_id, c.name AS class_name, tcs.subject_name, tcs.status
       FROM tutor_custom_subjects tcs
       JOIN classes c ON c.id = tcs.class_id
       WHERE tcs.tutor_id = ?
       ORDER BY tcs.id DESC`,
      [id]
    ),
  ]);

  return { locations, teachingProfiles, customSubjects };
}

async function assertExists(tx, table, id, label) {
  if (!id) return;
  const rows = await tx.query(`SELECT id FROM ${table} WHERE id = ?`, [id]);
  if (!rows.length) throw new ValidationError(`Selected ${label} does not exist.`);
}

async function assertAllExist(tx, table, ids, label) {
  if (!ids.length) return;
  const rows = await tx.query(
    `SELECT id FROM ${table} WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids
  );
  if (rows.length !== ids.length) {
    throw new ValidationError(`One or more selected ${label} do not exist.`);
  }
}

/* -------------------------------------------------------------------------
   GET /api/admin/tutors/:id
   ------------------------------------------------------------------------- */

export const GET = requireAdmin(async (_req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const tutor = await loadTutor(id);
  if (!tutor) return NextResponse.json({ error: "Tutor not found" }, { status: 404 });

  return NextResponse.json({ data: { tutor, ...(await related(id)) } });
});

/* -------------------------------------------------------------------------
   PATCH /api/admin/tutors/:id

   Accepts any subset of tutor columns plus:
     location_ids       number[]                    replaces tutor_locations
     teaching_profiles  {class_id, subject_id}[]    replaces tutor_teaching_profiles
     custom_subjects    {id, status}[]              updates tutor_custom_subjects.status
     mark_reviewed      boolean                     stamps last_profile_reviewed_at
   ------------------------------------------------------------------------- */

export const PATCH = requireAdmin(async (req, { params }) => {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const columns = {
      first_name:               text(body.first_name, 80),
      last_name:                text(body.last_name, 80),
      gender:                   oneOf(body.gender, GENDERS, "gender"),
      date_of_birth:            isoDate(body.date_of_birth, "Date of birth"),
      marital_status:           oneOf(body.marital_status, MARITAL, "marital status"),
      own_vehicle:              bit(body.own_vehicle),
      whatsapp:                 phone(body.whatsapp, "WhatsApp number"),
      alternate_phone:          phone(body.alternate_phone, "Alternate phone"),
      email:                    email(body.email),
      family_phone:             phone(body.family_phone, "Family phone"),
      family_relation:          text(body.family_relation, 60),
      present_address:          text(body.present_address),
      permanent_address:        text(body.permanent_address),
      residential_status:       oneOf(body.residential_status, RESIDENTIAL, "residential status"),
      highest_qualification_id: foreignId(body.highest_qualification_id, "qualification"),
      specialization_id:        foreignId(body.specialization_id, "specialization"),
      specialization_other:     text(body.specialization_other, 150),
      institution:              text(body.institution, 200),
      additional_qualification: text(body.additional_qualification, 120),
      english_fluency:          oneOf(body.english_fluency, FLUENCY, "English fluency"),
      teaching_start_year:      year(body.teaching_start_year),
      teaches_in_school:        bit(body.teaches_in_school),
      school_name_address:      text(body.school_name_address),
      teaching_mode:            oneOf(body.teaching_mode, MODES, "teaching mode", { nullable: false }),
      source_channel:           text(body.source_channel, 50),
      referred_by_name:         text(body.referred_by_name, 80),
      referral_phone:           phone(body.referral_phone, "Referral phone"),
      comment:                  text(body.comment),
      profile_image:            text(body.profile_image, 255),
      status:                   oneOf(body.status, STATUSES, "status", { nullable: false }),
      verified:                 bit(body.verified),
      profile_completed:        bit(body.profile_completed),
    };

    if (columns.first_name === null) throw new ValidationError("First name is required.");
    if (columns.teaches_in_school === 0) columns.school_name_address = null;

    const locationIds = "location_ids" in body ? idList(body.location_ids) : null;
    const pairs = "teaching_profiles" in body ? teachingPairs(body.teaching_profiles) : null;
    const customSubjects = "custom_subjects" in body ? customSubjectUpdates(body.custom_subjects) : null;
    const markReviewed = Boolean(body.mark_reviewed);

    const sets = [];
    const vals = [];
    for (const [column, value] of Object.entries(columns)) {
      if (value === undefined) continue;
      sets.push(`${column} = ?`);
      vals.push(value);
    }
    if (markReviewed) sets.push("last_profile_reviewed_at = NOW()");

    if (!sets.length && !locationIds && !pairs && !customSubjects) {
      throw new ValidationError("Nothing to update.");
    }

    const tutor = await withTransaction(async (tx) => {
      const existing = await tx.query("SELECT id FROM tutors WHERE id = ? FOR UPDATE", [id]);
      if (!existing.length) throw new ValidationError("Tutor not found", 404);

      await assertExists(tx, "qualifications", columns.highest_qualification_id, "qualification");
      await assertExists(tx, "specializations", columns.specialization_id, "specialization");
      if (locationIds) await assertAllExist(tx, "locations", locationIds, "teaching areas");
      if (pairs) {
        await assertAllExist(tx, "classes", [...new Set(pairs.map((p) => p[0]))], "classes");
        await assertAllExist(tx, "subjects", [...new Set(pairs.map((p) => p[1]))], "subjects");
      }

      if (sets.length) {
        await tx.execute(
          `UPDATE tutors SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`,
          [...vals, id]
        );
      }

      if (locationIds) {
        await tx.execute("DELETE FROM tutor_locations WHERE tutor_id = ?", [id]);
        if (locationIds.length) {
          await tx.execute(
            `INSERT INTO tutor_locations (tutor_id, location_id)
             VALUES ${locationIds.map(() => "(?, ?)").join(",")}`,
            locationIds.flatMap((locationId) => [id, locationId])
          );
        }
      }

      if (pairs) {
        await tx.execute("DELETE FROM tutor_teaching_profiles WHERE tutor_id = ?", [id]);
        if (pairs.length) {
          await tx.execute(
            `INSERT INTO tutor_teaching_profiles (tutor_id, class_id, subject_id)
             VALUES ${pairs.map(() => "(?, ?, ?)").join(",")}`,
            pairs.flatMap(([classId, subjectId]) => [id, classId, subjectId])
          );
        }
      }

      if (customSubjects) {
        for (const row of customSubjects) {
          await tx.execute(
            "UPDATE tutor_custom_subjects SET status = ? WHERE id = ? AND tutor_id = ?",
            [row.status, row.id, id]
          );
        }
      }

      return loadTutor(id, tx.query);
    });

    return NextResponse.json({ ok: true, data: { tutor, ...(await related(id)) } });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    throw err;
  }
});
