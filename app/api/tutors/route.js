// app/api/tutors/route.js
// GHT V3 — tutor registration API

import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";

export const dynamic = "force-dynamic";

const CURRENT_YEAR = new Date().getFullYear();

const ALLOWED_GENDERS = new Set([
  "Male",
  "Female",
  "Other",
]);

const ALLOWED_MARITAL_STATUS = new Set([
  "Single",
  "Married",
  "Widowed",
  "Divorced",
  "Other",
]);

const ALLOWED_RESIDENTIAL_STATUS = new Set([
  "Own",
  "Rented",
  "Parental",
  "PG/Hostel",
  "Other",
]);

const ALLOWED_ENGLISH_FLUENCY = new Set([
  "Yes",
  "Average",
  "No",
]);

const ALLOWED_TEACHING_MODES = new Set([
  "In-person",
  "Online",
  "Both",
]);

function cleanText(value, maxLength = 255) {
  if (value === undefined || value === null) {
    return null;
  }

  const valueAsString = String(value).trim();

  if (!valueAsString) {
    return null;
  }

  return valueAsString.slice(0, maxLength);
}

function positiveInteger(value) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
}

function uniqueIds(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map(positiveInteger)
        .filter(Boolean)
    ),
  ];
}

function isValidIndianMobile(value) {
  return /^[6-9]\d{9}$/.test(String(value));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}


