"use client";

import { useFormStatus } from "react-dom";

// Submit button that acknowledges its server action: disabled + label swap
// while the form is pending. State feedback only (colour/label), no animation —
// the frequency rule keeps working surfaces still.
//
// Must be rendered INSIDE the <form> it reports on: useFormStatus reads the
// status of the nearest ancestor form.
export function PendingButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  /** Label shown while the action runs, e.g. "Publishing…". */
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`press-ink cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
