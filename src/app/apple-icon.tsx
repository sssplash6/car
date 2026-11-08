import { ImageResponse } from "next/og";
import { mark } from "@/app/_components/illustrations/data/mark";

// Home-screen icon: the Mark on the cream page (DESIGN.md §12 (a) 9).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const [cx, cy] = mark.dots[0];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f5",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 48 48" fill="none">
          {mark.strokes.map((stroke, i) => (
            <path
              key={i}
              d={stroke.d}
              stroke="#141413"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          <circle cx={cx} cy={cy} r="2.2" fill="#d97757" />
        </svg>
      </div>
    ),
    size,
  );
}
