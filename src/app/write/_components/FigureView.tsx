"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { cx } from "@/app/_components/ui/cx";

// The figure inside the editor: the image as the reader will see it, and its
// caption as a plain field right under it, so captioning happens in place
// rather than in a dialog. Width and alt text live in the figure toolbar
// (FormatMenus.tsx), which appears when the figure is selected.
export function FigureView({ node, updateAttributes, selected, editor }: ReactNodeViewProps) {
  const { src, alt, caption, width } = node.attrs as {
    src: string;
    alt: string;
    caption: string;
    width: string;
  };

  return (
    <NodeViewWrapper
      as="figure"
      className={cx("a-figure", `a-figure-${width}`, "wr-figure", selected && "is-selected")}
      data-drag-handle=""
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} draggable={false} />
      {editor.isEditable ? (
        <input
          className="wr-caption"
          value={caption}
          placeholder="Add a caption (optional)"
          maxLength={600}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          // Keep ProseMirror from treating keys typed here as document edits.
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              editor.chain().focus().createParagraphNear().run();
            }
          }}
          onPaste={(e) => e.stopPropagation()}
        />
      ) : (
        caption && <figcaption>{caption}</figcaption>
      )}
    </NodeViewWrapper>
  );
}
