// lib/validators.js — shared server-side input validation (no external deps).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function cleanString(value, max = 255) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Normalises an Indian phone number to 10 digits, or returns null. */
export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export function isEmail(value) {
  return EMAIL_RE.test(String(value ?? "").trim());
}

/**
 * Validates a demo / contact request payload.
 * Returns { valid, errors, data }.
 */
export function validateDemoRequest(body) {
  const errors = {};
  const fullName = cleanString(body?.fullName, 120);
  const phone = normalizePhone(body?.phone);
  const email = cleanString(body?.email, 255);
  const message = cleanString(body?.message, 1000);
  const area = cleanString(body?.area, 120);
  const studentClass = cleanString(body?.studentClass, 60);
  const time = cleanString(body?.time, 60) || "Any";
  const source = cleanString(body?.source, 40) || "web_form";

  if (fullName.length < 2) errors.fullName = "Please enter the full name (at least 2 characters).";
  if (fullName.length > 120) errors.fullName = "Name must be under 120 characters.";
  if (!phone) errors.phone = "Please enter a valid 10-digit Indian mobile number.";
  if (email && !isEmail(email)) errors.email = "Please enter a valid email address.";

  let subjects = [];
  if (Array.isArray(body?.subjects)) {
    subjects = body.subjects.map((s) => cleanString(s, 60)).filter(Boolean).slice(0, 15);
  } else if (typeof body?.subjects === "string") {
    subjects = body.subjects.split(",").map((s) => cleanString(s, 60)).filter(Boolean).slice(0, 15);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { fullName, phone, email: email || null, message: message || null, area: area || null, studentClass: studentClass || null, time, source, subjects },
  };
}
