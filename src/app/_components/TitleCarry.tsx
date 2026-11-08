import type { ReactNode } from "react";
import { Carry } from "@/app/_components/motion/Carry";

// The paper's title travels: the row a reader clicks becomes the title they
// land on. Rows carry on click (only the clicked one moves); the paper page's
// h1 carries always (it receives). Wrap BLOCK elements (h1/h2/h3), never
// inline links: fragmented inline boxes snapshot badly. `share="paper-title"`
// is the class the timing CSS in globals.css targets.
export function TitleCarry({
  slug,
  mode = "click",
  children,
}: {
  slug: string;
  mode?: "always" | "click";
  children: ReactNode;
}) {
  return (
    <Carry name={`paper-${slug}`} share="paper-title" mode={mode}>
      {children}
    </Carry>
  );
}
