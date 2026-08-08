// // app/admin/demo-requests/page.js
// "use client";

// import { useEffect, useState, useCallback } from "react";
// import AdminSidebar from "@/components/admin/AdminSidebar";
// import TutorPickerModal from "@/components/admin/TutorPickerModal";
// import TelegramModal    from "@/components/admin/TelegramModal";
// import { adminFetch } from "@/lib/adminFetch";

// const STATUS_COLORS = {
//   pending:           "#f59e0b",
//   assigned:          "#3b82f6",
//   accepted:          "#10b981",
//   rejected_by_tutor: "#ef4444",
//   reassigned:        "#8b5cf6",
//   dropped:           "#6b7280",
//   cancelled:         "#374151",
// };

// const STATUS_LABELS = {
//   pending:           "⏳ Pending",
//   assigned:          "📤 Assigned",
//   accepted:          "✅ Accepted",
//   rejected_by_tutor: "❌ Rejected",
//   reassigned:        "🔁 Reassigned",
//   dropped:           "🗑 Dropped",
//   cancelled:         "⛔ Cancelled",
// };

// export default function DemoRequestsPage() {
//   const [rows, setRows]           = useState([]);
//   const [loading, setLoading]     = useState(true);
//   const [statusFilter, setStatus] = useState("");
//   const [search, setSearch]       = useState("");
//   const [selected, setSelected]   = useState(null);    // for tutor picker
//   const [telegramReq, setTgReq]   = useState(null);    // for telegram modal
//   const [actionLoading, setAL]    = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     const qs = new URLSearchParams();
//     if (statusFilter) qs.set("status", statusFilter);
//     if (search)       qs.set("search", search);
//     const res = await adminFetch(`/api/admin/demo-requests?${qs}`);
//     setRows(await res.json());
//     setLoading(false);
//   }, [statusFilter, search]);

//   useEffect(() => { load(); }, [load]);

//   async function doAction(id, action, extra = {}) {
//     setAL(true);
//     await adminFetch(`/api/admin/demo-requests/${id}`, {
//       method:  "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body:    JSON.stringify({ action, ...extra }),
//     });
//     setAL(false);
//     load();
//   }

//   function subjectDisplay(raw) {
//     try { return JSON.parse(raw).join(", "); }
//     catch { return raw || "—"; }
//   }

//   return (
//     <div className="admin-layout">
//       <AdminSidebar />
//       <main className="admin-main">
//         <div className="admin-page-header">
//           <h1>Demo Requests</h1>
//           <p>All student/parent enquiries and their assignment status</p>
//         </div>

//         {/* ── Filters ── */}
//         <div className="admin-filters">
//           <input
//             type="text"
//             placeholder="Search name, phone, area…"
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             className="admin-input"
//           />
//           <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="admin-select">
//             <option value="">All Statuses</option>
//             {Object.entries(STATUS_LABELS).map(([v, l]) => (
//               <option key={v} value={v}>{l}</option>
//             ))}
//           </select>
//           <button onClick={load} className="admin-btn admin-btn-secondary">Refresh</button>
//         </div>

//         {loading ? (
//           <div className="admin-loading">Loading…</div>
//         ) : (
//           <div className="admin-table-wrap">
//             <table className="admin-table">
//               <thead>
//                 <tr>
//                   <th>#</th><th>Name</th><th>Phone</th><th>Class</th>
//                   <th>Subjects</th><th>Area</th><th>Source</th>
//                   <th>Status</th><th>Tutor</th><th>Date</th><th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map(r => (
//                   <tr key={r.id}>
//                     <td className="text-muted">{r.id}</td>
//                     <td><strong>{r.full_name}</strong></td>
//                     <td><a href={`tel:${r.phone}`}>{r.phone}</a></td>
//                     <td>{r.student_class || "—"}</td>
//                     <td className="text-muted">{subjectDisplay(r.subjects)}</td>
//                     <td>{r.area || "—"}</td>
//                     <td>
//                       <span className="source-badge">{r.source}</span>
//                     </td>
//                     <td>
//                       <span className="status-pill" style={{
//                         background: STATUS_COLORS[r.assignment_status] + "22",
//                         color:      STATUS_COLORS[r.assignment_status],
//                         border:     `1px solid ${STATUS_COLORS[r.assignment_status]}44`,
//                       }}>
//                         {STATUS_LABELS[r.assignment_status] || r.assignment_status}
//                       </span>
//                     </td>
//                     <td>
//                       {r.tutor_first
//                         ? `${r.tutor_first} ${r.tutor_last}`
//                         : <span className="text-muted">—</span>}
//                     </td>
//                     <td className="text-muted">
//                       {new Date(r.created_at).toLocaleDateString("en-IN")}
//                     </td>
//                     <td>
//                       <div className="action-group">
//                         {/* Broadcast to Telegram */}
//                         <button
//                           className="admin-btn admin-btn-xs admin-btn-tg"
//                           title="Broadcast on Telegram"
//                           onClick={() => setTgReq(r)}
//                         >📢</button>

