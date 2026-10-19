export const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
export const decode = (value: string) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0));

// The link seed salts password derivation. Independent halves provide encryption
// and server authorization; neither the password nor the encryption key is sent.
export async function messageKeys(seed: Uint8Array<ArrayBuffer>, password?: string) {
  if (password === undefined) return {
    key: await crypto.subtle.importKey("raw", seed, "AES-GCM", false, ["encrypt", "decrypt"]),
    accessToken: undefined,
  };
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: seed, iterations: 600000 }, material, 512));
  return {
    key: await crypto.subtle.importKey("raw", bits.slice(0, 32), "AES-GCM", false, ["encrypt", "decrypt"]),
    accessToken: encode(bits.slice(32)),
  };
}
