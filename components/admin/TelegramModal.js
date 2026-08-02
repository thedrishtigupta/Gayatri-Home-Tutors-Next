// // components/admin/TelegramModal.js
// "use client";

// import { useEffect, useState } from "react";
// import { adminFetch } from "@/lib/adminFetch";

// export default function TelegramModal({ demoRequest, onClose }) {
//   const [preview, setPreview]   = useState("");
//   const [custom, setCustom]     = useState("");
//   const [loading, setLoading]   = useState(true);
//   const [sending, setSending]   = useState(false);
//   const [result, setResult]     = useState(null);

//   useEffect(() => {
//     adminFetch(`/api/admin/telegram?id=${demoRequest.id}`)
//       .then(r => r.json())
//       .then(d => { setPreview(d.preview); setLoading(false); });
//   }, [demoRequest.id]);

//   async function send() {
//     setSending(true);
//     const res = await adminFetch("/api/admin/telegram", {
//       method:  "POST",
//       headers: { "Content-Type": "application/json" },
//       body:    JSON.stringify({
//         demoRequestId: demoRequest.id,
//         customMessage: custom.trim() || undefined,
//       }),
//     });
//     const data = await res.json();
//     setResult(data.ok ? "✅ Sent successfully!" : `❌ Error: ${data.error}`);
//     setSending(false);
//   }

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-card modal-card-lg" onClick={e => e.stopPropagation()}>
//         <div className="modal-header">
//           <h2>📢 Telegram Broadcast</h2>
//           <button className="modal-close" onClick={onClose}>✕</button>
//         </div>

//         <div className="modal-body">
//           {loading ? (
//             <div className="admin-loading">Generating preview…</div>
//           ) : (
//             <>
//               <div className="tg-preview-label">Auto-generated message preview:</div>
//               <div className="tg-preview">{preview}</div>

//               <div className="admin-form-group" style={{marginTop:"16px"}}>
//                 <label>Custom message (optional — leave blank to use above)</label>
//                 <textarea
//                   className="admin-input"
//                   rows={8}
//                   placeholder="Override message text…"
//                   value={custom}
//                   onChange={e => setCustom(e.target.value)}
//                 />
//               </div>

//               {result && (
//                 <div className={`admin-alert ${result.startsWith("✅") ? "admin-alert-success" : "admin-alert-error"}`}>
//                   {result}
//                 </div>
//               )}

//               <div className="modal-footer">
//                 <button className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
//                 <button
//                   className="admin-btn admin-btn-primary"
//                   onClick={send}
//                   disabled={sending || !!result}
//                 >
//                   {sending ? "Sending…" : "Send to Channel"}
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// components/admin/TelegramModal.js
"use client";

import { useEffect, useState } from "react";
import { adminFetch, adminJson } from "@/lib/adminFetch";

export default function TelegramModal({ demoRequest, onClose }) {
  const [preview, setPreview]   = useState("");
  const [custom, setCustom]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [result, setResult]     = useState(null);

  useEffect(() => {
    adminJson(`/api/admin/telegram?id=${demoRequest.id}`).then(({ ok, data, error }) => {
      setPreview(ok ? data.preview : `⚠️ Could not build preview: ${error}`);
      setLoading(false);
    });
  }, [demoRequest.id]);

  async function send() {
    setSending(true);
    const res = await adminFetch("/api/admin/telegram", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        demoRequestId: demoRequest.id,
        customMessage: custom.trim() || undefined,
      }),
    });
    const data = await res.text().then(t => { try { return JSON.parse(t); } catch { return { ok: false, error: `Server error (${res.status})` }; } });
    setResult(data.ok ? "✅ Sent successfully!" : `❌ Error: ${data.error}`);
    setSending(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📢 Telegram Broadcast</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="admin-loading">Generating preview…</div>
          ) : (
            <>
              <div className="tg-preview-label">Auto-generated message preview:</div>
              <div className="tg-preview">{preview}</div>

              <div className="admin-form-group" style={{marginTop:"16px"}}>
                <label>Custom message (optional — leave blank to use above)</label>
                <textarea
                  className="admin-input"
                  rows={8}
                  placeholder="Override message text…"
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                />
              </div>

              {result && (
                <div className={`admin-alert ${result.startsWith("✅") ? "admin-alert-success" : "admin-alert-error"}`}>
                  {result}
                </div>
              )}

              <div className="modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={send}
                  disabled={sending || !!result}
                >
                  {sending ? "Sending…" : "Send to Channel"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}