//                         {/* Assign tutor */}
//                         {["pending","rejected_by_tutor","reassigned"].includes(r.assignment_status) && (
//                           <button
//                             className="admin-btn admin-btn-xs admin-btn-primary"
//                             onClick={() => setSelected({ id: r.id, action: "assign" })}
//                             disabled={actionLoading}
//                           >Assign</button>
//                         )}

//                         {/* Accept */}
//                         {r.assignment_status === "assigned" && (
//                           <button
//                             className="admin-btn admin-btn-xs admin-btn-green"
//                             onClick={() => doAction(r.id, "accept")}
//                             disabled={actionLoading}
//                           >Accept</button>
//                         )}

//                         {/* Reject by tutor */}
//                         {r.assignment_status === "assigned" && (
//                           <button
//                             className="admin-btn admin-btn-xs admin-btn-red"
//                             onClick={() => {
//                               const reason = prompt("Rejection reason (optional):");
//                               doAction(r.id, "reject", { reason });
//                             }}
//                             disabled={actionLoading}
//                           >Reject</button>
//                         )}

//                         {/* Reassign after rejection */}
//                         {r.assignment_status === "rejected_by_tutor" && (
//                           <button
//                             className="admin-btn admin-btn-xs admin-btn-purple"
//                             onClick={() => setSelected({ id: r.id, action: "reassign" })}
//                             disabled={actionLoading}
//                           >Reassign</button>
//                         )}

//                         {/* Drop */}
//                         {!["dropped","cancelled","accepted"].includes(r.assignment_status) && (
//                           <button
//                             className="admin-btn admin-btn-xs admin-btn-gray"
//                             onClick={() => {
//                               const reason = prompt("Drop reason (optional):");
//                               doAction(r.id, "drop", { reason });
//                             }}
//                             disabled={actionLoading}
//                           >Drop</button>
//                         )}

//                         {/* Cancel before any assignment */}
//                         {r.assignment_status === "pending" && (
//                           <button
//                             className="admin-btn admin-btn-xs admin-btn-dark"
//                             onClick={() => doAction(r.id, "cancel")}
//                             disabled={actionLoading}
//                           >Cancel</button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {!rows.length && (
//                   <tr><td colSpan={11} className="text-center text-muted">No results found</td></tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </main>

//       {/* Tutor picker modal */}
//       {selected && (
//         <TutorPickerModal
//           onPick={tutorId => {
//             doAction(selected.id, selected.action, { tutorId });
//             setSelected(null);
//           }}
//           onClose={() => setSelected(null)}
//         />
//       )}

//       {/* Telegram broadcast modal */}
//       {telegramReq && (
//         <TelegramModal
//           demoRequest={telegramReq}
//           onClose={() => setTgReq(null)}
//         />
//       )}
//     </div>
//   );
// }

// app/admin/demo-requests/page.js
"use client";

import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import TutorPickerModal from "@/components/admin/TutorPickerModal";
import TelegramModal    from "@/components/admin/TelegramModal";
import { adminFetch, adminJson } from "@/lib/adminFetch";
import { statusColor } from "@/lib/statusColors";

const STATUS_LABELS = {
  pending:           "⏳ Pending",
  assigned:          "📤 Assigned",
  accepted:          "✅ Accepted",
  rejected_by_tutor: "❌ Rejected",
  reassigned:        "🔁 Reassigned",
  dropped:           "🗑 Dropped",
  cancelled:         "⛔ Cancelled",
};

