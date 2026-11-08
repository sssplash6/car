import { Fragment, type CSSProperties } from "react";
import { Reveal } from "./Reveal";

// Words rise (DESIGN.md §6.2): each word lifts .42em into place, 34ms apart.
// The full text is read once, from the sr-only copy; the word spans are
// presentational. `blur` (a 4px unblur) is for the home headline only. Load
// mode is pure CSS on first paint; view mode rides a Reveal trigger.
export function WordRise({
  text,
  as: Tag = "p",
  className,
  mode = "load",
  blur = false,
  step = 34,
  id,
}: {
  text: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  mode?: "load" | "view";
  blur?: boolean;
  /** ms between words. */
  step?: number;
  id?: string;
}) {
  const words = text.split(" ");
  const inner = (
    <Tag className={className} id={id}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className={["word-rise", mode === "load" ? "load" : "", blur ? "rise-blur" : ""]
          .filter(Boolean)
          .join(" ")}
        style={{ "--step": `${step}ms` } as CSSProperties}
      >
        {words.map((word, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span style={{ "--w": i } as CSSProperties}>{word}</span>
          </Fragment>
        ))}
      </span>
    </Tag>
  );

  if (mode === "load") return inner;
  return <Reveal gesture="none">{inner}</Reveal>;
}
