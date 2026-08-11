import Link from "next/link";
import type { Metadata } from "next";
import { Rosette } from "@/app/_components/Ornament";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// Branded 404. Without this file a dead link lands on Next's default page,
// which reads as an outage on a site whose whole job is looking cared for.
// The Rosette is the doctrine's empty-state mark (DESIGN.md: masthead,
// favicon, empty states) — muted here, since nothing celebratory happened.
export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <Rosette className="mx-auto size-12 text-rule-strong" />
      <h1 className="mt-7 font-serif text-[2.5rem] leading-tight tracking-tight text-ink">
        Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        Nothing lives at this address. If you followed a link to get here, it
        may be out of date.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/papers"
          className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-surface press-ink hover:bg-accent-dark"
        >
          Browse the papers
        </Link>
        <Link
          href="/"
          className="rounded border border-rule-strong px-5 py-2.5 text-sm font-medium text-ink press-ink hover:border-accent hover:text-accent"
        >
          Go to the homepage
        </Link>
      </div>
    </div>
  );
}
