import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unreadCount } from "@/lib/notifications";
import { SITE_NAME } from "@/lib/site";
import { NotificationBell } from "@/app/_components/NotificationBell";
import { ProfileMenu } from "@/app/_components/ProfileMenu";

// Site chrome. Rendered on every page including public ones, so nothing here may
// assume a session exists.
//
// Nav is three items on one line. Signed-in destinations (submissions,
// notifications, the editor dashboard) live in the profile menu instead, so the
// public nav stays identical for every visitor and never wraps.
const NAV = [
  { href: "/papers", label: "Papers" },
  { href: "/about", label: "About" },
  { href: "/submit", label: "Submit" },
];

export async function SiteHeader() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Role comes from the database rather than the JWT so a freshly promoted editor
  // sees their dashboard link on the next page load instead of after
  // re-authenticating. One primary-key lookup, and only for signed-in users.
  const [roleRow, unread] = await Promise.all([
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      : Promise.resolve(null),
    unreadCount(userId),
  ]);
  const isAdmin = roleRow?.role === "ADMIN";

  return (
    <header className="border-b border-rule bg-canvas">
      <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-6 px-6 pt-7">
        {/* Masthead. The review's own name only. The academy is credited in the
            footer, not here. */}
        <Link href="/" className="group min-w-0">
          <span className="display-flush block font-serif text-[1.75rem] leading-[1.05] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-[2.125rem]">
            {SITE_NAME}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          {userId ? (
            <>
              <NotificationBell count={unread} />
              <ProfileMenu
                name={session?.user?.name ?? null}
                email={session?.user?.email ?? null}
                isAdmin={isAdmin}
              />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded border border-rule-strong px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      <nav className="mx-auto w-full max-w-6xl px-6">
        <ul className="mt-5 flex gap-7 text-[0.9375rem]">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="-mb-px inline-block border-b border-transparent pb-3 text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
