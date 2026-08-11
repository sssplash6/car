"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/_actions/auth";

// Account dropdown. A client component only because of the open/close behaviour —
// everything inside it is a plain link or a form post.
export function ProfileMenu({
  name,
  email,
  isAdmin,
}: {
  name: string | null;
  email: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape. Both listeners are attached only while
  // the menu is open, so a closed menu costs nothing.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const label = name || email || "Account";
  // Initial for the avatar. Falls back to a dot rather than an empty circle when
  // the name is missing or starts with punctuation.
  const initial = label.trim().charAt(0).toUpperCase() || "·";

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Account: ${label}`}
        className="flex cursor-pointer items-center gap-2 rounded border border-rule py-1 pl-1 pr-2.5 transition-colors hover:border-accent"
      >
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-full bg-accent-soft font-medium text-accent"
        >
          {initial}
        </span>
        <span className="max-w-28 truncate text-sm text-ink max-sm:hidden">
          {label}
        </span>
      </button>

      {/* A disclosure of plain links, deliberately NOT role="menu": the ARIA
          menu pattern contracts arrow-key navigation and focus wrapping this
          popover does not implement, and links-in-a-popover work correctly as
          links. Tab order, Escape, and outside-click cover the interactions. */}
      {open && (
        <nav
          aria-label="Account"
          className="absolute right-0 z-20 mt-2 w-56 rounded border border-rule bg-surface py-2 shadow-lg"
        >
          <div className="border-b border-rule px-4 pb-2">
            <p className="truncate text-sm text-ink">{label}</p>
            {email && <p className="truncate text-xs text-muted-fg">{email}</p>}
          </div>

          <MenuLink href="/submissions" onNavigate={() => setOpen(false)}>
            My submissions
          </MenuLink>
          <MenuLink href="/submit" onNavigate={() => setOpen(false)}>
            Submit a paper
          </MenuLink>
          <MenuLink href="/notifications" onNavigate={() => setOpen(false)}>
            Notifications
          </MenuLink>
          {isAdmin && (
            <MenuLink href="/admin" onNavigate={() => setOpen(false)}>
              Editor dashboard
            </MenuLink>
          )}

          {/* A form, not a link: signing out is a mutation and must not be
              reachable by prefetch or by a crawler following an anchor. */}
          <form action={signOutAction} className="mt-1 border-t border-rule pt-1">
            <button
              type="submit"
              className="w-full cursor-pointer px-4 py-2 text-left text-sm text-muted-fg transition-colors hover:bg-canvas hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}

function MenuLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-canvas"
    >
      {children}
    </Link>
  );
}
