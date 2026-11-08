"use client";

import { useState, ViewTransition, type MouseEvent, type ReactNode } from "react";

// Shared-element carry between pages (React <ViewTransition>; node_modules/
// next/dist/docs view-transitions guide).
//
// A morph happens when the page you leave and the page you land on both hold
// an element with the same name. If every list row always carried its name,
// moving between two lists that share papers (home → /papers, a paper → its
// "Also in") would send every shared title flying at once. So sources carry
// "on click": a row, plate or chip takes its name only at the moment the
// reader clicks it, and only that one travels. Destinations (the paper's
// title, an issue's plate on /issues) carry "always", ready to receive it.
//
// The click is caught on a plain wrapper element (`as`), not by cloning the
// child: children that cross from a server component can arrive as lazy
// references, which cloneElement cannot touch.
export function Carry({
  name,
  share,
  mode,
  as: Tag = "div",
  children,
}: {
  name: string;
  /** Class the timing CSS targets: ::view-transition-group(.<share>). */
  share: string;
  mode: "always" | "click";
  /** Wrapper for click mode: "span" inside inline or flex rows (the chip). */
  as?: "div" | "span";
  children: ReactNode;
}) {
  const [armed, setArmed] = useState(false);

  if (mode === "always") {
    return (
      <ViewTransition name={name} share={share} default="none">
        {children}
      </ViewTransition>
    );
  }

  function arm(event: MouseEvent) {
    // A plain left click navigates here; modified clicks open new tabs.
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      setArmed(true);
    }
  }

  return (
    <ViewTransition name={armed ? name : undefined} share={armed ? share : undefined} default="none">
      <Tag className="carry" onClickCapture={arm}>
        {children}
      </Tag>
    </ViewTransition>
  );
}
