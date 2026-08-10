import Link from "next/link";
import { BellIcon } from "@phosphor-icons/react/dist/ssr";

// Unread indicator in the header. A plain link to /notifications rather than a
// dropdown: the list is server-rendered there, so this needs no client JS and no
// second rendering of the same rows.
//
// Phosphor's /dist/ssr entry exports server-safe icon components, which keeps this
// a server component. Importing from the package root would pull in the client
// runtime and force "use client" all the way up.
export function NotificationBell({ count }: { count: number }) {
  // Counts above 9 would widen the badge past its circle, and the exact number
  // stops being useful well before then.
  const badge = count > 9 ? "9+" : String(count);

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className="relative flex size-9 items-center justify-center rounded text-muted-fg transition-colors hover:bg-accent-soft hover:text-accent"
    >
      <BellIcon size={19} weight="regular" aria-hidden="true" />

      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium leading-4 text-surface">
          {badge}
        </span>
      )}
    </Link>
  );
}
