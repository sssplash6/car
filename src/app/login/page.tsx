import type { Metadata } from "next";
import { googleEnabled } from "@/auth.config";
import { devLoginEnabled } from "@/auth";
import { signInAsDev, signInWithGoogle } from "@/app/_actions/auth";

export const metadata: Metadata = {
  title: "Sign in",
  // Nothing here is worth indexing, and a sign-in page ranking for the site name
  // is actively unhelpful.
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-3xl text-ink">Sign in</h1>
      <p className="mt-3 text-muted-fg">
        Reading abstracts needs no account. Sign in to download full papers or to
        submit your own.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-chart-bad/40 px-4 py-3 text-sm text-chart-bad">
          That sign-in attempt did not complete. Please try again.
        </p>
      )}

      <div className="mt-10 border-t border-line pt-10">
        {googleEnabled ? (
          <form
            action={async () => {
              "use server";
              await signInWithGoogle(next);
            }}
          >
            <button
              type="submit"
              className="w-full cursor-pointer rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Continue with Google
            </button>
          </form>
        ) : (
          // Configuration problem, not a user error — say so plainly instead of
          // rendering a button that dead-ends on Google's error page.
          <p className="rounded-md border border-chart-warn/40 px-4 py-3 text-sm text-chart-warn">
            Google sign-in is not configured on this deployment. Set
            AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.
          </p>
        )}

        {/* Local testing only. This block cannot render off localhost — see the
            double guard on devLoginEnabled in src/auth.ts. */}
        {devLoginEnabled && (
          <div className="mt-8 rounded-md border border-dashed border-chart-warn/50 p-4">
            <p className="text-xs font-medium text-chart-warn">
              Dev login — localhost only
            </p>
            <p className="mt-1 text-xs text-muted-fg">
              Bypasses Google entirely. The editor account is promoted through the
              real ADMIN_EMAILS path, so it only works if that address is listed.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <form
                action={async () => {
                  "use server";
                  await signInAsDev("reader");
                }}
              >
                <button
                  type="submit"
                  className="cursor-pointer rounded-md border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  Continue as reader
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signInAsDev("admin");
                }}
              >
                <button
                  type="submit"
                  className="cursor-pointer rounded-md border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  Continue as editor
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
