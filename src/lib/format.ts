// Display formatting shared by the redesigned pages. Dates are fixed to
// Asia/Tashkent like every other date on the site (src/lib/site.ts), so server
// and browser render the same string.

/** "24 Jul 2026" — list dates. Set in the uppercase meta style by CSS, so the
    text itself stays readable to screen readers. */
export function formatShortDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Tashkent",
  }).format(new Date(value));
}

/** "1.2 MB", or "84 KB" for small files. */
export function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb < 0.1 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${mb.toFixed(1)} MB`;
}