export default function DemoRequestsPage() {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState("");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);    // for tutor picker
  const [telegramReq, setTgReq]   = useState(null);    // for telegram modal
  const [actionLoading, setAL]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (search)       qs.set("search", search);
    const { ok, data } = await adminJson(`/api/admin/demo-requests?${qs}`, {}, []);
    setRows(ok && Array.isArray(data) ? data : []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function doAction(id, action, extra = {}) {
    setAL(true);
    await adminFetch(`/api/admin/demo-requests/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, ...extra }),
    });
    setAL(false);
    load();
  }

  function subjectDisplay(raw) {
    try { return JSON.parse(raw).join(", "); }
    catch { return raw || "—"; }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-page-header">
          <h1>Demo Requests</h1>
          <p>All student/parent enquiries and their assignment status</p>
        </div>

        {/* ── Filters ── */}
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search name, phone, area…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input"
          />
          <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="admin-select">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button onClick={load} className="admin-btn admin-btn-secondary">Refresh</button>
        </div>

        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Phone</th><th>Class</th>
                  <th>Subjects</th><th>Area</th><th>Source</th>
                  <th>Status</th><th>Tutor</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td className="text-muted">{r.id}</td>
                    <td><strong>{r.full_name}</strong></td>
                    <td><a href={`tel:${r.phone}`}>{r.phone}</a></td>
                    <td>{r.student_class || "—"}</td>
                    <td className="text-muted">{subjectDisplay(r.subjects)}</td>
                    <td>{r.area || "—"}</td>
                    <td>
                      <span className="source-badge">{r.source}</span>
                    </td>
                    <td>
                      <span className="status-pill" style={{
                        background: `${statusColor(r.assignment_status)}18`,
                        color:      statusColor(r.assignment_status),
                        border:     `1px solid ${statusColor(r.assignment_status)}40`,
                      }}>
                        {STATUS_LABELS[r.assignment_status] || r.assignment_status}
                      </span>
                    </td>
                    <td>
                      {r.tutor_first
                        ? `${r.tutor_first} ${r.tutor_last}`
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted">
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <div className="action-group">
                        {/* Broadcast to Telegram */}
                        <button
                          className="admin-btn admin-btn-xs admin-btn-tg"
                          title="Broadcast on Telegram"
                          onClick={() => setTgReq(r)}
                        >📢</button>

                        {/* Assign tutor */}
                        {["pending","rejected_by_tutor","reassigned"].includes(r.assignment_status) && (
                          <button
                            className="admin-btn admin-btn-xs admin-btn-primary"
                            onClick={() => setSelected({ id: r.id, action: "assign" })}
                            disabled={actionLoading}
                          >Assign</button>
                        )}

                        {/* Accept */}
                        {r.assignment_status === "assigned" && (
                          <button
                            className="admin-btn admin-btn-xs admin-btn-green"
                            onClick={() => doAction(r.id, "accept")}
                            disabled={actionLoading}
                          >Accept</button>
                        )}

                        {/* Reject by tutor */}
                        {r.assignment_status === "assigned" && (
                          <button
                            className="admin-btn admin-btn-xs admin-btn-red"
                            onClick={() => {
                              const reason = prompt("Rejection reason (optional):");
                              doAction(r.id, "reject", { reason });
                            }}
                            disabled={actionLoading}
                          >Reject</button>
                        )}

                        {/* Reassign after rejection */}
                        {r.assignment_status === "rejected_by_tutor" && (
                          <button
                            className="admin-btn admin-btn-xs admin-btn-purple"
                            onClick={() => setSelected({ id: r.id, action: "reassign" })}
                            disabled={actionLoading}
                          >Reassign</button>
                        )}

                        {/* Drop */}
                        {!["dropped","cancelled","accepted"].includes(r.assignment_status) && (
                          <button
                            className="admin-btn admin-btn-xs admin-btn-gray"
                            onClick={() => {
                              const reason = prompt("Drop reason (optional):");
                              doAction(r.id, "drop", { reason });
                            }}
                            disabled={actionLoading}
                          >Drop</button>
                        )}

                        {/* Cancel before any assignment */}
                        {r.assignment_status === "pending" && (
                          <button
                            className="admin-btn admin-btn-xs admin-btn-dark"
                            onClick={() => doAction(r.id, "cancel")}
                            disabled={actionLoading}
                          >Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={11} className="text-center text-muted">No results found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Tutor picker modal */}
      {selected && (
        <TutorPickerModal
          onPick={tutorId => {
            doAction(selected.id, selected.action, { tutorId });
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Telegram broadcast modal */}
      {telegramReq && (
        <TelegramModal
          demoRequest={telegramReq}
          onClose={() => setTgReq(null)}
        />
      )}
    </div>
  );
}