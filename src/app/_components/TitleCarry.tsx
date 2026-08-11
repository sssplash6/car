import { ViewTransition } from "react";

// The paper's title travels: the row a reader clicks becomes the title leaf
// they land on (same name on both ends = shared-element morph via the View
// Transitions API; see node_modules/next/dist/docs view-transitions guide).
// Everything else cuts — continuity belongs to the one object the reader is
// following, not the page. Wrap BLOCK elements (h1/h2/h3), never inline
// links: fragmented inline boxes snapshot badly.
//
// `default="none"` keeps these elements out of every transition except their
// own morph; `share="paper-title"` is the class the timing CSS in globals.css
// targets. Browsers without the API render children unchanged.
export function TitleCarry({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  return (
    <ViewTransition name={`paper-${slug}`} share="paper-title" default="none">
      {children}
    </ViewTransition>
  );
}
