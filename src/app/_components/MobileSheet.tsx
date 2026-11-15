"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ListIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { signOutAction } from "@/app/_actions/auth";
import { ThemeSelect } from "@/app/_components/ThemeToggle";
import { isActivePath } from "@/app/_components/NavLinks";

// The mobile menu (DESIGN.md §8.1): a full-screen sheet revealed by a clip
// path, links in 32px serif, then the reader's own row. It renders into
// <body>, not the header: the header's backdrop-filter would otherwise become
// the containing block of this fixed sheet and shrink it to 64px.
//
// Mounted on first open (so the server sends nothing for it), then kept, so
// the close transition can play. Esc closes, focus is trapped while open and
// returns to the menu button after.

type Account = { name: string | null; email: string | null; isAdmin: boolean; unread: number };

export function MobileSheet({
  nav,
  account,
  brand,
}: {
  nav: ReadonlyArray<{ href: string; label: string }>;
  account: Account | null;
  brand: ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  // A link inside the sheet navigates: close instantly, so a half-closed sheet
  // is never frozen into the page transition's snapshot.
  const [instant, setInstant] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const leave = () => {
    setInstant(true);
    close();
  };

  function show() {
    setInstant(false);
    setMounted(true);
    // One frame in the closed state first, so the reveal transition runs.
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  }

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const focusables = () =>
      sheet ? [...sheet.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")] : [];
    const timer = window.setTimeout(() => focusables()[0]?.focus(), 60);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = (i: number) => ({ "--i": i }) as CSSProperties;

  const sheet = (
    <div
      id="site-sheet"
      ref={sheetRef}
      className="sheet"
      data-open={open || undefined}
      data-instant={instant || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
    >
      <div className="sheet-top">
        <Link href="/" className="brand" aria-label="Home" onClick={leave}>
          {brand}
        </Link>
        <button type="button" className="icon-btn" style={{ width: 44, height: 44 }} aria-label="Close menu" onClick={close}>
          <XIcon aria-hidden="true" />
        </button>
      </div>

      <ul className="sheet-links">
        {nav.map((link, i) => (
          <li key={link.href} className="sheet-item" style={item(i)}>
            <Link
              href={link.href}
              aria-current={isActivePath(pathname, link.href) ? "page" : undefined}
              onClick={leave}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {account && (
        <ul className="sheet-account sheet-item mt-6" style={item(nav.length)}>
          <li>
            <Link href="/submissions" onClick={leave}>
              My submissions
            </Link>
          </li>
          <li>
            <Link href="/notifications" onClick={leave}>
              Notifications
              {account.unread > 0 && (
                <>
                  <span className="dot-accent ml-2" aria-hidden="true" />
                  <span className="sr-only">, {account.unread} unread</span>
                </>
              )}
            </Link>
          </li>
          {account.isAdmin && (
            <li>
              <Link href="/admin" onClick={leave}>
                Editor&rsquo;s desk
              </Link>
            </li>
          )}
        </ul>
      )}

      <div className="sheet-foot sheet-item" style={item(nav.length + 1)}>
        <ThemeSelect />
        {account ? (
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost btn-md">
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/login" className="btn btn-secondary btn-md" onClick={leave}>
            Sign in
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn lg:hidden"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="site-sheet"
        onClick={show}
      >
        <ListIcon aria-hidden="true" />
      </button>
      {mounted && createPortal(sheet, document.body)}
    </>
  );
}
