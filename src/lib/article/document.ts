// Article documents on the server: sanitise what the editor sends, render it
// to HTML, and measure it.
//
// The editor is a client and a client can send anything, so every save goes
// through sanitizeDoc() before it reaches the database. It keeps only the node
// and mark types in extensions.ts, clamps every attribute to its legal values,
// and then has ProseMirror check the result against the real schema. The HTML
// renderer escapes text and attributes as well, so a stored document cannot
// carry markup or script onto the reading page by either route.

import "server-only";

import { getSchema, type JSONContent } from "@tiptap/core";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import { Node as PMNode } from "@tiptap/pm/model";
import { FIGURE_WIDTHS, articleExtensions } from "./extensions";

/** Serialised body cap. Text only (images are URLs), so this is a very long essay. */
export const MAX_BODY_BYTES = 1_000_000;

const schema = getSchema(articleExtensions);

const NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "figure",
  "youtube",
]);
const MARKS = new Set(["bold", "italic", "underline", "strike", "code", "link", "highlight", "subscript", "superscript"]);
const ALIGN = new Set(["left", "center", "right"]);

export const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

/** http(s), mailto, or a same-site path. Never javascript:, data: and friends. */
export function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const value = href.trim();
  if (!value || value.length > 2000) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Images from our own media store, the shipped covers, or any https host. */
export function safeImageSrc(src: unknown): string | null {
  if (typeof src !== "string") return null;
  const value = src.trim();
  if (/^\/api\/media\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(value)) return value;
  if (/^\/covers\/[a-z0-9-]+\.(jpg|png|webp)$/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && value.length <= 2000 ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Only YouTube's own embed hosts may be framed. */
function safeYoutube(src: unknown): string | null {
  if (typeof src !== "string") return null;
  try {
    const url = new URL(src);
    const host = url.hostname.replace(/^www\./, "");
    const ok = ["youtube.com", "youtube-nocookie.com", "youtu.be", "m.youtube.com", "music.youtube.com"];
    return url.protocol === "https:" && ok.includes(host) ? url.toString() : null;
  } catch {
    return null;
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function cleanMarks(marks: unknown): JSONContent["marks"] {
  if (!Array.isArray(marks)) return undefined;
  const out: NonNullable<JSONContent["marks"]> = [];
  for (const mark of marks) {
    if (!mark || typeof mark !== "object" || !MARKS.has(mark.type)) continue;
    if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (href) out.push({ type: "link", attrs: { href } });
      continue;
    }
    out.push({ type: mark.type });
  }
  return out.length ? out : undefined;
}

function cleanNode(node: unknown): JSONContent | null {
  if (!node || typeof node !== "object") return null;
  const n = node as JSONContent;
  if (!n.type || !NODES.has(n.type)) return null;

  if (n.type === "text") {
    const text = typeof n.text === "string" ? n.text : "";
    if (!text) return null;
    const marks = cleanMarks(n.marks);
    return marks ? { type: "text", text, marks } : { type: "text", text };
  }

  const out: JSONContent = { type: n.type };
  const a = (n.attrs ?? {}) as Record<string, unknown>;

  switch (n.type) {
    case "heading":
      out.attrs = { level: a.level === 3 ? 3 : 2, textAlign: ALIGN.has(a.textAlign as string) ? a.textAlign : null };
      break;
    case "paragraph":
      out.attrs = { textAlign: ALIGN.has(a.textAlign as string) ? a.textAlign : null };
      break;
    case "orderedList":
      out.attrs = { start: Number.isInteger(a.start) && (a.start as number) > 0 ? a.start : 1 };
      break;
    case "codeBlock": {
      const language = str(a.language, 30);
      out.attrs = { language: /^[a-z0-9+#-]+$/i.test(language) ? language : null };
      break;
    }
    case "figure": {
      const src = safeImageSrc(a.src);
      if (!src) return null;
      out.attrs = {
        src,
        alt: str(a.alt, 300),
        caption: str(a.caption, 600),
        width: FIGURE_WIDTHS.includes(a.width as never) ? a.width : "normal",
      };
      return out;
    }
    case "youtube": {
      const src = safeYoutube(a.src);
      if (!src) return null;
      out.attrs = { src, start: Number.isInteger(a.start) ? a.start : 0 };
      return out;
    }
  }

  if (Array.isArray(n.content)) {
    const content = n.content.map(cleanNode).filter((c): c is JSONContent => c !== null);
    if (content.length) out.content = content;
  }
  return out;
}

/**
 * Turn whatever the client sent into a document that is valid against the
 * article schema, or throw. Unknown nodes and marks are dropped rather than
 * rejected: a paste from Word should lose its oddities, not fail the save.
 */
export function sanitizeDoc(input: unknown): JSONContent {
  const cleaned = cleanNode(input);
  if (!cleaned || cleaned.type !== "doc") return EMPTY_DOC;
  if (!cleaned.content?.length) return EMPTY_DOC;
  // ProseMirror's own structural check (a listItem outside a list, a heading
  // inside a heading). Throws RangeError on an invalid tree.
  PMNode.fromJSON(schema, cleaned).check();
  return cleaned;
}

/** Parse a stored body. Stored bodies were sanitised on save; a corrupt one
    renders as empty instead of taking the page down. */
export function parseBody(body: string | null | undefined): JSONContent {
  if (!body) return EMPTY_DOC;
  try {
    return JSON.parse(body) as JSONContent;
  } catch {
    return EMPTY_DOC;
  }
}

export function renderBody(doc: JSONContent): string {
  return renderToHTMLString({ content: doc, extensions: articleExtensions });
}

/** Plain text of the body, blocks separated by blank lines. */
export function bodyText(doc: JSONContent): string {
  const blocks: string[] = [];
  const walk = (node: JSONContent, into: string[]) => {
    if (node.type === "text") into.push(node.text ?? "");
    else if (node.type === "hardBreak") into.push(" ");
    node.content?.forEach((child) => walk(child, into));
  };
  for (const block of doc.content ?? []) {
    const parts: string[] = [];
    walk(block, parts);
    const text = parts.join("").trim();
    if (text) blocks.push(text);
  }
  return blocks.join("\n\n");
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Reading time at 230 words a minute, never less than one. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 230));
}

/** First ~maxChars of the body, cut at a word, for listings and search. */
export function excerpt(text: string, maxChars = 320): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxChars) return flat;
  const cut = flat.slice(0, maxChars);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.!?-]+$/, "")}…`;
}
