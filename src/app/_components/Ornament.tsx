import { useId } from "react";

// The ornament library — the review's decorative vocabulary, drawn from the
// region's geometric tradition: girih star-and-cross tilework, ikat lozenges,
// the roof-wheel rosette. See DESIGN.md for what each piece is FOR and the
// rationing rule (ornament marks boundaries and beginnings, nothing else).
//
// Everything here is inline SVG in currentColor, so ornament recolours through
// the same token system as text and costs no image requests. All of it is
// decorative: aria-hidden on every export, no exceptions.
//
// Server-safe on purpose (no "use client"): these render on every public page,
// and shipping a component library to the client to draw static geometry would
// be paying hydration for nothing.

/** Eight-point star built from two overlapping squares (the khatam). */
function Star8({
  cx,
  cy,
  r,
  filled = false,
}: {
  cx: number;
  cy: number;
  r: number;
  filled?: boolean;
}) {
  const common = filled
    ? { fill: "currentColor" }
    : { fill: "none", stroke: "currentColor", strokeWidth: 1 };
  return (
    <>
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} {...common} />
      <rect
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        transform={`rotate(45 ${cx} ${cy})`}
        {...common}
      />
    </>
  );
}

/**
 * Points for an eight-point star polygon (16 vertices, alternating radii).
 * inner ≈ 0.54 × outer reproduces the khatam's proportions — the same star the
 * two overlapping squares make, but as one outline, so a thin stroke keeps
 * crisp points instead of blurring into a ring at pattern scale.
 */
