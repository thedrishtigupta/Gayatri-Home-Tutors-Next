
// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { hashPassword, verifyPassword, setAuthCookie } from "@/lib/auth";

// First-run bootstrap. The previous code accepted admin/admin123 unconditionally
// and, on a wrong password, OVERWROTE the real admin's password hash with it —
// a permanent backdoor into production. It now only fires when the
// admin_users table is still empty and bootstrap is explicitly enabled.
const BOOTSTRAP_ENABLED =
  process.env.ALLOW_ADMIN_BOOTSTRAP === "true" || process.env.NODE_ENV !== "production";
const BOOTSTRAP_USER = process.env.BOOTSTRAP_ADMIN_USER || "admin";
const BOOTSTRAP_PASS = process.env.BOOTSTRAP_ADMIN_PASSWORD || "admin123";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const [user] = await query(
      "SELECT id, username, password_hash, role FROM admin_users WHERE username = ?",
      [username]
    );

    if (!user) {
      const [{ count }] = await query("SELECT COUNT(*) AS count FROM admin_users");

      if (
        BOOTSTRAP_ENABLED && Number(count) === 0 &&
        username === BOOTSTRAP_USER && password === BOOTSTRAP_PASS
      ) {
        const passwordHash = await hashPassword(password);
        const result = await execute(
          "INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, 'super_admin')",
          [username, passwordHash]
        );

        await setAuthCookie({ id: result.insertId, username, role: "super_admin" });
        return NextResponse.json({ ok: true, role: "super_admin" });
      }

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setAuthCookie({ id: user.id, username: user.username, role: user.role });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (err) {
    console.error("[auth/login POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}