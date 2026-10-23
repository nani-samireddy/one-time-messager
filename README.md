# Once

A minimal one-view messenger. Browser-encrypted messages, copyable links, and one atomic database deletion per reveal. Built with React, Vinext, and Cloudflare D1.

## Run locally

Requires Node.js 22.13+.

```sh
npm ci
npm run build
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flaky_metal_master.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_cheerful_grandmaster.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_lyrical_sleeper.sql
npm run dev
```

Open the printed localhost URL. Local preview and production use separate databases.

## Host free on your own Cloudflare account

Use the Workers Free plan and the included D1 free tier. No paid database, paid domain, or Sites subscription is needed for this path. You receive a `workers.dev` URL. Usage is subject to Cloudflare's free tier limits; remain on the Free plan to avoid paid usage. Current allowances: https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/d1/platform/pricing/.

1. Create a free Cloudflare account and sign in:

   ```sh
   npx wrangler login
   npx wrangler d1 create once-messages
   ```

2. Copy the `database_id` UUID from the output, then run:

   ```sh
   npm run build
   npm run host:prepare -- YOUR_DATABASE_UUID
   npx wrangler d1 migrations apply DB --remote --config .sites-runtime/cloudflare.json
   npx wrangler deploy --config .sites-runtime/cloudflare.json
   ```

3. Open the `workers.dev` URL printed by Wrangler. Links automatically use the site's current origin.

After updates, rebuild, rerun `host:prepare` with the same database ID, apply new migrations, and redeploy. The generated Cloudflare configuration is checkout-local and ignored by Git. Keep the same database for existing unopened links to continue working. Direct Cloudflare deployment is independent of the optional Sites hosting manifest.

## Verify

```sh
npx tsc --noEmit
# With the local dev server running:
node --experimental-strip-types tests/one-view.mjs
```

The integration check covers encryption with Unicode, successful first reveal, refusal of a second reveal, five concurrent reads with exactly one successful read, no-store responses, origin validation, and input validation.

## Message lifecycle

- Optional passwords use PBKDF2-SHA-256 (600,000 iterations) in the browser to derive separate encryption and authorization keys. The server stores only a hash of the authorization token. Incorrect or missing passwords do not delete the message. Protected links end in `.p`; removing the marker does not bypass the server check. Share the password separately from the link.
- AES-256-GCM encryption happens in the browser. The server receives ciphertext and an IV, never the key or plaintext.
- Link format: `/#<random-id>.<decryption-key>`. Both values live in the fragment. The ID is sent explicitly to the reveal API; the key never is.
- The URL does not contain the entire message: that would let anyone decode it repeatedly. A server-side record is necessary to enforce one-time retrieval across devices.
- The Reveal button prevents ordinary link preview crawlers from consuming messages. A single `DELETE ... RETURNING` query retrieves and deletes the message, preventing simultaneous reads.
- Unopened messages become inaccessible after 1 hour, 24 hours, or 7 days. Expired rows are cleaned up on subsequent creates. With no subsequent traffic they may remain encrypted in the database until cleanup; they cannot be revealed through the API.
- The reader can view the message until closing or navigating away. Refreshing does not retrieve it again. Network failure after deletion can lose a message before the recipient sees it.
- Anyone with the complete link and, for protected messages, the password can reveal it first. Recipients can still copy or screenshot the message. Deletion from the live application database does not promise erasure from provider backups.

## Public pages and discovery

- `/about`, `/privacy`, `/terms`: product information and policies, linked from every footer.
- `/sitemap.xml`: only the four public pages; never message links.
- `/robots.txt`: allows public content and excludes the API and authentication routes.
- `/llms.txt` and `/llms-full.txt`: public product and policy documentation for agents, without private messages.
- Open Graph/Twitter image, JSON-LD, canonical URLs, web manifest, and Apple icon are included.

`lib/site.ts` defines the canonical public origin. Update it when moving to a custom domain. The separate ChatGPT Sites deployment points to the Cloudflare origin as canonical. Message views set `noindex, nofollow, noarchive`; API responses also use `X-Robots-Tag` and `no-store`. Robots directives are not access controls. Only possession of the required link and password can authorize retrieval.
