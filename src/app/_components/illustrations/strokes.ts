import type { DrawSize } from "./types";

/**
 * Size-aware stroke widths (DESIGN.md §5.3), chosen so the rendered line is
 * 1.5–2px at every size; never `vector-effect`. Values are viewBox units for a
 * 400-unit-wide box and are scaled by the drawing's own width / 400, except the
 * `own` sizes, which are already expressed in their drawing's box (the 1200-wide
 * horizon, the 800-wide region map, the 48-wide Mark). `swSm` / `dsSm` apply below 768px.
 */
export const STROKE: Record<
  DrawSize,
  { sw: number; swSm?: number; ds: number; dsSm?: number; own?: boolean }
> = {
  xs: { sw: 9.4, ds: 1.8 },
  sm: { sw: 6.25, ds: 1.4 },
  md: { sw: 4.4, ds: 1.15 },
  lg: { sw: 3.3, ds: 1 },
  xl: { sw: 2.2, ds: 1 },
  plate: { sw: 2.75, swSm: 4.4, ds: 1, dsSm: 1.3 },
  hero: { sw: 1.75, swSm: 2.8, ds: 1, dsSm: 1.6, own: true },
  "mark-24": { sw: 3, ds: 1, own: true },
  "mark-32": { sw: 2.25, ds: 1, own: true },
  "mark-96": { sw: 1, ds: 1, own: true },
};
