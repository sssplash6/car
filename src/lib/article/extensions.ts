// The article document schema, shared by the editor (client) and the renderer
// (server). One list on purpose: if the two ever disagreed, the editor could
// write a node the reading page cannot draw, or the page could draw markup the
// editor never allowed.
//
// No React and no DOM in this file. The editor adds its node views and its
// client-only extensions (placeholder, character count) on top.

import { Node, type Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Youtube from "@tiptap/extension-youtube";

export const FIGURE_WIDTHS = ["normal", "wide", "full"] as const;
export type FigureWidth = (typeof FIGURE_WIDTHS)[number];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      /** Insert an image figure at the selection. */
      setFigure: (attrs: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

/**
 * An image with an optional caption and a width (column, wide, full bleed).
 * An atom: the caption is an attribute edited in the node view, not nested
 * rich text, so a figure can never swallow paragraphs.
 */
export const Figure = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    // rendered: false — renderHTML below builds the markup itself, so the raw
    // attributes never leak onto the <figure> as stray HTML attributes.
    return {
      src: { default: null, rendered: false },
      alt: { default: "", rendered: false },
      caption: { default: "", rendered: false },
      width: { default: "normal", rendered: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-figure]",
        getAttrs: (el) => {
          const img = (el as HTMLElement).querySelector("img");
          return {
            src: img?.getAttribute("src") ?? null,
            alt: img?.getAttribute("alt") ?? "",
            caption: (el as HTMLElement).querySelector("figcaption")?.textContent ?? "",
            width: (el as HTMLElement).getAttribute("data-width") ?? "normal",
          };
        },
      },
      {
        // A bare image pasted from elsewhere becomes a figure.
        tag: "img[src]",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("src"),
          alt: (el as HTMLElement).getAttribute("alt") ?? "",
        }),
      },
    ];
  },

  renderHTML({ node }) {
    const { src, alt, caption, width } = node.attrs as {
      src: string;
      alt: string;
      caption: string;
      width: FigureWidth;
    };
    const img = ["img", { src, alt, loading: "lazy", decoding: "async" }] as const;
    return caption
      ? ["figure", { "data-figure": "", "data-width": width, class: `a-figure a-figure-${width}` }, img, ["figcaption", {}, caption]]
      : ["figure", { "data-figure": "", "data-width": width, class: `a-figure a-figure-${width}` }, img];
  },

  addCommands() {
    return {
      setFigure:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

/** Link protocols an article may use. Anything else is stripped on save. */
export const LINK_PROTOCOLS = ["http", "https", "mailto"];

export const articleExtensions: Extensions = [
  StarterKit.configure({
    // h1 is the article title; the body starts at h2.
    heading: { levels: [2, 3] },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: LINK_PROTOCOLS,
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    },
  }),
  Highlight,
  Subscript,
  Superscript,
  TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right"] }),
  Typography,
  Youtube.configure({
    nocookie: true,
    modestBranding: true,
    HTMLAttributes: { class: "a-embed" },
  }),
  Figure,
];

