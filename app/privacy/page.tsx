import { DocumentPage } from "../../components/site/document";
import { pageMetadata } from "../../lib/site";
export const metadata = pageMetadata("Privacy policy", "How Once handles encrypted messages, passwords, retention, hosting, and technical data.", "/privacy");
export default function Page() { return <DocumentPage name="privacy"/>; }
