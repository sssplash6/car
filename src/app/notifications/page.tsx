import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { listNotifications } from "@/lib/notifications";
import { formatDate } from "@/lib/site";
import { PageShell } from "@/app/_components/PageShell";
import { PendingButton } from "@/app/_components/PendingButton";
import { Rosette } from "@/app/_components/Ornament";
import {
  markNotificationsRead,
  openNotification,
} from "@/app/notifications/actions";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id);
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <PageShell>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-serif text-4xl text-ink">Notifications</h1>

        {/* Opening a notification marks it read; this clears the ones you are
            not going to open. */}
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <PendingButton
              pendingLabel="Marking…"
              className="text-sm text-accent transition-colors hover:text-accent-dark"
            >
              Mark all as read ({unread})
            </PendingButton>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 border-t border-rule py-14 text-center">
          <Rosette className="mx-auto size-12 text-rule-strong" />
          <h2 className="mt-6 font-serif text-2xl text-ink">Nothing yet</h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-fg">
            News about your papers arrives here, and by email.
          </p>
        </div>
      ) : (
        <ul className="mt-8 border-t border-rule">
          {items.map((item) => (
            <li
              key={item.id}
              className={`border-b border-rule py-5 ${item.readAt ? "" : "bg-accent-soft/40"}`}
            >
              <div className="flex items-start justify-between gap-4 px-1">
                <div className="min-w-0">
                  {item.href ? (
                    // A form, not a link: opening marks the row read first,
                    // then goes where it points — and still works without JS.
                    <form action={openNotification}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="href" value={item.href} />
                      <button
                        type="submit"
                        className="cursor-pointer text-left text-ink transition-colors hover:text-accent"
                      >
                        {item.title}
                      </button>
                    </form>
                  ) : (
                    <p className="text-ink">{item.title}</p>
                  )}
                  {item.body && (
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {item.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-fg">
                    {formatDate(item.createdAt)}
                    {/* The tinted row and dot are visual; this is the same
                        fact for screen readers. */}
                    {!item.readAt && <span className="sr-only"> · Unread</span>}
                  </p>
                </div>
                {!item.readAt && (
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-accent"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
