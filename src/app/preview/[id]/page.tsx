import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { loadArticleAccess } from "@/lib/articles";
import { bodyText, countWords, parseBody, readingMinutes, renderBody } from "@/lib/article/document";
import { STATUS_LABEL, isPaperStatus, parseTopics } from "@/lib/papers";
import { ArticleLayout } from "@/app/_components/article/ArticleLayout";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string }> };

// An unpublished article exactly as it will read, for its author and for the
// editors deciding on it (the review queue links here).
export default async function PreviewPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const access = await loadArticleAccess(id, user);
  if (!access) notFound();

  const { article } = access;
  const doc = parseBody(article.body);
  const minutes = readingMinutes(countWords(bodyText(doc)));
  const status = isPaperStatus(article.status) ? STATUS_LABEL[article.status] : article.status;

  return (
    <div className="page-top page-end">
      <div className="wrap-narrow mb-10 flex flex-wrap items-center justify-between gap-3">
        <p className="t-meta">Preview · {status}</p>
        <div className="flex gap-2">
          {access.isAdmin && article.status === "SUBMITTED" && (
            <Link href="/admin/queue" className="btn btn-secondary btn-sm">
              Back to the queue
            </Link>
          )}
          {access.canEdit && (
            <Link href={`/write/${article.id}`} className="btn btn-primary btn-sm">
              Open in the editor
            </Link>
          )}
        </div>
      </div>
      <ArticleLayout
        title={article.title}
        subtitle={article.subtitle}
        authorLine={article.authorLine}
        topics={parseTopics(article.topics)}
        coverImage={article.coverImage}
        html={renderBody(doc)}
        meta={<>{minutes} min read</>}
      />
    </div>
  );
}
