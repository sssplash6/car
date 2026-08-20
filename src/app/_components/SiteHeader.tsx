import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unreadCount } from "@/lib/notifications";
import { SITE_NAME } from "@/lib/site";
import { NavLinks } from "@/app/_components/NavLinks";
import { NotificationBell } from "@/app/_components/NotificationBell";
import { ProfileMenu } from "@/app/_components/ProfileMenu";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { CatalogueTrigger } from "@/app/_components/CatalogueTrigger";
import { Rosette, WovenTrim } from "@/app/_components/Ornament";

// Site chrome. Rendered on every page including public ones, so nothing here may
// assume a session exists.
//
// The header is a RUNNING HEAD. A printed journal keeps telling you what you are
// reading in the top margin of every page; this one used to scroll away and
// leave the reader with no navigation for the length of an article. It now
// sticks at a negative offset: the masthead rides up out of view and the strip
// beneath it pins itself to the top edge. That is plain position:sticky, so it
// behaves the same in every browser — the only scroll-driven part is the
// compact wordmark fading into the pinned strip, which is decoration and is
// simply absent where the feature is not supported.
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
    <header
      className="sticky z-40 print:hidden"
      // The masthead's own height, negated: exactly that much of the header is
      // allowed to leave, and the strip below it stops at the viewport edge.
      style={{ top: "calc(-1 * var(--masthead-h))" }}
    >
      {/* ---- The part that leaves ---- */}
      <div className="bg-canvas">
        <WovenTrim />
        <div
          className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6"
          style={{ height: "calc(var(--masthead-h) - 0.375rem)" }}
        >
          {/* Masthead. The review's own name only. The academy is credited in the
              footer, not here. The rosette turns an eighth on hover — with 8-fold
              symmetry it lands on itself, a wheel clicking one notch round. */}
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <Rosette className="size-9 shrink-0 text-accent transition-transform duration-500 ease-[var(--ease-out-strong)] group-hover:rotate-45 sm:size-10" />
            <span className="display-flush block min-w-0 truncate font-serif text-[1.75rem] leading-[1.05] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-[2.125rem]">
              {SITE_NAME}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
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
                className="press-ink rounded border border-rule-strong px-3.5 py-1.5 text-sm text-ink hover:border-accent hover:text-accent"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ---- The part that stays ---- */}
      <div className="head-strip relative border-b border-rule bg-canvas">
        <nav
          aria-label="Primary"
          className="mx-auto flex w-full max-w-6xl items-center gap-5 px-6"
          style={{ height: "var(--head-h)" }}
        >
          {/* The compact device: once the masthead has gone, the strip still
              carries the press's mark. The rosette ALONE — the wordmark would
              only be a second, smaller copy of a name the reader just scrolled
              past, and reserving its width would push the nav out of line with
              the masthead above it. It fades in with scroll where scroll-driven
              animations exist and is simply absent otherwise; the full masthead
              is one flick away, so nothing is lost. aria-hidden because it
              duplicates the masthead link for anyone reading linearly. */}
          <Link
            href="/"
            aria-hidden="true"
            tabIndex={-1}
            className="head-mark hidden shrink-0 items-center sm:flex"
          >
            <Rosette className="size-[1.15rem] text-accent" />
          </Link>

          <NavLinks items={NAV} />

          <div className="ml-auto flex shrink-0 items-center">
            <CatalogueTrigger />
          </div>
        </nav>
      </div>
    </header>
  );
}
