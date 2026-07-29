import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "Email log",
  robots: { index: false, follow: false },
};

// Delivery log for every notification email.
//
// This page exists because sending is deliberately fire-and-forget: a decision is
// committed before the email is attempted, so a mail outage must not roll it back.
// Without this log a failure would only ever appear in server logs nobody reads.
//
// SKIPPED means RESEND_API_KEY was unset — normal in local development, and a
// misconfiguration in production.
const STATUS_STYLE: Record<string, string> = {
  SENT: "text-state-good",
  FAILED: "text-state-bad",
  SKIPPED: "text-state-mute",
};

const STATUS_LABEL: Record<string, string> = {
  SENT: "Sent",
  FAILED: "Failed",
  SKIPPED: "Not sent",
};

export default async function AdminEmailsPage() {
  const [logs, failed, skipped] = await Promise.all([
    prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.emailLog.count({ where: { status: "FAILED" } }),
    prisma.emailLog.count({ where: { status: "SKIPPED" } }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Email log</h1>
      <p className="mt-3 max-w-2xl text-muted-fg">
        Every notification email the site attempted, newest first. Delivery is
        best-effort by design: a decision is saved before the email is tried, so a
        failure here never means a lost review.
      </p>

      {skipped > 0 && (
        <p className="mt-4 max-w-2xl rounded border border-rule bg-surface px-4 py-3 text-sm text-ink-soft">
          {skipped} message{skipped === 1 ? "" : "s"} marked{" "}
          <em>not sent</em>: no{" "}
          <code className="text-accent">RESEND_API_KEY</code> was configured, so
          the content was written to the server console instead. Expected in local
          development.
        </p>
      )}

      {failed > 0 && (
        <p className="mt-4 max-w-2xl rounded border border-state-bad/40 px-4 py-3 text-sm text-state-bad">
          {failed} message{failed === 1 ? "" : "s"} failed. The recipient can still
          see the outcome in the app, so no decision was lost.
        </p>
      )}

      {logs.length === 0 ? (
        <p className="mt-10 border-t border-rule pt-10 text-muted-fg">
          No emails have been attempted yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm">
            <thead>
              <tr className="border-y border-rule text-xs uppercase tracking-wider text-muted-fg">
                <th className="py-3 pr-4 font-medium">When</th>
                <th className="py-3 pr-4 font-medium">Recipient</th>
                <th className="py-3 pr-4 font-medium">Subject</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-rule align-top">
                  <td className="whitespace-nowrap py-3 pr-4 text-muted-fg">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{log.recipient}</td>
                  <td className="py-3 pr-4 text-ink">
                    {log.subject}
                    {log.error && (
                      // The provider's message, kept verbatim — it is the only
                      // clue about why a send failed.
                      <span className="mt-1 block text-xs text-state-bad">
                        {log.error}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-3">
                    <span className={STATUS_STYLE[log.status] ?? "text-muted-fg"}>
                      {STATUS_LABEL[log.status] ?? log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
