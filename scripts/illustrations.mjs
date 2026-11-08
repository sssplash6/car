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

import { mkdirSync, writeFileSync } from "node:fs";
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

  // The Tian Shan in profile: far ridgeline → snow lines under the three
  // highest summits → foothills → the river leaving the valley → its delta.
  ridge: {
    vb: [1200, 280],
    amp: 2.2,
    step: 140,
    strokes: [
      "M48 200 C 110 192 160 172 198 152 C 224 138 242 122 262 106 C 276 116 290 128 306 132 C 326 116 346 84 368 58 C 388 82 404 108 426 122 C 446 112 460 100 476 92 C 494 104 512 120 534 128 C 562 116 588 92 612 68 C 628 54 640 44 652 36 C 668 56 690 86 716 106 C 736 98 752 88 768 82 C 790 100 812 118 838 126 C 866 110 890 90 914 74 C 934 92 958 116 986 132 C 1034 158 1092 178 1156 188",
      "M352 80 L 358 86 L 363 81 L 369 90 L 375 83 L 380 87 L 386 82",
      "M634 60 L 640 67 L 645 62 L 652 72 L 658 64 L 664 69 L 671 61",
      "M900 90 L 906 96 L 911 92 L 917 100 L 923 93 L 928 97 L 934 92",
      "M36 232 C 120 218 196 204 268 208 C 330 212 380 194 446 190 C 512 186 556 196 600 202 C 648 196 700 182 770 184 C 846 186 902 204 982 202 C 1052 200 1110 208 1168 214",
      "M600 202 C 594 216 614 224 608 238 C 602 252 570 256 548 266",
      "M608 238 C 630 250 668 254 704 266",
    ],
    dots: [
      [600, 202, 3.5],
      [548, 266, 4],
      [704, 266, 4],
    ],
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

  // Amu Darya and Syr Darya running to the Aral's 1960 shoreline and the two
  // lagoons left inside it.
  rivers: {
    vb: [1200, 400],
    amp: 2.2,
    step: 140,
    shift: [0, -36],
    scale: 0.95,
    strokes: [
      "M40 360 C 70 330 90 300 110 330 C 130 300 160 270 190 320 C 210 300 230 290 250 330",
      "M80 380 C 300 340 420 300 560 260 C 700 220 760 180 780 120",
      "M240 390 C 500 360 700 300 860 240 C 960 200 1000 160 1000 110",
      "M300 396 C 340 360 380 340 430 320",
      "M700 110 C 760 90 900 80 1060 96 C 1100 100 1130 120 1150 140",
      "M790 120 C 820 104 860 108 870 124 C 860 140 820 142 800 134",
      "M900 150 C 940 130 1000 136 1010 160 C 1000 186 940 190 914 176",
    ],
    dots: [],
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
for (const [name, r] of Object.entries(RAW)) {
  const [sx, sy] = r.shift ?? [0, 0];
  const k = r.scale ?? 1;
  const [cx, cy] = [r.vb[0] / 2, r.vb[1] / 2];
  const map = ([x, y]) => [(x + sx - cx) * k + cx, (y + sy - cy) * k + cy];
  const strokes = r.strokes.map((s, i) => {
    const src = typeof s === "string" ? { d: s } : s;
    return {
      d: wobble(src.d, { amp: r.amp, seed: `${name}-${i}`, step: r.step ?? 90, map }),
      ...(src.stage ? { stage: src.stage } : {}),
    };
  });
  const dots = r.dots.map(([x, y, rr, stage]) => {
    const [mx, my] = map([x, y]);
    return stage ? [+f(mx), +f(my), rr, stage] : [+f(mx), +f(my), rr];
  });
  const entry = { viewBox: r.vb, strokes, dots };
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
    const paths = d.strokes.map((s) => `<path d="${s.d}"/>`).join("");
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
<div style="margin-top:16px">${svg("ridge", { w: 1200, sw: 1.75 })}</div>
<div style="margin-top:16px">${svg("rivers", { w: 1200, sw: 1.75 })}</div></body>`;
  writeFileSync(file, html);
  console.log(`preview → ${file}`);
}