function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * i) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(
      `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

/** Small solid lozenge (rotated square), the system's smallest full stop. */
export function Diamond({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={`inline-block size-[0.5em] shrink-0 ${className ?? ""}`}
    >
      <rect
        x={1.8}
        y={1.8}
        width={6.4}
        height={6.4}
        transform="rotate(45 5 5)"
        fill="currentColor"
      />
    </svg>
  );
}

/** The site device: a roof-wheel rosette — khatam star inside a ring. */
export function Rosette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <circle
        cx={24}
        cy={24}
        r={22}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />
      <Star8 cx={24} cy={24} r={10.5} />
      <circle cx={24} cy={24} r={2.2} fill="currentColor" />
    </svg>
  );
}

/** Girih star-and-cross frieze. Marks a page's top edge or one major boundary. */
export function TileBand({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={`block h-3 w-full ${className ?? ""}`}
      // The band must not distort when the viewport resizes; the pattern is in
      // user units, so it simply repeats further.
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={28}
          height={12}
          // Center the motif row in the 12px band.
          patternTransform="translate(0 0)"
        >
          <Star8 cx={7} cy={6} r={3.6} filled />
          <rect
            x={19.4}
            y={4.4}
            width={3.2}
            height={3.2}
            transform="rotate(45 21 6)"
            fill="currentColor"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** A row of stepped ikat lozenges that fades out at both ends. Divider duty,
    only where a section begins a new thought. */
export function IkatDivider({ className }: { className?: string }) {
  const id = useId();
  // Stepped bars rather than a smooth diamond: the stepping is what reads as
  // ikat (the resist-dye bleed) instead of as a generic argyle.
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, black 18%, black 82%, transparent)",
      }}
    >
      <svg className="block h-2.5 w-full" preserveAspectRatio="none">
        <defs>
          <pattern id={id} patternUnits="userSpaceOnUse" width={22} height={10}>
            <rect x={10} y={0} width={2} height={10} fill="currentColor" opacity={0.35} />
            <rect x={8} y={2} width={6} height={6} fill="currentColor" opacity={0.55} />
            <rect x={6} y={4} width={10} height={2} fill="currentColor" />
            <rect x={20.2} y={4.2} width={1.6} height={1.6} fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

/** The cloth's finished edge. Unlike IkatDivider (a threshold INSIDE the paper,
    faded at both ends), a selvedge runs the full width uninterrupted — it is
    where the weaving stops. Used at the top and bottom of the woven spread;
    `flip` mirrors it so the two edges face their own cloth. */
export function IkatSelvedge({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  const id = useId();
  return (
    <div aria-hidden="true" className={className}>
      <svg
        className={`block h-2 w-full ${flip ? "-scale-y-100" : ""}`}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id={id} patternUnits="userSpaceOnUse" width={18} height={8}>
            <rect width={18} height={1} y={0} fill="currentColor" opacity={0.5} />
            <rect x={2} y={3} width={4} height={4} fill="currentColor" opacity={0.75} />
            <rect x={9} y={4} width={2} height={2} fill="currentColor" />
            <rect x={13} y={3.5} width={3} height={3} fill="currentColor" opacity={0.55} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

/** Star tessellation at low opacity, laid behind a band. Allowed on the
    homepage hero, the paper-page header and the footer — nowhere else. */
export function PatternField({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={56} height={56}>
          <polygon
            points={starPoints(28, 28, 13, 7)}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
          />
          {/* Corner lozenges complete at tile junctions when the pattern
              repeats, forming the cross between stars. */}
          {[
            [0, 0],
            [56, 0],
            [0, 56],
            [56, 56],
          ].map(([x, y]) => (
            <rect
              key={`${x}-${y}`}
              x={x - 5}
              y={y - 5}
              width={10}
              height={10}
              transform={`rotate(45 ${x} ${y})`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** The ʿunwān — the illuminated headpiece a manuscript sets above the opening
    of a work. A filled khatam half-medallion flanked by ikat steps fading to
    hairline terminals. ONE place only: the frontispiece of a paper page —
    "ornament marks beginnings", and a paper's title is the site's most
    important beginning. */
export function Headpiece({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 44"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      className={`block ${className ?? ""}`}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
      }}
    >
      {/* Central medallion: the khatam, halved by the header rule it sits on. */}
      <polygon points={starPoints(160, 22, 17, 9.2)} fill="currentColor" />
      <circle cx={160} cy={22} r={3} fill="var(--color-surface)" />
      {/* Flanking hairlines with ikat steps diminishing outward. */}
      {[1, -1].map((dir) => (
        <g key={dir} transform={dir === -1 ? "translate(320 0) scale(-1 1)" : undefined}>
          <rect x={0} y={21.4} width={130} height={1.2} fill="currentColor" />
          {[112, 96, 82].map((x, i) => (
            <rect
              key={x}
              x={x}
              y={22 - (5 - i * 1.2)}
              width={2.4}
              height={(5 - i * 1.2) * 2}
              fill="currentColor"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** The device at dome scale — the shanyrak as you actually see it: overhead,
    architectural, enormous. Outer and inner rings joined by the uyk spokes,
    the khatam within. For ONE cropped architectural moment (the About
    header) and the 404 endpaper; never body-copy decoration. */
export function RosetteGrand({ className }: { className?: string }) {
  const spokes = Array.from({ length: 32 }, (_, i) => (i * Math.PI) / 16);
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <circle cx={100} cy={100} r={96} fill="none" stroke="currentColor" strokeWidth={1} />
      <circle cx={100} cy={100} r={64} fill="none" stroke="currentColor" strokeWidth={1} />
      {spokes.map((a) => (
        <line
          key={a}
          x1={100 + 64 * Math.cos(a)}
          y1={100 + 64 * Math.sin(a)}
          x2={100 + 96 * Math.cos(a)}
          y2={100 + 96 * Math.sin(a)}
          stroke="currentColor"
          strokeWidth={1}
        />
      ))}
      <polygon
        points={starPoints(100, 100, 40, 21.6)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
      />
      <circle cx={100} cy={100} r={4} fill="currentColor" />
    </svg>
  );
}

/** Illumination corners for ONE framed moment per page. Parent must be
    relative; the brackets sit just inside its edges. */
export function Corners({ className }: { className?: string }) {
  const corner = (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <path
        d="M1 19 L1 6 Q1 1 6 1 L19 1"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <rect
        x={4.4}
        y={4.4}
        width={3.2}
        height={3.2}
        transform="rotate(45 6 6)"
        fill="currentColor"
      />
    </svg>
  );
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    >
      <span className="absolute left-0 top-0">{corner}</span>
      <span className="absolute right-0 top-0 rotate-90">{corner}</span>
      <span className="absolute bottom-0 right-0 rotate-180">{corner}</span>
      <span className="absolute bottom-0 left-0 -rotate-90">{corner}</span>
    </span>
  );
}

/** The woven selvedge across the very top of every page. Fixed colours in both
    modes (night-tile material, like the footer): a textile does not change dye
    when the lights go out. */
export function WovenTrim() {
  const id = useId();
  return (
    <svg aria-hidden="true" className="block h-1.5 w-full" preserveAspectRatio="none">
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={56} height={6}>
          <rect width={56} height={6} fill="#1d4f9c" />
          {(
            [
              [7, "#d7a54e"],
              [21, "#6fc9bd"],
              [35, "#f1e8d7"],
              [49, "#e18f74"],
            ] as const
          ).map(([x, color]) => (
            <rect
              key={x}
              x={x - 1.9}
              y={1.1}
              width={3.8}
              height={3.8}
              transform={`rotate(45 ${x} 3)`}
              fill={color}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Pointed pishtaq-arch frame. ONE arch per site — the homepage hero. The clip
    path is normalized to the box, so any aspect ratio keeps the arch true. */
const ARCH_D =
  "M 0 1 L 0 0.44 C 0 0.30 0.02 0.19 0.09 0.125 C 0.22 0.04 0.40 0.02 0.5 0 C 0.60 0.02 0.78 0.04 0.91 0.125 C 0.98 0.19 1 0.30 1 0.44 L 1 1 Z";
// Same line minus the closing bottom edge, for the keyline overlay.
const ARCH_OUTLINE_D =
  "M 0 1 L 0 0.44 C 0 0.30 0.02 0.19 0.09 0.125 C 0.22 0.04 0.40 0.02 0.5 0 C 0.60 0.02 0.78 0.04 0.91 0.125 C 0.98 0.19 1 0.30 1 0.44 L 1 1";

export function ArchFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Zero-size svg carrying the clip definition. It must stay rendered
          (not display:none) or the url() reference goes dead. */}
      <svg aria-hidden="true" className="absolute size-0">
        <defs>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            <path d={ARCH_D} />
          </clipPath>
        </defs>
      </svg>
      <div className="h-full w-full" style={{ clipPath: `url(#${id})` }}>
        {children}
      </div>
      {/* Gilded keyline drawn just outside the clip so the arch reads as set
          tilework rather than a cut-out. non-scaling-stroke keeps it hairline
          at any size, even with the 1×1 viewBox stretched. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-gild"
      >
        <path
          d={ARCH_OUTLINE_D}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
          // pathLength=1 normalizes the dash space so the ceremony's
          // keyline-draw (globals.css) can animate 1 → 0 regardless of the
          // path's true length. Inert outside .clip-reveal.
          pathLength={1}
          className="arch-keyline"
        />
      </svg>
    </div>
  );
}
