import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { siteUrl } from "@/lib/site";

// Emails promoted to ADMIN on sign-in. Comma-separated; blank means nobody can
// review submissions, which is a working-but-useless deployment — papers pile up
// in the queue with no way to publish them. Set this before going live.
//
// Promotion is recomputed on EVERY sign-in, so removing an address here demotes
// that person the next time they log in. There is deliberately no in-app UI to
// change roles: the env var is the single source of truth.
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function intendedRole(email: string | null | undefined): "ADMIN" | "READER" {
  return email && adminEmails.has(email.toLowerCase()) ? "ADMIN" : "READER";
}

// ---- Dev-only login bypass --------------------------------------------------
//
// One-click sign-in as a throwaway reader or admin, so the gate and the review
// queue can be exercised without registering a Google OAuth client.
//
// This is a COMPLETE AUTHENTICATION BYPASS: authorize() below accepts any input
// and hands back a session. It is therefore guarded three times, and each guard
// covers a different way the other two can fail. DO NOT relax any of them.
//
//   1. the flag must be explicitly set                    (runtime)
//   2. the build must not be a production build           (runtime)
//   3. the public origin must be localhost                (BUILD-TIME CONSTANT)
//
// Guard 3 cannot stand on its own, which is why guard 2 exists. siteUrl() reads
// NEXT_PUBLIC_SITE_URL, and Next INLINES every NEXT_PUBLIC_* var into the bundle
// at build time — `siteUrl()` compiles down to a frozen string literal with no
// env read left in it. So `isLocalhost` is decided by whatever the origin was
// when `next build` ran, NOT by the deployed environment. If a production build
// ever runs without NEXT_PUBLIC_SITE_URL set, isLocalhost freezes as `true` and
// the only thing standing between the public internet and this bypass is the
// flag — and `dev-admin@freshman.academy` is promoted through the real
// ADMIN_EMAILS path, so the bypass hands out ADMIN, not just a reader session.
//
// NODE_ENV is a genuine per-process runtime read (`next start` sets it), so
// guard 2 holds even against a mis-built bundle.
const devLoginRequested = process.env.ALLOW_DEV_LOGIN === "true";
const isProduction = process.env.NODE_ENV === "production";
const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(siteUrl());

export const devLoginEnabled = devLoginRequested && !isProduction && isLocalhost;

if (devLoginRequested && !devLoginEnabled) {
  console.warn(
    "[auth] ALLOW_DEV_LOGIN=true was IGNORED because this is not a localhost " +
      `development server (NODE_ENV=${process.env.NODE_ENV}, ` +
      `NEXT_PUBLIC_SITE_URL=${siteUrl()}). The dev login is never available here.`,
  );
}

// Fixed addresses so the accounts are stable across restarts. The admin one only
// actually gets ADMIN because the jwt callback below reconciles against
// ADMIN_EMAILS — the dev provider grants no privilege by itself, so this exercises
// the real promotion path rather than faking it.
export const DEV_READER_EMAIL = "dev-reader@freshman.academy";
export const DEV_ADMIN_EMAIL = "dev-admin@freshman.academy";

const devProviders = devLoginEnabled
  ? [
      Credentials({
        id: "dev",
        name: "Dev login",
        credentials: { as: {} },
        async authorize(credentials) {
          const wantsAdmin = credentials?.as === "admin";
          const email = wantsAdmin ? DEV_ADMIN_EMAIL : DEV_READER_EMAIL;

          // Upsert a real User row so foreign keys (Paper.submitterId) resolve.
          const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
              email,
              name: wantsAdmin ? "Dev Editor" : "Dev Reader",
            },
          });

          return { id: user.id, name: user.name, email: user.email };
        },
      }),
    ]
  : [];

// Full server-side Auth.js instance. The Prisma adapter persists users and OAuth
// accounts; sessions are JWTs so the proxy stays cheap (no DB read per request).
//
// Because the role is carried on the JWT it can go stale between sign-ins. That
// is fine for the download gate (every signed-in user is at least a READER), but
// NOT for admin actions — requireAdmin() in src/lib/dal.ts re-reads the role from
// the database so a revoked admin cannot keep reviewing with an old token.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  // Google plus, on localhost only, the dev bypass. Spread from authConfig rather
  // than redeclared so the provider list stays defined in one place.
  providers: [...authConfig.providers, ...devProviders],
  callbacks: {
    // Spread first so the edge-safe `authorized` callback survives; adding a
    // bare `callbacks` object here would silently drop route protection.
    ...authConfig.callbacks,

    // `user` is only populated on a fresh sign-in, which is exactly when we want
    // to reconcile the role against ADMIN_EMAILS.
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;

        const role = intendedRole(user.email);
        // Only write when it actually changed — avoids a needless UPDATE on
        // every sign-in for the common READER case.
        const current = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (current && current.role !== role) {
          await prisma.user.update({ where: { id: user.id }, data: { role } });
        }
        token.role = role;
      }
      return token;
    },

    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (typeof token.role === "string") session.user.role = token.role;
      return session;
    },
  },
});
