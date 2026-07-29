"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { DEFAULTS, type ContentKey } from "@/lib/content";

// Editing site copy. requireAdmin() runs here independently of admin/layout.tsx —
// a server action is reachable by direct POST and never passes through a layout.

const MAX_TITLE = 200;
const MAX_BODY = 8000;

function isContentKey(value: string): value is ContentKey {
  // Rejects keys not declared in DEFAULTS, so a crafted POST cannot create
  // arbitrary rows that no page reads.
  return Object.hasOwn(DEFAULTS, value);
}

export async function saveBlock(formData: FormData) {
  const admin = await requireAdmin();

  const key = String(formData.get("key") ?? "");
  if (!isContentKey(key)) return;

  const title = String(formData.get("title") ?? "").slice(0, MAX_TITLE);
  const body = String(formData.get("body") ?? "").slice(0, MAX_BODY);

  await prisma.contentBlock.upsert({
    where: { key },
    update: { title, body, updatedById: admin.id },
    create: { key, title, body, updatedById: admin.id },
  });

  revalidateContent();
}

/**
 * Drop the stored value so the placeholder default renders again.
 *
 * Deletes the row rather than blanking it — getBlock treats an empty string as
 * "fall back" anyway, but removing the row keeps "is this still placeholder copy"
 * answerable in the editor.
 */
export async function resetBlock(formData: FormData) {
  await requireAdmin();

  const key = String(formData.get("key") ?? "");
  if (!isContentKey(key)) return;

  await prisma.contentBlock.deleteMany({ where: { key } });

  revalidateContent();
}

function revalidateContent() {
  // Blocks appear on the homepage, About, the submit page, and in the footer —
  // which is in the root layout, so every route's shell is now stale.
  revalidatePath("/", "layout");
}
