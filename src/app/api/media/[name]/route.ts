import { NextResponse } from "next/server";
import { MEDIA_NAME_PATTERN, MEDIA_TYPES, readImage } from "@/lib/media";

// Public article images (src/lib/media.ts). Names are uuids and files never
// change once written, so they cache forever.
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!MEDIA_NAME_PATTERN.test(name)) return new NextResponse("Not found", { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await readImage(name);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": MEDIA_TYPES[name.split(".").pop()!],
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      // The type was sniffed on upload; nosniff keeps the browser to it.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
