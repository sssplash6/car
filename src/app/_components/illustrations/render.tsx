import type { CSSProperties, ReactNode } from "react";
import { STROKE } from "./strokes";
import { DrawSvg } from "./DrawSvg";
import type { DrawMode, DrawSize, DrawTone, DrawingData, IllName } from "./types";

// The renderer behind <Drawing>, taking a data module directly so a bundle
// that needs one drawing (the error page, the Mark) does not carry all 13.

export type DrawingProps = {
  name: IllName;
  size: DrawSize;
  tone?: DrawTone;
  draw?: DrawMode;
  /** ms before the first stroke. */
  delay?: number;
  /** ms between strokes. */
  stagger?: number;
  /** Gives the SVG role="img" with this name; omitted → decorative. */
  label?: string;
  className?: string;
  preserveAspectRatio?: string;
};

const r1 = (n: number) => Math.round(n * 100) / 100;

export function DrawingFrom({
  data,
  name,
  size,
  tone = "ink",
  draw = "view",
  delay = 0,
  stagger = 80,
  label,
  className,
  preserveAspectRatio,
}: DrawingProps & { data: DrawingData }) {
  const s = STROKE[size];
  const k = s.own ? 1 : data.viewBox[0] / 400;
  const total = (data.strokes.length - 1) * stagger + 1100;

  const style = {
    "--sw": r1(s.sw * k),
    "--sw-sm": r1((s.swSm ?? s.sw) * k),
    "--ds": s.ds,
    "--ds-sm": s.dsSm ?? s.ds,
    "--draw-delay": `${delay}ms`,
    "--stagger-path": `${stagger}ms`,
    "--draw-total": `${total}ms`,
  } as CSSProperties;

  const paths = data.strokes.map((stroke, i) => (
    <path
      key={`s${i}`}
      d={stroke.d}
      pathLength={1}
      data-s=""
      data-stage={stroke.stage}
      style={{ "--i": i } as CSSProperties}
    />
  ));
  const dots = data.dots.map(([cx, cy, r, stage], i) => (
    <circle
      key={`d${i}`}
      cx={cx}
      cy={cy}
      r={r1(r * s.ds)}
      data-d=""
      data-stage={stage}
      className={name === "mark" ? "summit" : undefined}
      style={{ "--r": r, "--i": i } as CSSProperties}
    />
  ));

  // Washes: colour under the line, faded in as each motif's outline closes.
  // A fade is a userSpace gradient whose stops read the same tokens, so it
  // follows the colour scheme like everything else.
  const washes = data.washes?.length ? (
    <>
      <defs>
        {data.washes.map((w, i) =>
          w.fade ? (
            <linearGradient
              key={i}
              id={`${name}-wash-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={w.fade.from[0]}
              y1={w.fade.from[1]}
              x2={w.fade.to[0]}
              y2={w.fade.to[1]}
            >
              {w.fade.stops.map(([offset, tone, opacity = 1]) => (
                <stop
                  key={offset}
                  offset={offset}
                  style={{ stopColor: `var(--wash-${tone})`, stopOpacity: opacity }}
                />
              ))}
            </linearGradient>
          ) : null,
        )}
      </defs>
      <g data-washes="">
        {data.washes.map((w, i) => (
          <path
            key={`w${i}`}
            d={w.d}
            data-w=""
            style={
              {
                fill: w.fade ? `url(#${name}-wash-${i})` : `var(--wash-${w.tone})`,
                "--i": w.at,
              } as CSSProperties
            }
          />
        ))}
      </g>
    </>
  ) : null;

  let body: ReactNode;
  if (data.needle) {
    const [ox, oy] = data.needle.origin;
    body = (
      <>
        {paths.slice(0, data.needle.from)}
        <g data-needle="" style={{ transformOrigin: `${ox}px ${oy}px` }}>
          {paths.slice(data.needle.from)}
          {dots}
        </g>
      </>
    );
  } else {
    body = (
      <>
        {washes}
        {paths}
        {dots}
      </>
    );
  }

  const svgProps = {
    className: ["ill", className].filter(Boolean).join(" "),
    "data-ill": name,
    "data-tone": tone,
    viewBox: `0 0 ${data.viewBox[0]} ${data.viewBox[1]}`,
    preserveAspectRatio,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
    ...(label
      ? { role: "img", "aria-label": label }
      : { "aria-hidden": true as const, focusable: "false" as const }),
  };

  if (draw === "view" || draw === "scroll") {
    return (
      <DrawSvg mode={draw} {...svgProps}>
        {body}
      </DrawSvg>
    );
  }

  return (
    <svg {...svgProps} data-draw-mode={draw === "load" ? "load" : undefined}>
      {body}
    </svg>
  );
}
