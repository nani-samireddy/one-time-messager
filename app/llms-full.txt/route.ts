import { documents } from "../../lib/public-documents";
import { SITE_URL, REPOSITORY_URL } from "../../lib/site";
export function GET() {
  const content = Object.values(documents).map(document => `# ${document.title}\n\nUpdated: 23 October 2026\n\n${document.intro}\n\n${document.sections.map(section => `## ${section.heading}\n\n${section.paragraphs.join("\n\n")}`).join("\n\n")}`).join("\n\n---\n\n");
  return new Response(`# Once public documentation\n\nWebsite: ${SITE_URL}\nSource and public contact: ${REPOSITORY_URL}\n\nPrivate messages, passwords, and message links are not part of this documentation.\n\n${content}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
