import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Editable site copy.
//
// Every block has a hardcoded fallback below, so the site renders complete pages
// against an empty database and an admin can overwrite any of it from
// /admin/content without a deploy. A missing row is the normal state, not an
// error — do not "fix" this by seeding rows at migration time.
//
// All current values are PLACEHOLDERS awaiting real editorial copy. They are
// written to be obviously provisional rather than convincingly final, so nothing
// here gets mistaken for approved text.

export type ContentKey = keyof typeof DEFAULTS;

export const DEFAULTS = {
  "home.hero": {
    // Kept to 13 words: the hero must fit the viewport, and a long subhead is a
    // font-scale error rather than a copy-length problem.
    title: "Research on Central Asia",
    body: "Peer-reviewed papers and analysis on the politics, economies and societies of the region.",
  },
  "home.editorial": {
    title: "From the editors",
    body: "A standing note from the editorial team belongs here: what the review is for, what it looks for in a submission, and how often new work appears. Placeholder copy.",
  },
  "home.callForPapers": {
    title: "Call for submissions",
    body: "We read submissions year-round from researchers, practitioners and graduate students working on the region. Placeholder copy: replace with real scope, length and deadline guidance.",
  },
  "about.main": {
    title: "About the Review",
    body: "Central Asian Review publishes research on Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan and Uzbekistan, alongside the wider region.\n\nThis is placeholder text. Replace it with the real account of the review's history, editorial stance and scope.\n\nEvery paragraph on this page is editable from the editor dashboard, so publishing the final wording needs no deploy.",
  },
  "about.masthead": {
    title: "Masthead",
    body: "Editor-in-Chief: Name Placeholder\nManaging Editor: Name Placeholder\nEditorial Board: Name, Name, Name\n\nPlaceholder list. Replace with the real masthead.",
  },
  "about.submissions": {
    title: "For contributors",
    body: "An editor reviews every submission before publication. Abstracts appear publicly; the full paper is available to registered readers.\n\nPlaceholder copy: replace with real formatting requirements, word limits and review timelines.",
  },
  "submit.intro": {
    title: "Submit a paper",
    body: "Anyone with an account may submit. An editor reads every submission before it appears on the site. Placeholder guidance: replace with the real submission requirements.",
  },
  "footer.credit": {
    title: "",
    body: "An independent review of scholarship on the region, published by Freshman Academy.",
  },
} as const;

export type Block = { title: string; body: string };

/**
 * Read one block, falling back to its placeholder default.
 *
 * Cached per render pass so a page pulling several blocks does not issue a query
 * each time. An empty stored string falls back too — clearing a field in the
 * admin editor should restore the placeholder rather than render a blank gap.
 */
export const getBlock = cache(async (key: ContentKey): Promise<Block> => {
  const fallback = DEFAULTS[key];
  const row = await prisma.contentBlock.findUnique({ where: { key } });

  return {
    title: row?.title?.trim() || fallback.title,
    body: row?.body?.trim() || fallback.body,
  };
});

/**
 * Every block with its current value and whether it is still the placeholder.
 *
 * Drives /admin/content, where the point is seeing at a glance what still needs
 * real copy.
 */
export async function listBlocks(): Promise<
  Array<Block & { key: ContentKey; isDefault: boolean; updatedAt: Date | null }>
> {
  const rows = await prisma.contentBlock.findMany();
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return (Object.keys(DEFAULTS) as ContentKey[]).map((key) => {
    const row = byKey.get(key);
    const title = row?.title?.trim() || DEFAULTS[key].title;
    const body = row?.body?.trim() || DEFAULTS[key].body;

    return {
      key,
      title,
      body,
      isDefault: !row?.body?.trim(),
      updatedAt: row?.updatedAt ?? null,
    };
  });
}

/** Human label for each block, so the admin editor is not a list of dotted keys. */
export const BLOCK_LABELS: Record<ContentKey, string> = {
  "home.hero": "Homepage hero",
  "home.editorial": "Homepage editorial note",
  "home.callForPapers": "Homepage call for submissions",
  "about.main": "About main text",
  "about.masthead": "About masthead",
  "about.submissions": "About contributor guidance",
  "submit.intro": "Submit page introduction",
  "footer.credit": "Footer credit line",
};
