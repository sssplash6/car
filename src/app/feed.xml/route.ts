import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { SITE_NAME, siteUrl } from "@/lib/site";

// Atom feed of published papers — the review's follow mechanism. Researchers
// who track a field live in feed readers; without this the only way to see
// new work was to remember to visit. Atom over RSS 2.0 for real <updated>
// timestamps and a saner author model.
//
// Same visibility rule as every public surface: PUBLISHED papers only, and
// only their public fields (title, authors, abstract) — the feed must never
// leak more than the abstract page shows.
export async function GET() {
  const papers = await prisma.paper.findMany({
    where: { status: PAPER_STATUS.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    take: 50, // a feed, not the archive; /papers is the archive
    select: {
      slug: true,
      title: true,
      abstract: true,
      authorLine: true,
      publishedAt: true,
    },
  });

  const base = siteUrl();
  const updated = (papers[0]?.publishedAt ?? new Date()).toISOString();

  const entries = papers
    .map((paper) => {
      const url = `${base}/p/${paper.slug}`;
      const authors = paper.authorLine
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => `<author><name>${escapeXml(name)}</name></author>`)
        .join("");
      return `  <entry>
    <title>${escapeXml(paper.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${(paper.publishedAt ?? new Date()).toISOString()}</updated>
    ${authors}
    <summary>${escapeXml(paper.abstract)}</summary>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(SITE_NAME)}</title>
  <subtitle>Research, analysis and essays on the politics, economies and societies of Central Asia.</subtitle>
  <link href="${base}/feed.xml" rel="self"/>
  <link href="${base}"/>
  <id>${base}/</id>
  <updated>${updated}</updated>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      // Fresh enough for a review that publishes a few times a quarter, cheap
      // enough that feed readers polling hourly cost nothing.
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** The five characters that matter inside XML text nodes and attributes. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
