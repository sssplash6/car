import type { ReactNode } from "react";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import type { IllName } from "@/app/_components/illustrations/types";
import { Reveal } from "@/app/_components/motion/Reveal";
import { cx } from "./cx";

// The paper page's door (DESIGN.md §8.11). The citation block is CiteBlock.tsx.

/** The door: the only dark surface before the footer on any page. The caller
    keeps id="the-full-paper" and the gated-download class, which the
    ScholarlyArticle JSON-LD names as the gated region. */
export function DoorPanel({
  id,
  className,
  title,
  line,
  action,
  aside,
  drawing,
}: {
  id: string;
  className?: string;
  title: string;
  line: ReactNode;
  action: ReactNode;
  aside?: ReactNode;
  drawing?: IllName;
}) {
  return (
    <Reveal as="section" id={id} className={cx("door", className)} aria-labelledby={`${id}-title`}>
      <div>
        <h2 id={`${id}-title`} className="t-h3">
          {title}
        </h2>
        <p>{line}</p>
        <div className="actions">
          {action}
          {aside}
        </div>
      </div>
      {drawing && <Drawing name={drawing} size="md" tone="door" draw="view" delay={200} />}
    </Reveal>
  );
}
