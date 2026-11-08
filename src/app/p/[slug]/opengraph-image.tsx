import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { issueFor, tashkentQuarter } from "@/lib/issues";
import { plateFor, type PlateTone } from "@/lib/plates";
import { SITE_NAME } from "@/lib/site";
import { DRAWINGS } from "@/app/_components/illustrations";

// A paper's share card: its issue's plate — the season's colour and the
// issue's drawing — with the title in plate ink (DESIGN.md §12 (b) P4).
export const alt = `A paper in ${SITE_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Light plate tones (src/app/globals.css); share cards have no dark mode.
const PLATE_HEX: Record<PlateTone, string> = {
  heather: "#cbcadb",
  sky: "#c9dcf0",
  cactus: "#bcd1ca",
  sage: "#c7d4be",
  peach: "#ebc9b7",
  apricot: "#f0c8a8",
  wheat: "#e9d3a8",
  coral: "#ebcece",
};

export default async function PaperOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [paper, all] = await Promise.all([
    prisma.paper.findFirst({
      where: { slug, status: PAPER_STATUS.PUBLISHED },
      select: { title: true, publishedAt: true },
    }),
    prisma.paper.findMany({ where: { status: PAPER_STATUS.PUBLISHED }, select: { publishedAt: true } }),
  ]);

  const dates = all.flatMap((p) => (p.publishedAt ? [p.publishedAt] : []));
  const issue = paper?.publishedAt ? issueFor(dates, paper.publishedAt) : null;
  const quarter = paper?.publishedAt ? tashkentQuarter(paper.publishedAt) : null;
  const plate = issue && quarter ? plateFor({ number: issue.number, ...quarter }) : null;
  const drawing = DRAWINGS[plate?.subject ?? "tulip"];

  const raw = paper?.title ?? SITE_NAME;
  const title = raw.length > 120 ? `${raw.slice(0, raw.lastIndexOf(" ", 117))}…` : raw;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "64px 72px",
          background: plate ? PLATE_HEX[plate.tone] : "#faf9f5",
          color: "#141413",
        }}
      >
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: 48,
          }}
        >
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 0.5 }}>
            {`${SITE_NAME}${issue ? ` · № ${issue.number} · ${issue.label}` : ""}`}
          </div>
          <div style={{ fontSize: title.length > 70 ? 44 : 56, lineHeight: 1.12, letterSpacing: -1 }}>
            {title}
          </div>
        </div>
        <svg
          width="320"
          height="400"
          viewBox={`0 0 ${drawing.viewBox[0]} ${drawing.viewBox[1]}`}
          fill="none"
        >
          {drawing.strokes.map((stroke, i) => (
            <path
              key={i}
              d={stroke.d}
              stroke="#141413"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {drawing.dots.map(([cx, cy, r], i) => (
            <circle key={`d${i}`} cx={cx} cy={cy} r={r} fill="#141413" fillOpacity="0.6" />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}
