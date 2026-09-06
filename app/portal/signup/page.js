// app/portal/signup/page.js — a registered tutor claims their login.
"use client";

import Link from "next/link";
import { useState } from "react";

export default function TutorSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/tutor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not create your account.");
        setBusy(false);
        return;
      }

      setDone(data);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="tp-auth">
        <div className="tp-auth-card">
          <div className="tp-auth-logo">
            <span aria-hidden="true">{done.status === "pending_verification" ? "📧" : "⏳"}</span>
            <h1>{done.status === "pending_verification" ? "Check your email" : "Request received"}</h1>
          </div>

          <div className="tp-alert tp-alert-info">{done.message}</div>

          <div className="tp-auth-foot">
            <Link href="/portal/login">Back to sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-auth">
      <div className="tp-auth-card">
        <div className="tp-auth-logo">
          <span aria-hidden="true">🏫</span>
          <h1>Set up your account</h1>
          <p>
            Use the email address you gave when you registered as a tutor. If it is not recognised,
            contact the office on WhatsApp.
          </p>
        </div>

        {error && (
          <div className="tp-alert tp-alert-error" role="alert">
            {error}
          </div>
        )}

        <form className="tp-auth-form" onSubmit={submit}>
          <label className="tp-field">
            <span>Registered email address</span>
            <input
              className="tp-input"
              type="email"
              autoComplete="username"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="tp-field">
            <span>Choose a password</span>
            <input
              className="tp-input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small className="tp-field-hint">At least 8 characters, with a letter and a number.</small>
          </label>

          <label className="tp-field">
            <span>Confirm password</span>
            <input
              className="tp-input"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>

          <button type="submit" className="tp-btn tp-btn-primary tp-btn-block" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="tp-auth-foot">
          Already set up? <Link href="/portal/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
