import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const databaseId = process.argv[2];
if (!databaseId || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(databaseId)) {
  console.error('Usage: npm run host:prepare -- <D1 database UUID>'); process.exit(1);
}
const built = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
const config = {
  name: 'once-message',
  main: resolve('dist/server/index.js'),
  compatibility_date: built.compatibility_date,
  compatibility_flags: built.compatibility_flags,
  no_bundle: true,
  rules: built.rules,
  assets: { directory: resolve('dist/client') },
  d1_databases: [{ binding: 'DB', database_name: 'once-messages', database_id: databaseId, migrations_dir: resolve('drizzle') }],
};
await mkdir('.sites-runtime', {recursive:true});
await writeFile('.sites-runtime/cloudflare.json', JSON.stringify(config,null,2)+'\n');
console.log('Prepared .sites-runtime/cloudflare.json for your Cloudflare account.');
