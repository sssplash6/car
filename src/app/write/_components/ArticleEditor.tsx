"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, ReactNodeViewRenderer, useEditor, useEditorState } from "@tiptap/react";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CircleNotchIcon,
  CloudCheckIcon,
  EyeIcon,
  ImageIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  SlidersHorizontalIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Figure, articleExtensions } from "@/lib/article/extensions";
import { ArticleLayout } from "@/app/_components/article/ArticleLayout";
import { cx } from "@/app/_components/ui/cx";
import {
  createArticle,
  deleteArticle,
  saveArticle,
  submitArticle,
  uploadImage,
  withdrawArticle,
  type ArticleDraft,
} from "@/app/write/actions";
import { FigureView } from "./FigureView";
import { FigureMenu, TextMenu } from "./FormatMenus";
import { SlashCommand, type SlashHandlers } from "./SlashMenu";
import "../editor.css";

// The writing room. One column, the page as it will read: cover, title,
// standfirst, byline, text. Formatting appears only when asked for (select
// text, or type "/"); everything saves itself a moment after the writer
// stops; nothing reaches readers until an editor publishes it.

export type EditorInitial = {
  id: string | null;
  status: string;
  slug: string;
  title: string;
  subtitle: string;
  authorLine: string;
  summary: string;
  topics: string[];
  coverImage: string | null;
  body: JSONContent | null;
  reviewNote: string | null;
  submittedAt: string | null;
};

type Meta = Omit<ArticleDraft, "body">;
type SaveState =
  | { kind: "idle" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

const MIN_WORDS = 150;
const SAVE_DELAY = 900;

const STATUS_NAME: Record<string, string> = {
  DRAFT: "Draft",
  REJECTED: "Returned for revision",
  SUBMITTED: "With the editors",
  PUBLISHED: "Published",
};

function timeAgo(at: Date, now: number): string {
  const s = Math.round((now - at.getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** A textarea that grows with its text, for the title and the standfirst. */
function GrowingText({
  value,
  onChange,
  onEnter,
  className,
  placeholder,
  maxLength,
  readOnly,
  label,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  className: string;
  placeholder: string;
  maxLength: number;
  readOnly?: boolean;
  label: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const own = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? own;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, ref]);
  return (
    <textarea
      ref={ref}
      rows={1}
      className={className}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      readOnly={readOnly}
      aria-label={label}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter?.();
        }
      }}
    />
  );
}

/** Upload one image through the server action; returns its URL or throws. */
async function upload(file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  const res = await uploadImage(form);
  if (!res.ok) throw new Error(res.error);
  return res.url;
}

const imageFiles = (list: FileList | null | undefined) =>
  Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

