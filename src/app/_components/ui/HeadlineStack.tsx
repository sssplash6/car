import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { WordRise } from "@/app/_components/motion/WordRise";
import { Reveal } from "@/app/_components/motion/Reveal";
import { cx } from "./cx";

// The Apple stack (DESIGN.md §8.18): eyebrow → title → lede → actions, with
// the drawn rule under centred titles. rise="load" plays the entrance on first
// paint (eyebrow, title, lede at 300ms, actions at 380ms); `words` makes the
// title rise word by word instead of as a block.

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function RuleDraw() {
  return (
    <svg
      className="rule-draw"
      viewBox="0 0 80 6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M40 3 C 30 2.2 18 3.8 2 3" pathLength={1} />
      <path d="M40 3 C 50 3.8 62 2.2 78 3" pathLength={1} />
    </svg>
  );
}

export function HeadlineStack({
  eyebrow,
  eyebrowHref,
  title,
  titleAs = "h1",
  titleId,
  size,
  lede,
  actions,
  align = "start",
  rule = false,
  rise = "none",
  words = false,
  blur = false,
  className,
}: {
  eyebrow?: ReactNode;
  eyebrowHref?: string;
  title: string;
  titleAs?: "h1" | "h2" | "p";
  titleId?: string;
  size: "display" | "h1" | "title" | "h2";
  lede?: string;
  actions?: ReactNode;
  align?: "center" | "start";
  rule?: boolean;
  rise?: "load" | "view" | "none";
  words?: boolean;
  blur?: boolean;
  className?: string;
}) {
  const load = rise === "load";
  const titleClass = cx(`t-${size}`, "stack-title");
  const Title = titleAs;

  const titleNode =
    words && rise !== "none" ? (
      <WordRise
        as={titleAs}
        id={titleId}
        text={title}
        mode={load ? "load" : "view"}
        blur={blur}
        className={titleClass}
      />
    ) : (
      <Title id={titleId} className={cx(titleClass, load && "rise-load")} style={load ? d(60) : undefined}>
        {title}
      </Title>
    );

  const stack = (
    <div className={cx(align === "center" ? "stack-center" : "stack-start", className)}>
      {eyebrow &&
        (eyebrowHref ? (
          <Link href={eyebrowHref} className={cx("t-meta stack-eyebrow", load && "rise-load")}>
            {eyebrow}
          </Link>
        ) : (
          <p className={cx("t-meta", load && "rise-load")}>{eyebrow}</p>
        ))}
      {titleNode}
      {rule && <RuleDraw />}
      {lede && (
        <p className={cx("t-lede stack-lede", load && "rise-load")} style={load ? d(words ? 300 : 160) : undefined}>
          {lede}
        </p>
      )}
      {actions && (
        <div className={cx("actions stack-actions", load && "rise-load")} style={load ? d(380) : undefined}>
          {actions}
        </div>
      )}
    </div>
  );

  return rise === "view" ? <Reveal gesture="rise">{stack}</Reveal> : stack;
}
