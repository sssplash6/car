import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

// The default share card (DESIGN.md §12 (a) 9): cream page, the logo, the
// name, one line. No custom font fetch, so it renders anywhere.
export const alt = `${SITE_NAME}: research on the politics, economies and societies of Central Asia`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // The same file the site's Mark uses, inlined so the card needs no fetch.
  const logo = await readFile(path.join(process.cwd(), "src/app/_components/ui/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
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
        <img src={logoSrc} width={168} height={168} alt="" />
        <div style={{ marginTop: 40, fontSize: 64, letterSpacing: -1.5 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#5e5d59" }}>
          Research on the politics, economies and societies of Central Asia
        </div>
      </div>
    ),
    size,
  );
}