/*
|--------------------------------------------------------------------------
| POST /api/tutors
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    const body = await request.json();

    /*
    |--------------------------------------------------------------------------
    | Basic personal information
    |--------------------------------------------------------------------------
    */

    const firstName = cleanText(body.firstName, 80);
    const lastName = cleanText(body.lastName, 80);
    const whatsapp = cleanText(body.whatsapp, 15);
    const email = cleanText(body.email, 120);

    if (!firstName) {
      throw validationError("First name is required.");
    }

    if (!lastName) {
      throw validationError("Last name is required.");
    }

    if (!whatsapp || !isValidIndianMobile(whatsapp)) {
      throw validationError(
        "Please enter a valid 10-digit WhatsApp number."
      );
    }

    if (!email || !isValidEmail(email)) {
      throw validationError(
        "Please enter a valid email address."
      );
    }

    if (!ALLOWED_GENDERS.has(body.gender)) {
      throw validationError("Please select a valid gender.");
    }

    if (!ALLOWED_MARITAL_STATUS.has(body.maritalStatus)) {
      throw validationError("Please select a valid marital status.");
    }

    /*
    |--------------------------------------------------------------------------
    | Optional contact information
    |--------------------------------------------------------------------------
    */

    const alternatePhone = cleanText(body.altNumber, 15);
    const familyPhone = cleanText(body.familyMobile, 15);
    const referralPhone = cleanText(body.friendContact, 15);

    if (
      alternatePhone &&
      !isValidIndianMobile(alternatePhone)
    ) {
      throw validationError(
        "Please enter a valid alternative mobile number."
      );
    }

    if (
      familyPhone &&
      !isValidIndianMobile(familyPhone)
    ) {
      throw validationError(
        "Please enter a valid family member mobile number."
      );
    }

    if (
      referralPhone &&
      !isValidIndianMobile(referralPhone)
    ) {
      throw validationError(
        "Please enter a valid referral contact number."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Address
    |--------------------------------------------------------------------------
    */

    const presentAddress = cleanText(
      body.presentAddress,
      5000
    );

    const permanentAddress = cleanText(
      body.permanentAddress,
      5000
    );

    if (!presentAddress) {
      throw validationError(
        "Present address is required."
      );
    }

    if (
      !ALLOWED_RESIDENTIAL_STATUS.has(
        body.residentialStatus
      )
    ) {
      throw validationError(
        "Please select a valid residential status."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Education
    |--------------------------------------------------------------------------
    */

    const highestQualificationId =
      positiveInteger(
        body.highestQualificationId
      );

    const specializationId =
      positiveInteger(
        body.specializationId
      );

    if (!highestQualificationId) {
      throw validationError(
        "Please select your highest qualification."
      );
    }

    if (!specializationId) {
      throw validationError(
        "Please select your specialization."
      );
    }

    const specializationOther =
      cleanText(
        body.specializationOther,
        150
      );

    const additionalQualification =
      cleanText(
        body.additionalQualification,
        120
      );

    if (
      !ALLOWED_ENGLISH_FLUENCY.has(
        body.englishFluency
      )
    ) {
      throw validationError(
        "Please select your English teaching comfort level."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Teaching information
    |--------------------------------------------------------------------------
    */

    const teachingStartYear =
      Number(body.teachingStartYear);

    if (
      !Number.isInteger(teachingStartYear) ||
      teachingStartYear < 1950 ||
      teachingStartYear > CURRENT_YEAR
    ) {
      throw validationError(
        "Please select a valid teaching start year."
      );
    }

    if (
      !["Yes", "No"].includes(
        body.schoolTeaching
      )
    ) {
      throw validationError(
        "Please specify whether you currently teach in a school."
      );
    }

    const teachesInSchool =
      body.schoolTeaching === "Yes";

    const schoolNameAddress =
      cleanText(
        body.schoolDetails,
        5000
      );

    if (
      teachesInSchool &&
      !schoolNameAddress
    ) {
      throw validationError(
        "School name and address are required."
      );
    }

    if (
      !ALLOWED_TEACHING_MODES.has(
        body.teachingMode
      )
    ) {
      throw validationError(
        "Please select a valid teaching mode."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Teaching groups
    |
    | UI grouping is NOT stored.
    |
    | Example:
    |
    | Classes: 7,8,9,10
    | Subjects: Maths, Science
    |
    | becomes:
    |
    | 7-Maths
    | 7-Science
    | 8-Maths
    | 8-Science
    | ...
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(body.teachingGroups) ||
      body.teachingGroups.length === 0
    ) {
      throw validationError(
        "Please add at least one teaching group."
      );
    }

    const teachingGroups =
      body.teachingGroups.map(
        (group) => ({
          classIds: uniqueIds(
            group?.classIds
          ),

          subjectIds: uniqueIds(
            group?.subjectIds
          ),

          customSubjects:
            Array.isArray(
              group?.customSubjects
            )
              ? [
                  ...new Set(
                    group.customSubjects
                      .map((value) =>
                        cleanText(
                          value,
                          100
                        )
                      )
                      .filter(Boolean)
                  ),
                ]
              : [],
        })
      );

    for (const group of teachingGroups) {
      if (!group.classIds.length) {
        throw validationError(
          "Every teaching group must contain at least one class."
        );
      }

      if (
        !group.subjectIds.length &&
        !group.customSubjects.length
      ) {
        throw validationError(
          "Every teaching group must contain at least one subject."
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Teaching locations
    |--------------------------------------------------------------------------
    */

    const locationIds =
      uniqueIds(body.locationIds);

    if (
      body.teachingMode !== "Online" &&
      locationIds.length === 0
    ) {
      throw validationError(
        "Please select at least one teaching locality."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Other information
    |--------------------------------------------------------------------------
    */

    const sourceChannel =
      cleanText(
        body.advertisement,
        50
      );

    const referredByName =
      cleanText(
        body.friendName,
        80
      );

    const comment =
      cleanText(
        body.comment,
        5000
      );

    if (
      sourceChannel === "Friend / Referral" &&
      !referredByName
    ) {
      throw validationError(
        "Please enter the referral name."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Terms
    |--------------------------------------------------------------------------
    */

    if (!body.terms) {
      throw validationError(
        "You must accept the Terms & Conditions."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE TRANSACTION
    |--------------------------------------------------------------------------
    */

    const result =
      await withTransaction(
        async (tx) => {

          /*
          |--------------------------------------------------------------------------
          | Validate qualification
          |--------------------------------------------------------------------------
          */

          const qualificationRows =
            await tx.query(
              `
              SELECT id
              FROM qualifications
              WHERE id = ?
                AND is_active = 1
              `,
              [highestQualificationId]
            );

          if (
            qualificationRows.length !== 1
          ) {
            throw validationError(
              "Selected qualification is invalid."
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Validate specialization
          |--------------------------------------------------------------------------
          */

          const specializationRows =
            await tx.query(
              `
              SELECT id, name
              FROM specializations
              WHERE id = ?
                AND is_active = 1
              `,
              [specializationId]
            );

          if (
            specializationRows.length !== 1
          ) {
            throw validationError(
              "Selected specialization is invalid."
            );
          }

          const selectedSpecialization =
            specializationRows[0];

          const specializationIsOther =
            selectedSpecialization.name
              .trim()
              .toLowerCase() === "other";

          if (
            specializationIsOther &&
            !specializationOther
          ) {
            throw validationError(
              "Please specify your specialization."
            );
          }

          if (
            !specializationIsOther &&
            specializationOther
          ) {
            throw validationError(
              "Specialization details should only be provided when Other is selected."
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Load active classes and subjects
          |--------------------------------------------------------------------------
          */

          const classRows =
            await tx.query(
              `
              SELECT id
              FROM classes
              WHERE is_active = 1
              `
            );

          const subjectRows =
            await tx.query(
              `
              SELECT id, name
              FROM subjects
              WHERE is_active = 1
              `
            );

          const validClassIds =
            new Set(
              classRows.map(
                (row) => Number(row.id)
              )
            );

          const validSubjectIds =
            new Set(
              subjectRows.map(
                (row) => Number(row.id)
              )
            );

          /*
          |--------------------------------------------------------------------------
          | Validate selected classes / subjects
          |--------------------------------------------------------------------------
          */

          for (
            const group of teachingGroups
          ) {

            for (
              const classId
              of group.classIds
            ) {
              if (
                !validClassIds.has(
                  classId
                )
              ) {
                throw validationError(
                  "One or more selected classes are invalid."
                );
              }
            }

            for (
              const subjectId
              of group.subjectIds
            ) {
              if (
                !validSubjectIds.has(
                  subjectId
                )
              ) {
                throw validationError(
                  "One or more selected subjects are invalid."
                );
              }
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Prevent Other from duplicating an existing subject
          |--------------------------------------------------------------------------
          */

          const standardSubjectNames =
            new Set(
              subjectRows.map(
                (row) =>
                  row.name
                    .trim()
                    .toLowerCase()
              )
            );

          for (
            const group
            of teachingGroups
          ) {

            for (
              const customSubject
              of group.customSubjects
            ) {

              if (
                standardSubjectNames.has(
                  customSubject
                    .trim()
                    .toLowerCase()
                )
              ) {
                throw validationError(
                  `"${customSubject}" already exists in the subject list. Please select it instead of using Other.`
                );
              }
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Validate locations
          |--------------------------------------------------------------------------
          */

          let locationRows = [];

          if (locationIds.length) {

            locationRows =
              await tx.query(
                `
                SELECT
                  id,
                  location_type,
                  parent_location_id
                FROM locations
                WHERE id IN (
                  ${locationIds
                    .map(() => "?")
                    .join(",")}
                )
                AND is_active = 1
                `,
                locationIds
              );

            if (
              locationRows.length !==
              locationIds.length
            ) {
              throw validationError(
                "One or more selected locations are invalid."
              );
            }

            const invalidLocation =
              locationRows.find(
                (row) =>
                  row.location_type !==
                  "locality"
              );

            if (invalidLocation) {
              throw validationError(
                "Only localities can be selected as teaching areas."
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Verify locality → city hierarchy
            |--------------------------------------------------------------------------
            */

            const cityIds = [
              ...new Set(
                locationRows
                  .map(
                    (row) =>
                      Number(
                        row.parent_location_id
                      )
                  )
                  .filter(Boolean)
              ),
            ];

            if (cityIds.length) {

              const cityRows =
                await tx.query(
                  `
                  SELECT
                    id,
                    location_type,
                    parent_location_id
                  FROM locations
                  WHERE id IN (
                    ${cityIds
                      .map(() => "?")
                      .join(",")}
                  )
                  AND is_active = 1
                  `,
                  cityIds
                );

              if (
                cityRows.length !==
                  cityIds.length ||
                cityRows.some(
                  (row) =>
                    row.location_type !==
                    "city"
                )
              ) {
                throw validationError(
                  "One or more selected localities have an invalid city hierarchy."
                );
              }
            }
          }

          /*
          |--------------------------------------------------------------------------
          | INSERT TUTOR
          |--------------------------------------------------------------------------
          |
          | Notice:
          | status is NOT supplied by the client.
          | It is always inserted as 'active'.
          |--------------------------------------------------------------------------
          */

          const tutorResult =
            await tx.execute(
              `
              INSERT INTO tutors (
                first_name,
                last_name,
                gender,
                date_of_birth,
                marital_status,
                whatsapp,
                alternate_phone,
                email,
                family_phone,
                family_relation,
                present_address,
                permanent_address,
                residential_status,
                highest_qualification_id,
                specialization_id,
                specialization_other,
                additional_qualification,
                english_fluency,
                teaching_start_year,
                teaches_in_school,
                school_name_address,
                teaching_mode,
                source_channel,
                referred_by_name,
                referral_phone,
                comment,
                terms_accepted,
                status
              )
              VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, 'active'
              )
              `,
              [
                firstName,
                lastName,
                body.gender,
                body.dob || null,
                body.maritalStatus,
                whatsapp,
                alternatePhone,
                email,
                familyPhone,
                cleanText(
                  body.relation,
                  60
                ),
                presentAddress,
                permanentAddress,
                body.residentialStatus,
                highestQualificationId,
                specializationId,
                specializationIsOther
                  ? specializationOther
                  : null,
                additionalQualification,
                body.englishFluency,
                teachingStartYear,
                teachesInSchool
                  ? 1
                  : 0,
                teachesInSchool
                  ? schoolNameAddress
                  : null,
                body.teachingMode,
                sourceChannel,
                referredByName,
                referralPhone,
                comment,
                1,
              ]
            );

          const tutorId =
            tutorResult.insertId;

          /*
          |--------------------------------------------------------------------------
          | Tutor ↔ locality relationships
          |--------------------------------------------------------------------------
          */

          for (
            const locationId
            of locationIds
          ) {

            await tx.execute(
              `
              INSERT INTO tutor_locations (
                tutor_id,
                location_id
              )
              VALUES (?, ?)
              `,
              [
                tutorId,
                locationId,
              ]
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Expand UI groups into unique class × subject pairs
          |--------------------------------------------------------------------------
          */

          const standardPairs =
            new Set();

          const customPairs =
            new Map();

          for (
            const group
            of teachingGroups
          ) {

            /*
            | Standard subjects
            */

            for (
              const classId
              of group.classIds
            ) {

              for (
                const subjectId
                of group.subjectIds
              ) {

                standardPairs.add(
                  `${classId}:${subjectId}`
                );
              }
            }

            /*
            | Custom subjects
            */

            for (
              const classId
              of group.classIds
            ) {

              for (
                const subjectName
                of group.customSubjects
              ) {

                const key =
                  `${classId}:${subjectName
                    .trim()
                    .toLowerCase()}`;

                if (
                  !customPairs.has(key)
                ) {
                  customPairs.set(
                    key,
                    {
                      classId,
                      subjectName,
                    }
                  );
                }
              }
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Insert standard teaching relationships
          |--------------------------------------------------------------------------
          */

          for (
            const pair
            of standardPairs
          ) {

            const [
              classId,
              subjectId,
            ] =
              pair
                .split(":")
                .map(Number);

            await tx.execute(
              `
              INSERT INTO tutor_teaching_profiles (
                tutor_id,
                class_id,
                subject_id
              )
              VALUES (?, ?, ?)
              `,
              [
                tutorId,
                classId,
                subjectId,
              ]
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Insert custom subjects
          |--------------------------------------------------------------------------
          */

          for (
            const {
              classId,
              subjectName,
            }
            of customPairs.values()
          ) {

            await tx.execute(
              `
              INSERT INTO tutor_custom_subjects (
                tutor_id,
                class_id,
                subject_name,
                status
              )
              VALUES (?, ?, ?, 'pending')
              `,
              [
                tutorId,
                classId,
                subjectName,
              ]
            );
          }

          return {
            tutorId,
            locationCount:
              locationIds.length,
            teachingProfileCount:
              standardPairs.size,
            customSubjectCount:
              customPairs.size,
          };
        }
      );

    return NextResponse.json(
      {
        ok: true,
        id: result.tutorId,
        locationCount:
          result.locationCount,
        teachingProfileCount:
          result.teachingProfileCount,
        customSubjectCount:
          result.customSubjectCount,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.error(
      "[POST /api/tutors]",
      error
    );

    if (
      error.statusCode === 400
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    if (
      error.code ===
      "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        {
          error:
            "A tutor with these details already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Server error. Please try again later.",
      },
      {
        status: 500,
      }
    );
  }
}