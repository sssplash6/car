import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unreadCount } from "@/lib/notifications";
import { SITE_NAME } from "@/lib/site";
import { NavLinks } from "@/app/_components/NavLinks";
import { NotificationBell } from "@/app/_components/NotificationBell";
import { ProfileMenu } from "@/app/_components/ProfileMenu";
import { Rosette, WovenTrim } from "@/app/_components/Ornament";

// Site chrome. Rendered on every page including public ones, so nothing here may
// assume a session exists.
//
// The woven trim across the very top is the site's selvedge — the one place the
// full textile palette appears at full saturation. Everything below it stays on
// paper tokens, which is what keeps the band special.
//
// Nav is four items on one line. Signed-in destinations (submissions,
// notifications, the editor dashboard) live in the profile menu instead, so the
// public nav stays identical for every visitor and never wraps.
const NAV = [
  { href: "/papers", label: "Papers" },
  { href: "/issues", label: "Issues" },
  { href: "/about", label: "About" },
  { href: "/submit", label: "Submit" },
] as const;

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
      <WovenTrim />

      <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-6 px-6 pt-6">
        {/* Masthead. The review's own name only. The academy is credited in the
            footer, not here. The rosette turns an eighth on hover — with 8-fold
            symmetry it lands on itself, a wheel clicking one notch round. */}
        <Link href="/" className="group flex min-w-0 items-end gap-3">
          <Rosette
            className="mb-1 size-9 shrink-0 text-accent transition-transform duration-500 ease-[var(--ease-out-strong)] group-hover:rotate-45 sm:size-10"
          />
          <span className="block min-w-0">
            <span className="display-flush block font-serif text-[1.75rem] leading-[1.05] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-[2.125rem]">
              {SITE_NAME}
            </span>
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

      <nav aria-label="Primary" className="mx-auto w-full max-w-6xl px-6">
        <div className="mt-4">
          <NavLinks items={NAV} />
        </div>
      </nav>
    </header>
  );
}
