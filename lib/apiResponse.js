// lib/apiResponse.js — consistent JSON envelopes for every API route.
import { NextResponse } from "next/server";

export function ok(data = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Wraps a route handler so an unexpected throw still returns valid JSON. */
export function safeRoute(name, handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(`[${name}]`, err);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}

/** Parses a JSON body without throwing on malformed input. */
export async function readJson(req) {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}
