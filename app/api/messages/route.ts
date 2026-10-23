import { env } from "cloudflare:workers";
const headers = { "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "no-store" };
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin." }, { status: 403, headers });
  try {
    const raw = await request.text();
    if (raw.length > 40000) return Response.json({ error: "Message is too long." }, { status: 413, headers });
    const { ciphertext, iv, hours, accessToken } = JSON.parse(raw);
    if (typeof ciphertext !== "string" || !/^[A-Za-z0-9_-]{22,36000}$/.test(ciphertext) || typeof iv !== "string" || !/^[A-Za-z0-9_-]{16}$/.test(iv) || ![1, 24, 168].includes(hours)) return Response.json({ error: "Invalid message." }, { status: 400, headers });
    if (accessToken !== undefined && (typeof accessToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(accessToken))) return Response.json({ error: "Invalid password protection." }, { status: 400, headers });
    const passwordHash = accessToken === undefined ? null : Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(accessToken))), b => b.toString(16).padStart(2, "0")).join("");
    const id = crypto.randomUUID().replaceAll("-", "");
    const expiresAt = Date.now() + hours * 3600000;
    await env.DB!.prepare("DELETE FROM messages WHERE expires_at <= ?").bind(Date.now()).run();
    await env.DB!.prepare("INSERT INTO messages (id, ciphertext, iv, expires_at, password_hash) VALUES (?, ?, ?, ?, ?)").bind(id, ciphertext, iv, expiresAt, passwordHash).run();
    return Response.json({ id, expiresAt }, { headers });
  } catch { return Response.json({ error: "Couldn't create your link. Please try again." }, { status: 500, headers }); }
}
