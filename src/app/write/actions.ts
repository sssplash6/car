"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_KIND, PAPER_STATUS, buildUniqueSlug } from "@/lib/papers";
import { loadArticleAccess } from "@/lib/articles";
import {
  MAX_BODY_BYTES,
  bodyText,
  countWords,
  excerpt,
  safeImageSrc,
  sanitizeDoc,
} from "@/lib/article/document";
import { saveImage } from "@/lib/media";
import { UploadError } from "@/lib/storage";
import { NOTIFICATION_KIND, notify } from "@/lib/notifications";
import { notifyEditorsOfSubmission } from "@/lib/email";

// The on-site editor's actions. Every one starts from requireUser() and, for an
// existing article, loadArticleAccess() (src/lib/articles.ts), which is where
// ownership and the editable-status rules live. Server actions are reachable by
// direct POST, so none of this may rely on what the editor UI shows or hides.

const MAX_TITLE = 300;
const MAX_SUBTITLE = 400;
const MAX_AUTHOR_LINE = 300;
const MAX_SUMMARY = 5000;
const MAX_TOPICS = 8;
const MIN_WORDS_TO_SUBMIT = 150;

export type ArticleDraft = {
  title: string;
  subtitle: string;
  authorLine: string;
  /** The summary shown in listings and search; blank means "use the opening". */
  summary: string;
  topics: string[];
  coverImage: string | null;
  /** ProseMirror JSON from the editor, as a string. A string because the
      editor's attribute objects have a null prototype, which React's
      server-action transport will not carry as plain data. Sanitised before
      it is stored. */
  body: string | null;
};

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const draftSlug = () => `draft-${randomUUID()}`;

