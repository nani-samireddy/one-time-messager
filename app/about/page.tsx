import { DocumentPage } from "../../components/site/document";
import { pageMetadata } from "../../lib/site";
export const metadata = pageMetadata("How Once works", "Create encrypted, password-protected notes that can be revealed only once.", "/about");
export default function Page() { return <DocumentPage name="about"/>; }
