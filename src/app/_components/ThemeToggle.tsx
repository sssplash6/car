"use client";

import { useSyncExternalStore } from "react";
import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";

// Reader's theme control: follow the device, or pin the paper light or dark.
// A reading site is used in bed and in libraries, so the choice belongs to the
// reader, not only to the OS.
//
// The choice lives in localStorage and is applied before first paint by the
// inline script in layout.tsx; this button only has to keep the attribute and
// the storage in sync after a click. Cycles system → dark → light, one quiet
// icon button — chrome, not ceremony.

type Mode = "system" | "light" | "dark";

const NEXT: Record<Mode, Mode> = { system: "dark", dark: "light", light: "system" };

const LABEL: Record<Mode, string> = {
  system: "Theme follows your device",
  dark: "Dark theme",
  light: "Light theme",
};

// The html[data-theme] attribute is the single source of truth (the pre-paint
// script sets it from localStorage before React exists), so the component
// reads it as an external store rather than mirroring it into state.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Mode {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

export function ThemeToggle() {
  // Server snapshot is "system": the server cannot read localStorage. The icon
  // corrects itself right after hydration for readers who pinned a theme; the
  // page colours never flash, because the pre-paint script already ran.
  const mode = useSyncExternalStore(subscribe, getSnapshot, (): Mode => "system");

  function cycle() {
    const next = NEXT[mode];
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {
      // Storage can be unavailable (private mode); the attribute still works
      // for this page view.
    }

    const apply = () => {
      if (next === "system") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", next);
      }
    };

    // The site's one new ceremony: day/night on a manuscript is a physical
    // event, so the paper cross-fades (tuned in globals.css) while the woven
    // chrome — identical in both modes — holds still. Reader-initiated and
    // rare, which is what earns it motion; everyone else gets the plain flip.
    if (
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

  const Icon =
    mode === "dark" ? MoonIcon : mode === "light" ? SunIcon : DesktopIcon;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABEL[mode]}. Switch to ${LABEL[NEXT[mode]].toLowerCase()}`}
      title={LABEL[mode]}
      className="press-ink flex size-9 cursor-pointer items-center justify-center rounded text-muted-fg hover:bg-accent-soft hover:text-accent"
    >
      <Icon size={19} weight="regular" aria-hidden="true" />
    </button>
  );
}
