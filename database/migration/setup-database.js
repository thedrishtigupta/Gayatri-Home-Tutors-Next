// database/migration/setup-database.js
// Runs the schema and seed files against the configured database, in order.
//
//   node database/migration/setup-database.js            # show the plan
//   node database/migration/setup-database.js --execute  # run it
//
// Each file is sent as a single multi-statement query, so a dump's session
// pragmas (FOREIGN_KEY_CHECKS, SQL_MODE) apply to the statements that follow.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const FILES = [
  ["ght-v3-schema.sql", "tutor + reference tables"],
  ["migration/002_operational_tables.sql", "admin_users, demo_requests, …"],
  ["migration/001_add_own_vehicle.sql", "own_vehicle column"],
  ["seed_reference_data_v3.sql", "classes, subjects, locations"],
  ["seed_education_reference_v3.sql", "qualifications, specializations"],
];

function readEnv() {
  const file = path.join(ROOT, "..", ".env.local");
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return env;
}

function sslOptions(env) {
  if (env.DB_SSL_CA) return { ca: env.DB_SSL_CA.replace(/\\n/g, "\n"), rejectUnauthorized: true };
  if (env.DB_SSL_CA_PATH) {
    const p = path.isAbsolute(env.DB_SSL_CA_PATH)
      ? env.DB_SSL_CA_PATH
      : path.join(process.cwd(), env.DB_SSL_CA_PATH);
    return { ca: fs.readFileSync(p, "utf8"), rejectUnauthorized: true };
  }
  if (env.DB_SSL === "true") return { rejectUnauthorized: true };
  return undefined;
}

(async () => {
  const env = { ...readEnv(), ...process.env };
  const execute = process.argv.includes("--execute");

  console.log("Files to apply, in order:\n");
  for (const [file, what] of FILES) {
    const full = path.join(ROOT, file);
    const size = fs.existsSync(full) ? `${(fs.statSync(full).size / 1024).toFixed(0)} KB` : "MISSING";
    console.log(`  ${file.padEnd(42)} ${size.padStart(8)}  ${what}`);
  }

  const missing = FILES.filter(([f]) => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) {
    console.log(`\n✗ missing: ${missing.map(([f]) => f).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  if (!execute) {
    console.log("\nDry run. Re-run with --execute to apply.");
    return;
  }

  const mysql = require("mysql2/promise");
  const ssl = sslOptions(env);

  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: "utf8mb4_unicode_ci",
    multipleStatements: true,
    connectTimeout: 20000,
    ...(ssl ? { ssl } : {}),
  });

  console.log(`\nconnected to ${env.DB_NAME} on ${env.DB_HOST}\n`);

  try {
    for (const [file, what] of FILES) {
      const sql = fs.readFileSync(path.join(ROOT, file), "utf8");
      const started = Date.now();
      process.stdout.write(`  ${file.padEnd(42)} … `);
      await conn.query(sql);
      console.log(`ok (${Date.now() - started}ms) — ${what}`);
    }

    const [tables] = await conn.query(
      `SELECT TABLE_NAME AS name FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
      [env.DB_NAME]
    );

    console.log(`\n${tables.length} tables created:`);
    console.log("  " + tables.map((t) => t.name).join(", "));

    const [[counts]] = await conn.query(
      `SELECT
         (SELECT COUNT(*) FROM classes) AS classes,
         (SELECT COUNT(*) FROM subjects) AS subjects,
         (SELECT COUNT(*) FROM locations) AS locations,
         (SELECT COUNT(*) FROM qualifications) AS qualifications,
         (SELECT COUNT(*) FROM specializations) AS specializations`
    );
    console.log("\nreference rows seeded:");
    for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(16)} ${v}`);
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error(`\n✗ failed: ${err.sqlMessage || err.message}`);
  if (err.sql) console.error(`  near: ${String(err.sql).slice(0, 200)}`);
  process.exitCode = 1;
});
