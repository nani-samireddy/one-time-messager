import type { Metadata } from "next";
import { SITE_URL, SITE_DESCRIPTION, pageMetadata } from "../lib/site";
import "./globals.css";
export const metadata: Metadata = {
  ...pageMetadata("Encrypted one-time messages", SITE_DESCRIPTION, "/"),
  metadataBase: new URL(SITE_URL),
  title: { default: "Once — encrypted one-time messages", template: "%s · Once" },
  applicationName: "Once",
  referrer: "no-referrer",
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
  category: "communication",
};
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Once", url: SITE_URL, description: SITE_DESCRIPTION, inLanguage: "en" },
    { "@type": "WebApplication", "@id": `${SITE_URL}/#app`, name: "Once", url: SITE_URL, description: SITE_DESCRIPTION, applicationCategory: "CommunicationApplication", operatingSystem: "Any", browserRequirements: "Requires JavaScript and a browser with Web Crypto support", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
  ],
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><link rel="describedby" href="/llms.txt"/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}/></head><body>{children}</body></html>;
}
