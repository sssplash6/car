"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";

// Search as you type. Still a plain GET form underneath — Enter works and the
// page works without JavaScript — but each pause in typing (220ms) replaces
// the URL's ?q= in place: the server searches titles, authors and abstracts as
// before, the input keeps focus, the list updates where it stands, and the
// URL stays shareable. While results are on their way the list dims slightly.
// Escape clears the search.
export function PapersSearch({
  defaultValue,
  year,
  placeholder,
}: {
  defaultValue: string;
  year: number | null;
  placeholder: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);

  function search(value: string) {
    window.clearTimeout(timer.current);
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (year) params.set("year", String(year));
    const s = params.toString();
    startTransition(() => router.replace(s ? `/papers?${s}` : "/papers", { scroll: false }));
  }

  useEffect(() => {
    document.getElementById("papers-results")?.toggleAttribute("data-pending", pending);
  }, [pending]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <form
      action="/papers"
      role="search"
      className="search-field"
      onSubmit={(event) => {
        event.preventDefault();
        search(input.current?.value ?? "");
      }}
    >
      <label htmlFor="paper-search" className="sr-only">
        Search the papers
      </label>
      <MagnifyingGlassIcon aria-hidden="true" />
      <input
        ref={input}
        id="paper-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(event) => {
          const value = event.currentTarget.value;
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => search(value), 220);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && event.currentTarget.value) {
            event.preventDefault();
            event.currentTarget.value = "";
            search("");
          }
        }}
      />
      {year && <input type="hidden" name="year" value={year} />}
    </form>
  );
}
