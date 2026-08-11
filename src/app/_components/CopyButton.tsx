"use client";

import { useState } from "react";
import { CheckIcon, CopySimpleIcon } from "@phosphor-icons/react/dist/ssr";

// Quiet copy-to-clipboard button for citation text. The two-second "Copied"
// swap is state feedback, not decoration, so it stays inside the product-
// register motion rules (colour/label change only, no animation).
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, http). Selecting the text
      // by hand still works; the button just doesn't confirm.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-rule-strong px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px"
    >
      {copied ? (
        <CheckIcon size={15} aria-hidden="true" className="text-state-good" />
      ) : (
        <CopySimpleIcon size={15} aria-hidden="true" />
      )}
      {copied ? "Copied" : label}
      {/* Announced for screen readers; the visual label swap above is not. */}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}
