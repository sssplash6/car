import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { listNotifications } from "@/lib/notifications";
import { formatDate } from "@/lib/site";
import { PageShell } from "@/app/_components/PageShell";
import { markNotificationsRead } from "@/app/notifications/actions";

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
        <h1 className="font-serif text-3xl text-ink">Notifications</h1>

        {/* Marking read is an explicit action rather than a side effect of opening
            the page: an automatic mark-on-view would clear the badge before the
            user had actually looked at anything. */}
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <button
              type="submit"
              className="cursor-pointer text-sm text-accent transition-colors hover:text-accent-dark"
            >
              Mark all as read ({unread})
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-10 border-t border-rule pt-10 text-muted-fg">
          Nothing yet. You will be notified here when a paper you submitted is
          reviewed.
        </p>
      ) : (
        <ul className="mt-8 border-t border-rule">
          {items.map((item) => (
            <li
              key={item.id}
              className={`border-b border-rule py-5 ${item.readAt ? "" : "bg-accent-soft/40"}`}
            >
              <div className="flex items-start justify-between gap-4 px-1">
                <div className="min-w-0">
                  <p className="text-ink">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="transition-colors hover:text-accent"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </p>
                  {item.body && (
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {item.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-fg">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                {!item.readAt && (
                  <span
                    aria-label="Unread"
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
