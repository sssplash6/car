"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { Diamond, WovenTrim } from "@/app/_components/Ornament";

// The card catalogue.
//
// An archive that can only be searched by loading a page and typing into a form
// is an archive nobody searches. This is the drawer: ⌘K (or /) anywhere on the
// site pulls it out, and it holds every published paper, every bound issue and
// the site's own destinations in one ranked list.
//
// Built on the native <dialog> element rather than a combobox library: the
// browser already owns the modal semantics, the focus trap, the inert
// background and Escape. What is left is a listbox, ~120 lines, and no
// dependency. The index is fetched once from /api/catalogue the first time the
// drawer opens, so pages nobody searches from pay nothing for it.

type Paper = {
  slug: string;
  title: string;
  authors: string;
  year: number | null;
  issue: { number: number; label: string } | null;
};
type Issue = { number: number; label: string; anchor: string; count: number };
type Index = { papers: Paper[]; issues: Issue[] };

type Entry = {
  key: string;
  href: string;
  kind: "paper" | "issue" | "place";
  title: string;
  meta?: string;
  note?: string;
  /** Lower sorts first. */
  rank: number;
};

const PLACES: { title: string; href: string; note: string }[] = [
  { title: "Papers", href: "/papers", note: "The whole index" },
  { title: "Issues", href: "/issues", note: "Bound quarterly volumes" },
  { title: "About the Review", href: "/about", note: "What this is, and who reads it" },
  { title: "Submit a paper", href: "/submit", note: "Free, at every stage" },
];

/** Rank a haystack against a query: title-start beats title-anywhere beats author. */
function score(query: string, title: string, authors: string): number | null {
  if (!query) return 0;
  const t = title.toLowerCase();
  const a = authors.toLowerCase();
  if (t.startsWith(query)) return 0;
  // Word-start inside the title — "heat" should find "Urban Heat…".
  if (new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(t)) return 1;
  if (t.includes(query)) return 2;
  if (a.includes(query)) return 3;
  return null;
}

