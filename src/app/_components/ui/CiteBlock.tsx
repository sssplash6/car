"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Reveal } from "@/app/_components/motion/Reveal";
import { CopyButton } from "@/app/_components/CopyButton";
import type { CiteFormat } from "@/lib/cite";
import { cx } from "./cx";

// How to cite this paper (DESIGN.md §8.12, extended): the citation in the
// reader's style — Chicago, APA, MLA or BibTeX — with one button to copy it
// and one to copy the link. Tabs follow the ARIA tabs pattern (arrow keys move
// between styles). Prints the selected style.
export function CiteBlock({
  formats,
  url,
  label = "Cite",
}: {
  formats: CiteFormat[];
  url: string;
  label?: string;
}) {
  const [active, setActive] = useState<CiteFormat["id"]>(formats[0].id);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = formats.find((format) => format.id === active) ?? formats[0];

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const at = formats.findIndex((format) => format.id === active);
    const next = (at + (event.key === "ArrowRight" ? 1 : -1) + formats.length) % formats.length;
    setActive(formats[next].id);
    tabs.current[next]?.focus();
  }

  return (
    <Reveal as="section" className="cite card-filled" aria-labelledby="cite-label">
      <div className="cite-head">
        <h2 id="cite-label" className="t-meta">
          {label}
        </h2>
        <div role="tablist" aria-label="Citation style" className="cite-tabs" onKeyDown={onKeyDown}>
          {formats.map((format, i) => (
            <button
              key={format.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`cite-tab-${format.id}`}
              aria-selected={format.id === active}
              aria-controls="cite-panel"
              tabIndex={format.id === active ? 0 : -1}
              className={cx(format.id === active && "is-active")}
              onClick={() => setActive(format.id)}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="cite-panel" aria-labelledby={`cite-tab-${current.id}`} tabIndex={0}>
        {current.id === "bibtex" ? (
          <pre className="cite-pre">{current.text}</pre>
        ) : (
          <blockquote>{current.text}</blockquote>
        )}
      </div>
      <div className="actions">
        <CopyButton text={current.text} label="Copy citation" />
        <CopyButton text={url} label="Copy link" icon="link" />
      </div>
    </Reveal>
  );
}
