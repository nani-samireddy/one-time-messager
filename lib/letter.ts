export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_NAME_LENGTH = 60;
export const papers = {
  cream: { label: "Vanilla", color: "#f9f8ec" },
  rose: { label: "Rose", color: "#ffe7ee" },
  lilac: { label: "Lilac", color: "#f0e9ff" },
  mint: { label: "Mint", color: "#e6f5e8" },
} as const;
export const fonts = { handwritten: "Handwritten", classic: "Classic", clean: "Clean" } as const;
export const stamps = { heart: "Heart", star: "Star", flower: "Flower", none: "None" } as const;

export type Letter = {
  message: string; to: string; from: string;
  paper: keyof typeof papers; font: keyof typeof fonts; stamp: keyof typeof stamps;
};
export const blankLetter: Letter = { message: "", to: "", from: "", paper: "cream", font: "handwritten", stamp: "heart" };
export type LetterLink = { id: string; key: string; protected: boolean; styled: boolean };

export function parseLetterLink(hash: string): LetterLink | null {
  const [id, key, ...flags] = hash.replace(/^#/, "").split(".");
  if (!/^[a-f0-9]{32}$/.test(id) || !/^[A-Za-z0-9_-]{43}$/.test(key ?? "")) return null;
  const suffix = flags.join(".");
  if (!["", "p", "l", "p.l"].includes(suffix) || flags.includes("")) return null;
  return { id, key, protected: flags.includes("p"), styled: flags.includes("l") };
}

export function decodeLetter(value: string, styled: boolean): Letter {
  if (!styled) return { ...blankLetter, message: value };
  const data: unknown = JSON.parse(value);
  if (!data || typeof data !== "object" || !("message" in data) || typeof data.message !== "string" || !data.message.trim() || data.message.length > MAX_MESSAGE_LENGTH) {
    throw new Error("Invalid letter");
  }
  const letter = data as Partial<Letter>;
  return {
    message: data.message,
    to: typeof letter.to === "string" ? letter.to.slice(0, MAX_NAME_LENGTH) : "",
    from: typeof letter.from === "string" ? letter.from.slice(0, MAX_NAME_LENGTH) : "",
    paper: typeof letter.paper === "string" && Object.hasOwn(papers, letter.paper) ? letter.paper : blankLetter.paper,
    font: typeof letter.font === "string" && Object.hasOwn(fonts, letter.font) ? letter.font : blankLetter.font,
    stamp: typeof letter.stamp === "string" && Object.hasOwn(stamps, letter.stamp) ? letter.stamp : blankLetter.stamp,
  };
}
