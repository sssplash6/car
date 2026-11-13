"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import {
  CheckIcon,
  CodeIcon,
  CornersOutIcon,
  HighlighterIcon,
  LinkBreakIcon,
  LinkSimpleIcon,
  QuotesIcon,
  RectangleIcon,
  TextAlignCenterIcon,
  TextBIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextSuperscriptIcon,
  TextUnderlineIcon,
  TrashIcon,
  ArrowsOutLineHorizontalIcon,
} from "@phosphor-icons/react";
import { cx } from "@/app/_components/ui/cx";

// The two floating toolbars. Text: appears over a selection with the inline
// marks, block types and links. Figure: appears when an image is selected,
// with its width, alt text and delete. Nothing formats from a fixed toolbar:
// the page stays a page until the writer asks for something.

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl+";

function Tool({
  label,
  shortcut,
  active,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cx("wr-tool", active && "is-active")}
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label}  ${shortcut}` : label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="wr-tool-sep" aria-hidden="true" />;

/** Give the caret back to the text once a small form (link, alt text)
    closes. On the next frame, because the form's input unmounting in the
    same render would otherwise leave focus on <body>, and the next "/"
    typed would open site search instead of the block menu. */
function refocus(editor: Editor) {
  requestAnimationFrame(() => editor.commands.focus());
}

/** Normalise what the writer typed into a link: bare domains get https. */
function normaliseUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^(https?:|mailto:|\/|#)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  return `https://${v}`;
}

export function TextMenu({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      highlight: e.isActive("highlight"),
      sup: e.isActive("superscript"),
      link: e.isActive("link"),
      href: (e.getAttributes("link").href as string | undefined) ?? "",
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      quote: e.isActive("blockquote"),
      center: e.isActive({ textAlign: "center" }),
    }),
  });

  useEffect(() => {
    if (linking) input.current?.focus();
  }, [linking]);

  const openLink = () => {
    setUrl(s.href);
    setLinking(true);
  };
  const applyLink = () => {
    const href = normaliseUrl(url);
    const chain = editor.chain().focus().extendMarkRange("link");
    (href ? chain.setLink({ href }) : chain.unsetLink())
      // Land the caret after the link, so the next keystroke carries on
      // writing instead of replacing the linked words.
      .command(({ tr }) => {
        tr.setSelection(TextSelection.create(tr.doc, tr.selection.to));
        return true;
      })
      .run();
    setLinking(false);
    refocus(editor);
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="textMenu"
      className="wr-pop wr-bubble"
      options={{ placement: "top", offset: 10, flip: true, shift: { padding: 12 }, onHide: () => setLinking(false) }}
      shouldShow={({ editor: e, state, from, to }) => {
        if (!e.isEditable || from === to) return false;
        if (state.selection instanceof NodeSelection) return false;
        if (e.isActive("codeBlock")) return false;
        return true;
      }}
    >
      {linking ? (
        <form
          className="wr-linkform"
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
        >
          <input
            ref={input}
            className="wr-linkinput"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste or type a link"
            aria-label="Link address"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setLinking(false);
                refocus(editor);
              }
            }}
          />
          <Tool label="Apply link" onClick={applyLink}>
            <CheckIcon />
          </Tool>
          {s.link && (
            <Tool
              label="Remove link"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                setLinking(false);
                refocus(editor);
              }}
            >
              <LinkBreakIcon />
            </Tool>
          )}
        </form>
      ) : (
        <div className="wr-tools" role="toolbar" aria-label="Format">
          <Tool label="Bold" shortcut={`${mod}B`} active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <TextBIcon weight="bold" />
          </Tool>
          <Tool label="Italic" shortcut={`${mod}I`} active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <TextItalicIcon />
          </Tool>
          <Tool label="Underline" shortcut={`${mod}U`} active={s.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <TextUnderlineIcon />
          </Tool>
          <Tool label="Strikethrough" active={s.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <TextStrikethroughIcon />
          </Tool>
          <Tool label="Highlight" active={s.highlight} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <HighlighterIcon />
          </Tool>
          <Tool label="Link" shortcut={`${mod}K`} active={s.link} onClick={openLink}>
            <LinkSimpleIcon />
          </Tool>
          <Sep />
          <Tool label="Heading" active={s.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <TextHTwoIcon />
          </Tool>
          <Tool label="Subheading" active={s.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <TextHThreeIcon />
          </Tool>
          <Tool label="Quote" active={s.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <QuotesIcon />
          </Tool>
          <Sep />
          <Tool
            label="Centre"
            active={s.center}
            onClick={() =>
              s.center
                ? editor.chain().focus().unsetTextAlign().run()
                : editor.chain().focus().setTextAlign("center").run()
            }
          >
            <TextAlignCenterIcon />
          </Tool>
          <Tool label="Footnote mark (superscript)" active={s.sup} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
            <TextSuperscriptIcon />
          </Tool>
          <Tool label="Inline code" active={s.code} onClick={() => editor.chain().focus().toggleCode().run()}>
            <CodeIcon />
          </Tool>
        </div>
      )}
    </BubbleMenu>
  );
}

export function FigureMenu({ editor }: { editor: Editor }) {
  const [altOpen, setAltOpen] = useState(false);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const attrs = e.getAttributes("figure") as { width?: string; alt?: string };
      return { width: attrs.width ?? "normal", alt: attrs.alt ?? "" };
    },
  });
  const setWidth = (width: string) => editor.chain().focus().updateAttributes("figure", { width }).run();

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="figureMenu"
      className="wr-pop wr-bubble"
      options={{ placement: "top", offset: 10, flip: true, shift: { padding: 12 }, onHide: () => setAltOpen(false) }}
      shouldShow={({ editor: e }) => e.isEditable && e.isActive("figure")}
    >
      {altOpen ? (
        <form
          className="wr-linkform"
          onSubmit={(e) => {
            e.preventDefault();
            setAltOpen(false);
            refocus(editor);
          }}
        >
          <input
            autoFocus
            className="wr-linkinput"
            value={s.alt}
            maxLength={300}
            onChange={(e) => editor.commands.updateAttributes("figure", { alt: e.target.value })}
            placeholder="Describe the image for screen readers"
            aria-label="Alt text"
          />
          <Tool
            label="Done"
            onClick={() => {
              setAltOpen(false);
              refocus(editor);
            }}
          >
            <CheckIcon />
          </Tool>
        </form>
      ) : (
        <div className="wr-tools" role="toolbar" aria-label="Image">
          <Tool label="Column width" active={s.width === "normal"} onClick={() => setWidth("normal")}>
            <RectangleIcon />
          </Tool>
          <Tool label="Wide" active={s.width === "wide"} onClick={() => setWidth("wide")}>
            <ArrowsOutLineHorizontalIcon />
          </Tool>
          <Tool label="Full width" active={s.width === "full"} onClick={() => setWidth("full")}>
            <CornersOutIcon />
          </Tool>
          <Sep />
          <button
            type="button"
            className={cx("wr-tool wr-tool-text", s.alt && "is-set")}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setAltOpen(true)}
          >
            {s.alt ? "Alt ✓" : "Alt text"}
          </button>
          <Sep />
          <Tool label="Remove image" onClick={() => editor.chain().focus().deleteSelection().run()}>
            <TrashIcon />
          </Tool>
        </div>
      )}
    </BubbleMenu>
  );
}
