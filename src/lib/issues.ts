// Quarterly issues, derived rather than stored.
//
// The review publishes on a rolling basis (papers go live the moment an editor
// approves them), so an issue is a reading of the archive, not a workflow
// object: every published paper belongs to the quarter it was published in.
// Deriving issues from publishedAt means no Issue table, no admin UI for
// assignment, and no way for a paper to be published but missing from an issue.
// If the editors ever want hand-curated issues, that is a schema change —
// revisit this file rather than bolting curation onto it.

export type IssuePaper = {
  id: string;
  slug: string;
  title: string;
  authorLine: string;
  publishedAt: Date;
};

export type Issue = {
  /** Chronological: the review's first quarter with a paper is issue 1. */
  number: number;
  /** Calendar year and quarter in Asia/Tashkent, e.g. 2026 / 3. */
  year: number;
  quarter: 1 | 2 | 3 | 4;
  /** "Summer 2026" — the reader-facing name for the quarter. */
  label: string;
  /** URL fragment for deep links: "no-3". */
  anchor: string;
  /** Newest first, matching every other list on the site. */
  papers: IssuePaper[];
};

// Northern-hemisphere seasons by quarter — correct for the whole region.
const SEASON: Record<1 | 2 | 3 | 4, string> = {
  1: "Winter",
  2: "Spring",
  3: "Summer",
  4: "Autumn",
};

/**
 * Year and quarter of a date in Asia/Tashkent (GMT+5), the site's display
 * timezone (ONBOARDING.md §4). Computed via Intl rather than getUTCMonth so a
 * paper published 23:00 UTC on 31 March lands in Q2, matching the date readers
 * see everywhere else on the site.
 */
export function tashkentQuarter(date: Date): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const month = get("month");
  return {
    year: get("year"),
    quarter: (Math.floor((month - 1) / 3) + 1) as 1 | 2 | 3 | 4,
  };
}

/**
 * The issue a given publish date falls in, relative to the full set of publish
 * dates — the paper page uses this to cite "Issue № 3 · Summer 2026" without
 * grouping the whole archive. Returns null when the date's quarter contains no
 * published papers, which can only mean the caller passed a date that is not
 * itself in `allPublishDates`.
 */
export function issueFor(
  allPublishDates: Date[],
  target: Date,
): { number: number; label: string; anchor: string } | null {
  const keyOf = (d: Date) => {
    const { year, quarter } = tashkentQuarter(d);
    return year * 4 + (quarter - 1);
  };

  const keys = [...new Set(allPublishDates.map(keyOf))].sort((a, b) => a - b);
  const index = keys.indexOf(keyOf(target));
  if (index === -1) return null;

  const { year, quarter } = tashkentQuarter(target);
  return {
    number: index + 1,
    label: `${SEASON[quarter]} ${year}`,
    anchor: `no-${index + 1}`,
  };
}

/**
 * Group published papers into quarterly issues, numbered chronologically from
 * the review's first quarter, returned newest-issue-first for display.
 *
 * Pure — papers are injected, nothing is queried — so it is trivially testable
 * and the /issues page stays a thin shell around it. Quarters with no papers
 * are skipped, not numbered: an empty issue is not an issue.
 */
export function groupIntoIssues(papers: IssuePaper[]): Issue[] {
  const byKey = new Map<number, Issue>();

  for (const paper of papers) {
    const { year, quarter } = tashkentQuarter(paper.publishedAt);
    const key = year * 4 + (quarter - 1);
    let issue = byKey.get(key);
    if (!issue) {
      issue = {
        number: 0, // assigned after grouping, once the full set is known
        year,
        quarter,
        label: `${SEASON[quarter]} ${year}`,
        anchor: "", // depends on number
        papers: [],
      };
      byKey.set(key, issue);
    }
    issue.papers.push(paper);
  }

  const chronological = [...byKey.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, issue]) => issue);

  chronological.forEach((issue, i) => {
    issue.number = i + 1;
    issue.anchor = `no-${issue.number}`;
    issue.papers.sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
    );
  });

  return chronological.reverse();
}
