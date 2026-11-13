import Link from "next/link";
import { Suspense } from "react";
import { openAccess } from "@/auth.config";
import { getOptionalUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { unreadCount } from "@/lib/notifications";
import { SITE_NAME } from "@/lib/site";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { Mark } from "@/app/_components/ui/Mark";
import { NavLinks } from "@/app/_components/NavLinks";
import { CatalogueTrigger } from "@/app/_components/CatalogueTrigger";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { NotificationBell } from "@/app/_components/NotificationBell";
import { ProfileMenu } from "@/app/_components/ProfileMenu";
import { MobileSheet } from "@/app/_components/MobileSheet";
import { NavProgress } from "@/app/_components/NavProgress";

// Site chrome (DESIGN.md §8.1). Rendered on every page, including public ones,
// so nothing here may assume a session. Sticky and never hidden: a reading
// site keeps its orientation. Its glass and hairline arrive over the first
// 48px of scroll (CSS scroll timeline, guarded).
//
// The public nav is the same four pills for every visitor; signed-in
// destinations live in the profile menu (and the mobile sheet).
const NAV = [
  { href: "/papers", label: "Papers" },
  { href: "/issues", label: "Issues" },
  { href: "/about", label: "About" },
  { href: "/submit", label: "Submit" },
];

export async function SiteHeader() {
  // Under open access this is the shared guest, never null (src/lib/dal.ts).
  const user = await getOptionalUser();
  const userId = user?.id ?? null;

  // Role from the database rather than the JWT, so a freshly promoted editor
  // sees the desk on the next page load. One primary-key lookup, signed-in only.
  const [roleRow, unread] = await Promise.all([
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      : Promise.resolve(null),
    unreadCount(userId),
  ]);

  const account = userId
    ? {
        // The guest's placeholder address is not worth showing.
        name: user?.name ?? null,
        email: openAccess ? null : (user?.email ?? null),
        isAdmin: roleRow?.role === "ADMIN",
        unread,
      }
    : null;

  return (
    <header className="site-header print:hidden">
      <div className="wrap head-inner">
        <Link href="/" className="brand" aria-label={`${SITE_NAME}, home`}>
          <Mark size={24} draw="session" />
          <span className="wordmark">{SITE_NAME}</span>
        </Link>

        <NavLinks items={NAV} />

        <div className="head-actions">
          <CatalogueTrigger emptyArt={<Drawing name="tulip" size="xs" draw="none" />} />
          <ThemeToggle className="max-lg:hidden" />
          {account ? (
            <>
              <NotificationBell count={account.unread} className="max-lg:hidden" />
              <ProfileMenu
                name={account.name}
                email={account.email}
                isAdmin={account.isAdmin}
                unread={account.unread}
                canSignOut={!openAccess}
                className="max-lg:hidden"
              />
            </>
          ) : (
            <Link href="/login" className="btn btn-secondary btn-sm max-lg:hidden">
              Sign in
            </Link>
          )}
          <MobileSheet
            nav={NAV}
            account={account}
            canSignOut={!openAccess}
            brand={
              <>
                <Mark size={24} />
                <span className="wordmark">{SITE_NAME}</span>
              </>
            }
          />
        </div>
      </div>
      {/* useSearchParams needs a Suspense boundary of its own. */}
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
    </header>
  );
}
