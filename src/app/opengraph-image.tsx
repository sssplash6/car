import { ImageResponse } from "next/og";
import { mark } from "@/app/_components/illustrations/data/mark";
import { SITE_NAME } from "@/lib/site";

// The default share card (DESIGN.md §12 (a) 9): cream page, the Mark, the
// name, one line. No custom font fetch, so it renders anywhere.
export const alt = `${SITE_NAME}: research on the politics, economies and societies of Central Asia`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const [cx, cy] = mark.dots[0];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#faf9f5",
          color: "#141413",
        }}
      >
        <svg width="96" height="96" viewBox="0 0 48 48" fill="none">
          {mark.strokes.map((stroke, i) => (
            <path
              key={i}
              d={stroke.d}
              stroke="#141413"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          <circle cx={cx} cy={cy} r="2" fill="#d97757" />
        </svg>
        <div style={{ marginTop: 40, fontSize: 64, letterSpacing: -1.5 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#5e5d59" }}>
          Research on the politics, economies and societies of Central Asia
        </div>
      </div>
    ),
    size,
  );
}