export function ArticleEditor({
  initial,
  isOwner,
  isAdmin,
  canEdit,
}: {
  initial: EditorInitial;
  isOwner: boolean;
  isAdmin: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [meta, setMeta] = useState<Meta>({
    title: initial.title,
    subtitle: initial.subtitle,
    authorLine: initial.authorLine,
    summary: initial.summary,
    topics: initial.topics,
    coverImage: initial.coverImage,
  });
  // The latest metadata for the autosave closure; updateMeta keeps it in step.
  const metaRef = useRef(meta);

  const idRef = useRef<string | null>(initial.id);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [uploads, setUploads] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState(!canEdit);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(initial.status === "REJECTED" && !!initial.reviewNote);
  const [now, setNow] = useState(() => Date.now());

  const subtitleRef = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);

  // ---- Autosave ----------------------------------------------------------
  // version counts edits; savedVersion is the last one the server has. A save
  // in flight never overlaps another: edits during it schedule one more.
  const version = useRef(0);
  const savedVersion = useRef(0);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // flush reschedules itself; going through a ref avoids a self-reference.
  const flushRef = useRef<() => void>(() => {});

  const collect = useCallback(
    (): ArticleDraft => {
      const doc = editorRef.current?.getJSON();
      return { ...metaRef.current, body: doc ? JSON.stringify(doc) : null };
    },
    [],
  );

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current || version.current === savedVersion.current) return;

    const draft = collect();
    const isEmpty =
      !draft.title.trim() &&
      !draft.subtitle.trim() &&
      !draft.coverImage &&
      !(editorRef.current?.getText().trim() ?? "");
    // Never create a row for a page nobody has written on.
    if (!idRef.current && isEmpty) {
      savedVersion.current = version.current;
      setSave({ kind: "idle" });
      return;
    }

    inFlight.current = true;
    const v = version.current;
    setSave({ kind: "saving" });
    try {
      const res = idRef.current ? await saveArticle(idRef.current, draft) : await createArticle(draft);
      if (!res.ok) {
        setSave({ kind: "error", message: res.error });
      } else {
        const createdId = (res as { id?: string }).id;
        if (createdId && !idRef.current) {
          idRef.current = createdId;
          // The draft now has an address: keep the URL in step without a
          // navigation, so a refresh reopens this draft.
          window.history.replaceState(null, "", `/write/${createdId}`);
        }
        savedVersion.current = v;
        setSave({ kind: "saved", at: new Date() });
      }
    } catch {
      setSave({ kind: "error", message: "Offline. Your changes will save when the connection returns." });
    } finally {
      inFlight.current = false;
    }
    if (version.current !== savedVersion.current) {
      timer.current = setTimeout(() => flushRef.current(), SAVE_DELAY * 3);
    }
  }, [collect]);

  useEffect(() => {
    flushRef.current = () => void flush();
  }, [flush]);

  const touch = useCallback(() => {
    if (!canEdit) return;
    version.current += 1;
    setSave((s) => (s.kind === "error" ? s : { kind: "dirty" }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY);
  }, [canEdit, flush]);

  const updateMeta = useCallback(
    (patch: Partial<Meta>) => {
      setMeta((m) => ({ ...m, ...patch }));
      metaRef.current = { ...metaRef.current, ...patch };
      touch();
    },
    [touch],
  );

  // Unsaved work: save on tab hide, warn before leaving, ⌘S saves now.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (version.current !== savedVersion.current) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flush();
      }
    };
    const onOnline = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onLeave);
    window.addEventListener("keydown", onKey);
    window.addEventListener("online", onOnline);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("online", onOnline);
      clearInterval(tick);
    };
  }, [flush]);

  // ---- Images --------------------------------------------------------------
  const withUpload = useCallback(async <T,>(work: () => Promise<T>): Promise<T | null> => {
    setUploads((n) => n + 1);
    try {
      return await work();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "That upload failed.");
      return null;
    } finally {
      setUploads((n) => n - 1);
    }
  }, []);

  const insertImages = useCallback(
    async (files: File[], pos?: number) => {
      for (const file of files) {
        const url = await withUpload(() => upload(file));
        const editor = editorRef.current;
        if (!url || !editor) continue;
        const chain = editor.chain().focus();
        if (pos !== undefined) chain.insertContentAt(pos, { type: "figure", attrs: { src: url, alt: "" } }).run();
        else chain.setFigure({ src: url }).run();
      }
    },
    [withUpload],
  );

  const setCover = useCallback(
    async (file: File) => {
      const url = await withUpload(() => upload(file));
      if (url) updateMeta({ coverImage: url });
    },
    [withUpload, updateMeta],
  );

  const handlers = useMemo<SlashHandlers>(
    () => ({
      // By id rather than ref: these run inside the editor, outside React.
      pickImage: () => document.getElementById("wr-figure-input")?.click(),
      embedVideo: () => setEmbedOpen(true),
    }),
    [],
  );

  // ---- Editor ----------------------------------------------------------------
  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,
    shouldRerenderOnTransaction: false,
    extensions: [
      ...articleExtensions.filter((e) => e.name !== "figure"),
      Figure.extend({ addNodeView: () => ReactNodeViewRenderer(FigureView) }),
      Placeholder.configure({
        placeholder: ({ node, pos }) =>
          node.type.name === "heading"
            ? "Heading"
            : pos === 0
              ? "Tell your story… Type / for images, headings, quotes and more."
              : "Type / for blocks",
        showOnlyCurrent: true,
      }),
      CharacterCount,
      SlashCommand.configure({ handlers }),
    ],
    content: initial.body ?? undefined,
    editorProps: {
      attributes: { class: "a-body wr-body", "aria-label": "Article text" },
      handleDrop: (view, event, _slice, moved) => {
        const files = imageFiles(event.dataTransfer?.files);
        if (moved || !files.length) return false;
        event.preventDefault();
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
        void insertImages(files, at?.pos);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (!files.length) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
    },
    onUpdate: () => touch(),
    onCreate: ({ editor: e }) => {
      editorRef.current = e;
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const stats = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const words = (e?.storage as { characterCount?: { words: () => number } } | undefined)?.characterCount?.words() ?? 0;
      return { words, minutes: Math.max(1, Math.round(words / 230)) };
    },
  }) ?? { words: 0, minutes: 1 };

  // ---- Actions ---------------------------------------------------------------
  const [busy, setBusy] = useState(false);

  const doSubmit = async () => {
    if (!idRef.current) {
      version.current += 1;
      await flush();
    }
    if (!idRef.current) return;
    setBusy(true);
    const res = await submitArticle(idRef.current, collect());
    setBusy(false);
    if (!res.ok) {
      setNotice(res.error);
      setSubmitOpen(false);
      return;
    }
    savedVersion.current = version.current;
    router.push("/submissions?submitted=1");
  };

  const doWithdraw = async () => {
    if (!idRef.current) return;
    setBusy(true);
    const res = await withdrawArticle(idRef.current);
    setBusy(false);
    if (!res.ok) return setNotice(res.error);
    router.refresh();
  };

  const doDelete = async () => {
    if (!idRef.current) {
      router.push("/submissions");
      return;
    }
    if (!window.confirm("Delete this draft for good? This can't be undone.")) return;
    const res = await deleteArticle(idRef.current);
    if (!res.ok) return setNotice(res.error);
    savedVersion.current = version.current;
    router.push("/submissions");
  };

  // ---- Render ----------------------------------------------------------------
  const status = initial.status;
  const hasTitle = meta.title.trim().length > 0;
  const enoughWords = stats.words >= MIN_WORDS;

  let saveLabel: ReactNode = null;
  if (uploads > 0) saveLabel = <><CircleNotchIcon className="wr-spin" /> Uploading image…</>;
  else if (save.kind === "saving" || save.kind === "dirty") saveLabel = <><CircleNotchIcon className="wr-spin" /> Saving…</>;
  else if (save.kind === "saved") saveLabel = <><CloudCheckIcon /> Saved {timeAgo(save.at, now)}</>;
  else if (save.kind === "error") saveLabel = <span className="wr-save-error"><WarningCircleIcon /> {save.message}</span>;
  else if (initial.id && canEdit) saveLabel = <><CloudCheckIcon /> All changes saved</>;

  return (
    <div className="wr">
      <div className="wr-bar" role="toolbar" aria-label="Article">
        <div className="wr-bar-start">
          <Link href="/submissions" className="wr-back" aria-label="Back to my submissions" title="My submissions">
            <ArrowLeftIcon />
          </Link>
          <span className={cx("wr-status", `wr-status-${status.toLowerCase()}`)}>{STATUS_NAME[status] ?? status}</span>
          <span className="wr-save" aria-live="polite">{saveLabel}</span>
        </div>
        <div className="wr-bar-end">
          <span className="wr-count t-meta" aria-live="off">
            {stats.words.toLocaleString()} words · {stats.minutes} min
          </span>
          {canEdit && (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetailsOpen(true)}>
                <SlidersHorizontalIcon aria-hidden="true" /> <span className="wr-hide-sm">Details</span>
              </button>
              <button type="button" className="btn btn-ghost btn-sm" aria-pressed={preview} onClick={() => setPreview((p) => !p)}>
                {preview ? <PencilSimpleIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
                <span className="wr-hide-sm">{preview ? "Edit" : "Preview"}</span>
              </button>
            </>
          )}
          {canEdit && isOwner && status !== "SUBMITTED" && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                void flush();
                setSubmitOpen(true);
              }}
            >
              <PaperPlaneTiltIcon aria-hidden="true" /> {status === "REJECTED" ? "Resubmit" : "Submit"}
            </button>
          )}
          {!canEdit && isOwner && status === "SUBMITTED" && (
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={doWithdraw}>
              <PencilSimpleIcon aria-hidden="true" /> Withdraw to edit
            </button>
          )}
          {status === "PUBLISHED" && (
            <Link href={`/p/${initial.slug}`} className="btn btn-secondary btn-sm">
              <ArrowSquareOutIcon aria-hidden="true" /> View live
            </Link>
          )}
        </div>
      </div>

      {notice && (
        <div className="wr-toast" role="alert">
          <WarningCircleIcon aria-hidden="true" />
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
            <XIcon />
          </button>
        </div>
      )}

      <div className="wr-page">
        {status === "SUBMITTED" && (
          <p className="wr-banner">
            {isAdmin && canEdit
              ? "You are editing a submission as an editor. Changes save to it directly; the author sees them when it is decided."
              : "This article is with the editors and locked while they read it. Withdraw it if you need to change something; it will leave the queue until you resubmit."}
          </p>
        )}
        {status === "PUBLISHED" && (
          <p className="wr-banner">This article is published. To change it, ask an editor to withdraw it to the queue.</p>
        )}
        {noteOpen && initial.reviewNote && (
          <aside className="wr-note" aria-label="Note from the editors">
            <div>
              <p className="t-meta">From the editors</p>
              <p className="wr-note-text">{initial.reviewNote}</p>
              <p className="wr-note-hint">Revise below, then press Resubmit.</p>
            </div>
            <button type="button" aria-label="Hide note" onClick={() => setNoteOpen(false)}>
              <XIcon />
            </button>
          </aside>
        )}

        {preview ? (
          <ArticleLayout
            className="wr-preview"
            title={meta.title}
            subtitle={meta.subtitle}
            authorLine={meta.authorLine}
            topics={meta.topics}
            coverImage={meta.coverImage}
            html={editor?.getHTML() ?? ""}
            meta={<>{stats.minutes} min read</>}
          />
        ) : (
          <article className="a-article wr-canvas">
            <CoverSlot
              cover={meta.coverImage}
              onPick={() => coverInput.current?.click()}
              onRemove={() => updateMeta({ coverImage: null })}
              onDropFile={setCover}
            />
            <header className="a-head">
              <GrowingText
                className="wr-title a-title t-title"
                value={meta.title}
                onChange={(title) => updateMeta({ title })}
                onEnter={() => subtitleRef.current?.focus()}
                placeholder="Title"
                maxLength={300}
                label="Title"
              />
              <GrowingText
                inputRef={subtitleRef}
                className="wr-subtitle a-subtitle"
                value={meta.subtitle}
                onChange={(subtitle) => updateMeta({ subtitle })}
                onEnter={() => editor?.commands.focus("start")}
                placeholder="Add a subtitle: one sentence on what this is about"
                maxLength={400}
                label="Subtitle"
              />
              <button type="button" className="wr-byline a-byline" onClick={() => setDetailsOpen(true)}>
                {meta.authorLine || "Add the author"}
                {meta.topics.length > 0 && <span className="wr-byline-topics"> · {meta.topics.join(", ")}</span>}
              </button>
            </header>
            <EditorContent editor={editor} />
            {editor && <TextMenu editor={editor} />}
            {editor && <FigureMenu editor={editor} />}
          </article>
        )}
      </div>

      <input
        ref={coverInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void setCover(file);
          e.target.value = "";
        }}
      />
      <input
        id="wr-figure-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => {
          void insertImages(imageFiles(e.target.files));
          e.target.value = "";
        }}
      />

      {detailsOpen && (
        <DetailsSheet
          meta={meta}
          onChange={updateMeta}
          onClose={() => setDetailsOpen(false)}
          onDelete={isOwner && (status === "DRAFT" || status === "REJECTED") ? doDelete : undefined}
        />
      )}

      {submitOpen && (
        <Modal title={status === "REJECTED" ? "Send the revision to the editors?" : "Send to the editors?"} onClose={() => setSubmitOpen(false)}>
          <ul className="wr-checks">
            <Check ok={hasTitle}>A title</Check>
            <Check ok={!!meta.authorLine.trim()}>An author line</Check>
            <Check ok={enoughWords}>
              At least {MIN_WORDS} words <span className="text-ink-3">({stats.words.toLocaleString()} so far)</span>
            </Check>
            <Check ok={!!meta.subtitle.trim()} optional>A subtitle</Check>
            <Check ok={!!meta.coverImage} optional>A cover image</Check>
          </ul>
          <p className="wr-modal-body">
            An editor reads every article in full. It stays locked while they do, and you will be notified when they publish it or send it back with notes.
          </p>
          <div className="wr-modal-actions">
            <button type="button" className="btn btn-ghost btn-md" onClick={() => setSubmitOpen(false)}>
              Keep writing
            </button>
            <button
              type="button"
              className="btn btn-primary btn-md"
              disabled={busy || !hasTitle || !enoughWords || !meta.authorLine.trim()}
              onClick={doSubmit}
            >
              {busy ? <CircleNotchIcon className="wr-spin" /> : <PaperPlaneTiltIcon aria-hidden="true" />}
              {status === "REJECTED" ? "Resubmit for review" : "Submit for review"}
            </button>
          </div>
        </Modal>
      )}

      {embedOpen && editor && (
        <EmbedDialog
          onClose={() => setEmbedOpen(false)}
          onEmbed={(src) => editor.chain().focus().setYoutubeVideo({ src }).run()}
        />
      )}
    </div>
  );
}

