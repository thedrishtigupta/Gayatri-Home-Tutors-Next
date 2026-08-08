// components/admin/AdminSidebar.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/demo-requests", label: "Demo Requests", icon: "📋" },
  { href: "/admin/tutors", label: "Tutors", icon: "👨‍🏫" },
  { href: "/admin/classes", label: "Class Pipeline", icon: "🔄" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Toggle a class on .admin-root so the CSS can slide the sidebar in/out
  // without every admin page needing to know about it.
  useEffect(() => {
    const root = document.querySelector(".admin-root");
    if (!root) return undefined;
    root.classList.toggle("sidebar-open", open);
    return () => root.classList.remove("sidebar-open");
  }, [open]);

  // Close the drawer whenever the route changes, and on Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleLogout() {
    if (loggingOut) return; // prevents duplicate submissions
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* logging out locally regardless */
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="admin-sidebar-toggle"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="admin-sidebar"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className="admin-sidebar" id="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span aria-hidden="true">🏫</span>
          <div>
            <strong>GHT Admin</strong>
            <small>Gayatri Home Tutors</small>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin sections">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`admin-nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-link">
            <span className="nav-icon" aria-hidden="true">
              🌐
            </span>{" "}
            View Site
          </a>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="admin-nav-link admin-logout-btn"
          >
            <span className="nav-icon" aria-hidden="true">
              🚪
            </span>{" "}
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
