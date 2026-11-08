"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

// The call for submissions: the footer's first row on public pages. Working
// pages (submit, submissions, notifications, sign-in, the editor's desk) close
// on the plain footer instead: those readers are already contributing.
const QUIET = ["/submit", "/submissions", "/notifications", "/login", "/admin"];

export function FooterCall({
  title,
  body,
  action,
  link,
  art,
}: {
  title: string;
  body: string;
  action: string;
  link: string;
  art?: ReactNode;
}) {
  const pathname = usePathname();
  if (QUIET.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;

  return (
    <section className="footer-call" aria-labelledby="call-title">
      <div>
        <h2 id="call-title" className="t-h2">
          {title}
        </h2>
        <p>{body}</p>
        <div className="actions mt-8">
          <Link href="/submit" className="btn btn-on-door btn-lg">
            {action}
          </Link>
          <Link href="/about#contributors" className="link link-door">
            <span>{link}</span>
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
      </div>
      {art}
    </section>
  );
}
