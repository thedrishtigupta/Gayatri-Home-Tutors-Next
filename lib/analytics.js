// lib/analytics.js — page-view tracker (called from middleware)

import { execute } from "./db";

/**
 * Increment the visit counter for a given path for today (IST).
 * Uses INSERT ... ON DUPLICATE KEY UPDATE for atomic upsert.
 */
export async function trackPageView(path) {
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
    await execute(
      `INSERT INTO page_views (path, visits, date)
       VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE visits = visits + 1`,
      [path, today]
    );
  } catch {
    // Analytics must never crash the page
  }
}
