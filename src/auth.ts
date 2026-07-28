import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

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
