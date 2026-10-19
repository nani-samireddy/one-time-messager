import assert from 'node:assert/strict';
const origin = process.env.TEST_ORIGIN || 'http://localhost:5173';
const headers = { Origin: origin, 'Content-Type': 'application/json' };
const encode = bytes => Buffer.from(bytes).toString('base64url');
const key = await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const original = 'A secret with unicode: నమస్తే 🌱';
const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, new TextEncoder().encode(original));
async function create() {
 const res = await fetch(origin+'/api/messages',{method:'POST',headers,body:JSON.stringify({ciphertext:encode(ciphertext),iv:encode(iv),hours:24})});
 assert.equal(res.status,200);return (await res.json()).id;
}
const reveal = id => fetch(origin+'/api/messages/reveal',{method:'POST',headers,body:JSON.stringify({id})});
const id = await create();
const first = await reveal(id);assert.equal(first.status,200);
assert.match(first.headers.get('cache-control'),/no-store/);
const body=await first.json();
const decoded=await crypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(body.iv,'base64url')},key,Buffer.from(body.ciphertext,'base64url'));
assert.equal(new TextDecoder().decode(decoded),original);
assert.equal((await reveal(id)).status,410);
const concurrentId=await create();
const results=await Promise.all(Array.from({length:5},()=>reveal(concurrentId)));
assert.deepEqual(results.map(r=>r.status).sort(),[200,410,410,410,410]);
assert.equal((await reveal('bad')).status,400);
assert.equal((await fetch(origin+'/api/messages',{method:'POST',headers:{...headers,Origin:'https://elsewhere.test'},body:'{}'})).status,403);
assert.equal((await fetch(origin+'/api/messages',{method:'POST',headers,body:JSON.stringify({ciphertext:'invalid',iv:'bad',hours:24})})).status,400);
console.log('Passed: Unicode encryption round-trip, repeat reveal denied, 5 concurrent reveals allow exactly one winner, no-store, invalid input and cross-origin rejection.');
