import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { PageShell } from "@/app/_components/PageShell";
import { PaperRow, type PaperRowData } from "@/app/_components/PaperRow";
import { IkatDivider } from "@/app/_components/Ornament";
import { Reveal } from "@/app/_components/Reveal";

export const metadata: Metadata = {
  title: "Papers",
  description:
    "Every paper published by Central Asian Review, newest first. Abstracts are free to read.",
  alternates: { canonical: "/papers" },
};

// The full public index. Public and crawlable, like the homepage — no auth check.
export default async function PapersPage() {
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
    <PageShell>
      <h1 className="display-flush font-serif text-[clamp(2.25rem,1.5rem+3vw,3rem)] leading-[1.05] tracking-tight text-ink">
        Papers
      </h1>
      <p className="mt-3 text-muted-fg">
        {papers.length === 0
          ? "Nothing has been published yet."
          : `${papers.length} paper${papers.length === 1 ? "" : "s"}, newest first. Abstracts are free to read; the full PDF needs an account.`}
      </p>

      {papers.length > 0 && (
        <>
          <IkatDivider className="mt-8 text-tile" />
          <div className="mt-2">
            {papers.map((paper: PaperRowData) => (
              // No stagger: rows reveal individually as they scroll in, and
              // anything already on screen at load renders without motion.
              <Reveal key={paper.id}>
                <PaperRow paper={paper} />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
