import type { Metadata } from "next";
export const SITE_URL = "https://once-message.later-voice-token.workers.dev";
export const REPOSITORY_URL = "https://github.com/nani-samireddy/one-time-messager";
export const LAST_UPDATED = "2026-11-11";
export const LAST_UPDATED_LABEL = "11 November 2026";
export const SITE_DESCRIPTION = "Write and personalize an encrypted letter. Share a private link that opens once, with optional password protection.";
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description, alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: { title: `${title} · Once`, description, url: `${SITE_URL}${path}`, siteName: "Once", type: "website", locale: "en_US", images: [{ url: `${SITE_URL}/social-preview.png`, width: 1200, height: 630, alt: "Once — a private letter, read once" }] },
    twitter: { card: "summary_large_image", title: `${title} · Once`, description, images: [`${SITE_URL}/social-preview.png`] },
  };
}
export const publicPages = [
  { path: "/", title: "Once — encrypted one-time letters", description: SITE_DESCRIPTION },
  { path: "/about", title: "How Once works", description: "How Once encrypts messages, protects them with optional passwords, and enforces one-time retrieval." },
  { path: "/privacy", title: "Privacy policy", description: "What Once stores, how message deletion works, and which providers help deliver the service." },
  { path: "/terms", title: "Terms and conditions", description: "The rules, responsibilities, and service limits for using Once." },
];
