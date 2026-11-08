import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { listNotifications } from "@/lib/notifications";
import { formatShortDate } from "@/lib/format";
import { COPY } from "@/lib/content";
import { PendingButton } from "@/app/_components/PendingButton";
import { Reveal } from "@/app/_components/motion/Reveal";
import { EmptyState } from "@/app/_components/ui/Feedback";
import { cx } from "@/app/_components/ui/cx";
import { markNotificationsRead, openNotification } from "@/app/notifications/actions";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

// Notifications (DESIGN.md §9.9). Each row is a form: opening it marks it read
// first, then goes where it points, and still works without JS. Unread rows
// carry the accent-mark dot and ink titles; read rows step back to ink-2.
export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id);
  const unread = items.filter((n) => !n.readAt).length;
  const copy = COPY.notifications;

  return (
    <div className="wrap-list page-top page-end">
      <div className="list-head">
        <h1 className="t-h1">{copy.title}</h1>
        {/* Opening a notification marks it read; this clears the rest. */}
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <PendingButton variant="secondary" size="md" pendingLabel="Marking…">
              {copy.markAll}
            </PendingButton>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-8"
          drawing="silkworm"
          title={copy.emptyTitle}
          body={copy.emptyBody}
          action={{ href: "/submissions", label: COPY.submissions.title }}
        />
      ) : (
        <Reveal as="ul" gesture="rows" className="ledger">
          {items.map((item, i) => (
            <li key={item.id} className="!py-0" style={{ "--i": i } as CSSProperties}>
              <div className="note-row">
                <span className={item.readAt ? undefined : "unread"} aria-hidden="true" />
                <div className="min-w-0">
                  {item.href ? (
                    <form action={openNotification}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="href" value={item.href} />
                      <button
                        type="submit"
                        className={cx("note-open t-h4", item.readAt ? "text-ink-2" : "text-ink")}
                      >
                        {item.title}
                      </button>
                    </form>
                  ) : (
                    <p className={cx("t-h4", item.readAt ? "text-ink-2" : "text-ink")}>{item.title}</p>
                  )}
                  {item.body && <p className="t-body mt-1 text-ink-3">{item.body}</p>}
                  {/* The dot is visual; this is the same fact for screen readers. */}
                  {!item.readAt && <span className="sr-only">Unread</span>}
                </div>
                <time className="t-meta pt-1" dateTime={item.createdAt.toISOString()}>
                  {formatShortDate(item.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </Reveal>
      )}
    </div>
  );
}
