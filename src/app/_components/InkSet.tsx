import { Fragment } from "react";

// Type being SET.
//
// The phrase arrives word by word, each word rising out of its own line about
// 34ms behind the last — the compositor's stick laying words into the line.
// Adapted from the "vertical cut reveal" family of text entrances catalogued on
// 21st.dev and motion-primitives, but rebuilt as server-rendered spans plus CSS
// transitions (globals.css owns .ink-set): this site's display type IS its
// search presence, so it must never depend on JavaScript to become visible, and
// no motion library ships to the client.
//
// The words stay real text with ordinary spaces between them, so the heading
// still copies, translates, wraps and reads to assistive technology as one
// sentence. Only the trigger comes from outside — an ancestor <Reveal> sets
// data-reveal, and for load mode the CSS plays with the first paint.
//
// Rationed to three moments on the whole site: the cover's headline, a paper's
// title leaf, and the editors' statement. A page where every heading sets
// itself is a page where nothing is being said.
export function InkSet({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <span className={`ink-set ${className ?? ""}`}>
      {words.map((word, i) => (
        <Fragment key={`${i}-${word}`}>
          {/* Outer span is the clip (the line's foot); inner span is what
              moves. Two elements because clipping and translating the same box
              would clip the motion away. */}
          <span style={{ "--i": i } as React.CSSProperties}>
            <span>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
