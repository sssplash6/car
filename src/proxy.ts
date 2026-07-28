import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed `middleware` to `proxy`. Use the edge-safe Auth.js config
// (no Prisma adapter) so this stays a cookie-only check — see the note on the
// `authorized` callback about why it must not touch the database.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except Next internals, the auth API, and static assets.
  // The PDF download route is deliberately NOT excluded — but it does its own
  // authoritative check too, because this cookie check alone is not a
  // security boundary.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
