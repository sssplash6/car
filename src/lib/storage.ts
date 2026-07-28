import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Where uploaded PDFs live.
//
// On Render this MUST point inside the mounted disk. The checked-out repo is
// ephemeral: without a disk (or with a repo-relative path) every deploy silently
// discards every uploaded paper. That is data loss, not a crash — nothing will
// alert you.
//
// Critically this directory is OUTSIDE public/. Anything under public/ is served
// statically by Next with no auth check, which would bypass the READER gate
// entirely and hand out every PDF to anyone who guessed a filename.
// The default is a bare relative path rather than path.join(process.cwd(), …):
// Node resolves it against the working directory identically, and calling
// process.cwd() at module scope makes Turbopack trace the entire project tree
// into the build output.
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "var/uploads";

// 10 MB covers a text-heavy paper with figures. Must stay <= the
// serverActions.bodySizeLimit in next.config.ts, or the request is rejected by
// Next before this code ever runs and the user sees an opaque error.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// A real PDF always starts with these five bytes. Checked because the browser's
// reported MIME type and the file extension are both client-controlled and
// trivially forged.
const PDF_MAGIC = "%PDF-";

// Generated filenames only ever look like this. Validated on read as well as
// write: storedName comes back from the database, and treating it as trusted
// would turn any future write path into a directory traversal.
const STORED_NAME_PATTERN = /^[0-9a-f-]{36}\.pdf$/;

export class UploadError extends Error {}

/**
 * Resolve a stored filename to its full path on disk.
 *
 * UPLOAD_DIR is runtime configuration pointing at a mounted disk, so the build
 * tracer cannot resolve it and emits an "unexpected file in NFT list" warning.
 * The turbopackIgnore hint below is the documented remedy but does NOT silence it
 * here; the warning is cosmetic — build output stays project-scoped (~15 MB) and
 * there is genuinely nothing to include at build time, since the directory does
 * not exist until the service is running. Left in place as documentation of
 * intent rather than as a working suppression.
 */
function uploadPath(storedName: string): string {
  return path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, storedName);
}

/**
 * Persist an uploaded PDF and return its generated filename plus byte size.
 *
 * Rejects: empty files, anything over MAX_UPLOAD_BYTES, and any file whose
 * leading bytes are not a PDF header. The caller's original filename is never
 * used on disk — only recorded in the database for the download name.
 */
export async function savePdf(
  file: File,
): Promise<{ storedName: string; size: number }> {
  if (file.size === 0) {
    throw new UploadError("That file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
    throw new UploadError("That file is not a PDF.");
  }

  const storedName = `${randomUUID()}.pdf`;

  // Unlike the SQLite file, upload dirs may nest — create the whole path.
  await mkdir(/*turbopackIgnore: true*/ UPLOAD_DIR, { recursive: true });
  await writeFile(uploadPath(storedName), bytes);

  return { storedName, size: bytes.byteLength };
}

/** Read a stored PDF back. Throws if storedName is not one of ours. */
export async function readPdf(storedName: string): Promise<Buffer> {
  if (!STORED_NAME_PATTERN.test(storedName)) {
    throw new UploadError(`Refusing to read suspicious filename: ${storedName}`);
  }
  return readFile(uploadPath(storedName));
}

/**
 * Delete a stored PDF, ignoring a missing file.
 *
 * Used when a draft is replaced or deleted. A missing file is not an error worth
 * failing the surrounding transaction over — the database row is the record that
 * matters, and an orphaned file is harmless.
 */
export async function deletePdf(storedName: string): Promise<void> {
  if (!STORED_NAME_PATTERN.test(storedName)) return;
  try {
    await unlink(uploadPath(storedName));
  } catch {
    // Already gone — nothing to do.
  }
}
