// app/admin/login/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm]     = useState({ username: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Login failed"); return; }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="admin-logo-icon">🏫</span>
          <h1>GHT Admin</h1>
          <p>Gayatri Home Tutors</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="admin-alert admin-alert-error">{error}</div>}

          <div className="admin-form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
