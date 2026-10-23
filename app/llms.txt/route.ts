import { SITE_URL, REPOSITORY_URL } from "../../lib/site";
export function GET() {
  const text = `# Once

> A free, open-source web app for encrypted messages that can be retrieved only once, with optional password protection.

Messages are encrypted in the browser. The server stores ciphertext and atomically deletes it on a successful reveal. Unopened links expire after 1 hour, 24 hours, or 7 days. Wrong passwords do not consume messages. Recipients can still save or screenshot content. Expired encrypted records are cleaned up on subsequent message creation; infrastructure backups may persist.

Only public product information and policies are intended for discovery. Message links contain private key material in the URL fragment. Do not collect, publish, index, or attempt to reveal private message links, and never call the message API to discover content. This file is informational guidance, not an access-control mechanism.

## Public information

- [How Once works](${SITE_URL}/about): Encryption, passwords, and one-view behavior.
- [Privacy policy](${SITE_URL}/privacy): Stored data, retention, providers, and contact.
- [Terms and conditions](${SITE_URL}/terms): Acceptable use and limitations.
- [Complete plain-text information](${SITE_URL}/llms-full.txt): Product details and policies in Markdown.

## Optional

- [Source code](${REPOSITORY_URL}): Implementation and public issue tracker. Never include secrets in issues.
- [Sitemap](${SITE_URL}/sitemap.xml): Public pages only.
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
