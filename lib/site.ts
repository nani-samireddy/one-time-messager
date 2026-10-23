import type { Metadata } from "next";
export const SITE_URL = "https://once-message.later-voice-token.workers.dev";
export const REPOSITORY_URL = "https://github.com/nani-samireddy/one-time-messager";
export const SITE_DESCRIPTION = "Send an encrypted, one-time message with an optional password. Share a private link that stops working after one reveal.";
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description, alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: { title: `${title} · Once`, description, url: `${SITE_URL}${path}`, siteName: "Once", type: "website", locale: "en_US", images: [{ url: `${SITE_URL}/social-preview.png`, width: 1200, height: 630, alt: "Once — a private note, read once" }] },
    twitter: { card: "summary_large_image", title: `${title} · Once`, description, images: [`${SITE_URL}/social-preview.png`] },
  };
}
export const publicPages = [
  { path: "/", title: "Once — encrypted one-time messages", description: SITE_DESCRIPTION },
  { path: "/about", title: "How Once works", description: "How Once encrypts messages, protects them with optional passwords, and enforces one-time retrieval." },
  { path: "/privacy", title: "Privacy policy", description: "What Once stores, how message deletion works, and which providers help deliver the service." },
  { path: "/terms", title: "Terms and conditions", description: "The rules, responsibilities, and service limits for using Once." },
];
