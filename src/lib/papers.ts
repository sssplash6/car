// Paper status vocabulary and slug derivation.
//
// SQLite has no native enum (Prisma rejects `enum` blocks on this provider), so
// Paper.status is a plain String column and this file is the source of truth for
// which values are legal. Anything reading status should narrow through
// PaperStatus rather than comparing bare strings.

export const PAPER_STATUS = {
  /** Author is still editing. Invisible to reviewers and to the public. */
  DRAFT: "DRAFT",
  /** Awaiting review. Locked for editing so a reviewer sees a stable document. */
  SUBMITTED: "SUBMITTED",
  /** Public abstract + READER-gated PDF download. */
  PUBLISHED: "PUBLISHED",
  /** Returned to the author, with reviewNote explaining why. */
  REJECTED: "REJECTED",
} as const;

export type PaperStatus = (typeof PAPER_STATUS)[keyof typeof PAPER_STATUS];

export function isPaperStatus(value: string): value is PaperStatus {
  return Object.hasOwn(PAPER_STATUS, value);
}

/** Human label for a status, shown on /submissions and /admin. */
export const STATUS_LABEL: Record<PaperStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Under review",
  PUBLISHED: "Published",
  REJECTED: "Needs revision",
};

// Slug length cap. Long enough to stay readable in a URL, short enough that the
// uniqueness suffix below never pushes it to an impractical length.
const MAX_SLUG_LENGTH = 80;

/**
 * Derive a URL slug from a paper title. Strips accents so "Étude" becomes
 * "etude" rather than dropping the letter entirely.
 *
 * Returns an empty string for titles with no alphanumeric content at all (e.g.
 * only punctuation or only CJK, which NFD does not decompose to ASCII) — callers
 * must handle that case, see buildUniqueSlug.
 */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // strip accent marks left behind by NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, ""); // slice may have left a trailing hyphen
}

/**
 * Build a slug that does not collide with an existing one.
 *
 * `exists` is injected rather than querying here so this stays a pure helper and
 * is trivially testable. Falls back to "paper" when slugify yields nothing,
 * which keeps non-Latin titles working instead of producing an empty URL.
 */
export async function buildUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(title) || "paper";

  if (!(await exists(base))) return base;

  // Sequential suffixes rather than a random hash, so a second paper on the same
  // topic reads as "-2" instead of an opaque string. Capped so a pathological
  // number of duplicates can't loop forever.
  for (let n = 2; n <= 50; n += 1) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }

  throw new Error(`Could not derive a unique slug for "${title}"`);
}
