import { LAST_UPDATED, SITE_URL, publicPages } from "../../lib/site";
export function GET() {
  const entries = publicPages.map(page => `<url><loc>${SITE_URL}${page.path}</loc><lastmod>${LAST_UPDATED}</lastmod></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
