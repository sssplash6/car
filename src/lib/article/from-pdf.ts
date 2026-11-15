// Turn an uploaded PDF into an article document (the editor's ProseMirror
// JSON), so a paper can be read as text on its page instead of only as a
// download.
//
// A PDF has no paragraphs, only positioned runs of text, so the structure is
// rebuilt from the layout:
//   - runs on (nearly) one baseline make a line; small raised runs on it are
//     footnote markers and keep a superscript mark
//   - a paragraph starts at an indented line or after a vertical gap
//   - a line of asterisks is a section break (horizontal rule)
//   - a short all-caps or large line is a heading ("NOTES" -> "Notes")
//   - "1. ..." lines after a heading become an ordered list
//   - the front matter before the body (eyebrow, title, authors) and the
//     running footer are dropped, since the page shows them already
//
// Best effort by design: a scanned PDF (no text layer) or an unusual layout
// returns null and the paper simply keeps its download. Never throws.
//
// Plain module (no server-only, no "@/" imports) so it can be exercised from
// a node script against real PDFs. The caller still runs the result through
// sanitizeDoc() before storing it.

import type { JSONContent } from "@tiptap/core";
import { getDocumentProxy } from "unpdf";

type Run = { str: string; x: number; y: number; h: number; w: number };
type Seg = { text: string; sup?: boolean };
type Line = { segs: Seg[]; text: string; x: number; y: number; size: number; page: number; gapBefore: number };

