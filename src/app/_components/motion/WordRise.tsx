import { Fragment, type CSSProperties } from "react";
import { Reveal } from "./Reveal";

// Words rise (DESIGN.md §6.2): each word lifts .42em into place, 34ms apart.
// The full text is read once, from the sr-only copy; the word spans are
// presentational. `blur` (a 4px unblur) is for the home headline only. Load
// mode is pure CSS on first paint; view mode rides a Reveal trigger. A `deck`
// is the title's second clause: it sets on its own line, smaller, and its words
// carry on the same rise; the heading reads "text: deck".
export function WordRise({
  text,
  deck,
  as: Tag = "p",
  className,
  mode = "load",
  blur = false,
  step = 34,
  id,
}: {
  text: string;
  deck?: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  mode?: "load" | "view";
  blur?: boolean;
  /** ms between words. */
  step?: number;
  id?: string;
}) {
  const words = text.split(" ");
  const riseClass = ["word-rise", mode === "load" ? "load" : "", blur ? "rise-blur" : ""]
    .filter(Boolean)
    .join(" ");
  const line = (list: string[], from: number, extra?: string) => (
    <span
      aria-hidden="true"
      className={extra ? `${riseClass} ${extra}` : riseClass}
      style={{ "--step": `${step}ms` } as CSSProperties}
    >
      {list.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span style={{ "--w": from + i } as CSSProperties}>{word}</span>
        </Fragment>
      ))}
    </span>
  );
  const inner = (
    <Tag className={className} id={id}>
      <span className="sr-only">{deck ? `${text}: ${deck}` : text}</span>
      {line(words, 0)}
      {deck && line(deck.split(" "), words.length, "stack-deck")}
    </Tag>
  );

  if (mode === "load") return inner;
  return <Reveal gesture="none">{inner}</Reveal>;
}
