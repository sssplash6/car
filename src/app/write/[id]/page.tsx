import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { loadArticleAccess } from "@/lib/articles";
import { parseBody } from "@/lib/article/document";
import { parseTopics } from "@/lib/papers";
import { ArticleEditor } from "@/app/write/_components/ArticleEditor";

export const metadata: Metadata = {
  title: "Write",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string }> };

// An existing article in the editor. Access (author, or an editor) and
// editability come from loadArticleAccess; a stranger gets a plain 404 so the
// id's existence is not confirmed.
export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const access = await loadArticleAccess(id, user);
  if (!access) notFound();

  const { article } = access;
  return (
    <ArticleEditor
      isOwner={access.isOwner}
      isAdmin={access.isAdmin}
      canEdit={access.canEdit}
      initial={{
        id: article.id,
        status: article.status,
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle ?? "",
        authorLine: article.authorLine,
        summary: article.abstract,
        topics: parseTopics(article.topics),
        coverImage: article.coverImage,
        body: article.body ? parseBody(article.body) : null,
        reviewNote: article.reviewNote,
        submittedAt: article.submittedAt?.toISOString() ?? null,
      }}
    />
  );
}