/** The most common value, rounded to half a point. */
function mode(values: number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) {
    const k = Math.round(v * 2) / 2;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best = 0;
  let bestCount = -1;
  for (const [k, c] of counts) if (c > bestCount) [best, bestCount] = [k, c];
  return best;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
const ASTERISM = /^[*·•⁂∗](\s*[*·•⁂∗])*$/;
/** "N O T E S" -> "NOTES": letter-spaced small caps come out one letter per word. */
const unspace = (s: string) => (/^(\S ){2,}\S$/.test(s.trim()) ? s.replace(/ /g, "") : s);

/** Join a line's runs into segments, spacing runs that sit apart. */
function buildLine(runs: Run[], page: number, bodySize: number): Line | null {
  runs.sort((a, b) => a.x - b.x);
  const solid = runs.filter((r) => r.h > 0 && r.str.trim());
  if (!solid.length) return null;
  const size = Math.max(...solid.map((r) => r.h));
  const base = solid.find((r) => r.h >= size * 0.8) ?? solid[0];

  const segs: Seg[] = [];
  let prevEnd = -Infinity;
  for (const r of runs) {
    if (!r.str) continue;
    const sup = r.h > 0 && r.h < size * 0.8 && r.y > base.y + 0.5 && size >= bodySize * 0.9;
    let text = r.str;
    const last = segs[segs.length - 1];
    const needsSpace =
      last && r.x - prevEnd > size * 0.15 && !/\s$/.test(last.text) && !/^\s/.test(text) && !sup;
    if (needsSpace) text = ` ${text}`;
    if (last && !!last.sup === sup) last.text += text;
    else segs.push(sup ? { text: text.trim(), sup } : { text });
    prevEnd = Math.max(prevEnd, r.x + r.w);
  }
  const text = segs.map((s) => s.text).join("");
  if (!text.trim()) return null;
  return { segs, text, x: base.x, y: base.y, size, page, gapBefore: 0 };
}

export async function pdfToDoc(
  bytes: Uint8Array,
  known: { title?: string; authorLine?: string } = {},
): Promise<JSONContent | null> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const pages: Run[][] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const { items } = await (await pdf.getPage(p)).getTextContent();
      const runs: Run[] = [];
      for (const it of items) {
        if (!("str" in it) || !it.str) continue;
        runs.push({ str: it.str, x: it.transform[4], y: it.transform[5], h: it.height, w: it.width });
      }
      pages.push(runs);
    }

    const all = pages.flat().filter((r) => r.h > 0 && r.str.trim().length > 1);
    if (all.length < 10) return null; // no text layer: a scan
    const bodySize = mode(all.flatMap((r) => Array(Math.min(r.str.length, 200)).fill(r.h)));

    // Runs -> lines, page by page. A run joins the open line while its baseline
    // is within half a line of it, which also catches raised footnote markers.
    const lines: Line[] = [];
    pages.forEach((runs, i) => {
      let open: Run[] = [];
      let openY = NaN; // baseline of the open line, from its first solid run
      const flush = () => {
        const line = buildLine(open, i + 1, bodySize);
        if (line) lines.push(line);
        open = [];
        openY = NaN;
      };
      for (const r of runs) {
        const solid = r.h > 0 && r.str.trim() !== "";
        if (solid && !Number.isNaN(openY) && Math.abs(r.y - openY) > bodySize * 0.5) flush();
        if (solid && Number.isNaN(openY)) openY = r.y;
        open.push(r);
      }
      flush();
    });
    if (!lines.length) return null;

    // Vertical rhythm and left margin of the body text.
    const bodyLines = lines.filter((l) => Math.abs(l.size - bodySize) < 0.6);
    const spacings: number[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].page === lines[i - 1].page) {
        const gap = lines[i - 1].y - lines[i].y;
        lines[i].gapBefore = gap;
        if (gap > 0 && bodyLines.includes(lines[i]) && bodyLines.includes(lines[i - 1])) spacings.push(gap);
      } else {
        lines[i].gapBefore = 0;
      }
    }
    const spacing = median(spacings) || bodySize * 1.5;
    const left = mode(bodyLines.map((l) => l.x));

    // Drop the front matter (everything before the first body-size line that is
    // not the title or the authors) and a running footer.
    const title = norm(known.title ?? "");
    const authors = norm(known.authorLine ?? "");
    const repeats = new Map<string, Set<number>>();
    for (const l of lines) {
      const k = norm(l.text);
      if (!repeats.has(k)) repeats.set(k, new Set());
      repeats.get(k)!.add(l.page);
    }
    let started = false;
    const kept = lines.filter((l, i) => {
      const k = norm(l.text);
      if (k === title || k === authors) return false;
      const asterism = ASTERISM.test(k);
      if (!asterism && (repeats.get(k)?.size ?? 0) > 1 && k.length < 140) return false;
      if (/^\d{1,4}$/.test(k)) return false; // page numbers
      const lastOnPage = !lines[i + 1] || lines[i + 1].page !== l.page;
      if (lastOnPage && l.size < bodySize * 0.85 && l.gapBefore > spacing * 1.8) return false;
      if (!started) {
        // Body-ish size: an epigraph set a little larger still counts; the
        // eyebrow (small) and the title (large) do not.
        if (l.size < bodySize * 0.9 || l.size > bodySize * 1.25) return false;
        started = true;
      }
      return true;
    });

    // Lines -> blocks.
    const content: JSONContent[] = [];
    let para: Seg[] | null = null;
    let list: Seg[][] | null = null;
    let afterHeading = false;

    const toInline = (segs: Seg[]): JSONContent[] =>
      segs
        .map((s, j) => (segs[j + 1]?.sup ? { ...s, text: s.text.trimEnd() } : s))
        .map((s) => ({ ...s, text: s.text.replace(/ʼ/g, "’").replace(/\s+/g, " ") }))
        .filter((s) => s.text)
        .reduce<Seg[]>((acc, s) => {
          const prev = acc[acc.length - 1];
          if (prev && !!prev.sup === !!s.sup) prev.text += s.text;
          else acc.push({ ...s });
          return acc;
        }, [])
        .map((s) => (s.sup ? { type: "text", text: s.text, marks: [{ type: "superscript" }] } : { type: "text", text: s.text }));
    const trimSegs = (segs: Seg[]) => {
      if (segs.length) {
        segs[0] = { ...segs[0], text: segs[0].text.replace(/^\s+/, "") };
        const z = segs.length - 1;
        segs[z] = { ...segs[z], text: segs[z].text.replace(/\s+$/, "") };
      }
      return segs;
    };
    const paragraph = (segs: Seg[]): JSONContent => ({ type: "paragraph", content: toInline(trimSegs(segs)) });
    const closePara = () => {
      if (para) content.push(paragraph(para));
      para = null;
    };
    const closeList = () => {
      if (list?.length) {
        content.push({
          type: "orderedList",
          attrs: { start: 1 },
          content: list.map((item) => ({ type: "listItem", content: [paragraph(item)] })),
        });
      }
      list = null;
    };
    const append = (into: Seg[], segs: Seg[]) => {
      const last = into[into.length - 1];
      const hyphenated = last && !last.sup && /[A-Za-zÀ-ÿА-яЁё]-$/.test(last.text.trimEnd());
      const glue = hyphenated || segs[0]?.sup ? "" : " ";
      if (last && segs[0]?.sup) last.text = last.text.trimEnd();
      if (last) last.text = last.text.trimEnd();
      into.push(...segs.map((s, j) => (j === 0 && !s.sup ? { ...s, text: glue + s.text.trimStart() } : s)));
    };

    for (const l of kept) {
      const t = unspace(l.text.trim());
      const bigGap = l.gapBefore > spacing * 1.5;
      const indented = l.x > left + bodySize * 0.6;

      if (ASTERISM.test(t)) {
        closePara();
        closeList();
        content.push({ type: "horizontalRule" });
        afterHeading = false;
        continue;
      }

      const letters = t.replace(/[^A-Za-zА-яЁё]/g, "");
      const allCaps = letters.length >= 3 && letters === letters.toUpperCase();
      const isHeading =
        t.length <= 80 &&
        !/[.,;:]$/.test(t) &&
        ((l.size >= bodySize * 1.2) || (allCaps && t.split(/\s+/).length <= 6 && (bigGap || !para)));
      if (isHeading) {
        closePara();
        closeList();
        const text = allCaps ? t.charAt(0) + t.slice(1).toLowerCase() : t;
        content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] });
        afterHeading = true;
        continue;
      }

      const numbered = /^\d{1,3}[.)]\s/.test(t);
      if (numbered && (list || afterHeading)) {
        closePara();
        list ??= [];
        list.push(l.segs.map((s, j) => (j === 0 ? { ...s, text: s.text.replace(/^\s*\d{1,3}[.)]\s*/, "") } : s)));
        continue;
      }
      if (list && !bigGap) {
        append(list[list.length - 1], l.segs);
        continue;
      }
      closeList();
      afterHeading = false;

      if (!para || bigGap || indented) {
        closePara();
        para = [...l.segs];
      } else {
        append(para, l.segs);
      }
    }
    closePara();
    closeList();

    const words = content
      .flatMap(function walk(n: JSONContent): string[] {
        return n.type === "text" ? [n.text ?? ""] : (n.content ?? []).flatMap(walk);
      })
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;
    if (words < 30) return null;

    return { type: "doc", content };
  } catch (err) {
    console.error("[pdf-text] could not read the PDF's text:", err);
    return null;
  }
}
