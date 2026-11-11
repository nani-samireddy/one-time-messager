import { Flower2, Heart, Star } from "lucide-react";
import type { CSSProperties } from "react";
import { papers, type Letter } from "../../lib/letter";

export function Stamp({ stamp, size = 24 }: { stamp: Letter["stamp"]; size?: number }) {
  if (stamp === "none") return null;
  const Icon = stamp === "flower" ? Flower2 : stamp === "star" ? Star : Heart;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.65} fill="currentColor" />;
}

export function Envelope({ open = false, compact = false, paper = "cream", stamp = "heart" }: {
  open?: boolean; compact?: boolean; paper?: Letter["paper"]; stamp?: Letter["stamp"];
}) {
  return <span aria-hidden="true" className={`post-envelope${open ? " is-open" : ""}${compact ? " is-compact" : ""}`} style={{ "--paper-color": papers[paper].color } as CSSProperties}>
    <svg viewBox="0 0 426 304" fill="none">
      <g className="post-sparks" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M31 111v22m-10-11h20M382 77v26m-12-13h24M396 206v18m-9-9h18" />
        <path d="m50 72 7 8m-12 4 10 1m324 151 9 6" />
      </g>
      <path d="m69 105 292-5 4 170-300-2Z" fill="#292b23" opacity=".15" transform="translate(3 8)" />
      <path className="post-flap-open" d="m68 105 147-82 147 78-3 102-288 4Z" fill="#e7e8d3" stroke="currentColor" strokeWidth="3.3" strokeLinejoin="round"/>
      <g className="post-letter-slide">
        <path d="m99 91 227 1 6 148-238 2Z" fill="#fdfcf1" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
        <path d="m123 116 173 1m-174 19 153 1m-153 19 166 1" stroke="#dcdccc" strokeWidth="2" strokeLinecap="round"/>
      </g>
      <path d="m68 104 72 1 74-2 76 1 72-3-1 57 3 54-2 57-78 1-68-2-75 2-75-3 2-55-1-56Z" fill="var(--paper-color)" stroke="currentColor" strokeWidth="3.6" strokeLinejoin="round"/>
      <path d="m67 267 92-77m204 79-94-79" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" opacity=".55"/>
      <path className="post-flap-closed" d="m68 104 73 2 73-3 78 1 70-3-45 37-48 36-54 41-46-36-52-39Z" fill="var(--paper-color)" stroke="currentColor" strokeWidth="3.6" strokeLinejoin="round"/>
      <g className="post-seal">
        <circle cx="215" cy="180" r="31" fill="#bf6c37" stroke="currentColor" strokeWidth="2.7"/>
        {stamp === "heart" && <path d="M215 193c-4-4-17-12-17-21 0-9 12-10 17-2 5-8 17-7 17 2 0 9-13 17-17 21Z" fill="#f9f8ec" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/>}
        {stamp === "star" && <path d="m215 160 5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1Z" fill="#ffe6a2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>}
        {stamp === "flower" && <path d="M215 169c-9-18-23-5-12 5-19 0-15 17 0 13-5 16 12 21 13 5 11 11 24-1 11-7 15-8 4-23-12-16Z" fill="#ffecb5" stroke="currentColor" strokeWidth="2"/>}
        {stamp === "none" && <path d="m204 180 8 8 15-17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}
      </g>
    </svg>
  </span>;
}

export function LetterPaper({ letter, preview = false }: { letter: Letter; preview?: boolean }) {
  return <article className={`letter-paper letter-font-${letter.font}`} style={{ "--paper-color": papers[letter.paper].color } as CSSProperties} aria-label={preview ? "Letter preview" : "Your letter"}>
    <header><span>{letter.to.trim() ? `For ${letter.to.trim()}` : "Just for you"}</span><span className="paper-stamp"><Stamp stamp={letter.stamp} /></span></header>
    <p>{letter.message}</p>
    {letter.from.trim() && <footer>— {letter.from.trim()}</footer>}
  </article>;
}
