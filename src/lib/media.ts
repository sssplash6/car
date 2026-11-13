import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { UploadError } from "@/lib/storage";

// Images for articles: covers and figures. They live on the same disk as the
// PDFs (UPLOAD_DIR/media) and are served publicly by /api/media/[name], since
// they appear on public pages. Draft images are public too, but only by an
// unguessable uuid name that nobody else is ever shown.

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "var/uploads";
const MEDIA_DIR = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, "media");

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const MEDIA_NAME_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

export const MEDIA_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** The type from the file's leading bytes, never from its name or the
    browser's claim, so a renamed HTML file cannot be served as an image. */
function sniff(bytes: Buffer): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  if (bytes.subarray(0, 4).toString("latin1") === "GIF8") return "gif";
  return null;
}

/** Store an uploaded image and return its public URL. */
export async function saveImage(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError("That image is empty.");
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError(`Images are limited to ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = sniff(bytes);
  if (!ext) throw new UploadError("Use a JPEG, PNG, WebP or GIF image.");

  const name = `${randomUUID()}.${ext}`;
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(path.join(MEDIA_DIR, name), bytes);
  return `/api/media/${name}`;
}

export async function readImage(name: string): Promise<Buffer> {
  if (!MEDIA_NAME_PATTERN.test(name)) throw new Error("Invalid media name");
  return readFile(path.join(MEDIA_DIR, name));
}
