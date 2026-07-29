"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { notifyDecision } from "@/lib/email";
import { NOTIFICATION_KIND, notify } from "@/lib/notifications";

// Review decisions. Both actions start from requireAdmin(), which re-reads the
// role from the database. A server action is reachable directly by POST and never
// passes through admin/layout.tsx, so the layout's check protects nothing here —
// DO NOT remove these on the grounds that the layout already gates /admin.

const MAX_REVIEW_NOTE = 2000;

export async function publishPaper(formData: FormData) {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Only a SUBMITTED paper may be published, enforced in the where clause. A
  // double-submitted form (or a stale tab) therefore updates zero rows instead of
  // re-publishing something already live and re-sending its notifications.
  const { count } = await prisma.paper.updateMany({
    where: { id, status: PAPER_STATUS.SUBMITTED },
    data: {
      status: PAPER_STATUS.PUBLISHED,
      publishedAt: new Date(),
      reviewNote: null,
      reviewerId: admin.id,
    },
  });

  if (count === 0) return;

  await announceDecision(id, true);
  revalidateAfterDecision();
}

export async function rejectPaper(formData: FormData) {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  if (!id) return;

  const { count } = await prisma.paper.updateMany({
    where: { id, status: PAPER_STATUS.SUBMITTED },
    data: {
      status: PAPER_STATUS.REJECTED,
      reviewNote: note.slice(0, MAX_REVIEW_NOTE) || null,
      reviewerId: admin.id,
    },
  });

  if (count === 0) return;

  await announceDecision(id, false);
  revalidateAfterDecision();
}

/**
 * Notify the author, in-app and by email, about a decision already committed.
 *
 * Loaded in a second query rather than returned from updateMany, which reports
 * only a count. Both channels swallow their own failures: the decision is saved,
 * and an editor must not see a failed action for something that succeeded. The
 * in-app notification is the durable record — email is best-effort and is skipped
 * entirely when RESEND_API_KEY is unset.
 */
async function announceDecision(id: string, published: boolean) {
  const paper = await prisma.paper.findUnique({
    where: { id },
    select: {
      title: true,
      slug: true,
      reviewNote: true,
      submitterId: true,
      submitter: { select: { email: true } },
    },
  });

  if (!paper) return;

  await notify({
    userIds: [paper.submitterId],
    kind: published
      ? NOTIFICATION_KIND.PAPER_PUBLISHED
      : NOTIFICATION_KIND.PAPER_RETURNED,
    title: published
      ? `"${paper.title}" is published`
      : `"${paper.title}" needs revision`,
    body: published
      ? "Your paper is now live and readable on the site."
      : (paper.reviewNote ?? "An editor returned your paper for revision."),
    href: published ? `/p/${paper.slug}` : "/submissions",
  });

  await notifyDecision({
    to: paper.submitter.email,
    paperId: id,
    title: paper.title,
    slug: paper.slug,
    published,
    reviewNote: paper.reviewNote,
  });
}

function revalidateAfterDecision() {
  // A decision changes the public index, the homepage lead, the author's dashboard,
  // and every admin surface. The layout scope also refreshes the header bell.
  revalidatePath("/", "layout");
  revalidatePath("/papers");
  revalidatePath("/admin");
  revalidatePath("/admin/queue");
  revalidatePath("/submissions");
}
