import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Data access layer. Every server action and every protected page starts here.
//
// src/proxy.ts also redirects unauthenticated users, but that is an OPTIMISTIC
// cookie check and is not a security boundary — it never runs for direct server
// action invocations. These helpers are what actually protect data, which is why
// they are the only place authorization decisions are made.
//
// Wrapped in React's cache() so several components in one render pass share a
// single session lookup and a single role read.

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
};

/**
 * Return the signed-in user, or redirect to /login.
 *
 * Rejects a session whose user id is missing, which happens if a JWT was issued
 * before the id was added to the token — treat it as signed out rather than
 * trusting a partial session.
 */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) redirect("/login");

  return {
    id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
});

/**
 * Like requireUser, but returns null instead of redirecting.
 *
 * For pages that render differently for signed-in users but must stay public and
 * crawlable — the paper index and abstract pages. Never use this to guard a
 * mutation.
 */
export const getOptionalUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  return {
    id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
});

/**
 * Confirm the caller is an ADMIN, reading the role from the DATABASE rather than
 * the session.
 *
 * This is the deliberate expensive path. The role on the JWT can be stale — an
 * admin removed from ADMIN_EMAILS keeps a valid token until they sign in again —
 * so trusting the token here would let a revoked admin publish papers.
 * DO NOT "optimise" this into a session.user.role check.
 */
export const requireAdmin = cache(async (): Promise<SessionUser> => {
  const user = await requireUser();

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (row?.role !== "ADMIN") redirect("/");

  return user;
});

/**
 * True when the caller may download a published paper's PDF.
 *
 * Every signed-in user is at least a READER, so presence of a session is the
 * whole check — no DB read needed. Kept as a named helper so the intent is
 * explicit at the call site rather than a bare null test.
 */
export async function canDownload(): Promise<boolean> {
  return (await getOptionalUser()) !== null;
}
