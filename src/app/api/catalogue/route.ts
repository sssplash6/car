import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { groupIntoIssues } from "@/lib/issues";

// The card catalogue's index: every published paper and every bound issue, as
// one small JSON document.
//
// Fetched once, lazily, the first time a reader opens the catalogue (⌘K) — not
// embedded in the header, which renders on every page and would put the whole
// archive into the HTML of pages nobody searches from. Nothing here is gated:
// it is exactly the data the public /papers and /issues pages already render.
export const dynamic = "force-dynamic";

export async function GET() {
  const papers = await prisma.paper.findMany({
    where: { status: PAPER_STATUS.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      authorLine: true,
      publishedAt: true,
    },
  });

  const dated = papers.flatMap((p) =>
    p.publishedAt ? [{ ...p, publishedAt: p.publishedAt }] : [],
  );
  const issues = groupIntoIssues(dated);

  // Issue number per slug, so a result can name the volume it sits in without
  // the client repeating the quarter arithmetic.
  const issueOf = new Map<string, { number: number; label: string }>();
  for (const issue of issues) {
    for (const paper of issue.papers) {
      issueOf.set(paper.slug, { number: issue.number, label: issue.label });
    }
  }

  const body = {
    papers: papers.map((p) => ({
      slug: p.slug,
      title: p.title,
      authors: p.authorLine,
      year: p.publishedAt?.getUTCFullYear() ?? null,
      issue: issueOf.get(p.slug) ?? null,
    })),
    issues: issues.map((i) => ({
      number: i.number,
      label: i.label,
      anchor: i.anchor,
      count: i.papers.length,
    })),
  };

  return Response.json(body, {
    headers: {
      // Public, and cheap to be a minute stale — the archive changes when an
      // editor publishes, not when a reader types.
      "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
    },
  });
}
