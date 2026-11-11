"use client";

import { ArrowLeft, ArrowRight, Check, Copy, Eye, EyeOff, LockKeyhole, Mail, Send, Share2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Envelope, LetterPaper, Stamp } from "../components/site/letter-art";
import { ideas, PostHome } from "../components/site/post-home";
import { SiteFooter } from "../components/site/footer";
import { blankLetter, decodeLetter, fonts, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, papers, parseLetterLink, stamps, type Letter, type LetterLink } from "../lib/letter";
import { decode, encode, messageKeys } from "../lib/message-crypto";

type View = "home" | "write" | "style" | "seal" | "shared" | "inbox" | "read" | "gone";
type ApiResult = { id?: string; ciphertext?: string; iv?: string; error?: string };

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [letter, setLetter] = useState<Letter>({ ...blankLetter });
  const [incoming, setIncoming] = useState<Letter | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [protectedCreated, setProtectedCreated] = useState(false);
  const [hours, setHours] = useState("24");
  const [link, setLink] = useState("");
  const [secret, setSecret] = useState<LetterLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pending = useRef(false);
  const requestVersion = useRef(0);
  const title = useRef<HTMLHeadingElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const shareInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function readHash() {
      const hash = window.location.hash;
      requestVersion.current++;
      pending.current = false;
      setBusy(false); setPassword(""); setShowPassword(false); setError(""); setIncoming(null);
      setLink(""); setCopied(false); setProtectedCreated(false); setSecret(null);
      if (!hash) { setView("home"); return; }
      setLetter({ ...blankLetter });
      const parsed = parseLetterLink(hash);
      setSecret(parsed);
      setView(parsed ? "inbox" : "gone");
    }
    const hide = () => {
      requestVersion.current++;
      pending.current = false;
      setBusy(false); setPassword(""); setShowPassword(false); setIncoming(null);
      setView(current => current === "read" ? "gone" : current);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("pagehide", hide);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("pagehide", hide);
    };
  }, []);

  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    const prior = robots?.getAttribute("content") || "index, follow";
    if (["shared", "inbox", "read", "gone"].includes(view)) robots?.setAttribute("content", "noindex, nofollow, noarchive");
    if (view !== "home") {
      window.scrollTo(0, 0);
      title.current?.focus({ preventScroll: true });
    }
    return () => { robots?.setAttribute("content", prior); };
  }, [view]);

  function update<K extends keyof Letter>(key: K, value: Letter[K]) {
    setLetter(current => ({ ...current, [key]: value }));
  }

  function go(next: View) {
    setError(""); setShowPassword(false); setView(next);
  }

  function start(text?: string) {
    if (text) setLetter(current => ({ ...current, message: current.message.trim() ? `${current.message}\n\n${text}`.slice(0, MAX_MESSAGE_LENGTH) : text }));
    go("write");
  }

  function insertTemplate(text: string) {
    const field = editor.current;
    const offset = field?.selectionStart ?? letter.message.length;
    const end = field?.selectionEnd ?? offset;
    const insertion = text.slice(0, MAX_MESSAGE_LENGTH - (letter.message.length - (end - offset)));
    update("message", letter.message.slice(0, offset) + insertion + letter.message.slice(end));
    requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(offset + insertion.length, offset + insertion.length); });
  }

  function reset(next: View = "home") {
    requestVersion.current++;
    pending.current = false;
    setBusy(false); setLetter({ ...blankLetter }); setIncoming(null); setSecret(null);
    setPassword(""); setProtectedCreated(false); setHours("24"); setLink(""); setCopied(false);
    history.replaceState(null, "", "/");
    go(next);
    window.scrollTo(0, 0);
  }

  async function create() {
    if (!letter.message.trim() || pending.current) return;
    pending.current = true;
    const version = requestVersion.current;
    setBusy(true); setError("");
    try {
      const seed = crypto.getRandomValues(new Uint8Array(32));
      const { key, accessToken } = await messageKeys(seed, password || undefined);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const payload = JSON.stringify({ ...letter, to: letter.to.trim(), from: letter.from.trim() });
      const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(payload));
      const response = await fetch("/api/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext: encode(new Uint8Array(ciphertext)), iv: encode(iv), hours: hours === "never" ? null : Number(hours), accessToken }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.id) throw new Error(data.error || "Couldn’t seal this letter.");
      if (version !== requestVersion.current) return;
      setLink(`${location.origin}/#${data.id}.${encode(seed)}${password ? ".p" : ""}.l`);
      setProtectedCreated(Boolean(password)); setPassword(""); setShowPassword(false);
      setLetter(current => ({ ...current, message: "", to: "", from: "" }));
      setView("shared");
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : "Couldn’t create your link. Please try again.");
    } finally {
      if (version === requestVersion.current) { pending.current = false; setBusy(false); }
    }
  }

  async function reveal() {
    if (!secret || pending.current || (secret.protected && !password)) return;
    pending.current = true;
    const version = requestVersion.current;
    setBusy(true); setError("");
    try {
      const { key, accessToken } = await messageKeys(decode(secret.key), secret.protected ? password : undefined);
      const response = await fetch("/api/messages/reveal", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ id: secret.id, accessToken }),
      });
      const data = await response.json() as ApiResult;
      if (version !== requestVersion.current) return;
      if (response.status === 410 || response.status === 400) { setView("gone"); return; }
      if (response.status === 401) setSecret({ ...secret, protected: true });
      if (!response.ok || !data.iv || !data.ciphertext) throw new Error(data.error || "Couldn’t open this letter.");
      try {
        const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(data.iv) }, key, decode(data.ciphertext));
        if (version !== requestVersion.current) return;
        setIncoming(decodeLetter(new TextDecoder().decode(plaintext), secret.styled));
        setPassword(""); setShowPassword(false); setSecret(null); setView("read");
        history.replaceState(null, "", location.pathname);
      } catch {
        if (version !== requestVersion.current) return;
        setView("gone"); setError("This letter is damaged and cannot be opened.");
      }
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : "Connection failed. Please try again.");
    } finally {
      if (version === requestVersion.current) { pending.current = false; setBusy(false); }
    }
  }

  async function copy() {
    setError("");
    try { await navigator.clipboard.writeText(link); setCopied(true); }
    catch { shareInput.current?.focus(); shareInput.current?.select(); setError("Copy the selected link to share it."); }
  }

  async function share() {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title: "A letter from Once", url: link }); }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === "AbortError")) await copy(); }
  }

  const steps = ["Write", "Customize", "Seal", "Share"];
  const step = ["write", "style", "seal", "shared"].indexOf(view);
  const expiry = hours === "168" ? "7 days" : hours === "1" ? "1 hour" : "24 hours";
  const passwordField = (name: string, label: string, hint: string, autocomplete: string) => <div className="post-password">
    <label htmlFor={name}>{label}</label>
    <div className="post-password-row"><input id={name} type={showPassword ? "text" : "password"} autoComplete={autocomplete} value={password} onChange={event => setPassword(event.target.value)} aria-describedby={`${name}-help`} placeholder="Enter a password" disabled={busy}/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
    <small id={`${name}-help`}>{hint}</small>
  </div>;

  return <div className="post-site">
    <header className="post-header"><a href="/" className="post-brand" aria-label="Once home"><Mail size={21}/> once<span>.</span></a><a href="/about" className="post-about">How it works <ArrowRight size={14}/></a></header>
    <main className="post-main">
      {view === "home" && <PostHome start={start}/>}
      {step >= 0 && <div className="post-workflow">
        <nav className="post-progress" aria-label="Letter progress"><span>STEP {step + 1} OF 4</span><ol>{steps.map((name, index) => <li key={name} data-complete={index < step} aria-current={index === step ? "step" : undefined}><span className="progress-dot" aria-hidden="true"/><span>{name}</span></li>)}</ol></nav>
        {view === "write" && <>
          <div className="post-heading"><span className="post-kicker">A LITTLE NOTE FROM YOU</span><h1 ref={title} tabIndex={-1}>Write your letter.</h1><p>What would you like them to know?</p></div>
          <form onSubmit={event => { event.preventDefault(); if (letter.message.trim()) go("style"); }}>
            <div className="post-toolbar"><details><summary>✦ Writing prompts</summary><div className="post-template-menu">{ideas.map(idea => <button key={idea.name} type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); insertTemplate(idea.text); }}><span aria-hidden="true">{idea.mark}</span> {idea.name}</button>)}</div></details></div>
            <div className="post-editor letter-font-handwritten"><label className="sr-only" htmlFor="letter-body">Your letter</label><textarea id="letter-body" ref={editor} value={letter.message} onChange={event => update("message", event.target.value)} maxLength={MAX_MESSAGE_LENGTH} placeholder="Write something just for them…" required/><span className="post-count">{letter.message.length.toLocaleString()} / 4,000</span></div>
            <div className="post-actions"><button type="button" className="post-back" onClick={() => go("home")}><ArrowLeft size={17}/> Home</button><button className="post-button post-primary" disabled={!letter.message.trim()}>Customize letter <ArrowRight size={18}/></button></div>
          </form>
        </>}
        {view === "style" && <>
          <div className="post-heading"><span className="post-kicker">THE LITTLE DETAILS</span><h1 ref={title} tabIndex={-1}>Make it yours.</h1><p>Pick the paper, type, and stamp they’ll see.</p></div>
          <div className="post-customize">
            <section className="post-settings" aria-label="Customize your letter">
              <div className="post-names"><label>To <span>optional</span><input value={letter.to} maxLength={MAX_NAME_LENGTH} onChange={event => update("to", event.target.value)} placeholder="Someone special"/></label><label>From <span>optional</span><input value={letter.from} maxLength={MAX_NAME_LENGTH} onChange={event => update("from", event.target.value)} placeholder="Your name"/></label></div>
              <fieldset><legend>Paper</legend><div className="post-options">{Object.entries(papers).map(([key, paper]) => <button key={key} type="button" aria-pressed={letter.paper === key} onClick={() => update("paper", key as Letter["paper"])}><span className="paper-swatch" style={{ background: paper.color }}/>{paper.label}</button>)}</div></fieldset>
              <fieldset><legend>Type</legend><div className="post-options">{Object.entries(fonts).map(([key, label]) => <button key={key} type="button" aria-pressed={letter.font === key} onClick={() => update("font", key as Letter["font"])}>{label}</button>)}</div></fieldset>
              <fieldset><legend>Stamp</legend><div className="post-options">{Object.entries(stamps).map(([key, label]) => <button key={key} type="button" aria-pressed={letter.stamp === key} onClick={() => update("stamp", key as Letter["stamp"])}><Stamp stamp={key as Letter["stamp"]} size={15}/>{label}</button>)}</div></fieldset>
            </section>
            <section className="post-style-preview" aria-label="Recipient preview"><span className="post-kicker">RECIPIENT PREVIEW</span><LetterPaper letter={letter} preview/></section>
          </div>
          <div className="post-actions"><button type="button" className="post-back" onClick={() => go("write")}><ArrowLeft size={17}/> Edit letter</button><button type="button" className="post-button post-primary" onClick={() => go("seal")}>Ready to seal <ArrowRight size={18}/></button></div>
        </>}
        {view === "seal" && <>
          <div className="post-heading"><span className="post-kicker">JUST BETWEEN YOU TWO</span><h1 ref={title} tabIndex={-1}>Seal your letter.</h1><p>Choose an expiry or keep the link available until it’s opened.</p></div>
          <form className="post-panel" onSubmit={event => { event.preventDefault(); void create(); }}>
            <Envelope compact paper={letter.paper} stamp={letter.stamp}/>
            <label className="post-expiry">Expires if unopened<select value={hours} disabled={busy} onChange={event => setHours(event.target.value)}><option value="1">After 1 hour</option><option value="24">After 24 hours</option><option value="168">After 7 days</option><option value="never">Never expires</option></select></label>
            {passwordField("seal-password", "Password (optional)", "If you add a password, share it separately from the link.", "new-password")}
            <p className="post-private"><ShieldCheck size={17}/> Your words and design are encrypted before they leave your browser.</p>
            {error && <p className="post-error" role="alert">{error}</p>}
            <div className="post-actions"><button type="button" disabled={busy} className="post-back" onClick={() => go("style")}><ArrowLeft size={17}/> Customize</button><button className="post-button post-primary" disabled={busy}>{busy ? "Sealing…" : "Seal & create a link"} <Send size={18}/></button></div>
          </form>
        </>}
        {view === "shared" && <>
          <div className="post-heading"><span className="post-kicker">SIGNED, SEALED, READY</span><h1 ref={title} tabIndex={-1}>Ready to pass it on.</h1><p>Share this link with your person. It works once, then disappears.</p></div>
          <section className="post-panel post-result">
            <Envelope compact paper={letter.paper} stamp={letter.stamp}/>
            <label htmlFor="share-link">Your one-time letter link</label>
            <div className="post-copy"><input id="share-link" ref={shareInput} readOnly value={link} onFocus={event => event.target.select()}/><button type="button" className="post-button post-primary" onClick={copy}>{copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? "Copied" : "Copy link"}</button></div>
            <p className="post-note" role="status">{copied ? "Link copied. " : ""}Opens once · {hours === "never" ? "Never expires if unread." : `Expires in ${expiry} if unread.`}</p>
            {protectedCreated && <p className="post-private"><LockKeyhole size={16}/> Password protected. Send the password separately.</p>}
            {error && <p className="post-error" role="alert">{error}</p>}
            <div className="post-actions"><button className="post-back" onClick={() => reset("write")}><ArrowLeft size={17}/> Write another message</button><button className="post-button post-secondary" onClick={share}><Share2 size={17}/> Share link</button></div>
          </section>
        </>}
      </div>}
      {view === "inbox" && <div className="post-inbox">
        <div className="post-heading"><span className="post-kicker">SPECIAL DELIVERY</span><h1 ref={title} tabIndex={-1}>A moment just for you.</h1><p>This message can only be revealed once. Make sure you’re ready before opening.</p></div>
        <Envelope open={busy}/>
        <form className="post-inbox-form" onSubmit={event => { event.preventDefault(); void reveal(); }}>
          {secret?.protected && passwordField("open-password", "Letter password", "A wrong password won’t use your one read.", "off")}
          {error && <p className="post-error" role="alert">{error}</p>}
          <button className="post-button post-primary" disabled={busy || (secret?.protected && !password)}>{busy ? "Opening…" : "Reveal my message"} <Mail size={18}/></button>
        </form>
      </div>}
      {view === "read" && incoming && <div className="post-inbox post-reading">
        <div className="post-heading"><span className="post-kicker">OPENED JUST FOR YOU</span><h1 ref={title} tabIndex={-1}>Your letter.</h1><p>The link has been used. Take your time reading it here.</p></div>
        <LetterPaper letter={incoming}/>
        <button className="post-button post-secondary" onClick={() => reset()}>Close message <Check size={18}/></button>
      </div>}
      {view === "gone" && <div className="post-inbox">
        <div className="post-heading"><span className="post-kicker">RETURN TO SENDER</span><h1 ref={title} tabIndex={-1}>Here once. Now gone.</h1><p>{error || "It may have already been read, expired, or arrived with an incomplete link."}</p></div>
        <Envelope open compact stamp="none"/>
        <button className="post-button post-primary" onClick={() => reset("write")}>Write your own message <ArrowRight size={18}/></button>
      </div>}
    </main>
    <div className="post-footer"><SiteFooter/></div>
  </div>;
}
