import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Once — a message, just once",
  description: "Write a private message. Share a link. Gone after one read.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
