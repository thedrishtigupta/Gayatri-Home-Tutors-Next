// app/api/admin/telegram/route.js — POST: admin triggers broadcast for a demo request

import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { formatClassBroadcast, sendToChannel } from "@/lib/telegram";

export const POST = requireAdmin(async (req) => {
  const { demoRequestId, customMessage } = await req.json();

  if (!demoRequestId) {
    return NextResponse.json({ error: "demoRequestId required" }, { status: 400 });
  }

  const [dr] = await query("SELECT * FROM demo_requests WHERE id = ?", [demoRequestId]);
  if (!dr) return NextResponse.json({ error: "Demo request not found" }, { status: 404 });

  const text = customMessage || formatClassBroadcast(dr);
  const result = await sendToChannel(text);

  // Log the broadcast attempt
  await execute(
    `INSERT INTO telegram_broadcasts (demo_request_id, message_text, success, error_message)
     VALUES (?, ?, ?, ?)`,
    [demoRequestId, text, result.ok ? 1 : 0, result.error || null]
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, preview: text });
});

// GET: preview the formatted message without sending
export const GET = requireAdmin(async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [dr] = await query("SELECT * FROM demo_requests WHERE id = ?", [parseInt(id)]);
  if (!dr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ preview: formatClassBroadcast(dr) });
});
