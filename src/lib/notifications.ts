import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

// In-app notifications.
//
// Deliberately separate from email: email is fire-and-forget and skipped entirely
// without RESEND_API_KEY, so these rows are the durable record. Creating a
// notification must never fail the surrounding action — a lost bell badge is not
// worth rolling back a published paper.

export const NOTIFICATION_KIND = {
  /** To editors, when a paper enters the review queue. */
  SUBMISSION_RECEIVED: "SUBMISSION_RECEIVED",
  /** To the author, when their paper goes live. */
  PAPER_PUBLISHED: "PAPER_PUBLISHED",
  /** To the author, when their paper is returned for revision. */
  PAPER_RETURNED: "PAPER_RETURNED",
} as const;

export type NotificationKind =
  (typeof NOTIFICATION_KIND)[keyof typeof NOTIFICATION_KIND];

/**
 * Create notifications for one or more users.
 *
 * Swallows its own errors on purpose — see the note at the top of this file.
 * Silently ignores an empty recipient list, which is the normal case when
 * ADMIN_EMAILS has not been configured yet.
 */
export async function notify(opts: {
  userIds: string[];
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
}): Promise<void> {
  if (opts.userIds.length === 0) return;

  try {
    await prisma.notification.createMany({
      data: opts.userIds.map((userId) => ({
        userId,
        kind: opts.kind,
        title: opts.title,
        body: opts.body,
        href: opts.href,
      })),
    });
  } catch (err) {
    console.error("[notifications] failed to create:", err);
  }
}

/** Ids of every admin, for notifying the editorial side. */
export async function adminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

/**
 * Unread count for the header bell.
 *
 * Cached per render pass because the header renders on every page. Returns 0 for
 * signed-out visitors rather than throwing, so the public layout stays simple.
 */
export const unreadCount = cache(async (userId: string | null): Promise<number> => {
  if (!userId) return 0;
  return prisma.notification.count({ where: { userId, readAt: null } });
});

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50, // a bell, not an archive
  });
}

/**
 * Mark everything unread as read for one user.
 *
 * Scoped by userId in the where clause so it can never touch another user's rows,
 * per the ownership-in-the-query rule in ONBOARDING.md §3.
 */
export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