// ---- Pieces ------------------------------------------------------------------

function CoverSlot({
  cover,
  onPick,
  onRemove,
  onDropFile,
}: {
  cover: string | null;
  onPick: () => void;
  onRemove: () => void;
  onDropFile: (file: File) => void;
}) {
  const [over, setOver] = useState(false);
  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      if (Array.from(e.dataTransfer.items).some((i) => i.type.startsWith("image/"))) {
        e.preventDefault();
        setOver(true);
      }
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => {
      const file = imageFiles(e.dataTransfer.files)[0];
      setOver(false);
      if (!file) return;
      e.preventDefault();
      onDropFile(file);
    },
  };

  if (!cover) {
    return (
      <button type="button" className={cx("wr-addcover", over && "is-over")} onClick={onPick} {...dropProps}>
        <ImageIcon aria-hidden="true" />
        {over ? "Drop to set the cover" : "Add a cover image"}
      </button>
    );
  }
  return (
    <figure className={cx("a-cover wr-cover", over && "is-over")} {...dropProps}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cover} alt="Cover" />
      <div className="wr-cover-tools">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onPick}>
          <ImageIcon aria-hidden="true" /> Replace
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRemove}>
          <TrashIcon aria-hidden="true" /> Remove
        </button>
      </div>
    </figure>
  );
}

