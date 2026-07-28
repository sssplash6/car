import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signOutAction } from "@/app/_actions/auth";
import { SITE_NAME } from "@/lib/site";

// Site chrome. Rendered on every page including the public ones, so it must not
// assume a session exists.
export async function SiteHeader() {
  const session = await auth();
  const userId = session?.user?.id;

  // The Review link is the only thing here that depends on the role. Read it from
  // the database rather than the JWT so a freshly-promoted admin sees the link on
  // their next page load instead of after re-authenticating. Cheap: one indexed
  // lookup by primary key, and only for signed-in users.
  const isAdmin = userId
    ? (
        await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
      )?.role === "ADMIN"
    : false;

  return (
    <header className="border-b border-line">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
        <Link
          href="/"
          className="font-serif text-lg text-ink transition-colors hover:text-brand"
        >
          {SITE_NAME}
        </Link>

        <div className="ml-auto flex items-center gap-x-5 text-sm">
          {userId ? (
            <>
              <Link
                href="/submit"
                className="text-brand transition-colors hover:text-brand-dark"
              >
                Submit a paper
              </Link>
              <Link
                href="/submissions"
                className="text-muted-fg transition-colors hover:text-ink"
              >
                My submissions
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-muted-fg transition-colors hover:text-ink"
                >
                  Review
                </Link>
              )}
              {/* A form, not a link: signing out is a mutation and must not be
                  reachable by prefetch or by a crawler following an <a>. */}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="cursor-pointer text-muted-fg transition-colors hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-brand transition-colors hover:text-brand-dark"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
