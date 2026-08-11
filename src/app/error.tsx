"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Rosette } from "@/app/_components/Ornament";

// Branded error boundary. Must be a client component (Next requirement), and
// must never assume the error is recoverable — the retry re-renders the
// segment, and the homepage link is the honest fallback when it is not.
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  // Next 16 renamed reset() — see node_modules/next/dist/docs on error.js.
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // The digest is what correlates this render with the server-side log line.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <Rosette className="mx-auto size-12 text-rule-strong" />
      <h1 className="mt-7 font-serif text-[2.5rem] leading-tight tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        The fault is on our side, not yours. Trying again usually works; if it
        keeps happening, come back a little later.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="cursor-pointer rounded bg-accent px-5 py-2.5 text-sm font-medium text-surface press-ink hover:bg-accent-dark"
        >
          Try again
        </button>
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
