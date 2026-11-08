"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BooksIcon,
  FileTextIcon,
  InfoIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PlateChip } from "@/app/_components/ui/IssuePlate";
import { ShortcutKbd } from "@/app/_components/ShortcutKbd";
import { formatShortDate } from "@/lib/format";
import { No } from "@/app/_components/ui/Numero";

// ⌘K: the catalogue (DESIGN.md §8.15). ⌘K / Ctrl-K anywhere, or "/" when not
// typing, opens one dialog holding every published paper, every issue and the
// site's own pages, grouped. On wide screens a preview pane shows the
// highlighted result — a paper's opening lines, an issue's contents — before
// you open it, and the destination is prefetched so Enter lands at once.
//
// Built on the native <dialog>: the browser owns the modal semantics, focus
// trap, inert background and Escape. The index comes from /api/catalogue,
// fetched the moment the trigger is hovered or focused (so opening rarely
// waits), or on first open.

type Paper = {
  slug: string;
  title: string;
  authors: string;
  year: number | null;
  date: string | null;
  snippet: string;
  issue: { number: number; label: string } | null;
};
type Issue = { number: number; label: string; anchor: string; count: number };
type Index = { papers: Paper[]; issues: Issue[] };

type Entry = {
  key: string;
  href: string;
  title: string;
  meta?: string;
  lead: ReactNode;
  rank: number;
  paper?: Paper;
  issue?: Issue;
  page?: (typeof PAGES)[number];
};

const PAGES = [
  { title: "Papers", href: "/papers", note: "Every paper the review has published, newest first.", Icon: FileTextIcon },
  { title: "Issues", href: "/issues", note: "The archive gathered into quarterly issues.", Icon: BooksIcon },
  { title: "About the Review", href: "/about", note: "What it covers, how a paper reaches a reader, and who it is for.", Icon: InfoIcon },
  { title: "Submit a paper", href: "/submit", note: "Send a finished paper. An editor reads every submission in full; free at every stage.", Icon: UploadSimpleIcon },
  { title: "Privacy", href: "/privacy", note: "What the site stores about readers and authors, and why.", Icon: LockSimpleIcon },
];

/** Title-start beats word-start beats anywhere beats the secondary text. */
function score(query: string, title: string, secondary: string): number | null {
  if (!query) return 0;
  const t = title.toLowerCase();
  if (t.startsWith(query)) return 0;
  if (new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(t)) return 1;
  if (t.includes(query)) return 2;
  if (secondary.toLowerCase().includes(query)) return 3;
  return null;
}

const byRank = (a: Entry, b: Entry) => a.rank - b.rank;

