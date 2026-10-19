import { env } from "cloudflare:workers";
const headers = { "Cache-Control": "no-store, max-age=0", "Pragma": "no-cache" };
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin." }, { status: 403, headers });
  try {
    const raw = await request.text();
    if (raw.length > 100) return Response.json({ error: "Invalid link." }, { status: 400, headers });
    const { id } = JSON.parse(raw);
    if (typeof id !== "string" || !/^[a-f0-9]{32}$/.test(id)) return Response.json({ error: "Invalid link." }, { status: 400, headers });
    // DELETE RETURNING is atomic: concurrent readers cannot both receive the message.
    const row = await env.DB!.prepare("DELETE FROM messages WHERE id = ? RETURNING ciphertext, iv, expires_at").bind(id).first<{ciphertext: string; iv: string; expires_at: number}>();
    if (!row || row.expires_at <= Date.now()) return Response.json({ error: "This message has already been opened or has expired." }, { status: 410, headers });
    return Response.json({ ciphertext: row.ciphertext, iv: row.iv }, { headers });
  } catch { return Response.json({ error: "Couldn't reach your message. Please try again." }, { status: 500, headers }); }
}
