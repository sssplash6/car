import type { ReactNode } from "react";
import { cx } from "@/app/_components/ui/cx";
import "./article.css";

// An article as a reader sees it: topics, title, standfirst, byline, cover,
// then the text. Shared by the public page (/p/[slug]), the private preview
// (/preview/[id]) and the editor's Preview mode, so what the author previews
// is exactly what gets published. Plain markup, no hooks: it renders on the
// server and inside the client editor alike.
//
// `html` must come from the article renderer (src/lib/article) or from the
// editor's own getHTML() on the same schema, never from raw input.

export function ArticleLayout({
  title,
  subtitle,
  authorLine,
  byline,
  topics,
  coverImage,
  html,
  eyebrow,
  meta,
  titleSlot,
  className,
}: {
  title: string;
  subtitle?: string | null;
  authorLine: string;
  /** Replaces the plain author line, e.g. with links into the archive. */
  byline?: ReactNode;
  topics?: string[];
  coverImage?: string | null;
  html: string;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  /** Wraps the title, e.g. in TitleCarry for the row-to-page morph. */
  titleSlot?: (title: ReactNode) => ReactNode;
  className?: string;
}) {
  const heading = (
    <h1 className={cx("a-title", title.length > 90 ? "t-h2" : "t-title")}>{title || "Untitled"}</h1>
  );

  return (
    <div className={cx("a-article", className)}>
      <header className="a-head">
        {eyebrow}
        {!eyebrow && topics && topics.length > 0 && (
          <p className="a-topics t-meta">{topics.join(" · ")}</p>
        )}
        {titleSlot ? titleSlot(heading) : heading}
        {subtitle && <p className="a-subtitle">{subtitle}</p>}
        <p className="a-byline">{byline ?? authorLine}</p>
        {meta && <p className="a-meta meta-line">{meta}</p>}
      </header>

      {coverImage && (
        <figure className="a-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt="" fetchPriority="high" />
        </figure>
      )}

      <div className="a-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
