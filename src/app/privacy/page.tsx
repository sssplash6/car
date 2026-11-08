import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { PUBLISHER_NAME, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${SITE_NAME} stores about readers and authors, and why.`,
  alternates: { canonical: "/privacy" },
};

// A plain-language description of what the site actually stores, derived from
// the code rather than a legal template. Factual and modest; formal terms, if
// ever needed, are an editorial and legal decision, not a page to invent.
const SECTIONS = [
  {
    title: "Reading",
    body: "Abstracts are public and need no account. The site does not run analytics scripts or advertising trackers; there is nothing here that follows you around the web.",
  },
  {
    title: "Accounts",
    body: "Signing in with Google stores your name and email address, used to keep your downloads working, to attach your submissions to you, and to email you review decisions. A session cookie keeps you signed in; it exists for that purpose alone.",
  },
  {
    title: "Submissions",
    body: "A submitted paper, its abstract and its author line are stored so editors can review and, if accepted, publish them. Until a paper is published, its PDF is visible only to you and the editors. Decision emails sent to you are logged so a delivery failure can be noticed and put right.",
  },
  {
    title: "Removal",
    body: `To have an account or an unpublished submission removed, contact the publisher, ${PUBLISHER_NAME}. Published papers are part of the scholarly record; withdrawing one is an editorial decision made with the authors.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="wrap page-top page-end">
      <header className="stack-start">
        <h1 className="t-h1 rise-load">Privacy</h1>
        <p className="t-lede stack-lede rise-load" style={{ "--d": "160ms" } as CSSProperties}>
          {SITE_NAME} keeps what it needs to run a reviewed publication, and nothing else.
        </p>
      </header>

      <div className="mt-16 max-w-[var(--narrow)]">
        {SECTIONS.map((section, i) => (
          <section key={section.title} className={`border-t border-rule pt-8 ${i > 0 ? "mt-12" : ""}`}>
            <h2 className="t-h3">{section.title}</h2>
            <p className="t-read mt-4">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
