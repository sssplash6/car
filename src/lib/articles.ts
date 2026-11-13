import "server-only";

import { prisma } from "@/lib/prisma";
import { PAPER_KIND, PAPER_STATUS, EDITABLE_STATUSES } from "@/lib/papers";
import type { SessionUser } from "@/lib/dal";

// Who may do what to an article. Every write action and every private page
// for articles goes through loadArticleAccess(), so the rules live in one
// place:
//
//   author  — edits while DRAFT or REJECTED (returned), submits, withdraws a
//             submission back to draft, deletes an unpublished draft
//   editor  — (ADMIN) reads any article, and may also edit one that is in
//             review, to fix a typo before publishing without a round trip
//
// The admin role is read from the database, never from the session, for the
// reason given on requireAdmin in src/lib/dal.ts.

export const articleSelect = {
  id: true,
  slug: true,
  kind: true,
  status: true,
  title: true,
  subtitle: true,
  abstract: true,
  authorLine: true,
  topics: true,
  body: true,
  coverImage: true,
  reviewNote: true,
  submitterId: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  publishedAt: true,
} as const;

export async function isAdmin(userId: string): Promise<boolean> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return row?.role === "ADMIN";
}

export async function loadArticleAccess(id: string, user: SessionUser) {
  const article = await prisma.paper.findFirst({
    where: { id, kind: PAPER_KIND.ARTICLE },
    select: articleSelect,
  });
  if (!article) return null;

  const isOwner = article.submitterId === user.id;
  const admin = await isAdmin(user.id);
  if (!isOwner && !admin) return null;

  const canEdit =
    (isOwner && EDITABLE_STATUSES.includes(article.status)) ||
    (admin && article.status !== PAPER_STATUS.PUBLISHED);

  return { article, isOwner, isAdmin: admin, canEdit };
}

export type ArticleAccess = NonNullable<Awaited<ReturnType<typeof loadArticleAccess>>>;
