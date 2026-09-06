// components/portal/TutorHeader.js
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/portal/dashboard", label: "Overview" },
  { href: "/portal/profile", label: "My profile" },
];

export default function TutorHeader({ name, impersonation }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function signOut() {
    if (leaving) return;
    setLeaving(true);
    try {
      await fetch("/api/tutor/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* leaving regardless */
    }
    router.push("/portal/login");
    router.refresh();
  }

  /** Drop the read-only tutor session and go back to the admin panel. */
  async function exitImpersonation() {
    if (leaving) return;
    setLeaving(true);
    try {
      await fetch("/api/admin/tutor-impersonate", { method: "DELETE", credentials: "same-origin" });
    } catch {
      /* leaving regardless */
    }
    router.push("/admin/tutors");
    router.refresh();
  }

  return (
    <>
      {impersonation && (
        <div className="tp-impersonation-bar" role="status">
          <span>
            <strong>Viewing as {name || "this tutor"}.</strong> This is what they see — read-only, and it
            ends automatically after 30 minutes.
          </span>
          <button type="button" onClick={exitImpersonation} disabled={leaving}>
            {leaving ? "Leaving…" : "Back to admin"}
          </button>
        </div>
      )}

      <header className="tp-header">
      <div className="tp-header-inner">
        <Link href="/portal/dashboard" className="tp-brand">
          <span aria-hidden="true" style={{ fontSize: 22 }}>🏫</span>
          <div>
            <strong>Gayatri Home Tutors</strong>
            <small>{name ? `Signed in as ${name}` : "Tutor panel"}</small>
          </div>
        </Link>

        <nav className="tp-header-nav" aria-label="Tutor panel">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          {!impersonation && (
            <button type="button" className="tp-btn tp-btn-ghost" onClick={signOut} disabled={leaving}>
              {leaving ? "Signing out…" : "Sign out"}
            </button>
          )}
        </nav>
      </div>
      </header>
    </>
  );
}
