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


import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "3306"),
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "gayatri_home_tutors",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           "+05:30",   // IST
  // The schema is utf8mb4; mysql2 otherwise negotiates utf8mb3 and 4-byte
  // characters (emoji in names / notes / telegram messages) are rejected
  // with ER_TRUNCATED_WRONG_VALUE or silently mangled.
  charset:            "utf8mb4_unicode_ci",
  enableKeepAlive:    true,
});

/**
 * Execute a query and return rows.
 * @template T
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<T[]>}
 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Execute an INSERT/UPDATE/DELETE and return the result header.
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<import("mysql2").ResultSetHeader>}
 */
export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
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
  const conn = await pool.getConnection();
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