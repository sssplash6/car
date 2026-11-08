import type { Metadata } from "next";
import { COPY } from "@/lib/content";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { Button } from "@/app/_components/ui/Button";
import { ShortcutKbd } from "@/app/_components/ShortcutKbd";

export const metadata: Metadata = {
  title: "Paper not found",
  robots: { index: false, follow: false },
};

// Rendered when /p/<slug> resolves no PUBLISHED paper (DESIGN.md §9.4).
export default function PaperNotFound() {
  return (
    <div className="frame">
      <Drawing name="compass" size="lg" draw="load" />
      <p className="t-meta">404</p>
      <h1 className="t-h2 mt-3">{COPY.notFound.paperTitle}</h1>
      <p className="t-body mt-3 max-w-[36ch] text-ink-3">{COPY.notFound.paperBody}</p>
      <div className="actions">
        <Button size="md" href="/papers">
          All papers
        </Button>
      </div>
      <p className="t-micro mt-6">
        or press <ShortcutKbd /> to search
      </p>
    </div>
  );
}
