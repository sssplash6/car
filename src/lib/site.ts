// Canonical site URL and shared formatting.

/**
 * Absolute base URL, no trailing slash.
 *
 * Needed for canonical tags, OG images, the sitemap, and links inside decision
 * emails — all of which break if handed a relative path. On Render set
 * NEXT_PUBLIC_SITE_URL to the real origin; the localhost fallback is for dev
 * only and would emit wrong canonical URLs if it ever reached production.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export const SITE_NAME = "Central Asian Review";

/** Shown in the footer. The review fronts its own brand; the academy publishes it. */
export const PUBLISHER_NAME = "Freshman Academy";

/** Region the review covers. Placeholder ordering — confirm with the editors. */
export const REGION_COUNTRIES = [
  "Kazakhstan",
  "Kyrgyzstan",
  "Tajikistan",
  "Turkmenistan",
  "Uzbekistan",
];

/**
 * Format a date for display.
 *
 * Fixed to Asia/Tashkent (GMT+5) per ONBOARDING.md §4 — every student-facing
 * date in this workspace uses it. Without an explicit timeZone this would render
 * differently on the server and in the browser, which React flags as a
 * hydration mismatch.
 */
export function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Tashkent",
  }).format(new Date(value));
}