export function CatalogueTrigger() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState<Index | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const open = useCallback(() => {
    const el = dialogRef.current;
    if (!el || el.open) return;
    el.showModal();
    setQuery("");
    setActive(0);
    // Fetch once, on first open. A failed fetch is not an error state worth
    // building: the drawer still navigates to the site's own pages.
    setIndex((current) => {
      if (current) return current;
      fetch("/api/catalogue")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: Index | null) => data && setIndex(data))
        .catch(() => {});
      return current;
    });
  }, []);

  // ⌘K / Ctrl-K anywhere, and "/" when the reader is not already typing —
  // the two shortcuts every archive-shaped site has trained people to expect.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      } else if (event.key === "/" && !typing && !dialogRef.current?.open) {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase();
    const out: Entry[] = [];

    for (const paper of index?.papers ?? []) {
      const rank = score(q, paper.title, paper.authors);
      if (rank === null) continue;
      out.push({
        key: `p-${paper.slug}`,
        href: `/p/${paper.slug}`,
        kind: "paper",
        title: paper.title,
        meta: paper.year ? String(paper.year) : undefined,
        note: paper.authors,
        rank,
      });
    }

    for (const issue of index?.issues ?? []) {
      const label = `Issue № ${issue.number} · ${issue.label}`;
      const rank = score(q, label, issue.label);
      if (rank === null) continue;
      out.push({
        key: `i-${issue.number}`,
        href: `/issues#${issue.anchor}`,
        kind: "issue",
        title: label,
        meta: `${issue.count} paper${issue.count === 1 ? "" : "s"}`,
        rank: rank + 4,
      });
    }

    for (const place of PLACES) {
      const rank = score(q, place.title, place.note);
      if (rank === null) continue;
      out.push({
        key: `d-${place.href}`,
        href: place.href,
        kind: "place",
        title: place.title,
        note: place.note,
        rank: rank + 8,
      });
    }

    return out.sort((a, b) => a.rank - b.rank).slice(0, 40);
  }, [index, query]);

  function go(entry: Entry | undefined) {
    if (!entry) return;
    dialogRef.current?.close();
    router.push(entry.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => {
        const next =
          event.key === "ArrowDown"
            ? Math.min(i + 1, entries.length - 1)
            : Math.max(i - 1, 0);
        listRef.current
          ?.querySelectorAll("li")
          [next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(entries[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Search the catalogue"
        className="press-ink group flex h-8 cursor-pointer items-center gap-2 rounded border border-rule px-2.5 text-muted-fg transition-colors hover:border-accent hover:text-accent sm:pr-1.5"
      >
        <MagnifyingGlassIcon size={15} aria-hidden="true" />
        <span className="hidden text-[0.8125rem] sm:inline">Search</span>
        {/* The shortcut, set as a printed key: the affordance is the point. */}
        <kbd className="hidden rounded border border-rule bg-canvas px-1.5 py-0.5 font-sans text-[0.6875rem] leading-none text-muted-fg transition-colors group-hover:border-accent/40 sm:inline">
          ⌘K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Search the catalogue"
        onClick={(event) => {
          // Native dialogs swallow outside clicks; the backdrop reports the
          // dialog itself as the target, so a hit outside the panel closes.
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="catalogue shadow-plate w-[min(42rem,calc(100vw-1.5rem))] overflow-hidden border border-rule-strong bg-surface p-0 text-ink backdrop:bg-[light-dark(rgb(38_32_25/0.34),rgb(0_0_0/0.6))] backdrop:backdrop-blur-[2px]"
      >
        <WovenTrim />

        {/* Focus rides the ROW, not the field: the site-wide focus ring drawn
            around a full-width input inside a framed drawer reads as a second,
            competing box. The caret plus a lapis rule under the row says the
            same thing quietly. */}
        <div className="flex items-center gap-3 border-b border-rule px-5 transition-colors has-[input:focus]:border-accent">
          <MagnifyingGlassIcon
            size={17}
            aria-hidden="true"
            className="shrink-0 text-muted-fg"
          />
          <input
            autoFocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="catalogue-results"
            placeholder="Search the archive — titles, authors, issues"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-14 w-full bg-transparent text-[1.0625rem] text-ink outline-none focus-visible:outline-none placeholder:text-muted-fg"
          />
        </div>

        <ul
          id="catalogue-results"
          role="listbox"
          ref={listRef}
          className="max-h-[min(26rem,55vh)] overflow-y-auto py-1.5"
        >
          {entries.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-fg">
              {index === null
                ? "Opening the drawer…"
                : `Nothing in the catalogue matches “${query}”.`}
            </li>
          )}
          {entries.map((entry, i) => (
            <li key={entry.key} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseMove={() => setActive(i)}
                onClick={() => go(entry)}
                className={`flex w-full cursor-pointer items-baseline gap-1 px-5 py-2.5 text-left transition-colors ${
                  i === active ? "bg-accent-soft" : ""
                }`}
              >
                <Diamond
                  className={`mr-2 self-center transition-opacity ${
                    i === active ? "text-gild opacity-100" : "opacity-0"
                  }`}
                />
                <span className="min-w-0">
                  <span
                    className={`block truncate ${
                      entry.kind === "place"
                        ? "text-[0.9375rem] text-ink"
                        : "font-serif text-[1.0625rem] leading-snug text-ink"
                    }`}
                  >
                    {entry.title}
                  </span>
                  {entry.note && (
                    <span className="mt-0.5 block truncate text-xs text-muted-fg">
                      {entry.note}
                    </span>
                  )}
                </span>
                {/* Contents-leaf leaders: the drawer is a table of contents. */}
                <span className="leader" aria-hidden="true" />
                {entry.meta && (
                  <span className="oldstyle-nums shrink-0 font-serif text-sm text-muted-fg">
                    {entry.meta}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule bg-canvas px-5 py-2.5 text-[0.6875rem] uppercase tracking-[0.1em] text-muted-fg">
          <span>↑ ↓ to move</span>
          <span>↵ to open</span>
          <span>esc to close</span>
          <span className="ml-auto hidden sm:inline">/ opens this drawer</span>
        </p>
      </dialog>
    </>
  );
}
