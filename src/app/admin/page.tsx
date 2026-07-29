import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PAPER_STATUS } from "@/lib/papers";
import { formatDate } from "@/lib/site";
import { StatusPill } from "@/app/_components/StatusPill";

export const metadata: Metadata = {
  title: "Editor dashboard",
  robots: { index: false, follow: false },
};

// Overview. Authorization comes from admin/layout.tsx.
export default async function AdminOverviewPage() {
  const [pending, published, returned, readers, recent, mailFailures] =
    await Promise.all([
      prisma.paper.count({ where: { status: PAPER_STATUS.SUBMITTED } }),
      prisma.paper.count({ where: { status: PAPER_STATUS.PUBLISHED } }),
      prisma.paper.count({ where: { status: PAPER_STATUS.REJECTED } }),
      prisma.user.count(),
      prisma.paper.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          updatedAt: true,
          submitter: { select: { email: true, name: true } },
        },
      }),
      // Surfaced up front because a failed decision email is invisible otherwise:
      // the send is deliberately fire-and-forget so a mail outage cannot roll back
      // a publish.
      prisma.emailLog.count({ where: { status: "FAILED" } }),
    ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Overview</h1>

      <div className="mt-8 grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Awaiting review" value={pending} href="/admin/queue" emphasis />
        <Stat label="Published" value={published} href="/papers" />
        <Stat label="Returned" value={returned} />
        <Stat label="Registered readers" value={readers} href="/admin/users" />
      </div>

      {mailFailures > 0 && (
        <p className="mt-6 rounded border border-state-bad/40 px-4 py-3 text-sm text-state-bad">
          {mailFailures} notification email
          {mailFailures === 1 ? "" : "s"} failed to send.{" "}
          <Link href="/admin/emails" className="underline">
            Open the email log
          </Link>
          . Authors can still see decisions in the app, so nothing is lost.
        </p>
      )}

      <section className="mt-14">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl text-ink">Recent activity</h2>
          <Link
            href="/admin/queue"
            className="text-sm text-accent transition-colors hover:text-accent-dark"
          >
            Review queue
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-6 border-t border-rule pt-6 text-muted-fg">
            No submissions yet.
          </p>
        ) : (
          <ul className="mt-4 border-t border-rule">
            {recent.map((paper) => (
              <li
                key={paper.id}
                className="flex items-center justify-between gap-4 border-b border-rule py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {paper.status === PAPER_STATUS.PUBLISHED ? (
                      <Link
                        href={`/p/${paper.slug}`}
                        className="transition-colors hover:text-accent"
                      >
                        {paper.title}
                      </Link>
                    ) : (
                      paper.title
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-fg">
                    {paper.submitter.email ?? paper.submitter.name ?? "unknown"} ·{" "}
                    {formatDate(paper.updatedAt)}
                  </p>
                </div>
                <StatusPill status={paper.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  emphasis = false,
}: {
  label: string;
  value: number;
  href?: string;
  /** The queue count is the number an editor is actually here to act on. */
  emphasis?: boolean;
}) {
  const body = (
    <div className="bg-surface p-5 transition-colors hover:bg-canvas">
      <p className="text-xs uppercase tracking-wider text-muted-fg">{label}</p>
      <p
        className={`mt-2 font-serif text-3xl ${emphasis && value > 0 ? "text-accent" : "text-ink"}`}
      >
        {value}
      </p>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
