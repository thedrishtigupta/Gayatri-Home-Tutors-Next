// app/api/tutors/options/route.js
// Public reference data for the Become Tutor form.

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [
        qualifications,
        specializations,
        subjects,
        classes,
        locations,
        ] = await Promise.all([
        query(`
            SELECT
            id,
            name,
            slug
            FROM qualifications
            WHERE is_active = 1
            ORDER BY name
        `),

        query(`
            SELECT
            id,
            name,
            slug
            FROM specializations
            WHERE is_active = 1
            ORDER BY name
        `),

        query(`
            SELECT
            id,
            name,
            slug
            FROM subjects
            WHERE is_active = 1
            ORDER BY name
        `),

        query(`
            SELECT
            id,
            name,
            short_name,
            slug,
            sort_order
            FROM classes
            WHERE is_active = 1
            ORDER BY sort_order, id
        `),

        query(`
            SELECT
            id,
            name,
            slug,
            location_type,
            parent_location_id
            FROM locations
            WHERE is_active = 1
            ORDER BY location_type, name
        `),
        ]);

        return NextResponse.json({
        qualifications,
        specializations,
        subjects,
        classes,
        locations,
        });
    } catch (error) {
        console.error("[tutors/options GET]", error);

        return NextResponse.json(
        { error: "Unable to load tutor form options." },
        { status: 500 }
        );
    }
}