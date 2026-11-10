// The Contour illustration library: data contracts (DESIGN.md §5).

export type Stage = 1 | 2 | 3;

export type DrawingData = {
  /** Width and height of the drawing's own coordinate box. */
  viewBox: [number, number];
  /** Document order is draw order. `stage` binds a stroke to a step of About's
      scroll sequence. */
  strokes: { d: string; stage?: Stage }[];
  /** [cx, cy, r] or [cx, cy, r, stage]. Dots appear after the lines. */
  dots: ([number, number, number] | [number, number, number, Stage])[];
  /** Compass only: strokes from `from` onward, and every dot, form the needle
      group that settles to north around `origin`. */
  needle?: { from: number; origin: [number, number] };
  /** Home horizon only: flat colour under the lines, painted in order (far to
      near). `tone` names a `--wash-*` token; `at` is the stroke whose drawing
      brings it in; `fade` swaps the flat fill for a linear gradient in
      drawing units, each stop [offset, tone, opacity = 1]. */
  washes?: Wash[];
};

export type Wash = {
  d: string;
  tone: string;
  at: number;
  fade?: {
    from: [number, number];
    to: [number, number];
    stops: [number, string, number?][];
  };
};

export type IllName =
  | "tulip"
  | "pomegranate"
  | "saiga"
  | "melon"
  | "leopard"
  | "apple"
  | "silkworm"
  | "cotton"
  | "mark"
  | "horizon"
  | "sextant"
  | "rivers"
  | "compass";

export type DrawSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "plate"
  | "hero"
  | "mark-24"
  | "mark-32"
  | "mark-96";

export type DrawTone = "ink" | "plate" | "door" | "muted";

/** view: draws on first scroll-in · load: CSS on first paint · scroll: bound to
    About's sticky steps · none: static. */
export type DrawMode = "view" | "load" | "scroll" | "none";
