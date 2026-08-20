import Link from "next/link";
import type { Metadata } from "next";
import { Rosette, RosetteGrand } from "@/app/_components/Ornament";

export const metadata: Metadata = {
  title: "Paper not found",
  robots: { index: false, follow: false },
};

// Rendered when /p/<slug> resolves no PUBLISHED paper. More specific than the
// site 404 because this address pattern has an honest second explanation: the
// paper exists but has not cleared review yet, and authors DO share their
// links early. Saying so turns a dead end into accurate expectations.
export default function PaperNotFound() {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-24 text-center">
      {/* The endpaper: the device ghosted at architectural scale behind the
          notice — a blank leaf is still a leaf of the same book. */}
      <RosetteGrand className="pointer-events-none absolute left-1/2 top-1/2 size-[44rem] -translate-x-1/2 -translate-y-1/2 text-rule opacity-70" />
      <Rosette className="relative mx-auto size-12 text-rule-strong" />
      <h1 className="relative mt-7 font-serif text-[2.5rem] leading-tight tracking-tight text-ink">
        This paper is not in the archive
      </h1>
      <p className="relative mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        There is no published paper at this address. It may still be in
        review, it may have been withdrawn, or the link may simply be wrong.
      </p>
      <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/papers"
          className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-surface press-ink hover:bg-accent-dark"
        >
          Browse the papers
        </Link>
        <Link
          href="/issues"
          className="rounded border border-rule-strong px-5 py-2.5 text-sm font-medium text-ink press-ink hover:border-accent hover:text-accent"
        >
          See the issues
        </Link>
      </div>
      {/* The dead end teaches the shortcut: the catalogue is the fastest way
          out of a wrong address, and a reader who learns ⌘K here uses it
          everywhere after. */}
      <p className="relative mt-8 text-sm text-muted-fg">
        Or press{" "}
        <kbd className="rounded border border-rule bg-surface px-1.5 py-0.5 font-sans text-xs text-ink">
          ⌘K
        </kbd>{" "}
        to search the whole catalogue.
      </p>
    </div>
  );
}