/** The matched part of a title, marked. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="hl">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

export function CatalogueTrigger({ emptyArt }: { emptyArt?: ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fetching = useRef(false);
  const [index, setIndex] = useState<Index | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const loadIndex = useCallback(() => {
    if (fetching.current) return;
    fetching.current = true;
    // A failed fetch is not worth an error state: the pages still navigate.
    fetch("/api/catalogue")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Index | null) => {
        if (data) setIndex(data);
        else fetching.current = false;
      })
      .catch(() => {
        fetching.current = false;
      });
  }, []);

  const open = useCallback(() => {
    const el = dialogRef.current;
    if (!el || el.open) return;
    setQuery("");
    setActive(0);
    el.showModal();
    loadIndex();
  }, [loadIndex]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) dialogRef.current.close();
        else open();
      } else if (event.key === "/" && !typing && !dialogRef.current?.open) {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const papers: Entry[] = [];
    for (const paper of index?.papers ?? []) {
      const rank = score(q, paper.title, paper.authors);
      if (rank === null) continue;
      papers.push({
        key: `p-${paper.slug}`,
        href: `/p/${paper.slug}`,
        title: paper.title,
        meta: paper.authors,
        lead: paper.issue ? <PlateChip number={paper.issue.number} label={paper.issue.label} /> : null,
        rank,
        paper,
      });
    }
    const issues: Entry[] = [];
    for (const issue of index?.issues ?? []) {
      const title = `Issue № ${issue.number} · ${issue.label}`;
      const rank = score(q, title, `issue ${issue.number} ${issue.label}`);
      if (rank === null) continue;
      issues.push({
        key: `i-${issue.number}`,
        href: `/issues#${issue.anchor}`,
        title,
        meta: `${issue.count} paper${issue.count === 1 ? "" : "s"}`,
        lead: <PlateChip number={issue.number} label={issue.label} />,
        rank,
        issue,
      });
    }
    const pages: Entry[] = [];
    for (const page of PAGES) {
      const rank = score(q, page.title, page.note);
      if (rank === null) continue;
      pages.push({
        key: `d-${page.href}`,
        href: page.href,
        title: page.title,
        lead: <page.Icon aria-hidden="true" />,
        rank,
        page,
      });
    }
    return [
      { id: "papers", label: `Papers · ${papers.length}`, entries: papers.sort(byRank).slice(0, 24) },
      { id: "issues", label: `Issues · ${issues.length}`, entries: issues.sort(byRank) },
      { id: "pages", label: "Pages", entries: pages.sort(byRank) },
    ].filter((group) => group.entries.length > 0);
  }, [index, query]);

  const flat = useMemo(() => groups.flatMap((group) => group.entries), [groups]);
  const current = flat[active];
  const currentHref = current?.href;

  // Prefetch the highlighted destination, so Enter (or a click) lands at once.
  useEffect(() => {
    if (!currentHref || !dialogRef.current?.open) return;
    const timer = window.setTimeout(() => router.prefetch(currentHref.split("#")[0]), 120);
    return () => window.clearTimeout(timer);
  }, [currentHref, router]);

  function go(entry: Entry | undefined) {
    if (!entry) return;
    dialogRef.current?.close();
    // Starts the header's loading line (NavProgress).
    window.dispatchEvent(new Event("car:navigate"));
    router.push(entry.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => {
        const next = event.key === "ArrowDown" ? Math.min(i + 1, flat.length - 1) : Math.max(i - 1, 0);
        listRef.current?.querySelector(`#catalogue-option-${next}`)?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(flat[active]);
    }
  }

  let n = -1;

  return (
    <>
      <button
        type="button"
        onClick={open}
        onPointerEnter={loadIndex}
        onFocus={loadIndex}
        aria-label="Search papers, authors and issues"
        className="search-pill"
      >
        <MagnifyingGlassIcon aria-hidden="true" />
        <span>Search</span>
        <ShortcutKbd />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Search the review"
        className="cmdk"
        onClick={(event) => {
          // A click on the backdrop reports the dialog itself as the target.
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="cmdk-input">
          <MagnifyingGlassIcon aria-hidden="true" />
          <input
            autoFocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="catalogue-results"
            aria-autocomplete="list"
            aria-activedescendant={current ? `catalogue-option-${active}` : undefined}
            aria-label="Search papers, authors, issues"
            placeholder="Search papers, authors, issues"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          <kbd className="kbd">esc</kbd>
        </div>

        <div className="cmdk-body">
          <div id="catalogue-results" role="listbox" aria-label="Results" ref={listRef} className="cmdk-list">
            {flat.length === 0 && (
              <div className="cmdk-empty">
                {index === null ? null : emptyArt}
                <span>{index === null ? "Opening the catalogue…" : "Nothing matches"}</span>
              </div>
            )}
            {groups.map((group) => (
              <div key={group.id} role="group" aria-labelledby={`catalogue-${group.id}`}>
                <div id={`catalogue-${group.id}`} className="cmdk-group t-meta" role="presentation">
                  {group.label}
                </div>
                {group.entries.map((entry) => {
                  n += 1;
                  const i = n;
                  return (
                    <div
                      key={entry.key}
                      id={`catalogue-option-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className="cmdk-row"
                      onMouseMove={() => i !== active && setActive(i)}
                      onClick={() => go(entry)}
                    >
                      <span className="lead">{entry.lead}</span>
                      <span className="ttl">
                        <Highlight text={entry.title} query={query} />
                      </span>
                      {entry.meta && <span className="mt">{entry.meta}</span>}
                      <ArrowRightIcon className="ar" aria-hidden="true" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Visual only: the same facts are in the option's own text. */}
          <aside className="cmdk-preview" aria-hidden="true">
            {current?.paper && (
              <>
                {current.paper.issue && (
                  <p className="pv-eyebrow">
                    <PlateChip number={current.paper.issue.number} label={current.paper.issue.label} />
                    <span className="t-meta">
                      <No /> {current.paper.issue.number} · {current.paper.issue.label}
                    </span>
                  </p>
                )}
                <p className="pv-title">{current.paper.title}</p>
                <p className="pv-authors">{current.paper.authors}</p>
                {current.paper.snippet && <p className="pv-snippet">{current.paper.snippet}</p>}
                {current.paper.date && <p className="t-meta mt-4">{formatShortDate(current.paper.date)}</p>}
              </>
            )}
            {current?.issue && (
              <>
                <p className="pv-eyebrow">
                  <PlateChip number={current.issue.number} label={current.issue.label} />
                  <span className="t-meta">{current.meta}</span>
                </p>
                <p className="pv-title">{current.issue.label}</p>
                <ul className="pv-list">
                  {(index?.papers ?? [])
                    .filter((paper) => paper.issue?.number === current.issue!.number)
                    .slice(0, 5)
                    .map((paper) => (
                      <li key={paper.slug}>{paper.title}</li>
                    ))}
                </ul>
              </>
            )}
            {current?.page && (
              <>
                <p className="pv-title">{current.page.title}</p>
                <p className="pv-snippet">{current.page.note}</p>
              </>
            )}
            {current && <p className="pv-open t-micro">↵ to open</p>}
          </aside>
        </div>

        <p className="cmdk-foot t-micro">↑↓ move · ↵ open · esc close</p>
      </dialog>
    </>
  );
}
