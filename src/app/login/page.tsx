import Link from "next/link";
import type { Metadata } from "next";
import { GoogleLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { siteUrl } from "@/lib/site";
import { COPY } from "@/lib/content";
import { demoMode, googleEnabled } from "@/auth.config";
import { devLoginEnabled } from "@/auth";
import { signInAsDev, signInWithGoogle } from "@/app/_actions/auth";
import { Notice } from "@/app/_components/ui/Feedback";
import { Mark } from "@/app/_components/ui/Mark";

export const metadata: Metadata = {
  title: "Sign in",
  // Nothing here is worth indexing.
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ next?: string; callbackUrl?: string; error?: string }>;
};

/**
 * Reduce a post-login destination to a same-site path. `next` is app-written
 * and relative; `callbackUrl` is what Auth.js appends when the proxy bounces a
 * signed-out visitor here, and arrives as an absolute URL. Anything else
 * (other origins, protocol-relative tricks) is dropped.
 */
function safePath(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    if (url.origin === siteUrl()) return url.pathname + url.search;
  } catch {
    // Not a URL at all — fall through.
  }
  return undefined;
}

// Sign in (DESIGN.md §9.6): one card, one primary action. Continuing with
// Google creates the account; there is no separate registration, and the card
// says so.
export default async function LoginPage({ searchParams }: PageProps) {
  const { next: rawNext, callbackUrl, error } = await searchParams;
  // Without this the proxy's round trip loses the destination.
  const next = safePath(rawNext) ?? safePath(callbackUrl);
  const copy = COPY.login;

  return (
    <div className="wrap page-top page-end">
      <div className="login-card settle-load">
        <Mark size={32} draw="load" delay={200} />
        <h1 className="t-h2 mt-6">{demoMode ? copy.demo.title : copy.title}</h1>
        <p className="t-body mt-3">{demoMode ? copy.demo.body : copy.body}</p>

        {error && (
          <Notice tone="bad" className="mt-6">
            That sign-in attempt did not complete. Please try again.
          </Notice>
        )}

        {/* The demo has no Google client by design; its buttons below are the sign-in. */}
        {!demoMode && (
          <div className="mt-8">
            {googleEnabled ? (
              <form
                action={async () => {
                  "use server";
                  await signInWithGoogle(next);
                }}
              >
                <button type="submit" className="btn btn-primary btn-lg w-full">
                  <GoogleLogoIcon weight="bold" aria-hidden="true" />
                  {copy.google}
                </button>
              </form>
            ) : (
              // A configuration problem, not a user error, so say so plainly
              // rather than render a button that dead-ends on Google's error page.
              <Notice tone="warn" role="none">
                Google sign-in is not configured on this deployment. Set AUTH_GOOGLE_ID and
                AUTH_GOOGLE_SECRET.
              </Notice>
            )}
          </div>
        )}

        {/* Local testing, or the public demo. Renders nowhere else: see the
            guards on devLoginEnabled in src/auth.ts. */}
        {devLoginEnabled && (
          <div>
            {!demoMode && (
              <>
                <p className="or-rule t-meta">{copy.devLabel}</p>
                <p className="t-ui-sm mt-3 text-ink-3">
                  Bypasses Google entirely. The editor account is promoted through the real
                  ADMIN_EMAILS path, so it only works if that address is listed.
                </p>
              </>
            )}
            <div className={`actions ${demoMode ? "mt-8" : "mt-4"}`}>
              <form
                action={async () => {
                  "use server";
                  await signInAsDev("reader");
                }}
              >
                <button type="submit" className="btn btn-secondary btn-md">
                  Continue as reader
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signInAsDev("admin");
                }}
              >
                <button type="submit" className="btn btn-secondary btn-md">
                  Continue as editor
                </button>
              </form>
            </div>
          </div>
        )}

        <p className="t-micro mt-8">
          By continuing you accept the{" "}
          <Link href="/privacy" className="prose-link">
            privacy notice
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
