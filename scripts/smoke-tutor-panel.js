// scripts/smoke-tutor-panel.js
// End-to-end check of the tutor panel against a running dev server.
//
//   node scripts/smoke-tutor-panel.js [--port 3000]
//
// Creates a disposable tutor, walks the whole flow (signup -> verify -> login
// -> read profile -> submit changes -> admin review -> confirm applied), then
// deletes everything it made. Safe to run against the live database: it only
// ever touches the row it created, and cleans up even when a step fails.

const fs = require("fs");
const path = require("path");
const crypto = require("node:crypto");

const ROOT = path.join(__dirname, "..");
const PORT = (() => {
  const i = process.argv.indexOf("--port");
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : "3000";
})();
const BASE = `http://localhost:${PORT}`;

const TEST_EMAIL = `smoke-test-${Date.now()}@example.invalid`;
const TEST_PASSWORD = "SmokeTest123";

function readEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return env;
}

const env = readEnv();

async function db() {
  const ssl = env.DB_SSL_CA_PATH
    ? { ca: fs.readFileSync(path.resolve(ROOT, env.DB_SSL_CA_PATH), "utf8"), rejectUnauthorized: true }
    : undefined;
  return require("mysql2/promise").createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: "utf8mb4_unicode_ci",
    ssl,
  });
}

let passed = 0;
let failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (ok) passed += 1;
  else failed += 1;
};

/** Fetch that keeps cookies per named jar. */
const jars = {};
async function call(jar, method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(jars[jar] ? { Cookie: jars[jar] } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length) {
    const pairs = setCookie.map((c) => c.split(";")[0]);
    jars[jar] = [...(jars[jar] ? jars[jar].split("; ") : []), ...pairs].join("; ");
  }
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, json, text };
}

