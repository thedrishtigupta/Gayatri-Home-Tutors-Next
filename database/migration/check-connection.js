// database/migration/check-connection.js
// Verifies the database credentials in .env.local before anything is migrated.
// Probes each layer separately so a failure points at the actual cause rather
// than the generic "Connection lost" the driver reports for all of them.
//
//   node database/migration/check-connection.js

const fs = require("fs");
const net = require("net");
const path = require("path");
const dns = require("node:dns").promises;

function readEnv() {
  const file = path.join(__dirname, "..", "..", ".env.local");
  const env = {};
  if (!fs.existsSync(file)) return env;

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  }
  return env;
}

function sslOptions(env) {
  if (env.DB_SSL_CA) return { ca: env.DB_SSL_CA.replace(/\\n/g, "\n"), rejectUnauthorized: true };
  if (env.DB_SSL_CA_PATH) {
    const resolved = path.isAbsolute(env.DB_SSL_CA_PATH)
      ? env.DB_SSL_CA_PATH
      : path.join(process.cwd(), env.DB_SSL_CA_PATH);
    return { ca: fs.readFileSync(resolved, "utf8"), rejectUnauthorized: true };
  }
  if (env.DB_SSL === "true") return { rejectUnauthorized: true };
  return undefined;
}

/** Does the server send its greeting? Distinguishes "down" from "auth failed". */
function handshakeProbe(host, port) {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = net.connect({ host, port });
    let greeted = false;

    socket.setTimeout(10000);
    socket.on("data", (buf) => {
      greeted = true;
      const end = buf.indexOf(0, 5);
      resolve({ ok: true, version: buf.slice(5, end > 0 ? end : 12).toString(), ms: Date.now() - started });
      socket.destroy();
    });
    socket.on("close", () => {
      if (!greeted) resolve({ ok: false, reason: "server closed the connection without a handshake" });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, reason: "timed out waiting for a handshake" });
    });
    socket.on("error", (err) => resolve({ ok: false, reason: err.code || err.message }));
  });
}

(async () => {
  const env = { ...readEnv(), ...process.env };
  const host = env.DB_HOST;
  const port = Number(env.DB_PORT);
  const ssl = sslOptions(env);

  console.log("=".repeat(58));
  console.log("DATABASE CONNECTION CHECK");
  console.log("=".repeat(58));
  console.log(`host      ${host || "(unset)"}`);
  console.log(`port      ${port || "(unset)"}`);
  console.log(`database  ${env.DB_NAME || "(unset)"}`);
  console.log(`user      ${env.DB_USER || "(unset)"}`);
  console.log(`tls       ${ssl ? (ssl.ca ? "yes, with a provider CA" : "yes, system CAs") : "no"}`);
  console.log("");

  if (!host || !port || !env.DB_USER || !env.DB_NAME) {
    console.log("✗ .env.local is missing one of DB_HOST / DB_PORT / DB_USER / DB_NAME");
    process.exitCode = 1;
    return;
  }

  try {
    const { address } = await dns.lookup(host);
    console.log(`✓ DNS        ${host} -> ${address}`);
  } catch (err) {
    console.log(`✗ DNS        cannot resolve ${host} (${err.code})`);
    process.exitCode = 1;
    return;
  }

  const probe = await handshakeProbe(host, port);
  if (!probe.ok) {
    console.log(`✗ MySQL      ${probe.reason}`);
    console.log("");
    console.log("  TCP reached the host but no MySQL server answered. The service is");
    console.log("  stopped, suspended, or the port is wrong. Credentials are not the");
    console.log("  problem — authentication never started.");
    process.exitCode = 1;
    return;
  }
  console.log(`✓ MySQL      handshake OK in ${probe.ms}ms — server ${probe.version}`);

  const mysql = require("mysql2/promise");
  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      charset: "utf8mb4_unicode_ci",
      connectTimeout: 15000,
      ...(ssl ? { ssl } : {}),
    });
  } catch (err) {
    console.log(`✗ Auth       ${err.code || err.message}`);
    if (err.code === "HANDSHAKE_NO_SSL_SUPPORT" || /ssl|tls|certificate/i.test(err.message)) {
      console.log("");
      console.log("  TLS problem. Aiven and most managed hosts need their ca.pem:");
      console.log("    DB_SSL_CA_PATH=database/ca.pem     (downloaded from the console)");
      console.log("  or paste the certificate inline as DB_SSL_CA.");
    }
    process.exitCode = 1;
    return;
  }

  console.log("✓ Auth       credentials accepted");

  const [[info]] = await conn.query(
    "SELECT VERSION() AS version, DATABASE() AS db, @@character_set_database AS charset"
  );
  console.log(`✓ Session    ${info.db} on MySQL ${info.version}, charset ${info.charset}`);

  const [tables] = await conn.query(
    "SELECT TABLE_NAME AS name, TABLE_ROWS AS approx_rows FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
    [info.db]
  );

  console.log("");
  if (!tables.length) {
    console.log("  The database is empty — run the schema and seed files next:");
    console.log("    database/ght-v3-schema.sql");
    console.log("    database/seed_reference_data_v3.sql");
    console.log("    database/seed_education_reference_v3.sql");
  } else {
    console.log(`  ${tables.length} table(s) present:`);
    for (const t of tables) console.log(`    ${String(t.approx_rows ?? 0).padStart(8)}  ${t.name}`);
  }

  if (info.charset !== "utf8mb4") {
    console.log("");
    console.log(`  ! Database charset is ${info.charset}, not utf8mb4. Names with accents`);
    console.log("    or emoji will be mangled. Recreate it with:");
    console.log(`    ALTER DATABASE \`${info.db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  }

  await conn.end();
  console.log("");
  console.log("All checks passed.");
})().catch((err) => {
  console.error("check failed:", err.message);
  process.exitCode = 1;
});
