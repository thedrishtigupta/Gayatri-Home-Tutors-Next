// app/portal/login/page.js
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/tutor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not sign you in.");
        setBusy(false);
        return;
      }

      // Only follow `from` when it is a path inside the tutor panel — an
      // attacker-supplied absolute URL must never become a redirect target.
      const target = from && /^\/portal\//.test(from) ? from : "/portal/dashboard";
      router.push(target);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="tp-auth">
      <div className="tp-auth-card">
        <div className="tp-auth-logo">
          <span aria-hidden="true">🏫</span>
          <h1>Tutor sign in</h1>
          <p>Manage your teaching profile with Gayatri Home Tutors.</p>
        </div>

        {error && (
          <div className="tp-alert tp-alert-error" role="alert">
            {error}
          </div>
        )}

        <form className="tp-auth-form" onSubmit={submit}>
          <label className="tp-field">
            <span>Email address</span>
            <input
              className="tp-input"
              type="email"
              autoComplete="username"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="the address you registered with"
            />
          </label>

          <label className="tp-field">
            <span>Password</span>
            <input
              className="tp-input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type="submit" className="tp-btn tp-btn-primary tp-btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="tp-auth-foot">
          First time here? <Link href="/portal/signup">Set up your account</Link>
          <br />
          <span style={{ fontSize: 12 }}>
            Trouble signing in? Contact the office on WhatsApp.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TutorLoginPage() {
  return (
    <Suspense fallback={<div className="tp-loading">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
