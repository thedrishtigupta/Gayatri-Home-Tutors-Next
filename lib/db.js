// lib/db.js — MySQL connection pool + typed query helper

// import mysql from "mysql2/promise";

// const pool = mysql.createPool({
//   host:     process.env.DB_HOST     || "localhost",
//   port:     parseInt(process.env.DB_PORT || "3306"),
//   user:     process.env.DB_USER     || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME     || "gayatri_home_tutors",
//   waitForConnections: true,
//   connectionLimit:    10,
//   queueLimit:         0,
//   timezone:           "+05:30",   // IST
// });

// /**
//  * Execute a query and return rows.
//  * @template T
//  * @param {string} sql
//  * @param {any[]} [params]
//  * @returns {Promise<T[]>}
//  */
// export async function query(sql, params = []) {
//   const [rows] = await pool.execute(sql, params);
//   return rows;
// }

// /**
//  * Execute an INSERT/UPDATE/DELETE and return the result header.
//  * @param {string} sql
//  * @param {any[]} [params]
//  * @returns {Promise<import("mysql2").ResultSetHeader>}
//  */
// export async function execute(sql, params = []) {
//   const [result] = await pool.execute(sql, params);
//   return result;
// }

// export default pool;


import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

// const pool = mysql.createPool({
//   host:     process.env.DB_HOST     || "localhost",
//   port:     parseInt(process.env.DB_PORT || "3306"),
//   user:     process.env.DB_USER     || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME     || "gayatri_home_tutors",
//   waitForConnections: true,
//   connectionLimit:    10,
//   queueLimit:         0,
//   timezone:           "+05:30",   // IST
//   // The schema is utf8mb4; mysql2 otherwise negotiates utf8mb3 and 4-byte
//   // characters (emoji in names / notes / telegram messages) are rejected
//   // with ER_TRUNCATED_WRONG_VALUE or silently mangled.
//   charset:            "utf8mb4_unicode_ci",
//   enableKeepAlive:    true,
// });

/**
 * TLS options for the connection pool.
 *
 * Managed providers (Aiven, PlanetScale, DigitalOcean…) require TLS and sign
 * their certificates with a private CA, so the system trust store is not
 * enough — the provider's ca.pem has to be supplied explicitly.
 *
 * The CA certificate is public, not a secret, so either form is safe:
 *   DB_SSL_CA       the PEM inline (literal "\n" escapes are accepted, which
 *                   is what Vercel and most dashboards need)
 *   DB_SSL_CA_PATH  a path to ca.pem, relative to the project root
 *
 * Set DB_SSL=true on its own to require TLS against a publicly trusted CA.
 * Returns undefined for a plain local MySQL, which needs no TLS at all.
 */
function sslOptions() {
    const inlineCa = process.env.DB_SSL_CA;
    const caPath = process.env.DB_SSL_CA_PATH;

    if (inlineCa) {
        return { ca: inlineCa.replace(/\\n/g, "\n"), rejectUnauthorized: true };
    }

    if (caPath) {
        const resolved = path.isAbsolute(caPath) ? caPath : path.join(process.cwd(), caPath);
        return { ca: fs.readFileSync(resolved, "utf8"), rejectUnauthorized: true };
    }

    if (process.env.DB_SSL === "true") {
        return { rejectUnauthorized: true };
    }

    return undefined;
}

let pool;

function getPool() {
    if (!pool) {
        const ssl = sslOptions();

        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            // Managed free tiers cap max_connections low; keep well under it so
            // a burst of serverless invocations cannot exhaust the server.
            connectionLimit: Number(process.env.DB_POOL_SIZE || 5),
            queueLimit: 0,
            charset: "utf8mb4_unicode_ci",
            enableKeepAlive: true,
            ...(ssl ? { ssl } : {}),
        });
    }

    return pool;
}

/**
 * Execute a query and return rows.
 * @template T
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<T[]>}
 */
export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/**
 * Execute an INSERT/UPDATE/DELETE and return the result header.
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<import("mysql2").ResultSetHeader>}
 */
export async function execute(sql, params = []) {
  const [result] = await getPool().execute(sql, params);
  return result;
}

/**
 * Run several statements atomically on a single connection.
 * The callback receives { query, execute } bound to that connection.
 * Rolls back and rethrows if anything inside fails.
 * @template T
 * @param {(tx: { query: typeof query, execute: typeof execute }) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withTransaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const tx = {
      async query(sql, params = []) {
        const [rows] = await conn.execute(sql, params);
        return rows;
      },
      async execute(sql, params = []) {
        const [result] = await conn.execute(sql, params);
        return result;
      },
    };
    const out = await fn(tx);
    await conn.commit();
    return out;
  } catch (err) {
    try { await conn.rollback(); } catch { /* connection already gone */ }
    throw err;
  } finally {
    conn.release();
  }
}

export default pool;