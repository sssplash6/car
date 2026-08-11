"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS, buildUniqueSlug } from "@/lib/papers";
import { UploadError, savePdf } from "@/lib/storage";
import { NOTIFICATION_KIND, notify } from "@/lib/notifications";
import { notifyEditorsOfSubmission } from "@/lib/email";

// Field limits. Enforced server-side because the matching maxLength attributes in
// the form are a hint to the browser, not a constraint — a crafted POST ignores
// them. SQLite would happily store megabytes in a TEXT column.
const MAX_TITLE = 300;
const MAX_ABSTRACT = 5000;
const MAX_AUTHOR_LINE = 300;
const MIN_ABSTRACT = 100;

export type SubmitState = {
  error?: string;
  /** Echoed back with every error: React 19 resets uncontrolled fields after
      the action round-trip, so without this a validation failure wipes the
      author's entire abstract. */
  values?: { title: string; authorLine: string; abstract: string };
};

/**
 * Create a paper and put it straight into review.
 *
 * There is no draft-then-submit split in this action: a submission always lands
 * as SUBMITTED so nothing sits invisible in the queue. DRAFT exists in the schema
 * for a future save-and-finish-later flow.
 */
export async function submitPaper(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const abstract = String(formData.get("abstract") ?? "").trim();
  const authorLine = String(formData.get("authorLine") ?? "").trim();
  const file = formData.get("file");

  // Everything the author typed rides along with every error, so no failure
  // costs them their text. The file cannot be echoed — browsers do not allow
  // programmatically refilling a file input — which the form copy explains.
  const values = { title, authorLine, abstract };

  if (!title) return { error: "Give the paper a title.", values };
  if (title.length > MAX_TITLE) {
    return { error: `Titles are limited to ${MAX_TITLE} characters.`, values };
  }
  if (!authorLine) {
    return { error: "List the authors, separated by commas.", values };
  }
  if (authorLine.length > MAX_AUTHOR_LINE) {
    return {
      error: `The author line is limited to ${MAX_AUTHOR_LINE} characters.`,
      values,
    };
  }
  if (abstract.length < MIN_ABSTRACT) {
    return {
      error: `The abstract is the only part search engines can read, so it needs at least ${MIN_ABSTRACT} characters.`,
      values,
    };
  }
  if (abstract.length > MAX_ABSTRACT) {
    return { error: `Abstracts are limited to ${MAX_ABSTRACT} characters.`, values };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Attach the paper as a PDF.", values };
  }

  // Write the file before the row: an orphaned file wastes a little disk, but a
  // row pointing at a file that was never written is a broken download.
  let stored;
  try {
    stored = await savePdf(file);
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message, values };
    console.error("[submit] upload failed:", err);
    return { error: "That upload failed. Please try again.", values };
  }

  const slug = await buildUniqueSlug(title, async (candidate) => {
    const hit = await prisma.paper.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return hit !== null;
  });

  const paper = await prisma.paper.create({
    data: {
      slug,
      title,
      abstract,
      authorLine,
      status: PAPER_STATUS.SUBMITTED,
      submittedAt: new Date(),
      storedName: stored.storedName,
      originalName: file.name,
      fileSize: stored.size,
      submitterId: user.id,
    },
  });

  // Tell the editors. Both calls swallow their own failures — the paper is already
  // saved, and neither a missing notification nor a mail outage should make a
  // successful submission look like it failed to the author.
  const editors = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  });

  await notify({
    userIds: editors.map((e) => e.id),
    kind: NOTIFICATION_KIND.SUBMISSION_RECEIVED,
    title: "New submission awaiting review",
    body: `${title} · ${authorLine}`,
    href: "/admin/queue",
  });

  await notifyEditorsOfSubmission({
    to: editors.map((e) => e.email).filter((e): e is string => !!e),
    paperId: paper.id,
    title,
    authorLine,
  });

  revalidatePath("/submissions");
  revalidatePath("/admin");
  revalidatePath("/admin/queue");

  // redirect() throws, so it must sit outside the try above or it would be
  // swallowed and reported to the user as an upload failure.
  redirect("/submissions?submitted=1");
}
