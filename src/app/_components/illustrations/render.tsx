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

  // The horizon's scroll timeline: `data-t` plus the moments as variables;
  // globals.css binds them to the scroll where scroll timelines exist.
  const moment = (
    t: [number, number] | null | undefined,
  ): { "data-t"?: ""; style: Record<string, number> } =>
    t ? { "data-t": "", style: { "--t": t[0], "--m": t[1] } } : { style: {} };

  const paths = data.strokes.map((stroke, i) => (
    <path
      key={`s${i}`}
      d={stroke.d}
      pathLength={1}
      data-s=""
      data-stage={stroke.stage}
      data-t={stroke.t ? "" : undefined}
      data-out={stroke.out ? "" : undefined}
      data-move={stroke.move}
      data-ink={stroke.ink}
      style={
        {
          "--i": i,
          ...(stroke.t && {
            "--t0": stroke.t[0],
            "--t1": stroke.t[1],
            "--m0": stroke.t[2],
            "--m1": stroke.t[3],
          }),
          ...(stroke.out && { "--o0": stroke.out[0], "--o1": stroke.out[1], "--f": stroke.out[2] }),
        } as CSSProperties
      }
    />
  ));
  const dots = data.dots.map(([cx, cy, r, stage], i) => {
    const t = moment(data.dotsAt?.[i]);
    return (
      <circle
        key={`d${i}`}
        cx={cx}
        cy={cy}
        r={r1(r * s.ds)}
        data-d=""
        data-stage={stage}
        data-t={t["data-t"]}
        className={name === "mark" ? "summit" : undefined}
        style={{ "--r": r, "--i": i, ...t.style } as CSSProperties}
      />
    );
  });

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
        {data.washes.map((w, i) => {
          const t = moment(w.t);
          return (
            <path
              key={`w${i}`}
              d={w.d}
              data-w=""
              data-tone={w.tone}
              data-t={t["data-t"]}
              data-out={w.out ? "" : undefined}
              data-move={w.move}
              style={
                {
                  fill: w.fade ? `url(#${name}-wash-${i})` : `var(--wash-${w.tone})`,
                  "--i": w.at,
                  ...t.style,
                  ...(w.out && { "--o0": w.out[0], "--o1": w.out[1] }),
                } as CSSProperties
              }
            />
          );
        })}
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
