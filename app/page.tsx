"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowRight, Check, Copy, LockKeyhole, Link2, Eye, Flame, X, Plus, ShieldCheck } from "lucide-react";

const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const decode = (value: string) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0));
type View = "write" | "created" | "sealed" | "opened" | "gone";

export default function Home() {
  const [view, setView] = useState<View>("write");
  const [message, setMessage] = useState("");
  const [hours, setHours] = useState("24");
  const [link, setLink] = useState("");
  const [secret, setSecret] = useState<{id: string; key: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState(false);

  useEffect(() => {
    function readHash() {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const [id, key] = hash.split(".");
      if (/^[a-f0-9]{32}$/.test(id) && /^[A-Za-z0-9_-]{43}$/.test(key || "")) {
        setSecret({ id, key }); setView("sealed");
      } else { setView("gone"); }
    }
    readHash(); window.addEventListener("hashchange", readHash);
    // Clear revealed plaintext before a page can enter the browser's back/forward cache.
    const hide = () => { setMessage(""); setView(v => v === "opened" ? "gone" : v); };
    window.addEventListener("pagehide", hide);
    return () => { window.removeEventListener("hashchange", readHash); window.removeEventListener("pagehide", hide); };
  }, []);

  async function create() {
    if (!message.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(message));
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ciphertext: encode(new Uint8Array(ciphertext)), iv: encode(iv), hours: Number(hours) }) });
      const data = await res.json() as { error: string; id: string; ciphertext: string; iv: string };
      if (!res.ok) throw new Error(data.error);
      const rawKey = await crypto.subtle.exportKey("raw", key);
      setLink(`${location.origin}/#${data.id}.${encode(new Uint8Array(rawKey))}`);
      setMessage(""); setView("created");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't create your link. Please try again."); }
    finally { setBusy(false); }
  }

  async function reveal() {
    if (!secret || busy) return;
    setBusy(true); setError("");
    try {
      const key = await crypto.subtle.importKey("raw", decode(secret.key), "AES-GCM", false, ["decrypt"]);
      const res = await fetch("/api/messages/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ id: secret.id }) });
      const data = await res.json() as { error: string; id: string; ciphertext: string; iv: string };
      if (res.status === 410 || res.status === 400) { setView("gone"); return; }
      if (!res.ok) throw new Error(data.error);
      try {
        const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(data.iv) }, key, decode(data.ciphertext));
        setMessage(new TextDecoder().decode(plaintext)); setView("opened");
        history.replaceState(null, "", location.pathname); setSecret(null);
      } catch { setView("gone"); setError("The link is damaged and this message can no longer be opened."); }
    } catch (e) { setError(e instanceof Error ? e.message : "Connection failed. Please try again."); }
    finally { setBusy(false); }
  }

  function reset() { setMessage(""); setLink(""); setSecret(null); setError(""); setCopied(false); setView("write"); history.replaceState(null, "", "/"); }
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); }
    catch { setError("Select the link above and copy it to share."); }
  }

  return <div className="site-shell">
    <header className="header"><a href="/" className="wordmark" aria-label="Once home">once<span className="logo-dot">.</span></a><button className="how-link" onClick={() => setInfo(true)}>How it works <ArrowUpRight size={15}/></button></header>
    <main>
      <div className="intro"><div className="eyebrow"><span/> A LITTLE MORE PRIVATE</div><h1>Some words are<br/>only meant to be read <em>once.</em></h1><p>Write a message. Share a link. After one read, it’s gone.<br className="desktop-break"/> A private moment, without a permanent record.</p></div>
      <section className="message-card" aria-label="One-time message">
        <div className="card-heading"><span className="card-title"><span className="small-mark">{view === "write" ? <Plus size={16}/> : view === "gone" ? <Flame size={16}/> : <LockKeyhole size={15}/>}</span>{view === "write" ? "A message for someone" : view === "created" ? "Your message is sealed" : view === "sealed" ? "Someone left you a message" : view === "opened" ? "Just for your eyes" : "This message is gone"}</span><span className="private-tag"><span/> ONE VIEW ONLY</span></div>
        {view === "write" && <><label className="sr-only" htmlFor="message">Your private message</label><div className="textarea-wrap"><textarea id="message" placeholder="Something just between you two…" maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} /><span className="char-count">{message.length.toLocaleString()} / 4,000</span></div><div className="compose-actions"><label className="expiry">Expires in <select value={hours} onChange={e => setHours(e.target.value)} aria-label="Message expiration"><option value="1">1 hour</option><option value="24">24 hours</option><option value="168">7 days</option></select></label><button className="primary" onClick={create} disabled={!message.trim() || busy}>{busy ? "Sealing message…" : "Create a one-time link"}<ArrowRight size={17}/></button></div></>}
        {view === "created" && <div className="state-content"><div className="state-icon"><Check size={25}/></div><h2>Ready to pass it on.</h2><p>Share this link with your person.<br/>It works once, then disappears.</p><div className="copy-row"><input aria-label="Your one-time message link" readOnly value={link} onFocus={e => e.target.select()}/><button className="primary" onClick={copy}>{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? "Copied" : "Copy link"}</button></div><p className="micro">Unopened links expire in {hours === "168" ? "7 days" : hours === "1" ? "1 hour" : "24 hours"}.</p><button className="text-button" onClick={reset}>Write another message <ArrowRight size={15}/></button></div>}
        {view === "sealed" && <div className="state-content"><div className="state-icon"><LockKeyhole size={25}/></div><h2>A moment just for you.</h2><p>This message can only be revealed once.<br/>Make sure you’re ready before opening.</p><button className="primary reveal" onClick={reveal} disabled={busy}>{busy ? "Opening…" : "Reveal my message"}<Eye size={17}/></button><p className="micro">It will be deleted from the server when you reveal it.</p></div>}
        {view === "opened" && <div className="opened-content"><div className="revealed-message">{message}</div><div className="opened-footer"><span><Check size={14}/> Deleted from the server</span><button className="text-button" onClick={reset}>Close message <X size={14}/></button></div></div>}
        {view === "gone" && <div className="state-content"><div className="state-icon"><Flame size={25}/></div><h2>Here once. Now gone.</h2><p>This message has already been opened,<br/>has expired, or the link is incomplete.</p><button className="primary reveal" onClick={reset}>Write your own message <ArrowRight size={17}/></button></div>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="card-footnote"><ShieldCheck size={14}/><span>Encrypted in your browser. Deleted after one reveal.</span></div>
      </section>
      <div className="steps"><div><span className="step-icon"><LockKeyhole size={19}/></span><h3>Write it privately</h3><p>Your words are encrypted<br/>before they leave your device.</p></div><div><span className="step-icon"><Link2 size={20}/></span><h3>Send the link</h3><p>A small link for something<br/>you don’t want to leave around.</p></div><div><span className="step-icon"><Flame size={20}/></span><h3>One read. Then gone.</h3><p>Opened once, deleted for good.<br/>The same link won’t work twice.</p></div></div>
      <p className="quiet-note">A little less forever. A little more peace of mind.</p>
    </main>
    <footer><span>Small messages. Short stays.</span><span>Made for the moment <span className="footer-star">✳</span></span></footer>
    {info && <div className="modal-backdrop" onClick={() => setInfo(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="info-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setInfo(false)} aria-label="Close explanation" autoFocus><X size={20}/></button><div className="eyebrow">PRIVATE BY DESIGN</div><h2 id="info-title">A note that doesn’t stay.</h2><p>Your browser encrypts the message. The link holds its ID and decryption key; the key stays in the URL fragment and isn’t sent to the server.</p><p>When the recipient taps Reveal, the server returns the encrypted message and deletes it in one step. A second request cannot retrieve it, even from another device.</p><p>Unopened messages expire after your chosen time. Anyone with the full link can reveal it first. A recipient can still copy or screenshot what they read.</p><button className="primary" onClick={() => setInfo(false)}>Got it <Check size={16}/></button></section></div>}
  </div>;
}
