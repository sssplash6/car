import type { Metadata } from "next";
import { PUBLISHER_NAME, SITE_NAME } from "@/lib/site";
import { PageShell } from "@/app/_components/PageShell";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${SITE_NAME} stores about readers and authors, and why.`,
  alternates: { canonical: "/privacy" },
};

// A plain-language description of what the site actually stores, derived from
// the code rather than from a legal template — a site that runs accounts and
// sends email owes its readers at least this page. It is deliberately factual
// and modest; if the publisher ever needs formal terms, that is an editorial
// and legal decision, not a page a developer should invent.
export default function PrivacyPage() {
  return (
    <PageShell>
      <h1 className="display-flush font-serif text-[clamp(2.25rem,1.5rem+3vw,3rem)] leading-[1.05] tracking-tight text-ink">
        Privacy
      </h1>
      <p className="mt-4 max-w-[62ch] leading-relaxed text-ink-soft">
        {SITE_NAME} keeps what it needs to run a reviewed publication, and
        nothing else. This page says what that is, in plain words.
      </p>

      <div className="mt-10 max-w-[62ch] space-y-10 border-t border-rule pt-10">
        <section>
          <h2 className="font-serif text-xl text-ink">Reading</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Abstracts are public and need no account. The site does not run
            analytics scripts or advertising trackers; there is nothing here
            that follows you around the web.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-ink">Accounts</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Signing in with Google stores your name and email address, used to
            keep your downloads working, to attach your submissions to you,
            and to email you review decisions. A session cookie keeps you
            signed in; it exists for that purpose alone.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-ink">Submissions</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            A submitted paper, its abstract and its author line are stored so
            editors can review and, if accepted, publish them. Until a paper
            is published, its PDF is visible only to you and the editors.
            Decision emails sent to you are logged so a delivery failure can
            be noticed and put right.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-ink">Removal</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            To have an account or an unpublished submission removed, contact
            the publisher, {PUBLISHER_NAME}. Published papers are part of the
            scholarly record; withdrawing one is an editorial decision made
            with the authors.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
