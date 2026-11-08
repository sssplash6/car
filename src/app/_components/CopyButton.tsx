"use client";

import { useRef, useState } from "react";
import { CheckIcon, CopyIcon, LinkSimpleIcon } from "@phosphor-icons/react/dist/ssr";

// Copy-to-clipboard pill for the citation block. "Copied" holds for 1.6s; the
// label swap is announced to screen readers through the live region.
export function CopyButton({
  text,
  label,
  icon = "copy",
}: {
  text: string;
  label: string;
  icon?: "copy" | "link";
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (permissions, plain http): the old way.
      const area = Object.assign(document.createElement("textarea"), { value: text });
      document.body.append(area);
      area.select();
      try {
        document.execCommand("copy");
      } catch {
        // Selecting the citation by hand still works.
      }
      area.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="btn btn-secondary btn-sm copy-btn"
      data-copied={copied || undefined}
    >
      {copied ? (
        <CheckIcon aria-hidden="true" />
      ) : icon === "link" ? (
        <LinkSimpleIcon aria-hidden="true" />
      ) : (
        <CopyIcon aria-hidden="true" />
      )}
      <span key={String(copied)} className="copy-label">
        {copied ? "Copied" : label}
      </span>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}
