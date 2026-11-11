// The Contour illustration library: data contracts (DESIGN.md §5).

export type Stage = 1 | 2 | 3;

export type DrawingData = {
  /** Width and height of the drawing's own coordinate box. */
  viewBox: [number, number];
  /** Document order is draw order. `stage` binds a stroke to a step of About's
      scroll sequence; `t` places it on the home horizon's scroll timeline;
      `out` marks a horizon patch: a piece of the land that a motif will hide,
      drawn on load and faded at that motif's moment [wide, phone], `place`
      being how far along the ridge it lies (0–1, for its load draw); `move`
      names a scroll motion in globals.css (the flock's flight); `ink` gives a
      line its own colour token (`--ink-water`: the region map's rivers). */
  strokes: {
    d: string;
    stage?: Stage;
    t?: Span;
    out?: [number, number, number];
    move?: string;
    ink?: string;
  }[];
  /** [cx, cy, r] or [cx, cy, r, stage]. Dots appear after the lines. */
  dots: ([number, number, number] | [number, number, number, Stage])[];
  /** Home horizon only: each dot's moment on the scroll timeline, [wide,
      phone], or null for a dot drawn on load. */
  dotsAt?: ([number, number] | null)[];
  /** Compass only: strokes from `from` onward, and every dot, form the needle
      group that settles to north around `origin`. */
  needle?: { from: number; origin: [number, number] };
  /** Home horizon only: flat colour under the lines, painted in order (far to
      near). `tone` names a `--wash-*` token; `at` is the stroke whose drawing
      brings it in; `fade` swaps the flat fill for a linear gradient in
      drawing units, each stop [offset, tone, opacity = 1]. */
  washes?: Wash[];
};

/** A stroke's place on the horizon's scroll timeline, in fractions of the run
    (0 → 1, may overrun): [start, end] on wide screens, then on phones, which
    see only the drawing's middle. Strokes without one draw on load. */
export type Span = [number, number, number, number];

export type Wash = {
  d: string;
  tone: string;
  at: number;
  /** Its moment on the scroll timeline, [wide, phone]. */
  t?: [number, number];
  /** The moment it fades away again, [wide, phone] (the caravan). */
  out?: [number, number];
  /** A named scroll motion in globals.css (the sun's rise). */
  move?: string;
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
  | "region"
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
