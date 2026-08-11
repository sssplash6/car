import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { readPdf } from "@/lib/storage";

// The PDF gate. This is the real security boundary for paper downloads —
// src/proxy.ts is an optimistic cookie check and the files are stored outside
// public/ precisely so that this handler is the ONLY way to reach them.
//
// Rules:
//   - a published paper needs any signed-in user (every account is >= READER)
//   - an unpublished paper is readable only by its own submitter, so an author
//     can check what they uploaded while it sits in the queue
//   - admins are covered by the submitter check plus the review UI, which reads
//     files through this same route
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getOptionalUser();

  // ?disposition=inline opens the PDF in the browser instead of downloading —
  // the review queue reads papers in a tab beside the queue, and forcing every
  // one through the Downloads folder taxed the editors' core loop. Anything
  // other than the exact string keeps the safe attachment default.
  const inline =
    new URL(_request.url).searchParams.get("disposition") === "inline";

  const paper = await prisma.paper.findUnique({
    where: { id },
    select: {
      status: true,
      storedName: true,
      originalName: true,
      submitterId: true,
    },
  });

  // Same 404 whether the paper is missing or the caller may not see it — a
  // distinct 403 would confirm that a given id exists.
  if (!paper) return new NextResponse("Not found", { status: 404 });

  const isPublished = paper.status === PAPER_STATUS.PUBLISHED;
  const isOwner = !!user && user.id === paper.submitterId;

  if (!user) {
    // Signed out: send them to sign in rather than a bare 401, since this URL is
    // reachable from the download button on a public abstract page.
    return NextResponse.redirect(
      new URL(`/login?next=/api/papers/${id}/file`, _request.url),
    );
  }

  if (!isPublished && !isOwner) {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (row?.role !== "ADMIN") {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  let bytes: Buffer;
  try {
    bytes = await readPdf(paper.storedName);
  } catch (err) {
    // The row exists but the file does not — the classic symptom of a Render
    // deploy where UPLOAD_DIR pointed outside the mounted disk.
    console.error(`[papers] missing file for paper ${id}:`, err);
    return new NextResponse("File unavailable", { status: 500 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      // Forced rather than echoed from the upload: the stored file was verified
      // to start with %PDF, so this is accurate, and it stops a mislabelled
      // upload from being served as something the browser would execute.
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${asciiFilename(paper.originalName)}"`,
      "Content-Length": String(bytes.byteLength),
      // Gated content must never be cached by a shared cache, or a CDN could
      // serve one reader's download to an anonymous visitor.
      "Cache-Control": "private, no-store",
    },
  });
}

/**
 * Reduce a filename to something safe for a Content-Disposition header.
 *
 * Quotes and newlines would let an uploaded name break out of the header (a
 * response-splitting vector), and non-ASCII bytes are not valid there. Falls
 * back to "paper.pdf" when nothing usable survives.
 */
function asciiFilename(name: string): string {
  const cleaned = name
    .replace(/[^\x20-\x7E]/g, "") // header values are ASCII only
    .replace(/["\\\r\n]/g, "")
    .trim();
  return cleaned || "paper.pdf";
}
