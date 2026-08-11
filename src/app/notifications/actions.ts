"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { markAllRead, markOneRead } from "@/lib/notifications";

export async function markNotificationsRead() {
  // requireUser is the authorization boundary here; markAllRead additionally
  // scopes by this id in its where clause, so it can never touch another user's
  // rows even if called with a stale session.
  const user = await requireUser();
  await markAllRead(user.id);

  // The bell lives in the layout, so the header of every page is now stale.
  revalidatePath("/", "layout");
}

/**
 * Open a notification: mark it read, then go where it points. Following the
 * link is the strongest possible signal that it has been seen — unlike
 * mark-on-view, which clears the badge for things never actually looked at.
 */
export async function openNotification(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const href = String(formData.get("href") ?? "");

  if (id) await markOneRead(user.id, id);
  revalidatePath("/", "layout");

  // href values are app-written, but the field arrives from the client, so
  // only same-site paths are followed ("//host" would be protocol-relative).
  const safe = href.startsWith("/") && !href.startsWith("//");
  redirect(safe ? href : "/notifications");
}
