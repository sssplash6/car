"use client";

import { Extension, type Editor, type Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useEffect, useImperativeHandle, useState, type ReactNode } from "react";
import {
  CodeBlockIcon,
  ImageIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  MinusIcon,
  QuotesIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextTIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import { cx } from "@/app/_components/ui/cx";

// The "/" menu: type a slash anywhere and pick a block. The list filters as
// you keep typing ("/quo" → Quote) and is driven entirely from the keyboard;
// the mouse works too. Image and video hand off to the editor (file picker,
// link dialog) through the callbacks passed to SlashCommand.configure().

export type SlashHandlers = {
  pickImage: (editor: Editor) => void;
  embedVideo: (editor: Editor) => void;
};

type Item = {
  title: string;
  hint: string;
  keywords: string;
  icon: ReactNode;
  run: (editor: Editor, range: Range, handlers: SlashHandlers) => void;
};

const ITEMS: Item[] = [
  {
    title: "Text",
    hint: "Plain paragraph",
    keywords: "paragraph text body",
    icon: <TextTIcon />,
    run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run(),
  },
  {
    title: "Heading",
    hint: "Section title",
    keywords: "h2 heading title section",
    icon: <TextHTwoIcon />,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
  },
  {
    title: "Subheading",
    hint: "Smaller title",
    keywords: "h3 subheading subtitle",
    icon: <TextHThreeIcon />,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
  },
  {
    title: "Quote",
    hint: "Set a passage apart",
    keywords: "quote blockquote citation",
    icon: <QuotesIcon />,
    run: (e, r) => e.chain().focus().deleteRange(r).setBlockquote().run(),
  },
  {
    title: "Bulleted list",
    hint: "Points in no order",
    keywords: "bullet list unordered ul",
    icon: <ListBulletsIcon />,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    hint: "Steps in order",
    keywords: "numbered ordered list ol",
    icon: <ListNumbersIcon />,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    title: "Image",
    hint: "Upload, with a caption",
    keywords: "image picture photo figure upload",
    icon: <ImageIcon />,
    run: (e, r, h) => {
      e.chain().focus().deleteRange(r).run();
      h.pickImage(e);
    },
  },
  {
    title: "Video",
    hint: "Embed from YouTube",
    keywords: "video youtube embed",
    icon: <YoutubeLogoIcon />,
    run: (e, r, h) => {
      e.chain().focus().deleteRange(r).run();
      h.embedVideo(e);
    },
  },
  {
    title: "Divider",
    hint: "A section break",
    keywords: "divider rule hr break separator",
    icon: <MinusIcon />,
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
  {
    title: "Code",
    hint: "Monospaced block",
    keywords: "code block pre",
    icon: <CodeBlockIcon />,
    run: (e, r) => e.chain().focus().deleteRange(r).setCodeBlock().run(),
  },
];

function filter(query: string): Item[] {
  const q = query.toLowerCase().trim();
  if (!q) return ITEMS;
  return ITEMS.filter((i) => i.title.toLowerCase().includes(q) || i.keywords.includes(q));
}

type ListHandle = { onKeyDown: (event: KeyboardEvent) => boolean };
type ListProps = SuggestionProps<Item> & { handlers: SlashHandlers };

const SlashList = forwardRef<ListHandle, ListProps>(function SlashList(props, ref) {
  const { items, editor, range, handlers } = props;
  const [active, setActive] = useState(0);

  // A new query is a new list: start from its first item.
  useEffect(() => setActive(0), [items]);

  const choose = (index: number) => {
    const item = items[index];
    if (item) item.run(editor, range, handlers);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (!items.length) return false;
      if (event.key === "ArrowDown") {
        setActive((a) => (a + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setActive((a) => (a - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        choose(active);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return <div className="wr-pop wr-slash"><p className="wr-slash-empty">No block called that</p></div>;
  }

  return (
    <div className="wr-pop wr-slash" role="listbox" aria-label="Insert a block">
      <p className="wr-slash-head t-meta">Blocks</p>
      {items.map((item, i) => (
        <button
          key={item.title}
          type="button"
          role="option"
          aria-selected={i === active}
          className={cx("wr-slash-item", i === active && "is-active")}
          onMouseEnter={() => setActive(i)}
          onMouseDown={(e) => {
            e.preventDefault(); // keep the editor's selection
            choose(i);
          }}
        >
          <span className="wr-slash-icon" aria-hidden="true">{item.icon}</span>
          <span className="wr-slash-text">
            <span className="wr-slash-title">{item.title}</span>
            <span className="wr-slash-hint">{item.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
});

/** Position the floating list under the caret, flipping above near the bottom. */
function place(el: HTMLElement, rect: DOMRect | null | undefined) {
  if (!rect) return;
  const height = el.offsetHeight || 320;
  const below = rect.bottom + 8;
  const top = below + height > window.innerHeight - 12 ? rect.top - height - 8 : below;
  const left = Math.min(rect.left, window.innerWidth - el.offsetWidth - 12);
  el.style.top = `${Math.max(12, top)}px`;
  el.style.left = `${Math.max(12, left)}px`;
}

export const SlashCommand = Extension.create<{ handlers: SlashHandlers }>({
  name: "slashCommand",

  addOptions() {
    return { handlers: { pickImage: () => {}, embedVideo: () => {} } };
  },

  addProseMirrorPlugins() {
    const handlers = this.options.handlers;
    return [
      Suggestion<Item>({
        editor: this.editor,
        char: "/",
        // Not in code, and only where a block could start: after a space or
        // at the start of a line, so "and/or" and URLs never open it.
        allowedPrefixes: [" "],
        allow: ({ editor }) => !editor.isActive("codeBlock"),
        items: ({ query }) => filter(query),
        command: ({ editor, range, props }) => props.run(editor, range, handlers),
        render: () => {
          let renderer: ReactRenderer<ListHandle, ListProps> | null = null;
          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashList, {
                props: { ...props, handlers },
                editor: props.editor,
              });
              const el = renderer.element as HTMLElement;
              el.classList.add("wr-float");
              document.body.appendChild(el);
              requestAnimationFrame(() => place(el, props.clientRect?.()));
            },
            onUpdate: (props) => {
              renderer?.updateProps({ ...props, handlers });
              if (renderer) requestAnimationFrame(() => place(renderer!.element as HTMLElement, props.clientRect?.()));
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                renderer?.destroy();
                renderer?.element.remove();
                renderer = null;
                return true;
              }
              return renderer?.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => {
              renderer?.destroy();
              renderer?.element.remove();
              renderer = null;
            },
          };
        },
      }),
    ];
  },
});
