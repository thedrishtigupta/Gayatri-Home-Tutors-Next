// app/tutor/verify/page.js — landing page for the emailed confirmation link.
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyBody() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState({ status: "working" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "This confirmation link is incomplete." });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/tutor/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        setState(
          res.ok
            ? { status: "ok", message: data.message, name: data.name }
            : { status: "error", message: data.error || "This link could not be used." }
        );
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Could not reach the server. Try the link again shortly." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const icon = state.status === "ok" ? "✅" : state.status === "error" ? "⚠️" : "⏳";
  const heading =
    state.status === "ok" ? "Email confirmed" : state.status === "error" ? "Link not valid" : "Confirming…";

  return (
    <div className="tp-auth">
      <div className="tp-auth-card">
        <div className="tp-auth-logo">
          <span aria-hidden="true">{icon}</span>
          <h1>{heading}</h1>
        </div>

        {state.status === "working" ? (
          <p className="tp-loading">Checking your confirmation link…</p>
        ) : (
          <div className={`tp-alert ${state.status === "ok" ? "tp-alert-success" : "tp-alert-error"}`} role="status">
            {state.message}
          </div>
        )}

        {state.status !== "working" && (
          <div className="tp-auth-foot">
            {state.status === "ok" ? (
              <Link href="/tutor/login">Sign in now</Link>
            ) : (
              <>
                <Link href="/tutor/signup">Try setting up again</Link>
                {" · "}
                <Link href="/tutor/login">Sign in</Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TutorVerifyPage() {
  return (
    <Suspense fallback={<div className="tp-loading">Loading…</div>}>
      <VerifyBody />
    </Suspense>
  );
}
