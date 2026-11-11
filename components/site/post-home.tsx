import { ArrowRight, Heart, LockKeyhole, PenLine, Sparkles } from "lucide-react";
import { useState } from "react";
import { blankLetter, type Letter } from "../../lib/letter";
import { Envelope, LetterPaper } from "./letter-art";

export const ideas = [
  { name: "Thinking of you", mark: "✿", text: "You crossed my mind today, and I wanted to tell you why.\n\n" },
  { name: "A birthday note", mark: "✦", text: "Happy birthday! One of my favorite things about you is…\n\n" },
  { name: "A little thank-you", mark: "♡", text: "Thank you for the way you showed up for me. It meant more than I said at the time.\n\n" },
  { name: "I miss you", mark: "☾", text: "I miss the little things. Like the way we used to…\n\n" },
  { name: "A love letter", mark: "♥", text: "Here is a small list of things I love about you. I’ll start with…\n\n" },
  { name: "A memory to keep", mark: "✧", text: "Do you remember the day we…\n\nHere is how I remember it.\n\n" },
] as const;

const demo: Letter = { ...blankLetter, to: "Someone lovely", from: "Once", message: "Here’s a little reminder: you don’t need a big occasion to say something kind.\n\nI hope this finds you on a good day. And if it doesn’t, I hope it makes the day a little better." };

export function PostHome({ start }: { start: (text?: string) => void }) {
  const [sampleOpen, setSampleOpen] = useState(false);
  return <>
    <section className="post-hero" aria-labelledby="post-title">
      <span className="post-kicker"><Heart size={13}/> WORDS THAT DON’T STAY FOREVER</span>
      <h1 id="post-title">A note for <em>right now.</em></h1>
      <p>Write it. Pass it on. Let it go.</p>
      <button type="button" className="post-envelope-button" aria-label="Start writing a letter" onClick={() => start()}><Envelope/></button>
      <button type="button" className="post-button post-primary" onClick={() => start()}>Write a note <ArrowRight size={19}/></button>
      <span className="post-note">Free to send · Encrypted in your browser</span>
    </section>
    <section className="post-ideas" aria-labelledby="ideas-title">
      <h2 id="ideas-title">A little inspiration</h2>
      <p>Pick a prompt, then make the words your own.</p>
      <div className="post-chips">{ideas.map(idea => <button type="button" key={idea.name} onClick={() => start(idea.text)}><span aria-hidden="true">{idea.mark}</span>{idea.name}</button>)}</div>
    </section>
    <section className="post-how" aria-labelledby="how-title">
      <span className="post-kicker">A LITTLE PRIVATE CORRESPONDENCE</span>
      <h2 id="how-title">How it works</h2>
      <ol>
        <li><PenLine size={24}/><h3>Write it privately</h3><p>Your words are encrypted before they leave your device.</p></li>
        <li><Sparkles size={24}/><h3>Send the link</h3><p>A small link for something you don’t want to leave around.</p></li>
        <li><LockKeyhole size={24}/><h3>One read. Then gone.</h3><p>Once opened, the link won’t work twice.</p></li>
      </ol>
    </section>
    <section className="post-demo" aria-labelledby="demo-title">
      <span className="post-kicker">A PEEK INSIDE</span>
      <h2 id="demo-title">Here’s what they’ll receive.</h2>
      {sampleOpen ? <div className="post-demo-paper"><LetterPaper letter={demo}/><button className="post-button post-secondary" onClick={() => setSampleOpen(false)}>Close sample</button></div> : <>
        <button type="button" className="post-envelope-button" aria-label="Open the sample envelope" onClick={() => setSampleOpen(true)}><Envelope compact/></button>
        <button type="button" className="post-button post-secondary" onClick={() => setSampleOpen(true)}>Open sample letter</button>
      </>}
    </section>
    <section className="post-faq" aria-labelledby="faq-title">
      <h2 id="faq-title">A few good questions</h2>
      <details><summary>Can someone read my letter twice?</summary><p>The link can retrieve it only once. The recipient can still copy or screenshot it while it’s open.</p></details>
      <details><summary>Is my letter private?</summary><p>Your browser encrypts the words and design together. Only someone with the full link and, if set, the password can open it.</p></details>
      <details><summary>What if they don’t open it?</summary><p>Choose an expiry of one hour, one day, or seven days. After that, the link no longer opens.</p></details>
      <details><summary>Do I need an account or a payment?</summary><p>Once is free. The <a href="https://once-message.later-voice-token.workers.dev/">public version</a> does not require an account.</p></details>
      <button type="button" className="post-button post-primary" onClick={() => start()}>Write your own message <ArrowRight size={18}/></button>
      <p className="post-postscript">P.S. Some things are better left off the record.</p>
    </section>
  </>;
}
