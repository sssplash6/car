// Builds scripts/region-map.json: the construction data for About's coverage
// map (the `region` drawing in scripts/illustrations.mjs). Source: Natural
// Earth, public domain, 1:50m (https://github.com/nvkelso/natural-earth-vector,
// geojson/ne_50m_admin_0_countries, ne_50m_lakes, ne_50m_rivers_lake_centerlines).
//
//   node scripts/region-map.mjs <folder holding those three .geojson files>
//
// What it does: projects the five states (Lambert conformal conic, standard
// parallels 38° and 52°, centred on 67° E), splits their outlines into the
// shared borders (drawn once) and the outer boundary, drops islands and
// enclaves too small to draw, builds the Caspian from every coast around it,
// clips the rivers to the region, and simplifies every line to drawing scale.
// The output is plain points in an 800-wide box; illustrations.mjs smooths and
// hand-wobbles them like every other drawing.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = process.argv[2];
if (!dir) throw new Error("usage: node scripts/region-map.mjs <natural-earth geojson folder>");
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.geojson`), "utf8"));
const OUT = join(dirname(fileURLToPath(import.meta.url)), "region-map.json");

// the five states, keyed by the language code the About page lists them with
const FIVE = { KAZ: "kk", KGZ: "ky", TJK: "tg", TKM: "tk", UZB: "uz" };
const CAPITALS = [
  [71.43, 51.13], // Astana
  [74.59, 42.87], // Bishkek
  [68.78, 38.56], // Dushanbe
  [58.38, 37.95], // Ashgabat
  [69.28, 41.31], // Tashkent
];
const LAKES = ["North Aral Sea", "South Aral Sea", "Lake Balkhash", "Issyk-Kul"];
const RIVERS = ["Amu  Darya", "Syr Darya", "Naryn", "Ural", "Ertis"];
const W = 800;
const MARGIN = 16;

// ---- projection ----
const rad = (d) => (d * Math.PI) / 180;
const [p1, p2, p0, l0] = [38, 52, 46, 67].map(rad);
const tq = (phi) => Math.tan(Math.PI / 4 + phi / 2);
const n = Math.log(Math.cos(p1) / Math.cos(p2)) / Math.log(tq(p2) / tq(p1));
const F = (Math.cos(p1) * tq(p1) ** n) / n;
const r0 = F / tq(p0) ** n;
const lcc = ([lon, lat]) => {
  const r = F / tq(rad(lat)) ** n;
  const a = n * (rad(lon) - l0);
  return [r * Math.sin(a), -(r0 - r * Math.cos(a))];
};

// ---- geometry helpers ----
const key = ([x, y]) => `${x.toFixed(5)},${y.toFixed(5)}`;
const edgeKey = (a, b) => [key(a), key(b)].sort().join("|");
const outerRings = (geom) =>
  (geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates).map((poly) => {
    const ring = poly[0];
    return key(ring[0]) === key(ring.at(-1)) ? ring.slice(0, -1) : ring;
  });
const pathLen = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts.at(-1)];
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const L = Math.hypot(dx, dy) || 1e-9;
  let [far, idx] = [0, 0];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L;
    if (d > far) [far, idx] = [d, i];
  }
  if (far <= eps) return [a, b];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
const rdpRing = (ring, eps) => {
  // split at the farthest pair so a closed ring keeps its shape
  const half = Math.floor(ring.length / 2);
  return [...rdp(ring.slice(0, half + 1), eps).slice(0, -1), ...rdp([...ring.slice(half), ring[0]], eps).slice(0, -1)];
};
function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function segDist([px, py], [ax, ay], [bx, by]) {
  const [dx, dy] = [bx - ax, by - ay];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1e-9)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
/** Walk an edge set into chains between junctions (and closed loops). */
function chains(edges) {
  const adj = new Map();
  const pt = new Map();
  for (const [a, b] of edges) {
    for (const [u, v] of [[a, b], [b, a]]) {
      pt.set(key(u), u);
      if (!adj.has(key(u))) adj.set(key(u), new Set());
      adj.get(key(u)).add(key(v));
    }
  }
  const used = new Set();
  const out = [];
  const walk = (start, next) => {
    const path = [start, next];
    used.add([start, next].sort().join("|"));
    let [prev, cur] = [start, next];
    while (adj.get(cur).size === 2 && cur !== start) {
      const nxt = [...adj.get(cur)].find((k) => k !== prev && !used.has([cur, k].sort().join("|")));
      if (!nxt) break;
      used.add([cur, nxt].sort().join("|"));
      path.push(nxt);
      [prev, cur] = [cur, nxt];
    }
    return path.map((k) => pt.get(k));
  };
  for (const [k, nb] of adj) if (nb.size !== 2) for (const m of nb) if (!used.has([k, m].sort().join("|"))) out.push(walk(k, m));
  for (const [k, nb] of adj) for (const m of nb) if (!used.has([k, m].sort().join("|"))) out.push(walk(k, m));
  return out;
}

// ---- the five states ----
const countries = load("ne_50m_admin_0_countries").features;
const five = countries.filter((f) => FIVE[f.properties.ADM0_A3]);
// rings too small to draw at this scale (islands, enclaves) are left out
const mainRings = (f) => outerRings(f.geometry).filter((r) => r.length >= 30);
const count = new Map();
for (const f of five)
  for (const ring of mainRings(f))
    ring.forEach((p, i) => {
      const k = edgeKey(p, ring[(i + 1) % ring.length]);
      count.set(k, (count.get(k) ?? 0) + 1);
    });
const edgesWhere = (want) => {
  const out = [];
  for (const f of five)
    for (const ring of mainRings(f))
      ring.forEach((p, i) => {
        const q = ring[(i + 1) % ring.length];
        const c = count.get(edgeKey(p, q));
        // a shared edge is listed by both states; keep it once
        if (c === want && (want === 1 || key(p) < key(q))) out.push([p, q]);
      });
  return out;
};
const inner = chains(edgesWhere(2));
// The outer boundary is one closed loop; cut it where the inner borders meet
// it, so simplification keeps those meeting points and every border joins.
const joins = new Set(inner.flatMap((c) => [key(c[0]), key(c.at(-1))]));
const outer = chains(edgesWhere(1)).flatMap((loop) => {
  const ring = key(loop[0]) === key(loop.at(-1)) ? loop.slice(0, -1) : loop;
  const at = ring.flatMap((p, i) => (joins.has(key(p)) ? [i] : []));
  if (!at.length) return [[...ring, ring[0]]];
  const rot = [...ring.slice(at[0]), ...ring.slice(0, at[0]), ring[at[0]]];
  const cuts = at.map((i) => (i - at[0] + ring.length) % ring.length).sort((a, b) => a - b);
  return cuts.map((c, j) => rot.slice(c, (cuts[j + 1] ?? ring.length) + 1));
});

// ---- the Caspian: every coast in its box that only one state claims ----
const inCaspian = ([lon, lat]) => lon > 46 && lon < 55.5 && lat > 36 && lat < 47.6;
const gcount = new Map();
const gowner = new Map();
for (const f of countries)
  for (const ring of outerRings(f.geometry).filter((r) => r.length >= 30))
    ring.forEach((p, i) => {
      const q = ring[(i + 1) % ring.length];
      if (!inCaspian(p) || !inCaspian(q)) return;
      const k = edgeKey(p, q);
      gcount.set(k, (gcount.get(k) ?? 0) + 1);
      gowner.set(k, f.properties.ADM0_A3);
    });
const coast = [];
for (const f of countries)
  for (const ring of outerRings(f.geometry).filter((r) => r.length >= 30))
    ring.forEach((p, i) => {
      const q = ring[(i + 1) % ring.length];
      if (gcount.get(edgeKey(p, q)) === 1 && inCaspian(p) && inCaspian(q)) coast.push([p, q]);
    });
const caspianLoop = chains(coast).sort((a, b) => b.length - a.length)[0];
// the far shore: the stretches of that loop that belong to other states
const farShore = [];
let run = [];
caspianLoop.forEach((p, i) => {
  const q = caspianLoop[(i + 1) % caspianLoop.length];
  const ours = FIVE[gowner.get(edgeKey(p, q))];
  if (!ours) run.push(p, q);
  else if (run.length) {
    farShore.push(run);
    run = [];
  }
});
if (run.length) farShore.push(run);

// ---- fit the box ----
const all = [...outer.flat(), ...caspianLoop].map(lcc);
const [x0, x1] = [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))];
const [y0, y1] = [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))];
const s = (W - 2 * MARGIN) / (x1 - x0);
const H = Math.round((y1 - y0) * s + 2 * MARGIN);
const P = (ll) => {
  const [x, y] = lcc(ll);
  return [MARGIN + (x - x0) * s, MARGIN + (y - y0) * s];
};
const r1 = (pts) => pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
const line = (lls, eps) => r1(rdp(lls.map(P), eps));
const ringOf = (lls, eps) => r1(rdpRing(lls.map(P), eps));

// a river that runs along a border is drawn by the border line alone
const borderP = [...outer, ...inner].map((c) => c.map(P));
const nearBorder = (p, pad) => borderP.some((c) => c.some((q, i) => i && segDist(p, c[i - 1], q) < pad));
const insideFive = (() => {
  const polys = five.flatMap((f) => mainRings(f).map((r) => r.map(P)));
  return (p) => polys.some((poly) => inPoly(p, poly));
})();

// ---- rivers, clipped to the region and kept off the border lines ----
const rivers = [];
for (const f of load("ne_50m_rivers_lake_centerlines").features) {
  if (!RIVERS.includes(f.properties.name)) continue;
  const lines = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const l of lines) {
    let cur = [];
    for (const ll of l) {
      const p = P(ll);
      if (insideFive(p) && !nearBorder(p, 3)) cur.push(p);
      else {
        if (cur.length > 1) rivers.push(cur);
        cur = [];
      }
    }
    if (cur.length > 1) rivers.push(cur);
  }
}

const lakes = load("ne_50m_lakes")
  .features.filter((f) => LAKES.includes(f.properties.name))
  .map((f) => ({ name: f.properties.name, ring: ringOf(outerRings(f.geometry)[0], 0.5) }));

const data = {
  source: "Natural Earth 1:50m (public domain), via scripts/region-map.mjs",
  vb: [W, H],
  outer: outer.map((c) => line(c, 1.1)).filter((c) => pathLen(c) > 6),
  inner: inner.map((c) => line(c, 1.1)).filter((c) => pathLen(c) > 6),
  farShore: farShore.map((c) => line(c, 1.1)).filter((c) => pathLen(c) > 6),
  caspian: ringOf(caspianLoop, 1.1),
  lakes,
  rivers: rivers.map((c) => r1(rdp(c, 1))).filter((c) => pathLen(c) > 16),
  states: five.map((f) => ({
    code: FIVE[f.properties.ADM0_A3],
    ring: ringOf(mainRings(f).sort((a, b) => b.length - a.length)[0], 0.8),
  })),
  capitals: r1(CAPITALS.map(P)),
};
writeFileSync(OUT, JSON.stringify(data));
console.log(
  `region-map.json: ${W}×${H}, outer ${data.outer.length}, inner ${data.inner.length}, far shore ${data.farShore.length}, rivers ${data.rivers.length}, lakes ${data.lakes.length}, points ${JSON.stringify(data).length} chars`,
);
