import type { Metadata } from "next";
import { COPY } from "@/lib/content";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { Button } from "@/app/_components/ui/Button";
import { ShortcutKbd } from "@/app/_components/ShortcutKbd";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// The site 404 (DESIGN.md §9.12): a compass that draws itself and then settles
// to north — the only rotation on the site — and two ways on.
export default function NotFound() {
  return (
    <div className="frame">
      <Drawing name="compass" size="lg" draw="load" />
      <p className="t-meta">404</p>
      <h1 className="t-h2 mt-3">{COPY.notFound.title}</h1>
      <p className="t-body mt-3 max-w-[36ch] text-ink-3">{COPY.notFound.body}</p>
      <div className="actions">
        <Button size="md" href="/papers">
          All papers
        </Button>
        <Button variant="secondary" size="md" href="/">
          Home
        </Button>
      </div>
      {/* The dead end teaches the shortcut. */}
      <p className="t-micro mt-6">
        or press <ShortcutKbd /> to search
      </p>
    </div>
  );
}
