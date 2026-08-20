"use client";

import { useEffect, useRef } from "react";

// Raking light across the cover.
//
// Gold on a bound cover is stamped foil, and foil answers the light — so the
// highlight inside the cover's display type follows the reader's pointer.
// The gradient itself lives in CSS (.foil-type in globals.css); this only
// reports where the light is, as two registered custom properties.
//
// Deliberately cheap and deliberately narrow:
//   · one pointermove listener on the cover, coalesced into a single rAF, and
//     the only thing it writes is two CSS variables — no React state, no
//     re-render, no layout read per frame beyond the target's own box;
//   · it does nothing at all without a fine hovering pointer (a touch device
//     has no cursor to answer) or when the reader asked for reduced motion;
//   · it targets [data-foil] descendants rather than itself, so the light is
//     measured against the TYPE's box and lands where the pointer actually is.
//
// Server-rendered markup is unaffected: with JavaScript off the type keeps the
// static highlight the CSS variables' initial values describe.
export function CoverLight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // A foiled headline whose type is SET is foiled word by word, not as a
    // block: a word mid-entrance sits on its own compositor layer and is not
    // part of an ancestor's background-clip:text mask. Each word therefore
    // owns its highlight, and because the gradient's radius is absolute while
    // only its centre moves, the light still reads as one source crossing the
    // whole line.
    const targets = Array.from(
      host.querySelectorAll<HTMLElement>("[data-foil]"),
    ).flatMap((el) => {
      const words = Array.from(
        el.querySelectorAll<HTMLElement>(".ink-set > span > span"),
      );
      return words.length > 0 ? words : [el];
    });
    if (targets.length === 0) return;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    function apply() {
      frame = 0;
      for (const target of targets) {
        const box = target.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        target.style.setProperty(
          "--mx",
          `${(((pointerX - box.left) / box.width) * 100).toFixed(2)}%`,
        );
        target.style.setProperty(
          "--my",
          `${(((pointerY - box.top) / box.height) * 100).toFixed(2)}%`,
        );
      }
    }

    function onMove(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    }

    host.addEventListener("pointermove", onMove);
    return () => {
      host.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={hostRef} className={className}>
      {children}
    </div>
  );
}
