// Module augmentation for the extra fields we put on the session and JWT.
// Without this, `session.user.role` is a type error even though src/auth.ts sets
// it. Keep in sync with the callbacks there.

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // "READER" | "ADMIN" — kept as a string because the value round-trips
      // through the JWT and the SQLite column, neither of which is typed.
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
