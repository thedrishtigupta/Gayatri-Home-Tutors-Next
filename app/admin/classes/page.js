// // app/admin/classes/page.js — visual pipeline / kanban
// "use client";

// import { useEffect, useState } from "react";
// import AdminSidebar from "@/components/admin/AdminSidebar";
// import TutorPickerModal from "@/components/admin/TutorPickerModal";
// import TelegramModal    from "@/components/admin/TelegramModal";
// import { adminFetch } from "@/lib/adminFetch";

// const COLUMNS = [
//   { key: "pending",           label: "⏳ Pending",          color: "#f59e0b" },
//   { key: "assigned",          label: "📤 Assigned",         color: "#3b82f6" },
//   { key: "accepted",          label: "✅ Accepted",         color: "#10b981" },
//   { key: "rejected_by_tutor", label: "❌ Rejected",         color: "#ef4444" },
//   { key: "reassigned",        label: "🔁 Reassigned",       color: "#8b5cf6" },
//   { key: "dropped",           label: "🗑 Dropped",          color: "#6b7280" },
// ];

// export default function ClassPipelinePage() {
//   const [all, setAll]           = useState([]);
//   const [loading, setLoading]   = useState(true);
//   const [selected, setSelected] = useState(null);
//   const [tgReq, setTgReq]       = useState(null);

//   async function load() {
//     setLoading(true);
//     const res = await adminFetch("/api/admin/demo-requests");
//     setAll(await res.json());
//     setLoading(false);
//   }

//   useEffect(() => { load(); }, []);

//   async function doAction(id, action, extra = {}) {
//     await adminFetch(`/api/admin/demo-requests/${id}`, {
//       method:  "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body:    JSON.stringify({ action, ...extra }),
//     });
//     load();
//   }

//   function subjectDisplay(raw) {
//     try { return JSON.parse(raw).join(", "); } catch { return raw || "—"; }
//   }

//   if (loading) return (
//     <div className="admin-layout">
//       <AdminSidebar />
//       <main className="admin-main"><div className="admin-loading">Loading pipeline…</div></main>
//     </div>
//   );

//   return (
//     <div className="admin-layout">
//       <AdminSidebar />
//       <main className="admin-main admin-main-wide">
//         <div className="admin-page-header">
//           <h1>Class Pipeline</h1>
//           <p>Drag-free Kanban — use action buttons to move classes between stages</p>
//         </div>

//         <div className="kanban-board">
//           {COLUMNS.map(col => {
//             const cards = all.filter(r => r.assignment_status === col.key);
//             return (
//               <div key={col.key} className="kanban-col">
//                 <div className="kanban-col-header" style={{ borderTopColor: col.color }}>
//                   <span>{col.label}</span>
//                   <span className="kanban-count" style={{ background: col.color }}>
//                     {cards.length}
//                   </span>
//                 </div>

//                 <div className="kanban-cards">
//                   {cards.map(r => (
//                     <div key={r.id} className="kanban-card">
//                       <div className="kanban-card-name">{r.full_name}</div>
//                       <div className="kanban-card-meta">📞 {r.phone}</div>
//                       <div className="kanban-card-meta">📚 {subjectDisplay(r.subjects)}</div>
//                       {r.student_class && <div className="kanban-card-meta">🏫 {r.student_class}</div>}
//                       {r.area && <div className="kanban-card-meta">📍 {r.area}</div>}
//                       {r.tutor_first && (
//                         <div className="kanban-card-tutor">
//                           👨‍🏫 {r.tutor_first} {r.tutor_last}
//                         </div>
//                       )}
//                       <div className="kanban-card-date">
//                         {new Date(r.created_at).toLocaleDateString("en-IN")}
//                       </div>

//                       <div className="kanban-card-actions">
//                         <button
//                           className="admin-btn admin-btn-xs admin-btn-tg"
//                           onClick={() => setTgReq(r)}
//                           title="Broadcast"
//                         >📢</button>

//                         {col.key === "pending" && (
//                           <>
//                             <button
//                               className="admin-btn admin-btn-xs admin-btn-primary"
//                               onClick={() => setSelected({ id: r.id, action: "assign" })}
//                             >Assign</button>
//                             <button
//                               className="admin-btn admin-btn-xs admin-btn-dark"
//                               onClick={() => doAction(r.id, "cancel")}
//                             >Cancel</button>
//                           </>
//                         )}

//                         {col.key === "assigned" && (
//                           <>
//                             <button
//                               className="admin-btn admin-btn-xs admin-btn-green"
//                               onClick={() => doAction(r.id, "accept")}
//                             >Accept</button>
//                             <button
//                               className="admin-btn admin-btn-xs admin-btn-red"
//                               onClick={() => {
//                                 const reason = prompt("Rejection reason:");
//                                 doAction(r.id, "reject", { reason });
//                               }}
//                             >Reject</button>
//                           </>
//                         )}

//                         {col.key === "rejected_by_tutor" && (
//                           <>
//                             <button
//                               className="admin-btn admin-btn-xs admin-btn-purple"
//                               onClick={() => setSelected({ id: r.id, action: "reassign" })}
//                             >Reassign</button>
//                             <button
//                               className="admin-btn admin-btn-xs admin-btn-gray"
//                               onClick={() => doAction(r.id, "drop")}
//                             >Drop</button>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   ))}

