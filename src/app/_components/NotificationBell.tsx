import { BellIcon } from "@phosphor-icons/react/dist/ssr";
import { IconButton } from "@/app/_components/ui/IconButton";

// Unread indicator: a plain link to /notifications (the list is server-
// rendered there), with the accent-mark dot when anything is unread. The
// exact count lives in the accessible name.
export function NotificationBell({ count, className }: { count: number; className?: string }) {
  return (
    <IconButton
      href="/notifications"
      label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      dot={count > 0}
      className={className}
    >
      <BellIcon aria-hidden="true" />
    </IconButton>
  );
}