function Check({ ok, optional, children }: { ok: boolean; optional?: boolean; children: ReactNode }) {
  return (
    <li className={cx("wr-check", ok ? "is-ok" : optional ? "is-optional" : "is-missing")}>
      <span className="wr-check-mark" aria-hidden="true">{ok ? "✓" : optional ? "○" : "!"}</span>
      <span>
        {children}
        {optional && !ok && <span className="text-ink-3"> · optional</span>}
      </span>
    </li>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="wr-modal"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      aria-labelledby="wr-modal-title"
    >
      <div className="wr-modal-inner">
        <h2 id="wr-modal-title" className="t-h3">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

function EmbedDialog({ onClose, onEmbed }: { onClose: () => void; onEmbed: (src: string) => boolean }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title="Embed a video" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onEmbed(url.trim())) onClose();
          else setError("That doesn't look like a YouTube link.");
        }}
      >
        <input
          autoFocus
          className="input mt-4 w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          aria-label="YouTube link"
        />
        {error && <p className="field-error mt-2">{error}</p>}
        <div className="wr-modal-actions">
          <button type="button" className="btn btn-ghost btn-md" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-md">
            Embed
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DetailsSheet({
  meta,
  onChange,
  onClose,
  onDelete,
}: {
  meta: Meta;
  onChange: (patch: Partial<Meta>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [topic, setTopic] = useState("");
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const addTopic = (raw: string) => {
    const label = raw.replace(/,/g, " ").trim();
    if (!label || meta.topics.length >= 8) return;
    if (meta.topics.some((t) => t.toLowerCase() === label.toLowerCase())) return;
    onChange({ topics: [...meta.topics, label] });
    setTopic("");
  };

  return (
    <dialog
      ref={ref}
      className="wr-sheet"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      aria-labelledby="wr-sheet-title"
    >
      <div className="wr-sheet-inner">
        <div className="wr-sheet-head">
          <h2 id="wr-sheet-title" className="t-h4">Details</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
            <XIcon />
          </button>
        </div>

        <label className="field">
          <span className="field-label">Authors</span>
          <input
            className="input"
            value={meta.authorLine}
            maxLength={300}
            onChange={(e) => onChange({ authorLine: e.target.value })}
            placeholder="Your name"
          />
          <span className="field-hint">Separate co-authors with commas. They don&apos;t need accounts.</span>
        </label>

        <div className="field">
          <span className="field-label" id="wr-topics-label">Topics</span>
          <div className="wr-topics input" onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
            {meta.topics.map((t) => (
              <span key={t} className="wr-topic">
                {t}
                <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange({ topics: meta.topics.filter((x) => x !== t) })}>
                  <XIcon />
                </button>
              </span>
            ))}
            <input
              aria-labelledby="wr-topics-label"
              value={topic}
              maxLength={40}
              onChange={(e) => {
                const v = e.target.value;
                if (v.endsWith(",")) addTopic(v);
                else setTopic(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTopic(topic);
                } else if (e.key === "Backspace" && !topic && meta.topics.length) {
                  onChange({ topics: meta.topics.slice(0, -1) });
                }
              }}
              onBlur={() => addTopic(topic)}
              placeholder={meta.topics.length ? "" : "Politics, Uzbekistan, Language…"}
            />
          </div>
          <span className="field-hint">Up to eight. Press Enter or comma after each.</span>
        </div>

        <label className="field">
          <span className="field-label">Summary</span>
          <textarea
            className="input"
            rows={5}
            value={meta.summary}
            maxLength={5000}
            onChange={(e) => onChange({ summary: e.target.value })}
            placeholder="Leave blank to use the subtitle or your opening lines."
          />
          <span className="field-hint">Shown in listings and to search engines.</span>
        </label>

        {onDelete && (
          <div className="wr-sheet-danger">
            <button type="button" className="btn btn-ghost btn-sm wr-danger" onClick={onDelete}>
              <TrashIcon aria-hidden="true" /> Delete draft
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
