// Issue plates: the per-issue colour and drawing (DESIGN.md §3.3).
//
// The season gives the hue, the year's parity gives the variant, the issue
// number gives the drawing. Nothing is stored: everything derives from the
// issue data src/lib/issues.ts already computes, so a plate can never disagree
// with the archive, and two Summers never wear the same colour.

import { tashkentQuarter } from "@/lib/issues";

export type PlateTone =
  | "heather"
  | "sky"
  | "cactus"
  | "sage"
  | "peach"
  | "apricot"
  | "wheat"
  | "coral";

export type Subject =
  | "tulip"
  | "pomegranate"
  | "saiga"
  | "melon"
  | "leopard"
  | "apple"
  | "silkworm"
  | "cotton";

export type Quarter = 1 | 2 | 3 | 4;

export const SUBJECTS: readonly Subject[] = [
  "tulip",
  "pomegranate",
  "saiga",
  "melon",
  "leopard",
  "apple",
  "silkworm",
  "cotton",
];

// Q1 Winter, Q2 Spring, Q3 Summer, Q4 Autumn: [even year, odd year].
const TONES: Record<Quarter, readonly [PlateTone, PlateTone]> = {
  1: ["heather", "sky"],
  2: ["cactus", "sage"],
  3: ["peach", "apricot"],
  4: ["wheat", "coral"],
};

const SEASON_QUARTER: Record<string, Quarter> = {
  Winter: 1,
  Spring: 2,
  Summer: 3,
  Autumn: 4,
};

export type Plate = { tone: PlateTone; subject: Subject; className: `plate-${PlateTone}` };

export function plateTone(year: number, quarter: Quarter): PlateTone {
  return TONES[quarter][year % 2 === 0 ? 0 : 1];
}

export function plateSubject(issueNumber: number): Subject {
  return SUBJECTS[(((issueNumber - 1) % 8) + 8) % 8];
}

export function plateFor(issue: { number: number; year: number; quarter: Quarter }): Plate {
  const tone = plateTone(issue.year, issue.quarter);
  return { tone, subject: plateSubject(issue.number), className: `plate-${tone}` };
}

/** For callers that only have issueFor()'s { number, label } ("Summer 2026"),
    e.g. ⌘K and /papers rows. */
export function plateFromLabel(number: number, label: string): Plate {
  const [season, yearText] = label.split(" ");
  const quarter = SEASON_QUARTER[season] ?? 1;
  const year = Number(yearText) || 0;
  return plateFor({ number, year, quarter });
}

/** The quarter still receiving papers ("This quarter"). */
export function isCurrentQuarter(year: number, quarter: Quarter, now: Date = new Date()): boolean {
  const current = tashkentQuarter(now);
  return current.year === year && current.quarter === quarter;
}