function cleanTopics(topics: unknown): string {
  if (!Array.isArray(topics)) return "";
  const seen = new Set<string>();
  for (const t of topics) {
    if (typeof t !== "string") continue;
    const label = t.replace(/[,\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
    if (label && ![...seen].some((s) => s.toLowerCase() === label.toLowerCase())) seen.add(label);
    if (seen.size >= MAX_TOPICS) break;
  }
  return [...seen].join(", ");
}

/** Validate and normalise a draft into the columns it is stored in. */
function toColumns(draft: ArticleDraft) {
  if (typeof draft.body === "string" && draft.body.length > MAX_BODY_BYTES * 2) {
    throw new UploadError("This article is too long to save. Split it into parts.");
  }
  let parsed: unknown = null;
  try {
    parsed = typeof draft.body === "string" ? JSON.parse(draft.body) : null;
  } catch {
    parsed = null;
  }
  const body = sanitizeDoc(parsed);
  const serialised = JSON.stringify(body);
  if (Buffer.byteLength(serialised) > MAX_BODY_BYTES) {
    throw new UploadError("This article is too long to save. Split it into parts.");
  }
  return {
    title: String(draft.title ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TITLE),
    subtitle: String(draft.subtitle ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_SUBTITLE) || null,
    authorLine: String(draft.authorLine ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_AUTHOR_LINE),
    abstract: String(draft.summary ?? "").trim().slice(0, MAX_SUMMARY),
    topics: cleanTopics(draft.topics) || null,
    coverImage: draft.coverImage ? safeImageSrc(draft.coverImage) : null,
    body: serialised,
  };
}

/**
 * Create a new draft from the editor's first save. Drafts are created here,
 * on the first keystroke, never on page load: a GET that inserts rows would be
 * triggered by link prefetching and would litter the table with empty drafts.
 */
export async function createArticle(draft: ArticleDraft): Promise<ActionResult<{ id: string; savedAt: string }>> {
  const user = await requireUser();
  let columns;
  try {
    columns = toColumns(draft);
  } catch (err) {
    if (!(err instanceof UploadError)) console.error("[write] save rejected:", err);
    return { ok: false, error: err instanceof UploadError ? err.message : "That could not be saved." };
  }

  const article = await prisma.paper.create({
    data: {
      ...columns,
      authorLine: columns.authorLine || user.name || "",
      kind: PAPER_KIND.ARTICLE,
      status: PAPER_STATUS.DRAFT,
      slug: draftSlug(),
      submitterId: user.id,
    },
    select: { id: true, updatedAt: true },
  });
  // No revalidatePath here, on purpose. A revalidating action makes Next
  // re-render the current route, which by now is /write/<id> (the editor
  // moves the URL there), and that remounts the editor mid-sentence: focus
  // lost, keystrokes dropped. /submissions renders per request anyway.
  return { ok: true, id: article.id, savedAt: article.updatedAt.toISOString() };
}

/** Autosave. Called by the editor a moment after the author stops typing. */
export async function saveArticle(id: string, draft: ArticleDraft): Promise<ActionResult<{ savedAt: string }>> {
  const user = await requireUser();
  const access = await loadArticleAccess(id, user);
  if (!access) return { ok: false, error: "This article is not yours to edit." };
  if (!access.canEdit) {
    return {
      ok: false,
      error:
        access.article.status === PAPER_STATUS.SUBMITTED
          ? "This article is with the editors. Withdraw it to keep editing."
          : "Published articles can't be edited here.",
    };
  }

  let columns;
  try {
    columns = toColumns(draft);
  } catch (err) {
    if (!(err instanceof UploadError)) console.error("[write] save rejected:", err);
    return { ok: false, error: err instanceof UploadError ? err.message : "That could not be saved." };
  }

  // The status in the where clause closes the race with a submit in another
  // tab: a save that lands after the submit updates nothing.
  const { count } = await prisma.paper.updateMany({
    where: {
      id,
      status: access.isAdmin
        ? { in: [PAPER_STATUS.DRAFT, PAPER_STATUS.REJECTED, PAPER_STATUS.SUBMITTED] }
        : { in: [PAPER_STATUS.DRAFT, PAPER_STATUS.REJECTED] },
    },
    data: columns,
  });
  if (count === 0) return { ok: false, error: "This article changed in another tab. Reload to continue." };

  return { ok: true, savedAt: new Date().toISOString() };
}

/** Send an article to the editors. Locks it until they decide. */
export async function submitArticle(id: string, draft: ArticleDraft): Promise<ActionResult> {
  const user = await requireUser();
  const access = await loadArticleAccess(id, user);
  if (!access || !access.isOwner) return { ok: false, error: "This article is not yours to submit." };
  if (![PAPER_STATUS.DRAFT, PAPER_STATUS.REJECTED].includes(access.article.status as never)) {
    return { ok: false, error: "This article is already with the editors." };
  }

  let columns;
  try {
    columns = toColumns(draft);
  } catch (err) {
    if (!(err instanceof UploadError)) console.error("[write] save rejected:", err);
    return { ok: false, error: err instanceof UploadError ? err.message : "That could not be saved." };
  }

  const text = bodyText(JSON.parse(columns.body));
  const words = countWords(text);
  if (!columns.title) return { ok: false, error: "Give the article a title." };
  if (!columns.authorLine) return { ok: false, error: "Add the author's name in Details." };
  if (words < MIN_WORDS_TO_SUBMIT) {
    return { ok: false, error: `Articles need at least ${MIN_WORDS_TO_SUBMIT} words. This one has ${words}.` };
  }

  // The summary is the page's description for search engines and listings.
  // Blank means the author left it to us: the standfirst if there is one,
  // else the opening of the text.
  const abstract = columns.abstract || columns.subtitle || excerpt(text);

  // A never-published article takes its permanent slug from its title now,
  // so a title changed during revision gets a matching URL.
  const slug = await buildUniqueSlug(columns.title, async (candidate) => {
    const hit = await prisma.paper.findUnique({ where: { slug: candidate }, select: { id: true } });
    return hit !== null && hit.id !== id;
  });

  const { count } = await prisma.paper.updateMany({
    where: { id, status: { in: [PAPER_STATUS.DRAFT, PAPER_STATUS.REJECTED] } },
    data: { ...columns, abstract, slug, status: PAPER_STATUS.SUBMITTED, submittedAt: new Date() },
  });
  if (count === 0) return { ok: false, error: "This article changed in another tab. Reload to continue." };

  // Tell the editors; both helpers swallow their own failures, as in
  // src/app/submit/actions.ts.
  const editors = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
  await notify({
    userIds: editors.map((e) => e.id),
    kind: NOTIFICATION_KIND.SUBMISSION_RECEIVED,
    title: "New article awaiting review",
    body: `${columns.title} · ${columns.authorLine}`,
    href: "/admin/queue",
  });
  await notifyEditorsOfSubmission({
    to: editors.map((e) => e.email).filter((e): e is string => !!e),
    paperId: id,
    title: columns.title,
    authorLine: columns.authorLine,
  });

  revalidatePath("/submissions");
  revalidatePath("/admin");
  revalidatePath("/admin/queue");
  return { ok: true };
}

/** Take a submission back from the queue to keep editing it. */
export async function withdrawArticle(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const access = await loadArticleAccess(id, user);
  if (!access || !access.isOwner) return { ok: false, error: "This article is not yours." };

  const { count } = await prisma.paper.updateMany({
    where: { id, status: PAPER_STATUS.SUBMITTED },
    data: { status: PAPER_STATUS.DRAFT, submittedAt: null },
  });
  if (count === 0) return { ok: false, error: "An editor has already decided on this article." };

  revalidatePath("/submissions");
  revalidatePath("/admin/queue");
  return { ok: true };
}

/** Delete an unpublished article for good. */
export async function deleteArticle(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const access = await loadArticleAccess(id, user);
  if (!access || !access.isOwner) return { ok: false, error: "This article is not yours." };

  const { count } = await prisma.paper.deleteMany({
    where: { id, kind: PAPER_KIND.ARTICLE, status: { in: [PAPER_STATUS.DRAFT, PAPER_STATUS.REJECTED] } },
  });
  if (count === 0) return { ok: false, error: "Only drafts can be deleted." };

  revalidatePath("/submissions");
  return { ok: true };
}

/** Upload a cover or an inline image. Returns its public URL. */
export async function uploadImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose an image." };
  try {
    return { ok: true, url: await saveImage(file) };
  } catch (err) {
    if (err instanceof UploadError) return { ok: false, error: err.message };
    console.error("[write] image upload failed:", err);
    return { ok: false, error: "That upload failed. Please try again." };
  }
}

