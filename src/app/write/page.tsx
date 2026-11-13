import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { ArticleEditor } from "@/app/write/_components/ArticleEditor";

export const metadata: Metadata = {
  title: "Write",
  robots: { index: false, follow: false },
};

// A blank page. Nothing is stored until the first keystroke (createArticle in
// actions.ts), so opening /write and leaving creates no empty draft.
export default async function WritePage() {
  const user = await requireUser();
  return (
    <ArticleEditor
      isOwner
      isAdmin={false}
      canEdit
      initial={{
        id: null,
        status: "DRAFT",
        slug: "",
        title: "",
        subtitle: "",
        authorLine: user.name ?? "",
        summary: "",
        topics: [],
        coverImage: null,
        body: null,
        reviewNote: null,
        submittedAt: null,
      }}
    />
  );
}
