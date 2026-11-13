import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, PencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/dal";
import { COPY } from "@/lib/content";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { SubmitForm } from "@/app/submit/_components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit",
  robots: { index: false, follow: false },
};

// Submit (DESIGN.md §9.7). Product register: the form leads, the aside says
// what happens next.
export default async function SubmitPage() {
  // proxy.ts already redirects signed-out visitors, but that is an optimistic
  // cookie check. This is the check that actually holds.
  await requireUser();

  const copy = COPY.submit;

  return (
    <div className="wrap page-top page-end">
      <header className="flex items-start justify-between gap-8">
        <div className="stack-start">
          <h1 className="t-h1 rise-load">{copy.intro.title}</h1>
          <p className="t-lede stack-lede rise-load" style={{ "--d": "160ms" } as CSSProperties}>
            {copy.intro.body}
          </p>
          <p className="t-meta mt-4 lg:hidden">Read in full → Emailed → Published</p>
        </div>
        <Drawing name="cotton" size="sm" draw="load" className="h-[120px] w-24 shrink-0 max-lg:hidden" />
      </header>

      {/* The two ways in. Writing on the site leads: it needs nothing
          prepared. The PDF form below stays for finished papers. */}
      <Link href="/write" className="write-card rise-load" style={{ "--d": "220ms" } as CSSProperties}>
        <span className="write-card-icon" aria-hidden="true">
          <PencilSimpleLineIcon />
        </span>
        <span className="min-w-0">
          <span className="t-h3 block">{copy.write.title}</span>
          <span className="t-ui mt-1 block text-ink-3">{copy.write.body}</span>
        </span>
        <span className="btn btn-primary btn-md write-card-cta">
          {copy.write.action}
          <ArrowRightIcon aria-hidden="true" />
        </span>
      </Link>
      <h2 className="t-meta mt-14">{copy.upload}</h2>

      <div className="submit-grid">
        <SubmitForm art={<Drawing name="cotton" size="xs" draw="none" />} />
        <aside className="max-lg:hidden" aria-labelledby="next-label">
          <h2 id="next-label" className="t-meta">
            {copy.nextLabel}
          </h2>
          <ol className="next-steps mt-3">
            {copy.next.map((step, i) => (
              <li key={step}>
                <span className="t-meta">{String(i + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
