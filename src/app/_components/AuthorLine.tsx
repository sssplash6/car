import Link from "next/link";

// The author line as a set of doors: each name searches the archive for that
// author. Authors are one free-text line (Paper.authorLine), not records, so
// the link goes to search rather than a person page — honest about the data,
// and still correct the day a real author model arrives. Splits on commas,
// which is how the field is written everywhere on the site.
export function AuthorLine({
  line,
  separator = ", ",
  className,
}: {
  line: string;
  separator?: string;
  className?: string;
}) {
  const names = line
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0) return <span className={className}>{line}</span>;

  return (
    <span className={className}>
      {names.map((name, i) => (
        <span key={`${i}-${name}`}>
          {i > 0 && separator}
          <Link href={`/papers?q=${encodeURIComponent(name)}`}>{name}</Link>
        </span>
      ))}
    </span>
  );
}