(async () => {
  const conn = await db();
  let tutorId = null;

  try {
    /* ── fixture ──────────────────────────────────────────────── */
    const [ins] = await conn.query(
      `INSERT INTO tutors (first_name, last_name, email, whatsapp, gender, teaching_mode, status, terms_accepted)
       VALUES ('Smoke', 'Test', ?, '9000000001', 'Other', 'In-person', 'active', 1)`,
      [TEST_EMAIL]
    );
    tutorId = ins.insertId;
    console.log(`fixture: tutor #${tutorId} <${TEST_EMAIL}>\n`);

    const [[cls]] = await conn.query("SELECT id FROM classes WHERE slug = 'class-8'");
    const [[sub]] = await conn.query("SELECT id FROM subjects WHERE slug = 'mathematics'");
    const [[loc]] = await conn.query("SELECT id FROM locations WHERE location_type = 'locality' LIMIT 1");

    /* ── 1. signup ────────────────────────────────────────────── */
    console.log("1. signup");
    const badPw = await call("t", "POST", "/api/tutor/signup", { email: TEST_EMAIL, password: "short" });
    check("weak password rejected", badPw.status === 400, badPw.json?.error);

    const unknown = await call("t", "POST", "/api/tutor/signup", {
      email: "definitely-not-a-tutor@example.invalid",
      password: TEST_PASSWORD,
    });
    check("unknown email rejected", unknown.status === 404);

    const signup = await call("t", "POST", "/api/tutor/signup", { email: TEST_EMAIL, password: TEST_PASSWORD });
    check("signup accepted", signup.status === 200 && signup.json?.ok, signup.json?.status);

    const [[acct]] = await conn.query("SELECT * FROM tutor_accounts WHERE tutor_id = ?", [tutorId]);
    check("account row created", Boolean(acct), acct?.status);

    /* ── 2. login blocked before activation ───────────────────── */
    console.log("\n2. login gating");
    const early = await call("t", "POST", "/api/tutor/login", { email: TEST_EMAIL, password: TEST_PASSWORD });
    check("login blocked while not active", early.status === 403, early.json?.error);

    // Whichever path signup took, activate the way that path would.
    if (acct.status === "pending_verification") {
      const [[tok]] = await conn.query(
        "SELECT * FROM tutor_auth_tokens WHERE tutor_id = ? AND purpose = 'verify_email'",
        [tutorId]
      );
      check("verification token stored hashed", Boolean(tok) && tok.token_hash.length === 64);
      // The raw token only existed in the email, so simulate the click directly.
      await conn.query(
        "UPDATE tutor_accounts SET status = 'active', email_verified_at = NOW() WHERE tutor_id = ?",
        [tutorId]
      );
      await conn.query("UPDATE tutor_auth_tokens SET used_at = NOW() WHERE id = ?", [tok.id]);
    } else {
      await conn.query("UPDATE tutor_accounts SET status = 'active' WHERE tutor_id = ?", [tutorId]);
      check("routed to admin approval (no SMTP configured)", acct.status === "pending_approval");
    }

    const wrongPw = await call("t", "POST", "/api/tutor/login", { email: TEST_EMAIL, password: "WrongPass123" });
    check("wrong password rejected", wrongPw.status === 401);
    check("wrong password message is generic", wrongPw.json?.error === "Email or password is incorrect.");

    const login = await call("t", "POST", "/api/tutor/login", { email: TEST_EMAIL, password: TEST_PASSWORD });
    check("login succeeds", login.status === 200 && login.json?.ok);
    check("session cookie set", (jars.t || "").includes("ght_tutor_token"));

    /* ── 3. read own profile ──────────────────────────────────── */
    console.log("\n3. profile read");
    const me = await call("t", "GET", "/api/tutor/profile");
    check("profile returned", me.status === 200 && me.json?.data?.tutor?.id === tutorId);
    check("password hash not exposed", !JSON.stringify(me.json).includes("password_hash"));
    check("stats present", Boolean(me.json?.data?.stats?.assignments));

    /* ── 4. submit changes ────────────────────────────────────── */
    console.log("\n4. submitting changes");
    const noop = await call("t", "PATCH", "/api/tutor/profile", { first_name: "Smoke" });
    check("unchanged value is a no-op", noop.json?.noChanges === true);

    const forbidden = await call("t", "PATCH", "/api/tutor/profile", { verified: 1 });
    check("non-editable field rejected", forbidden.status === 400, forbidden.json?.error?.slice(0, 48));

    const badPhone = await call("t", "PATCH", "/api/tutor/profile", { whatsapp: "123" });
    check("invalid phone rejected", badPhone.status === 400);

    const submit = await call("t", "PATCH", "/api/tutor/profile", {
      first_name: "Smokey",
      present_address: "12 Test Lane",
      teaching_profiles: [{ class_id: cls.id, subject_id: sub.id }],
      location_ids: [loc.id],
    });
    check("changes submitted", submit.status === 200 && submit.json?.ok, `${submit.json?.submitted?.length} fields`);

    const [live] = await conn.query("SELECT first_name FROM tutors WHERE id = ?", [tutorId]);
    check("tutors table NOT modified yet", live[0].first_name === "Smoke", `still "${live[0].first_name}"`);

    const [pending] = await conn.query(
      "SELECT COUNT(*) AS n FROM tutor_profile_changes WHERE tutor_id = ? AND status = 'pending'",
      [tutorId]
    );
    check("exactly one open submission", Number(pending[0].n) === 1);

    // Re-submitting must replace, not stack.
    await call("t", "PATCH", "/api/tutor/profile", { first_name: "Smokey", last_name: "Tested" });
    const [afterResubmit] = await conn.query(
      "SELECT COUNT(*) AS n FROM tutor_profile_changes WHERE tutor_id = ? AND status = 'pending'",
      [tutorId]
    );
    check("re-submitting replaces the open one", Number(afterResubmit[0].n) === 1);

    /* ── 4b. own_vehicle round-trips ──────────────────────────── */
    console.log("");
    console.log("4b. own_vehicle");
    // Sent together with the name edits: a submission replaces the open one, so
    // asking for own_vehicle alone would discard what step 4 queued up.
    const vehicle = await call("t", "PATCH", "/api/tutor/profile", {
      own_vehicle: true,
      first_name: "Smokey",
      last_name: "Tested",
    });
    check("tutor can request own_vehicle", vehicle.status === 200 && vehicle.json?.ok);
    const [beforeApproval] = await conn.query("SELECT own_vehicle FROM tutors WHERE id = ?", [tutorId]);
    check("own_vehicle not applied before approval", Number(beforeApproval[0].own_vehicle) === 0);

    const adminSet = await call("a2", "PATCH", `/api/admin/tutors/${tutorId}`, { own_vehicle: true });
    // a2 has no cookie yet; this asserts the admin route rejects anonymous callers.
    check("admin route needs auth", adminSet.status === 401);

    /* ── 5. admin review ──────────────────────────────────────── */
    console.log("\n5. admin review");
    const { SignJWT } = require("jose");
    const adminToken = await new SignJWT({ id: null, username: "smoke", role: "super_admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(new TextEncoder().encode(env.JWT_SECRET));
    jars.a = `ght_admin_token=${adminToken}`;

    const adminVehicle = await call("a", "PATCH", `/api/admin/tutors/${tutorId}`, { own_vehicle: true });
    check("admin can set own_vehicle directly", adminVehicle.status === 200);
    const [afterAdmin] = await conn.query("SELECT own_vehicle FROM tutors WHERE id = ?", [tutorId]);
    check("own_vehicle written by admin", Number(afterAdmin[0].own_vehicle) === 1);
    await conn.query("UPDATE tutors SET own_vehicle = 0 WHERE id = ?", [tutorId]);

    const queue = await call("a", "GET", "/api/admin/tutor-changes?status=pending");
    const mine = (queue.json?.data || []).find((c) => c.tutor_id === tutorId);
    check("submission appears in the queue", Boolean(mine), `${queue.json?.total} pending total`);

    const detail = await call("a", "GET", `/api/admin/tutor-changes/${mine.id}`);
    check("submission detail loads", detail.status === 200 && detail.json?.data?.fields?.length > 0);

    const rows = detail.json.data.fields;
    const firstNameRow = rows.find((f) => f.field === "first_name");
    const lastNameRow = rows.find((f) => f.field === "last_name");

    const vehicleRow = rows.find((f) => f.field === "own_vehicle");

    // Approve one field, reject another — the point of per-field review.
    // own_vehicle is left undecided, so the submission must stay open.
    const review = await call("a", "PATCH", `/api/admin/tutor-changes/${mine.id}`, {
      decisions: { [firstNameRow.id]: "approved", [lastNameRow.id]: "rejected" },
      note: "smoke test",
    });
    check("per-field decision accepted", review.status === 200 && review.json?.ok, review.json?.finalStatus);
    check("partly-decided submission stays pending", review.json?.finalStatus === "pending");
    check("undecided field still pending", review.json?.stillPending === 1);

    const [applied] = await conn.query("SELECT first_name, last_name FROM tutors WHERE id = ?", [tutorId]);
    check("approved field applied", applied[0].first_name === "Smokey");
    check("rejected field NOT applied", applied[0].last_name === "Test", `is "${applied[0].last_name}"`);

    // Deciding the last field closes the submission as partial: some approved,
    // some rejected.
    const finish = await call("a", "PATCH", `/api/admin/tutor-changes/${mine.id}`, {
      decisions: { [vehicleRow.id]: "approved" },
    });
    check("final decision closes it", finish.status === 200, finish.json?.finalStatus);
    check("closed as partial", finish.json?.finalStatus === "partial");

    const [vehicleApplied] = await conn.query("SELECT own_vehicle FROM tutors WHERE id = ?", [tutorId]);
    check("approved own_vehicle applied", Number(vehicleApplied[0].own_vehicle) === 1);

    const replay = await call("a", "PATCH", `/api/admin/tutor-changes/${mine.id}`, {
      decisions: { [firstNameRow.id]: "approved" },
    });
    check("already-reviewed submission refused", replay.status === 409);

    /* ── 6. session isolation ─────────────────────────────────── */
    console.log("\n6. session isolation");
    const tutorHitsAdmin = await call("t", "GET", "/api/admin/tutors?limit=1");
    check("tutor token cannot reach admin API", tutorHitsAdmin.status === 401);

    const adminHitsTutor = await call("a", "GET", "/api/tutor/profile");
    check("admin token cannot reach tutor API", adminHitsTutor.status === 401);
  } catch (err) {
    console.error("\nunexpected error:", err.message);
    failed += 1;
  } finally {
    if (tutorId) {
      // Child rows cascade from the tutor delete.
      await conn.query("DELETE FROM tutors WHERE id = ?", [tutorId]);
      console.log(`\ncleaned up tutor #${tutorId}`);
    }
    await conn.end();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
})();
