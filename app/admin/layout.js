// app/admin/layout.js — bare layout for all admin pages (no public header/footer)
import "@/styles/admin.css";

export const metadata = { title: { default: "Admin", template: "%s | GHT Admin" } };

export default function AdminLayout({ children }) {
  return <div className="admin-root">{children}</div>;
}
