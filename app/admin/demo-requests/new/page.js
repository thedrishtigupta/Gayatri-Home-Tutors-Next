// app/admin/demo-requests/new/page.js — Log a call/email/walk-in enquiry
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminFetch } from "@/lib/adminFetch";

const SUBJECTS = [
  "Mathematics","English","Social Studies","Chemistry","Accounts",
  "Science","Hindi","Physics","Biology","Economics","Business Studies","Computer Science",
];

const initialState = {
  fullName:"", phone:"", email:"", studentClass:"", time:"",
  subjects:[], area:"", message:"", source:"call", notes:"",
};

export default function NewEnquiryPage() {
  const router = useRouter();
  const [form, setForm]       = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function toggleSubject(s) {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter(x => x !== s) : [...f.subjects, s],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await adminFetch("/api/admin/demo-requests/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/admin/demo-requests");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-page-header">
          <h1>Log New Enquiry</h1>
          <p>Manually record a demo request received via call, email, WhatsApp, or walk-in</p>
        </div>

        <div className="admin-section" style={{ maxWidth: 680 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <div className="admin-alert admin-alert-error">{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="admin-form-group">
                <label>Full Name *</label>
                <input className="admin-input" name="fullName" value={form.fullName} onChange={handleChange} required />
              </div>
              <div className="admin-form-group">
                <label>Phone *</label>
                <input className="admin-input" name="phone" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="admin-form-group">
                <label>Email</label>
                <input className="admin-input" type="email" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="admin-form-group">
                <label>Source *</label>
                <select className="admin-select" name="source" value={form.source} onChange={handleChange}>
                  <option value="call">📞 Phone Call</option>
                  <option value="email">📧 Email</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="walk_in">🚶 Walk-in</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Student Class</label>
                <select className="admin-select" name="studentClass" value={form.studentClass} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Class 1–5</option><option>Class 6–8</option>
                  <option>Class 9–10</option><option>Class 11–12</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Preferred Time</label>
                <select className="admin-select" name="time" value={form.time} onChange={handleChange}>
                  <option value="">Any</option>
                  <option>Morning</option><option>Afternoon</option><option>Evening</option>
                </select>
              </div>
            </div>

            <div className="admin-form-group">
              <label>Area</label>
              <input className="admin-input" name="area" value={form.area} onChange={handleChange} placeholder="e.g. Rohini, Pitampura" />
            </div>

            <div className="admin-form-group">
              <label>Subjects Required</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                {SUBJECTS.map(s => (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                    background: form.subjects.includes(s) ? "var(--a-blue-light)" : "var(--a-surface-2)",
                    border: `1px solid ${form.subjects.includes(s) ? "var(--a-blue)" : "var(--a-border)"}`,
                    padding: "4px 10px", borderRadius: 6, fontSize: 12,
                    color: form.subjects.includes(s) ? "var(--a-blue)" : "var(--a-text-muted)",
                  }}>
                    <input type="checkbox" checked={form.subjects.includes(s)} onChange={() => toggleSubject(s)} style={{ display:"none" }} />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-form-group">
              <label>Message / Requirements</label>
              <textarea className="admin-input" name="message" value={form.message} onChange={handleChange} rows={3} />
            </div>

            <div className="admin-form-group">
              <label>Internal Notes (not visible to tutor)</label>
              <textarea className="admin-input" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Any internal notes about this enquiry…" />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                {loading ? "Saving…" : "Log Enquiry"}
              </button>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => router.back()}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
