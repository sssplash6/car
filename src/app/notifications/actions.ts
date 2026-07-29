"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { markAllRead } from "@/lib/notifications";

export async function markNotificationsRead() {
  // requireUser is the authorization boundary here; markAllRead additionally
  // scopes by this id in its where clause, so it can never touch another user's
  // rows even if called with a stale session.
  const user = await requireUser();
  await markAllRead(user.id);

  // The bell lives in the layout, so the header of every page is now stale.
  revalidatePath("/", "layout");
}
