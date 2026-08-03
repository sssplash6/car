import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Show the Google button only when credentials are configured, so a fresh clone
// with an empty .env renders an explanatory message instead of a button that
// dead-ends on Google's error page.
//
// BOTH halves are required, not just the id. Auth.js reads the secret itself
// (from AUTH_GOOGLE_SECRET, by convention from the provider id) so it never
// appears in this file — which makes it easy to check only the id and ship a
// half-configured client. That combination is the worst failure mode: the button
// renders, the user completes Google's consent screen, and the token exchange
// then fails on the callback with an opaque Configuration error. Render prompts
// for these two separately, so a typo in one is a realistic way to get there.
export const googleEnabled = !!(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

// Routes that require a signed-in user. Everything else is public — this is a
// content-marketing site, so the paper index and abstract pages MUST stay
// crawlable. Adding "/" or "/p" here would delete the site's search traffic.
const PROTECTED_PREFIXES = ["/submit", "/submissions", "/admin", "/notifications"];

// Edge-safe Auth.js config: no Prisma adapter, no database reads. Shared between
// the proxy (route protection) and the full server config in `src/auth.ts`.
export const authConfig = {
  // Required behind Render's proxy so Auth.js builds callback URLs from the
  // forwarded host headers rather than localhost.
  trustHost: true,
  providers: googleEnabled
    ? [
        Google({
          // Always let the user pick an account. Without this, a shared machine
          // silently reuses whoever signed in last.
          authorization: { params: { prompt: "select_account" } },
        }),
      ]
    : [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Optimistic route protection only. Per Next's own guidance this must not
    // touch the database — it runs on every matched request, including
    // prefetches. The authoritative checks live in src/lib/dal.ts.
    //
    // Note there is deliberately no signIn callback rejecting outside emails:
    // open signup is the point. Anyone may register and read; publishing is
    // gated by review, not by who can log in.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const needsAuth = PROTECTED_PREFIXES.some(
        (prefix) =>
          nextUrl.pathname === prefix ||
          nextUrl.pathname.startsWith(`${prefix}/`),
      );

      // /admin additionally requires the ADMIN role, checked in the page itself
      // because the role lives in the database and is not available here.
      if (needsAuth) return isLoggedIn;

      if (nextUrl.pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/submissions", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
