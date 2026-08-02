// // app/api/tutors/route.js — POST: tutor registration

// import { NextResponse } from "next/server";
// import { execute } from "@/lib/db";

// export async function POST(req) {
//   try {
//     const b = await req.json();

//     if (!b.firstName || !b.whatsapp || !b.email) {
//       return NextResponse.json(
//         { error: "First name, WhatsApp, and email are required" },
//         { status: 400 }
//       );
//     }
//     if (!b.terms) {
//       return NextResponse.json(
//         { error: "You must accept the Terms & Conditions" },
//         { status: 400 }
//       );
//     }

//     const result = await execute(
//       `INSERT INTO tutors (
//         first_name, last_name, gender, dob, marital_status, own_vehicle,
//         whatsapp, alt_number, email, family_mobile, family_relation,
//         present_address, permanent_address, residential_status,
//         qualification, additional_qual, english_fluency,
//         experience_years, school_teaching, school_details,
//         classes_taught, subjects, areas,
//         advertisement_source, referred_by_name, referred_by_contact,
//         comment, terms_accepted
//       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//       [
//         b.firstName, b.lastName, b.gender,
//         b.dob || null, b.maritalStatus || null, b.vehicle === "Yes" ? 1 : 0,
//         b.whatsapp, b.altNumber || null, b.email,
//         b.familyMobile || null, b.relation || null,
//         b.presentAddress || null, b.permanentAddress || null, b.residentialStatus || null,
//         b.qualification || null, b.additionalQualification || null, b.englishFluency || null,
//         parseInt(b.experience) || 0, b.schoolTeaching === "Yes" ? 1 : 0, b.schoolDetails || null,
//         b.classes || null, b.subjects || null, b.areas || null,
//         b.advertisement || null, b.friendName || null, b.friendContact || null,
//         b.comment || null, 1,
//       ]
//     );

//     return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
//   } catch (err) {
//     console.error("[tutors POST]", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }

// app/api/tutors/route.js — POST: tutor registration

import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

const GENDERS  = ["Male", "Female", "Other"];
const MARITAL  = ["Single", "Married", "Other"];
const RESIDENT = ["Owned", "Rented", "PG/Hostel"];
const FLUENCY  = ["Basic", "Intermediate", "Fluent"];

// Blank strings are not valid ENUM members under MySQL strict mode — send NULL.
function enumOrNull(value, allowed) {
  return allowed.includes(value) ? value : null;
}

// Free-text list fields are stored comma-separated; accept arrays too.
function listOrNull(value) {
  if (Array.isArray(value)) return value.length ? value.join(",") : null;
  return value ? String(value) : null;
}

export async function POST(req) {
  try {
    const b = await req.json();

    if (!b.firstName || !b.whatsapp || !b.email) {
      return NextResponse.json(
        { error: "First name, WhatsApp, and email are required" },
        { status: 400 }
      );
    }
    // last_name and gender are NOT NULL in the schema — validating here returns
    // a useful 400 instead of a generic "Server error" from MySQL.
    if (!b.lastName) {
      return NextResponse.json({ error: "Last name is required" }, { status: 400 });
    }
    if (!GENDERS.includes(b.gender)) {
      return NextResponse.json({ error: "Please select a valid gender" }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(b.email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (!/^[0-9+\-\s]{10,15}$/.test(String(b.whatsapp))) {
      return NextResponse.json({ error: "Please enter a valid WhatsApp number" }, { status: 400 });
    }
    if (!b.terms) {
      return NextResponse.json(
        { error: "You must accept the Terms & Conditions" },
        { status: 400 }
      );
    }

    // TINYINT UNSIGNED — a negative or absurd value aborted the INSERT.
    const experience = Math.min(Math.max(parseInt(b.experience, 10) || 0, 0), 99);

    const result = await execute(
      `INSERT INTO tutors (
        first_name, last_name, gender, dob, marital_status, own_vehicle,
        whatsapp, alt_number, email, family_mobile, family_relation,
        present_address, permanent_address, residential_status,
        qualification, additional_qual, english_fluency,
        experience_years, school_teaching, school_details,
        classes_taught, subjects, areas,
        advertisement_source, referred_by_name, referred_by_contact,
        comment, terms_accepted
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        b.firstName, b.lastName, b.gender,
        b.dob || null, enumOrNull(b.maritalStatus, MARITAL), b.vehicle === "Yes" ? 1 : 0,
        b.whatsapp, b.altNumber || null, b.email,
        b.familyMobile || null, b.relation || null,
        b.presentAddress || null, b.permanentAddress || null, enumOrNull(b.residentialStatus, RESIDENT),
        b.qualification || null, b.additionalQualification || null, enumOrNull(b.englishFluency, FLUENCY),
        experience, b.schoolTeaching === "Yes" ? 1 : 0, b.schoolDetails || null,
        listOrNull(b.classes), listOrNull(b.subjects), listOrNull(b.areas),
        b.advertisement || null, b.friendName || null, b.friendContact || null,
        b.comment || null, 1,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (err) {
    console.error("[tutors POST]", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "An application with these details already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}