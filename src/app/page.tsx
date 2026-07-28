import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";

// The public index. No auth check anywhere in this file — this page and the
// abstract pages are the site's entire search presence, so gating them would
// delete its search traffic. Only published papers are listed.
export default async function HomePage() {
  const papers = await prisma.paper.findMany({
    where: { status: PAPER_STATUS.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      abstract: true,
      authorLine: true,
      publishedAt: true,
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Papers</h1>
      <p className="mt-3 text-muted-fg">
        Research and writing from students and faculty at Freshman Academy.
      </p>

      {papers.length === 0 ? (
        <p className="mt-12 border-t border-line pt-12 text-muted-fg">
          No papers have been published yet.
        </p>
      ) : (
        <ul className="mt-12 border-t border-line">
          {papers.map((paper) => (
            <li key={paper.id} className="border-b border-line py-8">
              <h2 className="font-serif text-xl">
                <Link
                  href={`/p/${paper.slug}`}
                  className="text-ink transition-colors hover:text-brand"
                >
                  {paper.title}
                </Link>
              </h2>
              <p className="mt-1.5 text-sm text-muted-fg">
                {paper.authorLine}
                {paper.publishedAt && ` · ${formatDate(paper.publishedAt)}`}
              </p>
              {/* Clamped in CSS rather than truncated in JS: the full abstract
                  stays in the DOM for crawlers while readers see three lines. */}
              <p className="mt-3 line-clamp-3 text-ink/80">{paper.abstract}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
