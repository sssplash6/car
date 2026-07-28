"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { notifyDecision } from "@/lib/email";
import { siteUrl } from "@/lib/site";

// Review decisions. Both actions start from requireAdmin(), which re-reads the
// role from the database — a server action is reachable directly by POST, so the
// proxy redirect and the hidden-in-the-UI argument protect nothing here.

const MAX_REVIEW_NOTE = 2000;

export async function publishPaper(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Only a SUBMITTED paper may be published, enforced in the where clause. A
  // double-submitted form (or a stale tab) therefore updates zero rows instead of
  // re-publishing something already live and re-sending its email.
  const { count } = await prisma.paper.updateMany({
    where: { id, status: PAPER_STATUS.SUBMITTED },
    data: {
      status: PAPER_STATUS.PUBLISHED,
      publishedAt: new Date(),
      reviewNote: null,
    },
  });

  if (count === 0) return;

  await sendDecisionEmail(id, true);
  revalidateAfterDecision();
}

export async function rejectPaper(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  if (!id) return;

  const { count } = await prisma.paper.updateMany({
    where: { id, status: PAPER_STATUS.SUBMITTED },
    data: {
      status: PAPER_STATUS.REJECTED,
      reviewNote: note.slice(0, MAX_REVIEW_NOTE) || null,
    },
  });

  if (count === 0) return;

  await sendDecisionEmail(id, false);
  revalidateAfterDecision();
}

/**
 * Email the submitter about a decision that has already been committed.
 *
 * Loaded in a second query rather than returned from updateMany, which reports
 * only a count. notifyDecision swallows its own failures — the decision must not
 * appear to fail because the mail provider was down.
 */
async function sendDecisionEmail(id: string, published: boolean) {
  const paper = await prisma.paper.findUnique({
    where: { id },
    select: {
      title: true,
      slug: true,
      reviewNote: true,
      submitter: { select: { email: true } },
    },
  });

  if (!paper) return;

  await notifyDecision({
    to: paper.submitter.email,
    title: paper.title,
    slug: paper.slug,
    published,
    reviewNote: paper.reviewNote,
    siteUrl: siteUrl(),
  });
}

function revalidateAfterDecision() {
  // The index and the author's dashboard both change on any decision; the
  // abstract page is revalidated by path below via the index's own fetch.
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/submissions");
}
