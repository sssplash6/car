import Link from "next/link";
import type { Metadata } from "next";
import { Rosette, RosetteGrand } from "@/app/_components/Ornament";

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
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-24 text-center">
      {/* The endpaper: the device ghosted at architectural scale behind the
          notice — a blank leaf is still a leaf of the same book. */}
      <RosetteGrand className="pointer-events-none absolute left-1/2 top-1/2 size-[44rem] -translate-x-1/2 -translate-y-1/2 text-rule opacity-70" />
      <Rosette className="relative mx-auto size-12 text-rule-strong" />
      <h1 className="relative mt-7 font-serif text-[2.5rem] leading-tight tracking-tight text-ink">
        Page not found
      </h1>
      <p className="relative mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        Nothing lives at this address. If you followed a link to get here, it
        may be out of date.
      </p>
      <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
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
