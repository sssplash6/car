import { Fragment, type CSSProperties } from "react";
import { Reveal } from "./Reveal";

// The editors' statement fills in word by word as you scroll through it: each
// word goes from a faint trace to full ink as the paragraph travels from the
// lower third of the screen to the upper third (a CSS view timeline; see
// .scroll-fill in globals.css). Where scroll timelines are unsupported, or
// with reduced motion, it is simply full ink and rises in as a block. The
// words are plain inline text, so it reads as one sentence to everyone.
export function ScrollFill({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <Reveal gesture="rise">
      <p className={["scroll-fill", className].filter(Boolean).join(" ")} style={{ "--n": words.length } as CSSProperties}>
        {words.map((word, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className="sf-w" style={{ "--w": i } as CSSProperties}>
              {word}
            </span>
          </Fragment>
        ))}
      </p>
    </Reveal>
  );
}
