"use client";

import { useEffect } from "react";
import { COPY } from "@/lib/content";
import { DrawingFrom } from "@/app/_components/illustrations/render";
import { sextant } from "@/app/_components/illustrations/data/sextant";
import { Button } from "@/app/_components/ui/Button";

// Error boundary (DESIGN.md §9.13). Must be a client component, and must never
// assume the error is recoverable: the retry re-renders the segment, and Home
// is the honest fallback when it is not.
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  // Next 16 renamed reset() — see node_modules/next/dist/docs on error.js.
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // The digest correlates this render with the server-side log line.
    console.error(error);
  }, [error]);

  return (
    <div className="frame">
      <DrawingFrom data={sextant} name="sextant" size="lg" tone="muted" draw="load" />
      <h1 className="t-h2">{COPY.error.title}</h1>
      <p className="t-body mt-3 max-w-[36ch] text-ink-3">{COPY.error.body}</p>
      <div className="actions">
        <Button size="md" onClick={() => unstable_retry()}>
          Try again
        </Button>
        <Button variant="secondary" size="md" href="/">
          Home
        </Button>
      </div>
      {error.digest && <p className="t-micro mt-6">Reference {error.digest}</p>}
    </div>
  );
}
