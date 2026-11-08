"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/_actions/auth";
import { cx } from "@/app/_components/ui/cx";

// Account menu: the initial in a 32px circle, opening a small overlay card.
// A disclosure of plain links, deliberately NOT role="menu" (that pattern
// promises arrow-key navigation this popover does not implement). Tab order,
// Escape and outside click cover the interactions.
export function ProfileMenu({
  name,
  email,
  isAdmin,
  unread,
  className,
}: {
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  unread: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

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
  const initial = label.trim().charAt(0).toUpperCase() || "·";
  const done = () => setOpen(false);

  return (
    <div ref={wrapper} className={cx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Account: ${label}`}
        className="avatar"
      >
        <span aria-hidden="true">{initial}</span>
      </button>

      {open && (
        <nav aria-label="Account" className="menu">
          <div className="menu-head">
            <p className="truncate text-ui font-medium text-ink">{label}</p>
            {email && email !== label && <p className="truncate text-ui-sm text-ink-3">{email}</p>}
          </div>
          <Link href="/submissions" className="menu-item" onClick={done}>
            My submissions
          </Link>
          <Link href="/notifications" className="menu-item" onClick={done}>
            Notifications
            {unread > 0 && <span className="ml-auto t-micro">{unread} unread</span>}
          </Link>
          {isAdmin && (
            <Link href="/admin" className="menu-item" onClick={done}>
              Editor&rsquo;s desk
            </Link>
          )}
          <div className="menu-sep" />
          {/* A form: signing out is a mutation, never reachable by prefetch. */}
          <form action={signOutAction}>
            <button type="submit" className="menu-item text-ink-2">
              Sign out
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
