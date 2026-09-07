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
/**
 * True on Vercel and other lambda-style hosts, where each concurrent instance
 * builds its own pool and the filesystem holds only what the build traced.
 */
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function sslOptions() {
    const inlineCa = process.env.DB_SSL_CA;
    const caPath = process.env.DB_SSL_CA_PATH;

    if (inlineCa) {
        return { ca: inlineCa.replace(/\\n/g, "\n"), rejectUnauthorized: true };
    }

    if (caPath) {
        const resolved = path.isAbsolute(caPath) ? caPath : path.join(process.cwd(), caPath);
        try {
            return { ca: fs.readFileSync(resolved, "utf8"), rejectUnauthorized: true };
        } catch (err) {
            /*
             * Nearly always a deployment problem rather than a code one, and it
             * used to surface as an unexplained 500 with only a digest to go on.
             *
             * The path is assembled at runtime from an environment variable, so
             * Next's output file tracing cannot see the read and never copies
             * ca.pem into the serverless bundle. The file is in the repository
             * and works locally; it simply is not there in the deployed
             * function. DB_SSL_CA carries the certificate in the environment
             * instead and has no filesystem dependency at all.
             */
            throw new Error(
                `Could not read the database CA certificate at ${resolved} (${err.code || err.message}). ` +
                (IS_SERVERLESS
                    ? "On a serverless host this file is usually absent, because DB_SSL_CA_PATH is only " +
                      "resolved at runtime and the build cannot trace it into the bundle. Set DB_SSL_CA " +
                      "to the contents of ca.pem and remove DB_SSL_CA_PATH."
                    : "Check that the path is correct and relative to the project root.")
            );
        }
    }

    if (process.env.DB_SSL === "true") {
        return { rejectUnauthorized: true };
    }

    return undefined;
}

let pool;

function getPool() {
    if (!pool) {
        // Without this, an unset DB_HOST silently becomes localhost and the
        // failure reads as a connection refusal rather than missing config.
        if (!process.env.DB_HOST) {
            throw new Error(
                "DB_HOST is not set — the database environment variables are missing on this host. " +
                "Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME and DB_SSL_CA."
            );
        }

        const ssl = sslOptions();

        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            /*
             * Managed free tiers cap max_connections low — Aiven allows 76 —
             * and every serverless instance opens a pool of its own. A pool of
             * 5 across a dozen warm lambdas exhausts the server on its own, so
             * the ceiling is lower where instances multiply.
             */
            connectionLimit: Number(process.env.DB_POOL_SIZE || (IS_SERVERLESS ? 2 : 5)),
            queueLimit: 0,
            charset: "utf8mb4_unicode_ci",
            enableKeepAlive: true,
            ...(ssl ? { ssl } : {}),
        });
    }

    return pool;
}

export { getPool };

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

/*
 * No default export. `export default pool` exported the value of `pool` at
 * module-evaluation time, which is always undefined because the pool is built
 * lazily on first use. Nothing imported it, but anything that did would have
 * received undefined. Use the named query, execute, withTransaction or getPool.
 */