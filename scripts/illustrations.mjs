// Builds the Contour illustration library (DESIGN.md §5).
//
//   node scripts/illustrations.mjs            → writes src/app/_components/illustrations/data/*.ts
//   node scripts/illustrations.mjs --preview out.html   → also writes a contact sheet
//
// Each drawing is authored here as construction paths (absolute M / C / L / Z
// only, in its own viewBox). The build gives every stroke a deterministic hand
// wobble (§5.1: long cubics split into 2–3 pieces, interior nodes nudged by up
// to `amp` units, closed shapes left slightly open), then re-centres and scales
// the drawing in its box. The output is plain path data: no transforms, no
// runtime cost, and the same file every time it runs.
//
// For a drawing made in a vector editor instead, use scripts/illustration-prep.mjs.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "src/app/_components/illustrations/data");

// ---------- path toolkit ----------
const f = (n) => (Math.round(n * 10) / 10).toString();
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const line = (a, b) => [a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b];
const rad = (deg) => (deg * Math.PI) / 180;

function parse(d, map = (p) => p) {
  const toks = d.match(/[MCLZ]|-?\d*\.?\d+/g);
  const subs = [];
  let cur = null;
  let pt = null;
  let i = 0;
  let cmd = null;
  const num = () => parseFloat(toks[i++]);
  const pt2 = () => map([num(), num()]);
  while (i < toks.length) {
    if (/[MCLZ]/.test(toks[i])) cmd = toks[i++];
    if (cmd === "M") {
      pt = pt2();
      cur = { start: pt, segs: [], closed: false };
      subs.push(cur);
      cmd = "L";
      continue;
    }
    if (cmd === "C") {
      const p1 = pt2();
      const p2 = pt2();
      const p3 = pt2();
      cur.segs.push([pt, p1, p2, p3]);
      pt = p3;
    } else if (cmd === "L") {
      const p3 = pt2();
      cur.segs.push(line(pt, p3));
      pt = p3;
    } else if (cmd === "Z") {
      if (dist(pt, cur.start) > 0.5) cur.segs.push(line(pt, cur.start));
      cur.closed = true;
      pt = cur.start;
      cmd = null;
    }
  }
  return subs;
}

function serialize(subs) {
  let out = "";
  for (const s of subs) {
    out += `M${f(s.start[0])} ${f(s.start[1])}`;
    for (const [, p1, p2, p3] of s.segs)
      out += `C${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])} ${f(p3[0])} ${f(p3[1])}`;
    if (s.closed) out += "Z";
  }
  return out;
}

function split([p0, p1, p2, p3], t) {
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const m = lerp(d, e, t);
  return [
    [p0, a, d, m],
    [m, e, c, p3],
  ];
}

