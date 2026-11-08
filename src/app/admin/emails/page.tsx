import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/site";
import { Notice, StatusMark } from "@/app/_components/ui/Feedback";

export const metadata: Metadata = {
  title: "Email log",
  robots: { index: false, follow: false },
};

// Delivery log for every notification email. Sending is deliberately
// fire-and-forget (a decision is committed before the email is attempted, so
// a mail outage cannot roll it back); without this log a failure would only
// ever appear in server logs nobody reads.
//
// SKIPPED means RESEND_API_KEY was unset: normal in local development, a
// misconfiguration in production.
export default async function AdminEmailsPage() {
  const [logs, failed, skipped] = await Promise.all([
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.emailLog.count({ where: { status: "FAILED" } }),
    prisma.emailLog.count({ where: { status: "SKIPPED" } }),
  ]);

  return (
    <div>
      <h2 className="sr-only">Email log</h2>
      <p className="t-body max-w-2xl text-ink-3">
        Every notification email the site attempted, newest first. Delivery is best-effort by
        design: a decision is saved before the email is tried, so a failure here never means a lost
        review.
      </p>

      {skipped > 0 && (
        <Notice tone="warn" role="none" className="mt-6 max-w-2xl">
          {skipped} message{skipped === 1 ? "" : "s"} skipped: no{" "}
          <code className="font-mono text-[0.875em]">RESEND_API_KEY</code> was configured, so the
          content was written to the server console instead. Expected in local development.
        </Notice>
      )}
      {failed > 0 && (
        <Notice tone="bad" className="mt-4 max-w-2xl">
          {failed} message{failed === 1 ? "" : "s"} failed. The recipient can still see the outcome
          in the app, so no decision was lost.
        </Notice>
      )}

      {logs.length === 0 ? (
        <p className="t-body mt-8 text-ink-3">No emails have been attempted yet.</p>
      ) : (
        <table className="dtable mt-8">
          <thead>
            <tr>
              <th scope="col">Recipient</th>
              <th scope="col">Subject</th>
              <th scope="col">Status</th>
              <th scope="col">Time</th>
              <th scope="col">Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="primary-cell break-all">{log.recipient}</td>
                <td data-label="Subject">{log.subject}</td>
                <td data-label="Status">
                  <StatusMark status={log.status} />
                </td>
                {/* Minutes matter in a delivery log: "which attempt was this"
                    is unanswerable at day granularity. */}
                <td data-label="Time" className="whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td data-label="Error">
                  {log.error ? (
                    // The provider's message, verbatim: the only clue to why.
                    <details>
                      <summary className="cursor-pointer text-bad">Show</summary>
                      <p className="t-ui-sm mt-2 max-w-md break-words text-bad">{log.error}</p>
                    </details>
                  ) : (
                    <span className="text-ink-4">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