//                   {!cards.length && (
//                     <div className="kanban-empty">No classes</div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </main>

//       {selected && (
//         <TutorPickerModal
//           onPick={tutorId => {
//             doAction(selected.id, selected.action, { tutorId });
//             setSelected(null);
//           }}
//           onClose={() => setSelected(null)}
//         />
//       )}
//       {tgReq && <TelegramModal demoRequest={tgReq} onClose={() => setTgReq(null)} />}
//     </div>
//   );
// }


// app/admin/classes/page.js — visual pipeline / kanban
"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import TutorPickerModal from "@/components/admin/TutorPickerModal";
import TelegramModal    from "@/components/admin/TelegramModal";
import { adminFetch, adminJson } from "@/lib/adminFetch";
import { statusColor } from "@/lib/statusColors";

const COLUMNS = [
  { key: "pending",           label: "⏳ Pending",    color: statusColor("pending") },
  { key: "assigned",          label: "📤 Assigned",   color: statusColor("assigned") },
  { key: "accepted",          label: "✅ Accepted",   color: statusColor("accepted") },
  { key: "rejected_by_tutor", label: "❌ Rejected",   color: statusColor("rejected_by_tutor") },
  { key: "reassigned",        label: "🔁 Reassigned", color: statusColor("reassigned") },
  { key: "dropped",           label: "🗑 Dropped",    color: statusColor("dropped") },
];

export default function ClassPipelinePage() {
  const [all, setAll]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [tgReq, setTgReq]       = useState(null);

  async function load() {
    setLoading(true);
    // Guarded: a 500 with an empty body used to throw "Unexpected end of
    // JSON input" and leave the pipeline stuck on "Loading".
    const { ok, data } = await adminJson("/api/admin/demo-requests", {}, []);
    setAll(ok && Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function doAction(id, action, extra = {}) {
    await adminFetch(`/api/admin/demo-requests/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, ...extra }),
    });
    load();
  }

  function subjectDisplay(raw) {
    try { return JSON.parse(raw).join(", "); } catch { return raw || "—"; }
  }

  if (loading) return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main"><div className="admin-loading">Loading pipeline…</div></main>
    </div>
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main admin-main-wide">
        <div className="admin-page-header">
          <h1>Class Pipeline</h1>
          <p>Drag-free Kanban — use action buttons to move classes between stages</p>
        </div>

        <div className="kanban-board">
          {COLUMNS.map(col => {
            const cards = all.filter(r => r.assignment_status === col.key);
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header" style={{ borderTopColor: col.color }}>
                  <span>{col.label}</span>
                  <span className="kanban-count" style={{ background: col.color }}>
                    {cards.length}
                  </span>
                </div>

                <div className="kanban-cards">
                  {cards.map(r => (
                    <div key={r.id} className="kanban-card">
                      <div className="kanban-card-name">{r.full_name}</div>
                      <div className="kanban-card-meta">📞 {r.phone}</div>
                      <div className="kanban-card-meta">📚 {subjectDisplay(r.subjects)}</div>
                      {r.student_class && <div className="kanban-card-meta">🏫 {r.student_class}</div>}
                      {r.area && <div className="kanban-card-meta">📍 {r.area}</div>}
                      {r.tutor_first && (
                        <div className="kanban-card-tutor">
                          👨‍🏫 {r.tutor_first} {r.tutor_last}
                        </div>
                      )}
                      <div className="kanban-card-date">
                        {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </div>

                      <div className="kanban-card-actions">
                        <button
                          className="admin-btn admin-btn-xs admin-btn-tg"
                          onClick={() => setTgReq(r)}
                          title="Broadcast"
                        >📢</button>

                        {col.key === "pending" && (
                          <>
                            <button
                              className="admin-btn admin-btn-xs admin-btn-primary"
                              onClick={() => setSelected({ id: r.id, action: "assign" })}
                            >Assign</button>
                            <button
                              className="admin-btn admin-btn-xs admin-btn-dark"
                              onClick={() => doAction(r.id, "cancel")}
                            >Cancel</button>
                          </>
                        )}

                        {col.key === "assigned" && (
                          <>
                            <button
                              className="admin-btn admin-btn-xs admin-btn-green"
                              onClick={() => doAction(r.id, "accept")}
                            >Accept</button>
                            <button
                              className="admin-btn admin-btn-xs admin-btn-red"
                              onClick={() => {
                                const reason = prompt("Rejection reason:");
                                doAction(r.id, "reject", { reason });
                              }}
                            >Reject</button>
                          </>
                        )}

                        {col.key === "rejected_by_tutor" && (
                          <>
                            <button
                              className="admin-btn admin-btn-xs admin-btn-purple"
                              onClick={() => setSelected({ id: r.id, action: "reassign" })}
                            >Reassign</button>
                            <button
                              className="admin-btn admin-btn-xs admin-btn-gray"
                              onClick={() => doAction(r.id, "drop")}
                            >Drop</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {!cards.length && (
                    <div className="kanban-empty">No classes</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {selected && (
        <TutorPickerModal
          onPick={tutorId => {
            doAction(selected.id, selected.action, { tutorId });
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
        />
      )}
      {tgReq && <TelegramModal demoRequest={tgReq} onClose={() => setTgReq(null)} />}
    </div>
  );
}