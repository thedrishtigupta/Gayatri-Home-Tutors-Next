// components/admin/AdminSidebar.js
"use client";

import Link     from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard",      label: "Dashboard",      icon: "📊" },
  { href: "/admin/demo-requests",  label: "Demo Requests",  icon: "📋" },
  { href: "/admin/tutors",         label: "Tutors",         icon: "👨‍🏫" },
  { href: "/admin/classes",        label: "Class Pipeline", icon: "🔄" },
  { href: "/admin/analytics",      label: "Analytics",      icon: "📈" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span>🏫</span>
        <div>
          <strong>GHT Admin</strong>
          <small>Gayatri Home Tutors</small>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`admin-nav-link ${pathname.startsWith(href) ? "active" : ""}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <a href="/" target="_blank" rel="noopener" className="admin-nav-link">
          <span className="nav-icon">🌐</span> View Site
        </a>
        <button onClick={handleLogout} className="admin-nav-link admin-logout-btn">
          <span className="nav-icon">🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
