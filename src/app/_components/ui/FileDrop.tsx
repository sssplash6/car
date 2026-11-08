"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { formatFileSize } from "@/lib/format";

// The PDF dropzone (DESIGN.md §4.5). The native file input stays the real
// control — it carries the file to the server action — stretched invisibly
// over the zone, so a click opens the picker and a dropped file lands on the
// input itself. Only the frame and the chosen-file chip are ours.
export function FileDrop({
  id,
  name,
  accept,
  required,
  hint,
  art,
  onChange,
  ...aria
}: {
  id?: string;
  name: string;
  accept: string;
  required?: boolean;
  hint: ReactNode;
  /** The cotton drawing, rendered by the server page. */
  art?: ReactNode;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const [over, setOver] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);

  return (
    <div className="dropzone" data-over={over || undefined} aria-invalid={aria["aria-invalid"]}>
      {art}
      {file ? (
        <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-ui-sm text-ink">
          <span className="truncate">{file.name}</span>
          <span className="shrink-0 text-ink-3">{formatFileSize(file.size)}</span>
        </span>
      ) : (
        <span className="t-ui-sm text-ink-2">{hint}</span>
      )}
      <input
        type="file"
        id={id}
        name={name}
        accept={accept}
        required={required}
        {...aria}
        onDragEnter={() => setOver(true)}
        onDragLeave={() => setOver(false)}
        onDrop={() => setOver(false)}
        onChange={(event) => {
          const chosen = event.currentTarget.files?.[0];
          setFile(chosen ? { name: chosen.name, size: chosen.size } : null);
          onChange?.(event);
        }}
      />
    </div>
  );
}
