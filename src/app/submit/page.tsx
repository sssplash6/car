import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { COPY } from "@/lib/content";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { SubmitForm } from "@/app/submit/_components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit a paper",
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
