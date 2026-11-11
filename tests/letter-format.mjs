import assert from "node:assert/strict";
import { blankLetter, decodeLetter, parseLetterLink } from "../lib/letter.ts";

const id = "a".repeat(32);
const key = "b".repeat(43);
const link = `#${id}.${key}`;
assert.deepEqual(parseLetterLink(link), { id, key, protected: false, styled: false });
assert.deepEqual(parseLetterLink(link + ".p"), { id, key, protected: true, styled: false });
assert.deepEqual(parseLetterLink(link + ".l"), { id, key, protected: false, styled: true });
assert.deepEqual(parseLetterLink(link + ".p.l"), { id, key, protected: true, styled: true });
for (const malformed of [link + ".", link + ".l.p", link + ".p.p", "#bad"]) {
  assert.equal(parseLetterLink(malformed), null);
}

const letter = { ...blankLetter, message: "Thinking of you 🪻\nSee you soon.", to: "Mira", from: "Dev", paper: "lilac", font: "classic", stamp: "star" };
const payload = JSON.stringify(letter);
assert.deepEqual(decodeLetter(payload, true), letter);
assert.equal(decodeLetter(payload, false).message, payload); // Older notes may be literal JSON.
assert.deepEqual(decodeLetter(JSON.stringify({ ...letter, paper: "__proto__", stamp: "unrecognized" }), true), { ...letter, paper: "cream", stamp: "heart" });
assert.throws(() => decodeLetter(JSON.stringify({ ...letter, message: "x".repeat(4001) }), true));

const maxLetter = { ...letter, message: "\u0000".repeat(4000), to: "\u0000".repeat(60), from: "\u0000".repeat(60) };
const bytes = new TextEncoder().encode(JSON.stringify(maxLetter)).length + 16; // AES-GCM tag.
assert.ok(Math.ceil(bytes * 4 / 3) <= 36000, "A maximum-size styled letter fits the existing ciphertext limit.");
console.log("Passed: older links, styled link flags, safe theme fallbacks, and maximum payload size.");
