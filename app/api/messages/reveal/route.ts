import { env } from "cloudflare:workers";
const headers = { "Cache-Control": "no-store, max-age=0", "Pragma": "no-cache" };
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin." }, { status: 403, headers });
  try {
    const raw = await request.text();
    if (raw.length > 250) return Response.json({ error: "Invalid link." }, { status: 400, headers });
    const { id, accessToken } = JSON.parse(raw);
    if (typeof id !== "string" || !/^[a-f0-9]{32}$/.test(id)) return Response.json({ error: "Invalid link." }, { status: 400, headers });
    if (accessToken !== undefined && (typeof accessToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(accessToken))) return Response.json({ error: "Invalid password protection." }, { status: 400, headers });
    const passwordHash = accessToken === undefined ? null : Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(accessToken))), b => b.toString(16).padStart(2, "0")).join("");
    // DELETE RETURNING is atomic: concurrent readers cannot both receive the message.
    const row = await env.DB!.prepare("DELETE FROM messages WHERE id = ? AND (password_hash IS NULL OR password_hash = ?) RETURNING ciphertext, iv, expires_at").bind(id, passwordHash).first<{ciphertext: string; iv: string; expires_at: number}>();
    if (!row) {
      const existing = await env.DB!.prepare("SELECT expires_at FROM messages WHERE id = ?").bind(id).first<{expires_at: number}>();
      if (existing && existing.expires_at > Date.now()) return Response.json({ error: "Incorrect password. Please try again.", passwordRequired: true }, { status: 401, headers });
    }
    if (!row || row.expires_at <= Date.now()) return Response.json({ error: "This message has already been opened or has expired." }, { status: 410, headers });
    return Response.json({ ciphertext: row.ciphertext, iv: row.iv }, { headers });
  } catch { return Response.json({ error: "Couldn't reach your message. Please try again." }, { status: 500, headers }); }
}
