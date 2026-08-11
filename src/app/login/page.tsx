import Link from "next/link";
import type { Metadata } from "next";
import { GoogleLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Corners } from "@/app/_components/Ornament";
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
    <div className="mx-auto w-full max-w-md px-6 py-16">
      {/* A doorway, so it gets the frame: the same treatment as the gated
          download panel, because both mark the same threshold. */}
      {/* The illumination corners alone frame the doorway. No Rosette here:
          the device belongs to the masthead 150px above, and repeating it
          demotes it from device to decoration (DESIGN.md placement rule). */}
      <div className="relative border border-rule-strong bg-surface p-8 sm:p-10">
        <Corners className="text-gild" />
        <h1 className="display-flush font-serif text-[2.5rem] leading-tight tracking-tight text-ink">
          Sign in
        </h1>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Abstracts are free to read without an account. Sign in to download
          full papers or to submit your own work. New here? Continuing with
          Google creates your account; there is no separate registration.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-7 rounded border border-state-bad/40 bg-surface px-4 py-3 text-sm text-state-bad"
          >
            That sign-in attempt did not complete. Please try again.
          </p>
        )}

        <div className="mt-9 border-t border-rule pt-9">
          {googleEnabled ? (
            <form
              action={async () => {
                "use server";
                await signInWithGoogle(next);
              }}
            >
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded bg-accent px-4 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-dark active:translate-y-px"
              >
                <GoogleLogoIcon size={17} weight="bold" aria-hidden="true" />
                Continue with Google
              </button>
            </form>
          ) : (
            // A configuration problem, not a user error, so say so plainly rather
            // than rendering a button that dead-ends on Google's error page.
            <p className="rounded border border-state-warn/40 bg-surface px-4 py-3 text-sm text-state-warn">
              Google sign-in is not configured on this deployment. Set
              AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.
            </p>
          )}

          {/* Local testing only. This block cannot render off localhost: see the
              double guard on devLoginEnabled in src/auth.ts. */}
          {devLoginEnabled && (
            <div className="mt-8 rounded border border-dashed border-state-warn/50 p-4">
              <p className="text-xs font-medium text-state-warn">
                Dev login, localhost only
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-fg">
                Bypasses Google entirely. The editor account is promoted through the
                real ADMIN_EMAILS path, so it only works if that address is listed.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <form
                  action={async () => {
                    "use server";
                    await signInAsDev("reader");
                  }}
                >
                  <button
                    type="submit"
                    className="cursor-pointer rounded border border-rule-strong px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px"
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
                    className="cursor-pointer rounded border border-rule-strong px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px"
                  >
                    Continue as editor
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-fg">
        Just here to read?{" "}
        <Link href="/papers" className="text-accent hover:text-accent-dark">
          Browse the papers
        </Link>
        .
      </p>
    </div>
  );
}