function bez([p0, p1, p2, p3], t) {
  const u = 1 - t;
  const pt = [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
  const tan = [
    3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
  const len = Math.hypot(tan[0], tan[1]) || 1;
  return { pt, tan: [tan[0] / len, tan[1] / len] };
}

function mulberry(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

/** Hand wobble (§5.1). */
function wobble(d, { amp = 1.5, seed = "x", minLen = 36, step = 90, map } = {}) {
  const rnd = mulberry(hash(seed));
  const subs = parse(d, map);
  for (const s of subs) {
    const segs = [];
    for (const seg of s.segs) {
      const len = dist(seg[0], seg[3]) + 0.5 * (dist(seg[0], seg[1]) + dist(seg[2], seg[3]));
      const n = amp > 0 && len > minLen ? Math.min(3, Math.max(2, Math.round(len / step))) : 1;
      let rest = seg;
      const pieces = [];
      for (let k = n; k > 1; k--) {
        const [l, r] = split(rest, 1 / k);
        pieces.push(l);
        rest = r;
      }
      pieces.push(rest);
      for (let k = 0; k < pieces.length - 1; k++) {
        const ang = rnd() * Math.PI * 2;
        const mag = amp * (0.45 + 0.55 * rnd());
        const v = [Math.cos(ang) * mag, Math.sin(ang) * mag];
        const L = pieces[k];
        const R = pieces[k + 1];
        L[2] = [L[2][0] + v[0], L[2][1] + v[1]];
        L[3] = [L[3][0] + v[0], L[3][1] + v[1]];
        R[0] = L[3];
        R[1] = [R[1][0] + v[0], R[1][1] + v[1]];
      }
      segs.push(...pieces);
    }
    if (s.closed && amp > 0 && segs.length) {
      // the terminal stays slightly open: stop a couple of units short
      const last = segs[segs.length - 1];
      const back = lerp(last[3], last[2], 0.08);
      last[3] = [back[0] + amp * 0.6, back[1] - amp * 0.4];
      s.closed = false;
    }
    s.segs = segs;
  }
  return serialize(subs);
}

// ---------- construction helpers ----------

/** Elliptical arc as cubics (≤ 90° each). Angles in degrees, screen space (clockwise). */
function arc(cx, cy, rx, ry, a0, a1, rot = 0) {
  const phi = rad(rot);
  const E = (t) => [
    cx + rx * Math.cos(t) * Math.cos(phi) - ry * Math.sin(t) * Math.sin(phi),
    cy + rx * Math.cos(t) * Math.sin(phi) + ry * Math.sin(t) * Math.cos(phi),
  ];
  const D = (t) => [
    -rx * Math.sin(t) * Math.cos(phi) - ry * Math.cos(t) * Math.sin(phi),
    -rx * Math.sin(t) * Math.sin(phi) + ry * Math.cos(t) * Math.cos(phi),
  ];
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
  const step = (a1 - a0) / n;
  let out = "";
  for (let i = 0; i < n; i++) {
    const t1 = rad(a0 + i * step);
    const t2 = rad(a0 + (i + 1) * step);
    const al = (4 / 3) * Math.tan((t2 - t1) / 4);
    const p0 = E(t1);
    const p3 = E(t2);
    const d1 = D(t1);
    const d2 = D(t2);
    if (i === 0) out += `M${f(p0[0])} ${f(p0[1])}`;
    out += ` C${f(p0[0] + al * d1[0])} ${f(p0[1] + al * d1[1])} ${f(p3[0] - al * d2[0])} ${f(p3[1] - al * d2[1])} ${f(p3[0])} ${f(p3[1])}`;
  }
  return out;
}

/** Full ellipse, closed. */
const ellipse = (cx, cy, rx, ry, rot = 0, start = 0) => `${arc(cx, cy, rx, ry, start, start + 360, rot)} Z`;

/** Radial ticks on a circle: one path of short segments. */
function radialTicks(cx, cy, r0, r1, angles) {
  return angles
    .map((a) => {
      const c = Math.cos(rad(a));
      const s = Math.sin(rad(a));
      return `M${f(cx + r0 * c)} ${f(cy + r0 * s)} L${f(cx + r1 * c)} ${f(cy + r1 * s)}`;
    })
    .join(" ");
}

/** Ticks across (or beside) a construction cubic, as one path. */
function ticksAlong(seg, ts, len, { side = 0, lean = 0 } = {}) {
  return ts
    .map((t) => {
      const { pt, tan } = bez(seg, t);
      const nx = -tan[1];
      const ny = tan[0];
      // lean tilts the tick toward the curve's direction (feathered antennae)
      const dx = nx + tan[0] * lean;
      const dy = ny + tan[1] * lean;
      const k = Math.hypot(dx, dy);
      const ux = dx / k;
      const uy = dy / k;
      const a = side === 0 ? -len / 2 : 0;
      const b = side === 0 ? len / 2 : side * len;
      return `M${f(pt[0] + ux * a)} ${f(pt[1] + uy * a)} L${f(pt[0] + ux * b)} ${f(pt[1] + uy * b)}`;
    })
    .join(" ");
}

/** Apply a point map to construction path data (rotation, mirroring, placement). */
const xform = (d, fn) => serialize(parse(d, fn));
const mirrorX = (d, ax) => xform(d, ([x, y]) => [2 * ax - x, y]);
function place(cx, cy, rotDeg = 0) {
  const c = Math.cos(rad(rotDeg));
  const s = Math.sin(rad(rotDeg));
  return ([x, y]) => [cx + x * c - y * s, cy + x * s + y * c];
}
const segOf = (d) => parse(d)[0].segs[0];

// ---------- occlusion (the home horizon) ----------
// Lines are fill-none, so a nearer shape cannot hide a farther line by paint.
// Instead the farther line is cut where it passes behind: every cubic is
// sampled, the hidden stretches found (inside a closed silhouette, or within
// `pad` of an open one), and the visible stretches kept as exact sub-cubics.

/** Polyline of a construction path (all its subpaths, joined). */
function polyOf(d, n = 24) {
  const pts = [];
  for (const s of parse(d)) for (const seg of s.segs) for (let i = 0; i <= n; i++) pts.push(bez(seg, i / n).pt);
  return pts;
}
/** Each subpath as its own polyline. */
const polysOf = (d, n = 24) =>
  parse(d).map((s) => s.segs.flatMap((seg) => Array.from({ length: n + 1 }, (_, i) => bez(seg, i / n).pt)));

function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function segDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
/** An occluder: a closed silhouette (`fill`) and/or lines kept clear by `pad`. */
const solid = (poly, pad = 5) => ({ poly, closed: true, pad });
const wire = (poly, pad = 5) => ({ poly, closed: false, pad });
function hidden(p, occs) {
  for (const o of occs) {
    if (o.closed && inPoly(p, o.poly)) return true;
    const P = o.poly;
    const last = o.closed ? P.length : P.length - 1;
    for (let i = 0; i < last; i++) if (segDist(p, P[i], P[(i + 1) % P.length]) < o.pad) return true;
  }
  return false;
}
function subCubic(seg, t0, t1) {
  const right = t0 > 0 ? split(seg, t0)[1] : seg;
  return t1 < 1 ? split(right, (t1 - t0) / (1 - t0))[0] : right;
}
function occlude(d, occs, minRun = 3) {
  return keepWhere(d, (p) => hidden(p, occs), minRun);
}
/** The stretches of `d` where `isHidden` is false, as exact sub-cubics. */
function keepWhere(d, isHidden, minRun = 3) {
  const N = 72;
  const out = [];
  for (const s of parse(d)) {
    let run = null;
    for (const seg of s.segs) {
      const hid = (t) => isHidden(bez(seg, t).pt);
      const edges = [];
      let prev = hid(0);
      for (let i = 1; i <= N; i++) {
        const v = hid(i / N);
        if (v !== prev) {
          let lo = (i - 1) / N;
          let hi = i / N;
          for (let k = 0; k < 12; k++) {
            const mid = (lo + hi) / 2;
            if (hid(mid) === prev) lo = mid;
            else hi = mid;
          }
          edges.push((lo + hi) / 2);
        }
        prev = v;
      }
      const ts = [0, ...edges, 1];
      let vis = !hid(0);
      for (let k = 0; k < ts.length - 1; k++, vis = !vis) {
        if (!vis || ts[k + 1] - ts[k] < 1e-4) {
          if (!vis) run = null;
          continue;
        }
        const piece = subCubic(seg, ts[k], ts[k + 1]);
        if (run && ts[k] === 0) run.segs.push(piece);
        else {
          run = { start: piece[0], segs: [piece], closed: false };
          out.push(run);
        }
      }
      if (prev) run = null;
    }
  }
  // drop crumbs a pen would never leave
  return serialize(out.filter((r) => r.segs.reduce((n, g) => n + dist(g[0], g[3]), 0) > minRun));
}

/** Catmull-Rom through points → one smooth cubic path. */
function smooth(pts) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Local figure coordinates (ground at y = 0, facing left) → the scene. */
const at = (x, y, s = 1, flip = false) => ([lx, ly]) => [x + (flip ? -lx : lx) * s, y + ly * s];

/** A closed polygon as a path: the shape of a wash. */
const ring = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")} Z`;
/** Height at x along a polyline that runs left to right. */
const yAt = (pts) => (x) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
  }
  return pts[x < pts[0][0] ? 0 : pts.length - 1][1];
};

// ---------- the region map (About → Coverage) ----------
// The five states, their shared borders, the Caspian and Aral seas, Balkhash
// and Issyk-Kul, the Amu Darya, Syr Darya and their neighbours, and the five
// capitals as dots. The geography is Natural Earth's (1:50m, public domain),
// projected and simplified by scripts/region-map.mjs into region-map.json;
// here it is only smoothed and handed the same pen as everything else. Each
// state carries a pale wash of its own, which the list beside the map uses as
// its legend (and hovering a name lifts that state's wash).
function regionMap() {
  const M = JSON.parse(readFileSync(join(root, "scripts/region-map.json"), "utf8"));
  // borders keep their straight runs (the desert lines are ruled); water is
  // drawn smooth, in the water ink, so a river never reads as a border
  const ruled = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")}`;
  const closed = (pts) => `${smooth([...pts, pts[0]])} Z`;
  const strokes = [];
  const add = (d, amp, ink) => strokes.push({ d, amp, ...(ink ? { ink } : {}) });
  // the outline, then the borders inside it, then the water
  M.outer.forEach((c) => add(ruled(c), 0.5));
  M.inner.forEach((c) => add(ruled(c), 0.5));
  M.farShore.forEach((c) => add(ruled(c), 0.5));
  const borders = strokes.length - 1;
  M.lakes.forEach((l) => add(closed(l.ring), 0.4, "water"));
  add(M.rivers.map((c) => smooth(c)).join(" "), 0.4, "water");
  return {
    vb: M.vb,
    strokes,
    dots: M.capitals.map(([x, y]) => [x, y, 2.4]),
    washes: [
      ...M.states.map((st) => ({ d: ring(st.ring), tone: st.code, at: borders })),
      { d: ring(M.caspian), tone: "water", at: borders },
      ...M.lakes.map((l, i) => ({ d: ring(l.ring), tone: "water", at: borders + 1 + i })),
    ],
  };
}
const REGION = regionMap();

// ---------- the library (§5.4) ----------
// Each entry: viewBox, wobble amp (and step for very large boxes), shift/scale
// to re-centre the composition with the §5.2 margin, strokes in draw order,
// dots [cx, cy, r]. A stroke may carry a stage (About's tulip).

const melonAt = place(192, 330, -24);
const melonLocal = (d) => xform(d, melonAt);
const MELON_RX = 136;
const MELON_RY = 80;

const sextantC = [357, 460];
const sextantA0 = 187.67;
const sextantA1 = 266.76;

const saigaHorn = "M234 172 C 238 140 258 112 262 84 C 264 66 258 52 248 44";
const saigaHornSegs = parse(saigaHorn)[0].segs;

const silkAntenna = "M196 152 C 188 134 176 120 160 112";

// ---------- the home horizon ----------
// The region read left to right as time: the steppe camp (yurts, smoke,
// horses) under the Tian Shan, then a madrasa of the Silk Road cities, then
// wind turbines and a new city, and a fast train along the front. Owner's
// direction of 2026-11-10 (the motifs) and 2026-11-11 (the madrasa, and the
// scroll drawing it in order "like an evolutionary timeline"). Every era
// appears in the middle 700 units, which is all a phone shows (xMidYMid
// slice, 160px tall). Nothing is a specific landmark: the madrasa is the
// Timurid type, not one building, and no tower, dome or flag belongs to one
// state.

const HZ_RIDGE =
  "M48 200 C 110 192 160 172 198 152 C 224 138 242 122 262 106 C 276 116 290 128 306 132 C 326 116 346 84 368 58 C 388 82 404 108 426 122 C 446 112 460 100 476 92 C 494 104 512 120 534 128 C 562 116 588 92 612 68 C 628 54 640 44 652 36 C 668 56 690 86 716 106 C 736 98 752 88 768 82 C 790 100 812 118 838 126 C 866 110 890 90 914 74 C 934 92 958 116 986 132 C 1034 158 1092 178 1156 188";
const HZ_SNOW = [
  "M352 80 L 358 86 L 363 81 L 369 90 L 375 83 L 380 87 L 386 82",
  "M634 60 L 640 67 L 645 62 L 652 72 L 658 64 L 664 69 L 671 61",
  "M900 90 L 906 96 L 911 92 L 917 100 L 923 93 L 928 97 L 934 92",
];

// The steppe line everything stands on; g(x) is its height at x.
const HZ_GROUND = smooth([
  [36, 236],
  [170, 232],
  [310, 236],
  [450, 232],
  [590, 235],
  [730, 231],
  [870, 234],
  [1010, 231],
  [1166, 236],
]);
const hzGroundPts = polyOf(HZ_GROUND, 40);
const g = yAt(hzGroundPts);
const hzRidgePts = polyOf(HZ_RIDGE, 10);
const hzGroundCoarse = polyOf(HZ_GROUND, 6); // for washes: fewer points, same line

/** A yurt on the steppe: felt walls, the domed roof up to the crown, the
    wall-roof belt, the door; `ribs` adds two roof poles, `smoke` a wisp. */
function yurt(cx, w, { ribs = false, smoke = false } = {}) {
  const b = g(cx);
  const hw = w / 2;
  const wt = b - w * 0.24; // wall top
  const cy = wt - w * 0.2; // crown rim
  const cw = w * 0.11;
  const sag = w * 0.035;
  const roof =
    ` C ${cx - hw + w * 0.08} ${wt - w * 0.11} ${cx - cw - w * 0.12} ${cy + w * 0.03} ${cx - cw} ${cy}` +
    ` C ${cx - cw * 0.6} ${cy - w * 0.05} ${cx + cw * 0.6} ${cy - w * 0.05} ${cx + cw} ${cy}` +
    ` C ${cx + cw + w * 0.12} ${cy + w * 0.03} ${cx + hw - w * 0.08} ${wt - w * 0.11} ${cx + hw} ${wt}`;
  const outline = `M${cx - hw * 0.97} ${b} L ${cx - hw} ${wt}${roof} L ${cx + hw * 0.97} ${b}`;
  const belt = `M${cx - hw} ${wt} C ${cx - hw * 0.4} ${wt + sag} ${cx + hw * 0.4} ${wt + sag} ${cx + hw} ${wt}`;
  const dw = w * 0.075;
  const door = `M${cx - dw} ${b} L ${cx - dw} ${b - w * 0.13} L ${cx + dw} ${b - w * 0.13} L ${cx + dw} ${b}`;
  const beltPts = polyOf(belt, 10);
  // white felt walls, a sun-warmed roof, a painted door
  const washes = [
    { d: ring([[cx - hw * 0.97, b], ...beltPts, [cx + hw * 0.97, b]]), tone: "felt" },
    { d: ring([...polyOf(`M${cx - hw} ${wt}${roof}`, 8), ...[...beltPts].reverse()]), tone: "roof" },
    { d: `${door} Z`, tone: "door" },
  ];
  const strokes = [outline, belt, door];
  if (ribs)
    strokes.push(
      `M${cx - cw * 0.7} ${cy + 1.5} C ${cx - w * 0.16} ${cy + w * 0.08} ${cx - w * 0.22} ${wt - w * 0.03} ${cx - w * 0.26} ${wt + sag * 0.85}` +
        ` M${cx + cw * 0.7} ${cy + 1.5} C ${cx + w * 0.16} ${cy + w * 0.08} ${cx + w * 0.22} ${wt - w * 0.03} ${cx + w * 0.26} ${wt + sag * 0.85}`,
    );
  if (smoke) {
    const y0 = cy - w * 0.06;
    strokes.push(`M${cx} ${y0} C ${cx - 5} ${y0 - 9} ${cx + 6} ${y0 - 15} ${cx + 3} ${y0 - 24} C ${cx} ${y0 - 32} ${cx + 9} ${y0 - 38} ${cx + 16} ${y0 - 42}`);
  }
  return { strokes, washes, occ: [solid(polyOf(outline), 5), ...(smoke ? [wire(polyOf(strokes.at(-1)), 5)] : [])] };
}

// Horses in profile, facing left, ground at y = 0, about 110 long.
const HORSE_STAND = {
  strokes: [
    // face, ear, crest, back, rump, the far hind leg
    "M8 -62 C 12 -68 16 -76 20 -82 L 23 -92 L 28 -84 C 37 -80 46 -68 55 -63 C 66 -58 80 -58 92 -61 C 100 -63 106 -57 105 -48 C 104 -38 98 -32 97 -22 L 96 0",
    // muzzle, jaw, throat, neck, chest, the near foreleg
    "M8 -62 C 5 -58 8 -54 13 -55 C 19 -56 24 -60 29 -66 C 32 -58 34 -50 36 -44 C 38 -40 38 -36 37 -31 L 36 -14 L 37 0",
    // belly, the far foreleg, the near hind leg
    "M37 -31 C 50 -27 70 -28 84 -33 M46 -29 L 45 -14 L 47 0 M84 -33 C 88 -24 89 -18 86 -12 L 85 0",
    // tail
    "M102 -59 C 111 -54 113 -42 110 -26 M104 -56 C 110 -48 108 -36 112 -27",
  ],
  hull: [[8, -62], [20, -82], [24, -93], [28, -84], [55, -63], [92, -61], [105, -48], [112, -27], [96, 0], [85, 0], [84, -33], [47, 0], [36, 0], [36, -44], [29, -66], [13, -55]],
  // the coat's wash: head, neck and barrel; the legs stay line
  coat: [[8, -62], [14, -72], [20, -82], [23, -90], [28, -84], [40, -76], [55, -63], [70, -60], [92, -61], [102, -57], [105, -48], [101, -36], [97, -24], [88, -24], [84, -33], [70, -29], [50, -28], [37, -31], [37, -40], [34, -50], [29, -66], [19, -56], [10, -55]],
};
const HORSE_GRAZE = {
  strokes: [
    // muzzle in the grass, face, ear, crest, back, rump, the far hind leg
    "M6 -3 C 7 -12 10 -22 14 -30 L 12 -39 L 20 -33 C 28 -46 40 -60 55 -63 C 66 -58 80 -58 92 -61 C 100 -63 106 -57 105 -48 C 104 -38 98 -32 97 -22 L 96 0",
    // chin, jaw, throat, neck, chest, the near foreleg
    "M6 -3 C 8 -1 12 -1 15 -3 C 18 -8 20 -14 22 -18 C 28 -26 33 -36 37 -40 C 38 -36 38 -34 37 -31 L 36 -14 L 37 0",
    "M37 -31 C 50 -27 70 -28 84 -33 M46 -29 L 45 -14 L 47 0 M84 -33 C 88 -24 89 -18 86 -12 L 85 0",
    "M102 -59 C 111 -54 113 -42 110 -26 M104 -56 C 110 -48 108 -36 112 -27",
  ],
  hull: [[6, -3], [14, -30], [12, -39], [20, -33], [55, -63], [92, -61], [105, -48], [112, -27], [96, 0], [85, 0], [84, -33], [47, 0], [36, 0], [37, -40], [22, -18], [15, -3]],
  coat: [[6, -3], [8, -14], [12, -24], [14, -30], [13, -37], [20, -33], [30, -48], [42, -58], [55, -63], [70, -60], [92, -61], [102, -57], [105, -48], [101, -36], [97, -24], [88, -24], [84, -33], [70, -29], [50, -28], [37, -31], [37, -38], [30, -30], [22, -18], [17, -8], [12, -2]],
};
function horse(kind, x, s, flip = false, coat = "bay") {
  const m = at(x, g(x), s, flip);
  return {
    strokes: kind.strokes.map((d) => xform(d, m)),
    washes: [{ d: ring(kind.coat.map(m)), tone: coat }],
    occ: [solid(kind.hull.map(m), 4)],
  };
}

/** A madrasa in the Timurid manner: the portal (pishtaq) with its pointed
    iwan and a door, the frieze across it, two low wings of arched cells, a
    minaret at each corner, and a ribbed melon dome on its drum behind the
    portal. Built in local units (ground at 0, up negative), scaled by `s`. */
function madrasa(cx, s) {
  const m = at(cx, g(cx), s);
  const L = (d) => xform(d, m);
  // a pointed arch on two jambs, from the ground up to `apex`
  const arch = (x, hw, spring, apex) => {
    const [y1, y2] = [spring + (apex - spring) * 0.45, spring + (apex - spring) * 0.75];
    return (
      `M${x - hw} 0 L ${x - hw} ${spring} C ${x - hw} ${y1} ${x - hw * 0.45} ${y2} ${x} ${apex}` +
      ` C ${x + hw * 0.45} ${y2} ${x + hw} ${y1} ${x + hw} ${spring} L ${x + hw} 0`
    );
  };
  const minaret = (x) =>
    `M${x - 4.5} 0 L ${x - 3.5} -104 L ${x - 5} -104 L ${x - 5} -110 L ${x - 3.5} -110 C ${x - 3.5} -114 ${x - 1.5} -117 ${x} -119` +
    ` C ${x + 1.5} -117 ${x + 3.5} -114 ${x + 3.5} -110 L ${x + 5} -110 L ${x + 5} -104 L ${x + 3.5} -104 L ${x + 4.5} 0`;
  const portal = "M-22 0 L -22 -100 L 22 -100 L 22 0";
  const iwan = arch(0, 13, -54, -84);
  const door = arch(0, 5, -16, -25);
  const frieze = "M-22 -91 L 22 -91";
  const cells = [-41, -30, 30, 41].map((x) => arch(x, 4, -24, -33));
  const wings = ["M-22 -54 L -49 -54", "M22 -54 L 49 -54", ...cells].join(" ");
  const dome =
    "M-15 -100 L -15 -108 C -23 -112 -25 -129 -14 -138 C -8 -143 -3 -144 0 -148" +
    " C 3 -144 8 -143 14 -138 C 25 -129 23 -112 15 -108 L 15 -100";
  const ribs = "M-15 -108 L 15 -108 M-7 -108 C -12 -121 -9 -136 0 -148 M7 -108 C 12 -121 9 -136 0 -148 M0 -148 L 0 -156";
  const [minL, minR] = [minaret(-53.5), minaret(53.5)];
  const facade = [[-49, 0], [-49, -54], [-22, -54], [-22, -100], [22, -100], [22, -54], [49, -54], [49, 0]].map(m);
  // warm brick, blue tile in the iwan and the cells, the turquoise dome
  const washes = [
    { d: ring(polyOf(L(dome), 8)), tone: "dome" },
    { d: ring(facade), tone: "brick" },
    ...[minL, minR].map((d) => ({ d: ring(polyOf(L(d), 4)), tone: "brick" })),
    { d: ring(polyOf(L(iwan), 8)), tone: "tile" },
    ...cells.map((d) => ({ d: ring(polyOf(L(d), 6)), tone: "tile" })),
  ];
  return {
    strokes: [portal, `${iwan} ${door}`, frieze, wings, minL, minR, dome, ribs].map(L),
    washes,
    occ: [solid(facade, 4), solid(polyOf(L(dome), 12), 4), ...[minL, minR].map((d) => solid(polyOf(L(d), 6), 4))],
  };
}

/** A wind turbine: the tower, three swept blades, the hub as a dot. `turn` is
    the first blade's angle from vertical, clockwise. */
function turbine(x, H, L, turn) {
  const b = g(x);
  const hub = [x, b - H];
  const tower = `M${x} ${b} L ${x} ${hub[1] + 3}`;
  const blades = [0, 1, 2]
    .map((k) => {
      const a = rad(turn + k * 120);
      const u = [Math.sin(a), -Math.cos(a)];
      const n = [-u[1], u[0]];
      const P = (t, o) => [hub[0] + u[0] * L * t + n[0] * L * o, hub[1] + u[1] * L * t + n[1] * L * o];
      const [c1, c2, tip] = [P(0.35, 0.07), P(0.72, 0.05), P(1, 0)];
      return `M${f(hub[0])} ${f(hub[1])} C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(tip[0])} ${f(tip[1])}`;
    })
    .join(" ");
  return {
    strokes: [tower, blades],
    dot: [hub[0], +f(hub[1]), 2.6],
    occ: [wire(polyOf(tower), 5), ...polysOf(blades).map((p) => wire(p, 5))],
  };
}

/** One building standing on the steppe, as a closed outline plus an optional
    edge line that turns the face into a volume. `tone` is its wash; a dome
    also carries `cap`, the dome's own colour. */
function tower(x0, x1, top, kind, { edge = 0, tone = "glass", cap } = {}) {
  const b0 = g(x0);
  const b1 = g(x1);
  const w = x1 - x0;
  const cx = (x0 + x1) / 2;
  let crown;
  if (kind === "slant") crown = `L ${x0} ${top + w * 0.5} L ${x1} ${top}`;
  else if (kind === "slant-l") crown = `L ${x0} ${top} L ${x1} ${top + w * 0.5}`;
  else if (kind === "spire")
    crown = `L ${x0} ${top} L ${cx - w * 0.18} ${top - 12} L ${cx} ${top - 34} L ${cx + w * 0.18} ${top - 12} L ${x1} ${top}`;
  else if (kind === "round") crown = `L ${x0} ${top + w / 2} ${arc(cx, top + w / 2, w / 2, w / 2, 180, 360).replace(/^M[^C]*/, "")}`;
  else if (kind === "sail") crown = `L ${x0} ${top} C ${x0 + w * 0.7} ${top + 2} ${x1} ${top + w * 0.7} ${x1} ${top + w * 1.6}`;
  else if (kind === "dome")
    crown = `L ${x0} ${top} L ${x0 + w * 0.08} ${top} ${arc(cx, top, w * 0.42, w * 0.5, 180, 360).replace(/^M[^C]*/, "")} L ${x1} ${top}`;
  else crown = `L ${x0} ${top} L ${x1} ${top}`;
  const outline = `M${x0} ${b0} ${crown} L ${x1} ${b1}`;
  const extra = [];
  if (edge) {
    const ex = x0 + w * edge;
    const ey = kind === "slant" ? top + w * 0.5 * (1 - edge) : kind === "slant-l" ? top + w * 0.5 * edge : kind === "round" ? top + w / 2 - Math.sqrt(Math.max(0, (w / 2) ** 2 - (ex - cx) ** 2)) : top;
    extra.push(`M${f(ex)} ${f(ey + 6)} L ${f(ex)} ${f(g(ex))}`);
  }
  if (kind === "dome") extra.push(`M${cx} ${top - w * 0.5} L ${cx} ${top - w * 0.5 - 9}`);
  if (kind === "mast") extra.push(`M${cx} ${top} L ${cx} ${top - 16}`);
  const poly = polyOf(outline, 16);
  const washes = [{ d: ring(polyOf(outline, 6)), tone }];
  if (kind === "dome" && cap) washes.push({ d: `${arc(cx, top, w * 0.42, w * 0.5, 180, 360)} Z`, tone: cap });
  return { outline, extra, poly, washes };
}

/** The new city, nearest first: each building hides what stands behind it.
    Glass in three blues (the far ones paler, in haze) and warm stone. The
    turquoise dome now belongs to the madrasa, an era earlier. */
function city() {
  const front = [
    tower(828, 856, 198, "flat", { tone: "stone" }),
    tower(902, 928, 112, "round", { edge: 0.68, tone: "glass" }),
    tower(938, 984, 176, "flat", { edge: 0.36, tone: "stone" }),
    tower(1004, 1028, 142, "mast", { tone: "glass-2" }),
    tower(1056, 1098, 188, "flat", { tone: "glass" }),
    tower(1098, 1146, 208, "flat", { tone: "stone" }),
  ];
  const back = [
    tower(848, 878, 112, "slant", { edge: 0.34, tone: "glass-far" }),
    tower(880, 906, 92, "spire", { edge: 0.28, tone: "glass-far" }),
    tower(982, 1012, 100, "sail", { edge: 0.3, tone: "glass-far" }),
    tower(1030, 1058, 124, "slant-l", { edge: 0.62, tone: "glass-far" }),
  ];
  const frontOcc = front.map((t) => solid(t.poly, 4));
  // left to right, so the city rises in the order the eye reads it
  const all = [...front.map((t) => ({ t, near: true })), ...back.map((t) => ({ t, near: false }))].sort(
    (p, q) => p.t.poly[0][0] - q.t.poly[0][0],
  );
  const parts = all.map(({ t, near }) => {
    const d = [t.outline, ...t.extra].join(" ");
    return { d: near ? d : occlude(d, frontOcc), near, washes: t.washes, occ: [solid(t.poly, 5)] };
  });
  return { parts, occ: [...front, ...back].map((t) => solid(t.poly, 5)) };
}

/** A Bactrian camel walking right on the road, local units (ground at 0, up
    negative, about 70 long and 51 tall): the back over two humps, the neck
    dipping and rising to the head, the underside and four legs mid-stride,
    and a pack over the saddle between the humps. */
const CAMEL = {
  strokes: [
    // tail, rump, rear hump, saddle, front hump, withers, neck, head, muzzle,
    // chin, throat, down to the chest
    "M-29 -29 C -29 -34 -28 -38 -26 -41 C -25 -50 -20 -58 -15 -58 C -10 -58 -8 -52 -6 -49 C -4 -54 0 -59 4 -59 C 9 -59 11 -52 13 -47 C 18 -44 22 -46 25 -51 C 27 -55 29 -58 32 -58 C 35 -58 38 -56 40 -54 C 41 -52 40 -51 38 -51 C 35 -51 32 -51 30 -49 C 27 -44 24 -38 18 -35",
    // chest and the near foreleg, the far foreleg, belly, the hind legs, haunch
    "M18 -35 C 16 -33 15 -32 14 -31 L 15 -15 L 17 0 M12 -31 L 11 -15 L 8 0 M12 -31 C 2 -28 -10 -28 -18 -31 L -15 -15 L -12 0 M-20 -31 L -22 -15 L -25 0 M-20 -31 C -23 -33 -25 -37 -26 -41",
    // the pack over the saddle
    "M-11 -51 L -12 -39 L 1 -39 L 0 -53",
  ],
  coat: [[-29, -29], [-27, -38], [-25, -48], [-20, -56], [-15, -58], [-10, -57], [-6, -49], [-2, -56], [4, -59], [9, -58], [12, -50], [16, -45], [22, -46], [27, -55], [32, -58], [38, -56], [40, -53], [36, -51], [30, -49], [26, -41], [18, -35], [14, -31], [2, -28], [-10, -28], [-18, -31], [-22, -32], [-26, -38]],
  pack: [[-11, -51], [-12, -39], [1, -39], [0, -53], [-3, -50], [-6, -49], [-8, -51]],
};
/** A caravan walking the road the train will take: camels nose to tail, each
    one's nose rope tied to the saddle of the one ahead. */
function caravan(xs, s) {
  return xs.map((x, i) => {
    const m = at(x, HZ_RAIL, s);
    const strokes = CAMEL.strokes.map((d) => xform(d, m));
    const next = xs[i + 1];
    if (next !== undefined) {
      const [a, b] = [m([40, -52]), at(next, HZ_RAIL, s)([-11.5, -45])];
      const sag = 6 * s;
      strokes.push(
        `M${f(a[0])} ${f(a[1])} C ${f(a[0] + (b[0] - a[0]) * 0.3)} ${f(a[1] + sag + 4)} ${f(a[0] + (b[0] - a[0]) * 0.7)} ${f(b[1] + sag)} ${f(b[0])} ${f(b[1])}`,
      );
    }
    return {
      strokes,
      washes: [
        { d: ring(CAMEL.coat.map(m)), tone: "camel" },
        { d: ring(CAMEL.pack.map(m)), tone: i % 2 ? "tile" : "door" },
      ],
    };
  });
}

/** The train on its rail, nose to the right: body, window strips per car,
    car joints, the windscreen, a pantograph; its wheels are dots. */
const HZ_RAIL = 294;
function train(x0, x1, cars = 3) {
  const tb = HZ_RAIL - 6;
  const tr = HZ_RAIL - 36;
  // a trainset: the long nose leads, a short one closes the rear
  const body =
    `M${x0 + 6} ${tb} C ${x0 + 1} ${tb} ${x0 - 1} ${tb - 3} ${x0} ${tb - 6} C ${x0 + 6} ${tr + 10} ${x0 + 22} ${tr} ${x0 + 46} ${tr}` +
    ` L ${x1 - 92} ${tr} C ${x1 - 46} ${tr} ${x1 - 12} ${tr + 12} ${x1} ${tb - 5}` +
    ` C ${x1 + 1} ${tb - 1} ${x1 - 3} ${tb} ${x1 - 9} ${tb} Z`;
  const carLen = (x1 - x0) / cars;
  const joints = Array.from({ length: cars - 1 }, (_, i) => x0 + carLen * (i + 1));
  const win = [x0, ...joints]
    .map((a, i) => {
      const s = i === 0 ? a + 34 : a + 10;
      const e = i === cars - 1 ? x1 - 100 : a + carLen - 10;
      return `M${f(s)} ${tr + 8} L ${f(e)} ${tr + 8} L ${f(e)} ${tr + 15} L ${f(s)} ${tr + 15} Z`;
    })
    .join(" ");
  const seams = joints.map((j) => `M${f(j)} ${tr} L ${f(j)} ${tb}`).join(" ");
  const screen = `M${x1 - 86} ${tr + 3} C ${x1 - 60} ${tr + 3} ${x1 - 40} ${tr + 8} ${x1 - 28} ${tr + 15}`;
  const stripe = `M${x0 + 2} ${tb - 8} L ${x1 - 8} ${tb - 8}`;
  const p = joints[0] - carLen / 2;
  const panto = `M${p - 8} ${tr} L ${p} ${tr - 8} L ${p + 10} ${tr - 8} M${p} ${tr - 8} L ${p + 6} ${tr}`;
  const wheels = [x0, ...joints].flatMap((a, i) => {
    const e = i === cars - 1 ? x1 - 30 : a + carLen;
    return [a + 18, a + 30, e - 30, e - 18].map((x) => [+f(x), HZ_RAIL - 3, 2.2]);
  });
  // white body, a band of livery under the stripe, glass in the windows
  const livery =
    `M${x0 + 1} ${tb - 8} L ${x1 - 3} ${tb - 8} L ${x1} ${tb - 5} C ${x1 + 1} ${tb - 1} ${x1 - 3} ${tb} ${x1 - 9} ${tb}` +
    ` L ${x0 + 6} ${tb} C ${x0 + 1} ${tb} ${x0 - 1} ${tb - 3} ${x0} ${tb - 6} Z`;
  const glass = `M${x1 - 86} ${tr + 3} C ${x1 - 60} ${tr + 3} ${x1 - 40} ${tr + 8} ${x1 - 28} ${tr + 15} L ${x1 - 86} ${tr + 15} Z`;
  const washes = [
    { d: body, tone: "train" },
    { d: livery, tone: "livery" },
    { d: `${win} ${glass}`, tone: "window" },
  ];
  return { strokes: [body, win, seams, screen, stripe, panto], dots: wheels, washes };
}

// The scroll timeline, in fractions of the run (0 → 1). The rail is the time
// axis, drawn left to right until AXIS; each motif draws as the rail's pen
// passes its left edge, and the train arrives last. Wide screens see the
// whole box and phones only its middle, so every moment is worked out for
// both windows ([wide, phone]); the land itself is there on load.
const AXIS = 0.86;
// the caravan fades as the train starts to draw on the same road
const LEAVE = AXIS - 0.005;
// Five birds over the new city, where the scroll brings them: they set out
// over the empty steppe at dawn and cross the eras with the reader.
const bird = (x, y, w) =>
  `M${x - w} ${y - w * 0.1} C ${x - w * 0.6} ${y - w * 0.55} ${x - w * 0.2} ${y - w * 0.45} ${x} ${y + w * 0.15}` +
  ` C ${x + w * 0.2} ${y - w * 0.45} ${x + w * 0.6} ${y - w * 0.55} ${x + w} ${y - w * 0.1}`;
const HZ_FLOCK = [
  [748, 46, 7],
  [768, 36, 6],
  [788, 50, 5.5],
  [806, 30, 5],
  [826, 42, 4.5],
]
  .map(([x, y, w]) => bird(x, y, w))
  .join(" ");
const WINDOWS = [
  [24, 1176],
  [250, 950],
];

function horizon() {
  const yurts = [yurt(330, 92, { ribs: true, smoke: true }), yurt(420, 64), yurt(214, 46)];
  const horses = [
    horse(HORSE_STAND, 474, 0.56, false, "chestnut"),
    horse(HORSE_GRAZE, 284, 0.4, true, "dun"),
    horse(HORSE_GRAZE, 66, 0.4, false, "grey"),
    horse(HORSE_STAND, 168, 0.36, true, "chestnut"),
  ];
  const school = madrasa(594, 0.85);
  const turbines = [turbine(700, 122, 46, 14), turbine(756, 96, 36, 52), turbine(802, 72, 27, 98)];
  const town = city();
  const tr = train(372, 852);
  const camels = caravan([440, 494, 548, 602], 0.45);

  // everything that stands in front of the land, by motif
  const motifs = [
    ...yurts.map((o, i) => ({ key: `yurt${i}`, occ: o.occ })),
    ...horses.map((o, i) => ({ key: `horse${i}`, occ: o.occ })),
    { key: "madrasa", occ: school.occ },
    ...turbines.map((o, i) => ({ key: `turbine${i}`, occ: o.occ })),
    ...town.parts.map((t, i) => ({ key: `tower${i}`, occ: t.occ })),
  ];
  const front = motifs.flatMap((m) => m.occ);
  const behindTurbines = [...school.occ, ...town.occ];

  // Strokes in draw order, each tagged with the motif it belongs to, so a
  // wash can come in as its motif's outline closes. A line wholly behind
  // something nearer leaves nothing to draw and is dropped.
  const strokes = [];
  const add = (key, ds, amp) => ds.forEach((d) => d && strokes.push({ d, amp, key }));
  add("ridge", [occlude(HZ_RIDGE, front, 28)], 2.2);
  HZ_SNOW.forEach((d, i) => add(`snow${i}`, [occlude(d, front)], 0.7));
  add("ground", [HZ_GROUND], 2.2);
  add("flock", [HZ_FLOCK], 0.3);
  yurts.forEach((o, i) => add(`yurt${i}`, o.strokes, 0.7));
  horses.forEach((o, i) => add(`horse${i}`, o.strokes, 0.7));
  add("madrasa", school.strokes, 0.7);
  camels.forEach((o, i) => add(`camel${i}`, o.strokes, 0.5));
  turbines.forEach((o, i) => add(`turbine${i}`, o.strokes.map((d) => occlude(d, behindTurbines)), 0.7));
  town.parts.forEach((t, i) => add(`tower${i}`, [t.d], 0.7));
  add("rail", [`M24 ${HZ_RAIL} L 1176 ${HZ_RAIL}`], 2.2);
  add("train", tr.strokes, 0.7);
  const last = (key, or = 0) => {
    const i = strokes.findLastIndex((s) => s.key === key);
    return i < 0 ? or : i;
  };

  // ---- washes: flat colour under the line, painted far to near ----
  // Opaque pale tints, so a nearer wash covers a farther one exactly as a
  // nearer line hides a farther one; only the hills and steppe fade, into
  // the page, and nothing stands behind them.
  const ridgeAt = yAt(hzRidgePts);
  const [rx0, rx1] = [hzRidgePts[0][0], hzRidgePts.at(-1)[0]];
  const groundBack = hzGroundCoarse.filter(([x]) => x > rx0 && x < rx1).reverse();
  const hills = ring([...hzRidgePts, [rx1, g(rx1)], ...groundBack, [rx0, g(rx0)]]);
  // snow: from each zigzag up to the ridge above it
  const snow = HZ_SNOW.map((d) => {
    const zig = polyOf(d, 2);
    const [a, b] = [zig[0][0], zig.at(-1)[0]];
    const cap = hzRidgePts.filter(([x]) => x > a && x < b).reverse();
    return ring([...zig, [b, ridgeAt(b)], ...cap, [a, ridgeAt(a)]]);
  });
  // the steppe: the strip between the ground line and the rail, fading out
  // sideways where the ground line ends
  const [gx0, gx1] = [hzGroundCoarse[0][0], hzGroundCoarse.at(-1)[0]];
  const steppe = ring([...hzGroundCoarse, [gx1, HZ_RAIL], [gx0, HZ_RAIL]]);
  const towerWashes = town.parts
    .map((t, i) => ({ ...t, at: last(`tower${i}`, last("ground")) }))
    .sort((p, q) => p.near - q.near) // far towers first
    .flatMap((t) => t.washes.map((w) => ({ ...w, at: t.at })));

  const washes = [
    { d: ellipse(520, 62, 24, 24), tone: "sun", at: 0, move: "sun" },
    // blue on the peaks, gone to the page by the foothills (so the ridge's
    // open ends need no edge)
    { d: hills, tone: "hills", fade: { from: [0, 44], to: [0, 228], stops: [[0, "hills"], [1, "hills", 0]] }, at: last("ridge") },
    ...snow.map((d) => ({ d, tone: "snow", at: last("ridge") + 1 })),
    {
      d: steppe,
      tone: "steppe",
      fade: { from: [gx0, 0], to: [gx1, 0], stops: [[0, "steppe", 0], [0.16, "steppe"], [0.84, "steppe"], [1, "steppe", 0]] },
      at: last("ground"),
    },
    ...towerWashes,
    ...school.washes.map((w) => ({ ...w, at: last("madrasa") })),
    ...yurts.flatMap((o, i) => o.washes.map((w) => ({ ...w, at: last(`yurt${i}`) }))),
    ...horses.flatMap((o, i) => o.washes.map((w) => ({ ...w, at: last(`horse${i}`) }))),
    ...camels.flatMap((o, i) => o.washes.map((w) => ({ ...w, at: last(`camel${i}`), out: [LEAVE, LEAVE] }))),
    ...tr.washes.map((w) => ({ ...w, at: last("train") })),
  ];

  // ---- the timeline: each stroke's [start, end] per window ----
  const land = new Set(["ridge", "ground", "flock", ...HZ_SNOW.map((_, i) => `snow${i}`)]);
  const keys = [...new Set(strokes.map((s) => s.key))].filter((k) => !land.has(k));
  const spans = strokes.map(() => []);
  for (const [w0, w1] of WINDOWS) {
    const xT = (x) => (AXIS * (x - w0)) / (w1 - w0);
    for (const k of keys) {
      const idx = strokes.flatMap((s, i) => (s.key === k ? [i] : []));
      const n = idx.length;
      let t0;
      let dur;
      if (k === "rail") [t0, dur] = [xT(24), xT(1176) - xT(24)];
      else if (k === "train") [t0, dur] = [AXIS + 0.01, 0.11];
      else {
        const x0 = Math.min(...idx.flatMap((i) => polyOf(strokes[i].d, 4).map(([x]) => x)));
        dur = Math.min(0.11, Math.max(0.045, 0.035 + 0.01 * n));
        t0 = Math.min(Math.max(xT(x0), -0.2), 0.95 - dur);
      }
      // a motif's strokes follow one another, each over 60% of its time
      const len = k === "rail" ? dur : dur * 0.6;
      const step = n > 1 ? (dur - len) / (n - 1) : 0;
      idx.forEach((i, j) => spans[i].push(t0 + j * step, t0 + j * step + len));
    }
  }
  // a wash comes in as its stroke closes, a dot as its motif ends
  const moment = (i) => (spans[i].length ? [0, 2].map((o) => spans[i][o] + 0.85 * (spans[i][o + 1] - spans[i][o])) : null);
  const end = (i) => [spans[i][1], spans[i][3]];

  // ---- patches: the land is whole on load ----
  // The ridge and snow are cut where motifs will stand in front of them, but
  // those motifs only arrive with the scroll. So each cut piece is kept as its
  // own stroke, drawn on load and faded out the moment the motif that hides it
  // starts to draw (`out`: [wide, phone, place along the ridge]). Pieces too
  // short to keep between two motifs fade with the later one. Without scroll
  // timelines everything draws at once and the patches are never shown.
  const startOf = (key) => {
    const idx = strokes.flatMap((s, i) => (s.key === key && spans[i].length ? [i] : []));
    return idx.length ? [Math.min(...idx.map((i) => spans[i][0])), Math.min(...idx.map((i) => spans[i][2]))] : null;
  };
  const arriving = motifs
    .map((m) => ({ ...m, at: startOf(m.key) }))
    .filter((m) => m.at)
    .sort((p, q) => p.at[0] - q.at[0]);
  const LAND = [{ d: HZ_RIDGE, run: 28, amp: 2.2 }, ...HZ_SNOW.map((d) => ({ d, run: 3, amp: 0.7 }))];
  const patches = [];
  for (const src of LAND) {
    const byMotif = new Map();
    arriving.forEach((m, j) => {
      const earlier = arriving.slice(0, j).flatMap((o) => o.occ);
      const d = keepWhere(src.d, (p) => !hidden(p, m.occ) || hidden(p, earlier), 1);
      if (d) byMotif.set(m.key, [d]);
    });
    for (const sub of parse(keepWhere(src.d, (p) => hidden(p, front), 0))) {
      if (sub.segs.reduce((n, g) => n + dist(g[0], g[3]), 0) > src.run) continue;
      const ends = [sub.start, sub.segs.at(-1)[3]];
      const touching = arriving.filter((m) => ends.some((e) => hidden(e, m.occ.map((o) => ({ ...o, pad: o.pad + 2 })))));
      const owner = touching.at(-1);
      if (owner) byMotif.set(owner.key, [...(byMotif.get(owner.key) ?? []), serialize([sub])]);
    }
    for (const [key, ds] of byMotif) {
      const m = arriving.find((o) => o.key === key);
      const d = ds.join(" ");
      const x0 = Math.min(...polyOf(d, 2).map(([x]) => x));
      patches.push({ d, amp: src.amp, out: [...m.at, Math.min(1, Math.max(0, (x0 - 48) / (1156 - 48)))] });
    }
  }

  return {
    strokes: [
      ...strokes.map(({ d, amp, key }, i) => ({
        d,
        amp,
        ...(spans[i].length ? { t: spans[i] } : {}),
        ...(key.startsWith("camel") ? { out: [LEAVE, LEAVE, 0] } : {}),
        ...(key === "flock" ? { move: "flock" } : {}),
      })),
      ...patches,
    ],
    dots: [...turbines.map((t) => t.dot), ...tr.dots],
    dotsAt: [...turbines.map((_, i) => end(last(`turbine${i}`))), ...tr.dots.map(() => end(last("train")))],
    washes: washes.map((w) => {
      const t = moment(w.at);
      return t ? { ...w, t } : w;
    }),
  };
}
const HZ = horizon();

const RAW = {
  mark: {
    vb: [48, 48],
    amp: 0,
    strokes: [
      "M6 30 C 6 16 18 7 30 8 C 40 9 44 18 42 28 C 40 38 30 43 20 42 C 11 41 6 37 6 30 Z",
      "M14 28 C 14 19 22 13 30 14 C 37 15 39 22 37 28 C 35 34 28 37 22 36 C 17 35 14 32 14 28 Z",
      "M22 25 C 22 21 26 18 30 19 C 33 20 34 23 33 26 C 32 29 28 30 25 29 C 23 28 22 27 22 25 Z",
    ],
    dots: [[29, 23, 1.8]],
  },

  // The home horizon, built above (HZ): the Tian Shan, the steppe camp, the
  // turbines, the city and the train. Strokes carry their own wobble.
  horizon: {
    vb: [1200, 320],
    amp: 0.7,
    step: 140,
    strokes: HZ.strokes,
    dots: HZ.dots,
    washes: HZ.washes,
    dotsAt: HZ.dotsAt,
    washShift: [1.5, 1.5],
  },

  // Tulipa greigii. Stage 1 = stem and leaves, 2 = the cup, 3 = open petals.
  tulip: {
    vb: [400, 500],
    amp: 1.6,
    shift: [0, -10],
    scale: 1.08,
    strokes: [
      { d: "M200 466 C 198 410 203 330 200 266", stage: 1 },
      { d: "M198 440 C 156 424 118 384 104 306 C 134 334 166 370 197 404", stage: 1 },
      { d: "M196 424 C 166 398 132 356 112 318", stage: 1 },
      { d: "M202 410 C 246 396 282 352 296 292 C 270 324 238 352 203 374", stage: 1 },
      { d: "M184 260 C 190 274 210 274 216 260", stage: 2 },
      { d: "M176 148 C 178 124 188 104 200 88 C 212 104 222 124 224 148", stage: 2 },
      { d: "M186 250 C 166 230 156 200 158 160", stage: 2 },
      { d: "M200 264 C 162 258 132 222 132 172 C 132 148 136 128 142 110 C 158 140 180 160 200 178", stage: 3 },
      { d: "M200 264 C 238 258 268 222 268 172 C 268 148 264 128 258 110 C 242 140 220 160 200 178", stage: 3 },
    ],
    dots: [
      [191, 161, 4.5, 3],
      [200, 153, 5.5, 3],
      [209, 161, 4.5, 3],
    ],
  },

  // A whole fruit beside its halved twin; the whole fruit's line stops at the
  // half's rim so the outlines never cross.
  pomegranate: {
    vb: [400, 500],
    amp: 1.6,
    shift: [-40, -35],
    scale: 1.22,
    strokes: [
      "M265 254 C 249 228 220.6 212 190 212 C 141.4 212 102 251.4 102 300 C 102 348.6 141.4 388 190 388 C 212.4 388 233.7 379.3 250 364",
      "M178 214 C 178 204 174 196 168 189 C 172 193 176 196 180 198 C 183 193 187 188 190 183 C 193 188 197 193 200 198 C 204 196 208 193 212 189 C 206 196 202 204 202 214",
      "M232 330 C 232 270 282 232 334 240 C 372 250 386 296 372 340 C 356 384 300 402 264 384 C 244 372 232 352 232 330",
      "M243.5 328.1 C 243.5 277.7 285.5 245.8 329.2 252.5 C 361.1 260.9 372.9 299.5 361.1 336.5 C 347.7 373.4 300.6 388.6 270.4 373.4 C 253.6 363.4 243.5 346.6 243.5 328.1",
      "M304 318 C 290 308 272 300 253 290",
      "M304 318 C 322 306 344 292 366 285",
      "M304 318 C 302 340 304 360 302 384",
    ],
    dots: [
      [284, 297, 6],
      [318, 296, 6],
      [291, 337, 6],
      [330, 330, 6],
      [276, 354, 6],
      [314, 362, 6],
      [344, 350, 6],
    ],
  },

  // Saiga antelope, head in profile facing left: the bulbous drooping nose
  // overhanging the mouth, one ringed lyre horn rising above the eye.
  saiga: {
    vb: [400, 500],
    amp: 1.6,
    shift: [-25, 56],
    scale: 1.18,
    strokes: [
      "M126 206 C 140 184 176 176 206 174 C 236 172 266 170 292 180",
      "M126 206 C 104 222 100 256 116 272 C 128 284 146 282 154 272",
      "M150 286 C 158 300 176 304 192 298",
      "M192 298 C 228 296 262 282 282 252",
      "M282 178 C 294 146 318 136 326 150 C 332 166 312 186 296 194",
      saigaHorn,
      `${ticksAlong(saigaHornSegs[0], [0.18, 0.36, 0.54, 0.72, 0.9], 13)} ${ticksAlong(saigaHornSegs[1], [0.25], 11)}`,
      "M282 252 C 294 280 304 312 308 344",
      "M300 192 C 326 230 344 290 350 344",
      "M150 196 C 140 214 138 238 146 256",
    ],
    dots: [
      [232, 208, 6],
      [124, 262, 5],
    ],
  },

  // Torpedo melon on the vine: the fruit lying on a diagonal, its netting as
  // two meridians and two crossing lines, the stem rising to the vine.
  melon: {
    vb: [400, 500],
    amp: 1.6,
    shift: [-26, -22],
    scale: 1.04,
    strokes: [
      ellipse(192, 330, MELON_RX, MELON_RY, -24, 180),
      melonLocal(`M${-MELON_RX} 0 C ${-MELON_RX * 0.5} -44.8 ${MELON_RX * 0.5} -44.8 ${MELON_RX} 0`),
      melonLocal(`M${-MELON_RX} 0 C ${-MELON_RX * 0.5} 44.8 ${MELON_RX * 0.5} 44.8 ${MELON_RX} 0`),
      melonLocal("M10 -79 C -6 -30 -6 30 10 79"),
      melonLocal("M-60 -70 C -76 -24 -76 24 -60 70"),
      "M316 275 C 324 258 330 238 336 214",
      "M232 208 C 272 196 306 204 336 214 C 352 219 364 214 374 204",
      "M262 202 C 240 168 204 152 176 164 C 188 194 226 208 262 202",
      "M260 200 C 238 186 214 172 188 166",
      "M374 204 C 390 194 390 174 376 170 C 362 166 358 182 368 188",
    ],
    dots: [
      [...melonAt([0, -33]), 5],
      [...melonAt([0, 33]), 5],
      [...melonAt([-71, -26]), 5],
      [...melonAt([-71, 26]), 5],
    ],
  },

  // Snow leopard, the head frontal: small round ears, the broad fur ruff of the
  // cheeks, rosettes on brow and cheek.
  leopard: {
    vb: [400, 500],
    amp: 1.3,
    shift: [-10, 10],
    scale: 1.25,
    strokes: [
      "M120 204 C 146 128 270 120 300 204",
      "M128 192 C 110 160 120 126 148 130 C 160 132 166 142 168 152",
      "M292 192 C 310 160 300 126 272 130 C 260 132 254 142 252 152",
      "M120 204 C 96 262 108 328 168 356",
      "M300 204 C 324 262 312 328 252 356",
      "M210 236 C 205 256 205 272 208 284",
      "M196 286 C 204 296 216 296 224 286 C 218 281 202 281 196 286 Z",
      "M210 296 C 210 301 210 305 210 310 M210 310 C 200 322 186 322 178 312 M210 310 C 220 322 234 322 242 312",
      "M194 346 C 204 351 216 351 226 346",
      "M152 246 C 162 234 180 234 190 246 C 180 256 162 256 152 246",
      "M230 246 C 240 234 258 234 268 246 C 258 256 240 256 230 246",
      "M170 306 C 150 304 130 308 110 316 M172 316 C 154 320 138 328 122 338 M250 306 C 270 304 290 308 310 316 M248 316 C 266 320 282 328 298 338",
    ],
    dots: [
      [186, 178, 6],
      [210, 164, 6],
      [234, 178, 6],
      [142, 288, 6],
      [278, 288, 6],
      [210, 206, 5],
    ],
  },

  // Wild apple of Almaty (Malus sieversii) hanging from its branch.
  apple: {
    vb: [400, 500],
    amp: 1.6,
    shift: [-4, -4],
    scale: 1.04,
    strokes: [
      "M48 300 C 120 270 200 210 352 132",
      "M196 220 C 204 240 210 254 214 268",
      "M226 284 C 196 276 168 296 166 330 C 164 368 194 400 226 396 C 258 400 290 370 288 332 C 286 296 256 276 226 284",
      "M214 287 C 220 280 232 280 238 287",
      "M226 284 C 224 278 220 272 214 268",
      "M296 160 C 300 124 336 108 360 120 C 358 150 326 166 296 160",
      "M298 158 C 316 144 336 132 356 122",
      "M200 220 C 178 206 156 210 142 228 C 164 240 186 236 200 220",
    ],
    dots: [
      [202, 334, 5],
      [238, 360, 5],
      [250, 318, 5],
    ],
  },

  // Silkworm moth above a mulberry leaf.
  silkworm: {
    vb: [400, 500],
    amp: 1.5,
    shift: [0, -46],
    scale: 1.02,
    strokes: [
      "M200 456 C 148 434 104 392 112 346 C 120 306 164 290 200 270 C 236 290 280 306 288 346 C 296 392 252 434 200 456",
      "M200 478 C 200 430 201 360 200 286",
      "M200 420 C 180 412 160 398 146 382 M200 420 C 220 412 240 398 254 382 M200 370 C 184 362 168 350 156 336 M200 370 C 216 362 232 350 244 336",
      "M200 150 C 195 172 195 206 200 238",
      "M200 164 C 150 128 104 156 126 194 C 142 220 184 214 200 200",
      mirrorX("M200 164 C 150 128 104 156 126 194 C 142 220 184 214 200 200", 200),
      "M198 206 C 174 214 162 238 180 250 C 192 256 198 240 200 228 M202 206 C 226 214 238 238 220 250 C 208 256 202 240 200 228",
      `${silkAntenna} ${ticksAlong(segOf(silkAntenna), [0.2, 0.36, 0.52, 0.68, 0.84], 9, { side: -1, lean: -0.6 })}`,
      mirrorX(`${silkAntenna} ${ticksAlong(segOf(silkAntenna), [0.2, 0.36, 0.52, 0.68, 0.84], 9, { side: -1, lean: -0.6 })}`, 200),
    ],
    dots: [
      [154, 170, 5],
      [174, 190, 5],
      [246, 170, 5],
      [226, 190, 5],
    ],
  },

  // Open cotton boll on its stem, with a palmate leaf.
  cotton: {
    vb: [400, 500],
    amp: 1.6,
    shift: [-10, -77],
    scale: 1.22,
    strokes: [
      "M200 354 C 202 400 197 430 200 472",
      "M128 304 C 118 314 110 324 99 338 C 116 338 134 334 150 326",
      "M272 304 C 282 314 290 324 301 338 C 284 338 266 334 250 326",
      "M182 324 C 188 334 194 344 200 354 C 206 344 212 334 218 324",
      "M200 300 C 192 318 176 326 158 324 C 132 322 116 304 118 282 C 118 264 132 252 144 248 C 132 232 134 206 150 194 C 164 182 188 182 200 196",
      "M200 196 C 212 182 236 182 250 194 C 266 206 268 232 256 248 C 268 252 282 264 282 282 C 284 304 268 322 242 324 C 224 326 208 318 200 300",
      "M200 206 C 199 218 201 228 200 238 M154 254 C 164 258 172 262 180 266 M246 254 C 236 258 228 262 220 266 M200 290 C 200 284 200 278 200 272",
      "M200 424 C 214 416 228 412 242 410 C 248 386 260 366 276 352 C 280 364 282 374 282 384 C 296 384 310 386 322 392 C 312 402 300 410 290 418 C 294 428 294 438 292 448 C 272 440 254 428 242 410 M242 410 C 254 390 266 370 274 356 M242 410 C 268 404 296 398 318 393 M242 410 C 258 422 272 434 288 444",
    ],
    dots: [
      [158, 290, 6],
      [172, 226, 6],
      [228, 226, 6],
      [242, 290, 6],
      [200, 254, 5],
    ],
  },

  // Ulugh Beg's meridian arc: the graduated double rail, the observer, the
  // sight line to a star.
  sextant: {
    vb: [400, 500],
    amp: 1.4,
    shift: [-6, -36],
    scale: 1.0,
    strokes: [
      arc(sextantC[0], sextantC[1], 300, 300, sextantA0, sextantA1),
      arc(sextantC[0], sextantC[1], 282, 282, sextantA0, sextantA1),
      radialTicks(sextantC[0], sextantC[1], 285, 297, Array.from({ length: 11 }, (_, i) => 192 + i * 7)),
      radialTicks(sextantC[0], sextantC[1], 282, 300, [sextantA0, sextantA1]),
      "M36 470 C 140 464 252 474 376 466",
      "M180 380 C 220 320 290 214 340 140",
      radialTicks(352, 120, 6, 16, [0, 60, 120, 180, 240, 300]),
    ],
    dots: [[180, 380, 6]],
  },

  // The five states on one map (About → Coverage), built below (REGION).
  region: {
    vb: REGION.vb,
    amp: 0.5,
    step: 140,
    strokes: REGION.strokes,
    dots: REGION.dots,
    washes: REGION.washes,
    washShift: [0.8, 0.8],
  },

  // Compass rose after the astrolabe. Strokes from index 2 (the needles, the
  // intercardinal ticks and the N) and the pivot form the needle group that
  // settles to north on the 404 page.
  compass: {
    vb: [400, 400],
    amp: 1.2,
    shift: [0, 8],
    scale: 1.0,
    needleFrom: 2,
    strokes: [
      arc(200, 212, 140, 140, -87, 267),
      ellipse(200, 212, 108, 108, 0, -90),
      "M200 84 L 212 212 L 200 340 L 188 212 Z",
      "M104 212 L 200 220 L 296 212 L 200 204 Z",
      radialTicks(200, 212, 114, 134, [-45, 45, 135, 225]),
      "M190 56 L 190 30 L 210 56 L 210 30",
    ],
    dots: [[200, 212, 7]],
  },
};

// ---------- build ----------
const DATA = {};
const r3 = (n) => Math.round(n * 1000) / 1000;
for (const [name, r] of Object.entries(RAW)) {
  const [sx, sy] = r.shift ?? [0, 0];
  const k = r.scale ?? 1;
  const [cx, cy] = [r.vb[0] / 2, r.vb[1] / 2];
  const map = ([x, y]) => [(x + sx - cx) * k + cx, (y + sy - cy) * k + cy];
  const strokes = r.strokes.map((s, i) => {
    const src = typeof s === "string" ? { d: s } : s;
    return {
      d: wobble(src.d, { amp: src.amp ?? r.amp, seed: `${name}-${i}`, step: r.step ?? 90, map }),
      ...(src.stage ? { stage: src.stage } : {}),
      ...(src.t ? { t: src.t.map(r3) } : {}),
      ...(src.out ? { out: src.out.map(r3) } : {}),
      ...(src.move ? { move: src.move } : {}),
      ...(src.ink ? { ink: src.ink } : {}),
    };
  });
  const dots = r.dots.map(([x, y, rr, stage]) => {
    const [mx, my] = map([x, y]);
    return stage ? [+f(mx), +f(my), rr, stage] : [+f(mx), +f(my), rr];
  });
  const entry = { viewBox: r.vb, strokes, dots };
  if (r.dotsAt) entry.dotsAt = r.dotsAt.map((t) => t.map(r3));
  // washes sit a hair off the line, down and right, like a hand-tinted print
  if (r.washes) {
    const [ox, oy] = r.washShift ?? [0, 0];
    // move every point, keeping L as L (serialize would spell each as a cubic)
    const shift = (d) => {
      const out = [];
      let pair = [];
      for (const t of d.match(/[MLCZ]|-?\d*\.?\d+/g)) {
        if (/[MLCZ]/.test(t)) out.push(t);
        else if (pair.push(+t) === 2) {
          const [x, y] = map([pair[0] + ox, pair[1] + oy]);
          out.push(`${f(x)} ${f(y)}`);
          pair = [];
        }
      }
      return out.join(" ").replace(/([MLCZ]) /g, "$1");
    };
    entry.washes = r.washes.map(({ d, t, ...w }) => ({ d: shift(d), ...w, ...(t ? { t: t.map(r3) } : {}) }));
  }
  if (r.needleFrom !== undefined) {
    const [ox, oy] = map([200, 212]);
    entry.needle = { from: r.needleFrom, origin: [+f(ox), +f(oy)] };
  }
  DATA[name] = entry;
}

mkdirSync(OUT, { recursive: true });
for (const [name, d] of Object.entries(DATA)) {
  const body = [
    "// Generated by scripts/illustrations.mjs. Edit the construction there, not here.",
    'import type { DrawingData } from "../types";',
    "",
    `export const ${name}: DrawingData = ${JSON.stringify(d, null, 2)};`,
    "",
  ].join("\n");
  writeFileSync(join(OUT, `${name}.ts`), body);
}
console.log(`wrote ${Object.keys(DATA).length} drawings to ${OUT}`);

// ---------- optional contact sheet ----------
const pi = process.argv.indexOf("--preview");
if (pi > -1) {
  const file = process.argv[pi + 1];
  const svg = (name, { w, tone = "#141413", bg = "transparent", sw }) => {
    const d = DATA[name];
    const strokeW = sw ?? (d.viewBox[0] / 400) * 2.75;
    const paths = d.strokes.filter((s) => !s.out).map((s) => `<path d="${s.d}"/>`).join("");
    const dots = d.dots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");
    return `<figure style="margin:0;background:${bg};border-radius:24px;padding:12px;width:${w}px"><svg viewBox="0 0 ${d.viewBox[0]} ${d.viewBox[1]}" width="${w}" fill="none" stroke="${tone}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" style="display:block;overflow:visible">${paths}<g fill="${tone}" fill-opacity=".6" stroke="none">${dots}</g></svg><figcaption style="font:12px monospace;margin-top:6px">${name}</figcaption></figure>`;
  };
  const plates = [
    ["tulip", "#bcd1ca"],
    ["pomegranate", "#ebc9b7"],
    ["saiga", "#e9d3a8"],
    ["melon", "#c7d4be"],
    ["leopard", "#cbcadb"],
    ["apple", "#ebcece"],
    ["silkworm", "#c9dcf0"],
    ["cotton", "#f0c8a8"],
    ["sextant", "#faf9f5"],
  ];
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:24px;background:#faf9f5;font-family:sans-serif">
<div style="display:flex;flex-wrap:wrap;gap:16px">${plates.map(([n, bg]) => svg(n, { w: 300, bg })).join("")}
${svg("compass", { w: 300, bg: "#f5f4ed" })}${svg("mark", { w: 96, sw: 1 })}</div>
<div style="margin-top:16px">${svg("horizon", { w: 1200, sw: 1.75 })}</div>
<div style="margin-top:16px">${svg("region", { w: 800, sw: 1.75 })}</div>
<figure style="margin:16px 0 0"><svg viewBox="400 240 260 60" width="1040" fill="none" stroke="#141413" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${DATA.horizon.strokes.filter((s) => s.out && s.t).map((s) => `<path d="${s.d}"/>`).join("")}<path d="M380 294 L 680 294"/></svg><figcaption style="font:12px monospace">horizon: the caravan</figcaption></figure></body>`;
  writeFileSync(file, html);
  console.log(`preview → ${file}`);
}
