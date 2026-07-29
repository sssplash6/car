import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { PageShell } from "@/app/_components/PageShell";
import { PaperRow, type PaperRowData } from "@/app/_components/PaperRow";

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
      <h1 className="font-serif text-4xl text-ink">Papers</h1>
      <p className="mt-3 text-muted-fg">
        {papers.length === 0
          ? "Nothing has been published yet."
          : `${papers.length} paper${papers.length === 1 ? "" : "s"}, newest first. Abstracts are free to read; the full PDF needs an account.`}
      </p>

      {papers.length > 0 && (
        <div className="mt-10 border-t border-rule">
          {papers.map((paper: PaperRowData) => (
            <PaperRow key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
