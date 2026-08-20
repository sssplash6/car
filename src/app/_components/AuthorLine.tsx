import Link from "next/link";

// The author line as a set of doors rather than a caption.
//
// A reader who has just decided this paper is worth citing very often wants the
// next question answered — what else has this author published here? — and the
// only thing standing between them and it was a comma-separated string.
//
// Authors are stored as one free-text line (Paper.authorLine), not as records,
// so each name links into the archive's own search rather than to a person
// page: honest about what the data actually is, and it stays correct the day a
// real author model arrives. Splitting is on commas only, which is how the
// field is written everywhere on the site.
export function AuthorLine({
  line,
  className,
}: {
  line: string;
  className?: string;
}) {
  const names = line
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  // A line that does not split (one author, or an unexpected format) is still
  // one searchable name — but if splitting produced nothing, print the raw
  // line rather than an empty element.
  if (names.length === 0) return <span className={className}>{line}</span>;

  return (
    <span className={className}>
      {names.map((name, i) => (
        <span key={`${i}-${name}`}>
          {i > 0 && ", "}
          <Link
            href={`/papers?q=${encodeURIComponent(name)}`}
            className="title-link hover:text-accent"
          >
            {name}
          </Link>
        </span>
      ))}
    </span>
  );
}
