
// components/admin/TutorPickerModal.js
"use client";

import { useEffect, useState } from "react";
import { adminJson } from "@/lib/adminFetch";

export default function TutorPickerModal({ onPick, onClose }) {
  const [tutors, setTutors]   = useState([]);
  const [search, setSearch]   = useState("");
  const [subject, setSubject] = useState("");
  const [area, setArea]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams({ status: "active" });
    if (search)  qs.set("search",  search);
    if (subject) qs.set("subject", subject);
    if (area)    qs.set("area",    area);
    // A failed filter query returns an empty body; res.json() threw
    // "Unexpected end of JSON input" and left the modal blank forever.
    // The endpoint answers { data, page, total, ... }; older builds answered a
    // bare array, so both shapes are accepted here.
    const { ok, data, error: err } = await adminJson(`/api/admin/tutors?${qs}`, {}, []);
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    setTutors(ok ? list : []);
    if (!ok) setError(err);
    setLoading(false);
  }


  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select a Tutor</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-filters">
          <input
            className="admin-input"
            placeholder="Search name / phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <input
            className="admin-input"
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
          <input
            className="admin-input"
            placeholder="Area"
            value={area}
            onChange={e => setArea(e.target.value)}
          />
          <button className="admin-btn admin-btn-primary" onClick={load}>Search</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="admin-loading">Loading tutors…</div>
          ) : (
            <div className="tutor-picker-list">
              {tutors.map(t => (
                <div key={t.id} className="tutor-picker-item">
                  <div className="tutor-picker-info">
                    <strong>{t.first_name} {t.last_name}</strong>
                    <span className="text-muted">{t.whatsapp}</span>
                    <span className="text-muted" style={{fontSize:"12px"}}>
                      {t.subjects?.split(",").slice(0,3).join(", ")}
                    </span>
                    <span className="text-muted" style={{fontSize:"12px"}}>
                      📍 {t.areas?.split(",").slice(0,3).join(", ")}
                    </span>
                  </div>
                  <div className="tutor-picker-meta">
                    <span className="success-pill">
                      {t.total_classes_assigned > 0
                        ? `${Number(t.success_rate).toFixed(0)}% success`
                        : "New"}
                    </span>
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={() => onPick(t.id)}
                    >Assign</button>
                  </div>
                </div>
              ))}
              {!tutors.length && !loading && (
                <p className="text-center text-muted">No active tutors found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}