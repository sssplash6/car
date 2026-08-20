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

/**
 * Region the review covers, each country also named in its own official
 * language and script.
 *
 * The review's stated principle is that the region is the subject, not a
 * backdrop (PRODUCT.md) — and a publication that can only spell its own
 * subject in English has not met that bar. A country's own name is editorial
 * competence, not a political claim: the standing rule bans flags, state
 * emblems and motifs captioned as belonging to one country, none of which this
 * is.
 *
 * `lang` is load-bearing markup, not decoration — it tells a screen reader
 * which voice to use and the browser which font stack and hyphenation rules
 * apply. Kazakh, Kyrgyz and Tajik are set in Cyrillic (still each country's
 * standard script); Turkmen and Uzbek in their official Latin orthographies,
 * including the ʻokina-shaped U+02BB in Oʻzbekiston. The display serif loads
 * the Cyrillic subset for exactly this.
 *
 * Alphabetical by English name — placeholder ordering, confirm with the editors.
 */
export const REGION_COUNTRIES = [
  { en: "Kazakhstan", native: "Қазақстан", lang: "kk" },
  { en: "Kyrgyzstan", native: "Кыргызстан", lang: "ky" },
  { en: "Tajikistan", native: "Тоҷикистон", lang: "tg" },
  { en: "Turkmenistan", native: "T\u00fcrkmenistan", lang: "tk" },
  { en: "Uzbekistan", native: "O\u02bbzbekiston", lang: "uz" },
] as const;

/** Just the English names, for prose that lists them inline. */
export const REGION_COUNTRY_NAMES = REGION_COUNTRIES.map((c) => c.en);

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

/** A Date n whole days before now, for query windows ("failures this week"). */
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/**
 * Date plus time of day, for operational logs (the email log) where "which
 * attempt was this" needs minutes, not just a date. Same fixed timezone as
 * formatDate for the same hydration reason.
 */
export function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(value));
}
