"use client";

import { useSyncExternalStore, type MouseEvent } from "react";
import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "@/app/_components/ui/cx";

// The reader's theme. Two controls share one store:
//   ThemeToggle — the header's sun/moon: flips what you see, light ↔ dark.
//   ThemeSelect — System · Light · Dark, in the footer and the mobile menu,
//                 for going back to following the device.
// The choice lives in localStorage ("theme") and is applied pre-paint by
// layout.tsx; html[data-theme] is the single source of truth, read here as an
// external store. The switch itself spreads outward from the click as a
// circle (a typed "theme" view transition; reduced motion flips instantly).

export type ThemeMode = "system" | "light" | "dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function getMode(): ThemeMode {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

function getScheme(): "light" | "dark" {
  const mode = getMode();
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useThemeMode() {
  return useSyncExternalStore(subscribe, getMode, (): ThemeMode => "system");
}

function useScheme() {
  return useSyncExternalStore(subscribe, getScheme, (): "light" | "dark" => "light");
}

/** Where the circle starts: the pointer, or the control's centre for keys. */
function originOf(event: MouseEvent<HTMLElement>) {
  if (event.clientX || event.clientY) return { x: event.clientX, y: event.clientY };
  const r = event.currentTarget.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function setTheme(next: ThemeMode, origin?: { x: number; y: number }) {
  try {
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
  } catch {
    // Storage unavailable (private mode): the attribute still works.
  }

  const apply = () => {
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
  };

  if (
    !("startViewTransition" in document) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    apply();
    return;
  }

  let transition: ViewTransition;
  try {
    // Typed, so the circle CSS never leaks onto route transitions.
    transition = document.startViewTransition({ update: apply, types: ["theme"] });
  } catch {
    transition = document.startViewTransition(apply);
  }
  if (!origin) return;
  transition.ready
    .then(() => {
      const { x, y } = origin;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 560, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
}

export function ThemeToggle({ className }: { className?: string }) {
  const scheme = useScheme();
  const next = scheme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <button
      type="button"
      onClick={(event) => setTheme(next, originOf(event))}
      className={cx("icon-btn theme-toggle", className)}
      aria-label={label}
      title={label}
    >
      {/* Which icon shows is CSS keyed to html[data-theme] and the device
          preference, so it is right before hydration. */}
      <SunIcon className="ic-sun" aria-hidden="true" />
      <MoonIcon className="ic-moon" aria-hidden="true" />
    </button>
  );
}

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { mode: "system", label: "System", Icon: DesktopIcon },
  { mode: "light", label: "Light", Icon: SunIcon },
  { mode: "dark", label: "Dark", Icon: MoonIcon },
];

export function ThemeSelect({ tone = "page", className }: { tone?: "page" | "door"; className?: string }) {
  const mode = useThemeMode();
  return (
    <div role="radiogroup" aria-label="Theme" className={cx("theme-select", tone === "door" && "theme-select-door", className)}>
      {OPTIONS.map(({ mode: option, label, Icon }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={mode === option}
          onClick={(event) => mode !== option && setTheme(option, originOf(event))}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
