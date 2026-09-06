// scripts/backup-db.js
// Timestamped, gzipped mysqldump of the configured database, with rotation.
//
//   node scripts/backup-db.js              # write a backup
//   node scripts/backup-db.js --keep 30    # keep the newest 30 (default 14)
//   node scripts/backup-db.js --list       # show what is already stored
//
// Reads connection details from .env.local. Designed to be run unattended from
// Task Scheduler / cron: it exits non-zero on any failure so a wrapper can
// alert, and it verifies the dump before rotating anything away.

const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..");
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(ROOT, "backups");

/* ── config ──────────────────────────────────────────────────────── */

function readEnv() {
  const file = path.join(ROOT, ".env.local");
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

/** mysqldump is rarely on PATH on Windows; check the usual install locations. */
function findMysqldump() {
  if (process.env.MYSQLDUMP_PATH) return process.env.MYSQLDUMP_PATH;

  const candidates = [
    "mysqldump",
    "C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqldump.exe",
    "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe",
    "C:/xampp/mysql/bin/mysqldump.exe",
    "C:/laragon/bin/mysql/mysql-8.0.30-winx64/bin/mysqldump.exe",
    "/usr/bin/mysqldump",
    "/usr/local/bin/mysqldump",
    "/opt/homebrew/bin/mysqldump",
  ];

  for (const c of candidates.slice(1)) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0]; // fall back to PATH and let spawn report ENOENT
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const human = (bytes) =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

/* ── listing / rotation ──────────────────────────────────────────── */

function existingBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => /^ght-.*\.sql\.gz$/.test(f))
    .map((f) => {
      const full = path.join(BACKUP_DIR, f);
      // fs.Stats exposes mtime/size as prototype getters, so spreading it
      // silently yields undefined for both.
      const { mtime, mtimeMs, size } = fs.statSync(full);
      return { file: f, full, mtime, mtimeMs, size };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function listBackups() {
  const all = existingBackups();
  if (!all.length) {
    console.log(`No backups in ${BACKUP_DIR}`);
    return;
  }
  console.log(`${all.length} backup(s) in ${BACKUP_DIR}:\n`);
  for (const b of all) {
    console.log(`  ${b.mtime.toISOString().slice(0, 19).replace("T", " ")}  ${human(b.size).padStart(9)}  ${b.file}`);
  }
  console.log(`\n  total ${human(all.reduce((a, b) => a + b.size, 0))}`);
}

/* ── dump ────────────────────────────────────────────────────────── */

(async () => {
  if (process.argv.includes("--list")) {
    listBackups();
    return;
  }

  const env = { ...readEnv(), ...process.env };
  const keep = Math.max(1, Number(arg("--keep", 14)));

  for (const key of ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"]) {
    if (!env[key]) {
      console.error(`✗ ${key} is not set in .env.local`);
      process.exit(1);
    }
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outFile = path.join(BACKUP_DIR, `ght-${env.DB_NAME}-${stamp}.sql.gz`);
  const tmpFile = `${outFile}.part`;

  const bin = findMysqldump();
  const args = [
    `--host=${env.DB_HOST}`,
    `--port=${env.DB_PORT}`,
    `--user=${env.DB_USER}`,
    // Consistent snapshot from a single transaction — no table locks, so the
    // site keeps serving while the dump runs.
    "--single-transaction",
    "--quick",
    "--routines",
    "--triggers",
    "--events",
    // Managed providers do not grant PROCESS, which mysqldump needs to read
    // tablespace metadata; without this the dump aborts with error 1227.
    "--no-tablespaces",
    // Binlog coordinates are meaningless outside the provider's own cluster.
    "--set-gtid-purged=OFF",
    "--default-character-set=utf8mb4",
    "--hex-blob",
  ];

  // Aiven and friends require TLS and present a private CA.
  if (env.DB_SSL_CA_PATH) {
    const ca = path.isAbsolute(env.DB_SSL_CA_PATH)
      ? env.DB_SSL_CA_PATH
      : path.join(ROOT, env.DB_SSL_CA_PATH);
    if (!fs.existsSync(ca)) {
      console.error(`✗ CA certificate not found: ${ca}`);
      process.exit(1);
    }
    args.push(`--ssl-ca=${ca}`, "--ssl-mode=VERIFY_CA");
  } else if (env.DB_SSL === "true") {
    args.push("--ssl-mode=REQUIRED");
  }

  args.push(env.DB_NAME);

  console.log(`backing up ${env.DB_NAME} from ${env.DB_HOST}`);
  console.log(`  using ${bin}`);

  const started = Date.now();
  const stderr = [];

  const code = await new Promise((resolve, reject) => {
    // The password goes through the environment, never argv — command lines are
    // visible to other users in the process list.
    const child = spawn(bin, args, {
      env: { ...process.env, MYSQL_PWD: env.DB_PASSWORD || "" },
    });

    const gzip = zlib.createGzip({ level: 9 });
    const out = fs.createWriteStream(tmpFile);

    child.stdout.pipe(gzip).pipe(out);
    child.stderr.on("data", (d) => stderr.push(d.toString()));
    child.on("error", reject);
    out.on("error", reject);
    child.on("close", (c) => out.on("finish", () => resolve(c)));
  }).catch((err) => {
    if (err.code === "ENOENT") {
      console.error(`\n✗ mysqldump not found at "${bin}".`);
      console.error("  Install MySQL client tools, or set MYSQLDUMP_PATH to the binary.");
    } else {
      console.error(`\n✗ ${err.message}`);
    }
    fs.rmSync(tmpFile, { force: true });
    process.exit(1);
  });

  const warnings = stderr.join("").trim();

  if (code !== 0) {
    console.error(`\n✗ mysqldump exited ${code}`);
    if (warnings) console.error(warnings);
    fs.rmSync(tmpFile, { force: true });
    process.exit(1);
  }

  /* ── verify before trusting it ─────────────────────────────────── */

  const size = fs.statSync(tmpFile).size;
  if (size < 1024) {
    console.error(`\n✗ dump is only ${size} bytes — treating as a failure`);
    fs.rmSync(tmpFile, { force: true });
    process.exit(1);
  }

  // Scan the whole dump: tables are written alphabetically, so `tutors` lands
  // after the 31k tutor_teaching_profiles rows and a head-only check misses it.
  const text = zlib.gunzipSync(fs.readFileSync(tmpFile)).toString("utf8");
  const expected = ["tutors", "admin_users", "tutor_teaching_profiles", "locations"];
  const missing = expected.filter((t) => !text.includes(`CREATE TABLE \`${t}\``));
  if (missing.length) {
    console.error(`\n✗ dump is missing expected tables: ${missing.join(", ")}`);
    fs.rmSync(tmpFile, { force: true });
    process.exit(1);
  }
  if (!text.includes("Dump completed")) {
    console.error("\n✗ dump has no completion marker — it was truncated");
    fs.rmSync(tmpFile, { force: true });
    process.exit(1);
  }

  const tableCount = (text.match(/^CREATE TABLE /gm) || []).length;
  const insertCount = (text.match(/^INSERT INTO /gm) || []).length;

  fs.renameSync(tmpFile, outFile);

  console.log(`\n✓ ${path.relative(ROOT, outFile)}`);
  console.log(`  ${human(size)} gzipped (${human(text.length)} raw) in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`  ${tableCount} tables, ${insertCount} insert statements`);
  if (warnings && !/Using a password/i.test(warnings)) console.log(`  note: ${warnings.split("\n")[0]}`);

  /* ── rotate ────────────────────────────────────────────────────── */

  const all = existingBackups();
  const stale = all.slice(keep);
  for (const b of stale) fs.rmSync(b.full, { force: true });

  console.log(`  keeping ${Math.min(all.length, keep)} of ${all.length} backup(s)${stale.length ? `, removed ${stale.length}` : ""}`);
})().catch((err) => {
  console.error("✗ backup failed:", err.message);
  process.exit(1);
});
