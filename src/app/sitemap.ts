import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { siteUrl } from "@/lib/site";

// Generated per request, not at build time. Two reasons, both load-bearing:
// the Render disk holding the SQLite file is mounted at runtime, so a build-time
// query would fail or silently produce an empty sitemap; and a static sitemap
// would freeze at deploy time and never list papers published afterwards.
export const dynamic = "force-dynamic";

// Only published abstracts belong here. Listing a gated or pending paper would
// point crawlers at a 404 (unpublished slugs do not resolve), which costs crawl
// budget and shows up as coverage errors in Search Console.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const papers = await prisma.paper.findMany({
    where: { status: PAPER_STATUS.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: base, lastModified: papers[0]?.updatedAt ?? new Date(), priority: 1 },
    ...papers.map((paper) => ({
      url: `${base}/p/${paper.slug}`,
      lastModified: paper.updatedAt,
      priority: 0.8,
    })),
  ];
}
