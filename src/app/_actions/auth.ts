"use server";

import { signIn, signOut } from "@/auth";

// App-wide auth actions. These live outside a route folder because two unrelated
// routes need them (the login page signs in, the site header signs out) —
// route-local actions.ts is the convention for everything else.

export async function signInWithGoogle(next?: string) {
  // redirectTo is validated by Auth.js against the site origin, so a crafted
  // ?next= cannot bounce the user to an external domain after sign-in.
  await signIn("google", { redirectTo: next || "/submissions" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/**
 * Dev-only: sign in as a throwaway reader or editor.
 *
 * Safe to expose because the "dev" provider is only registered when
 * ALLOW_DEV_LOGIN=true AND the site is on localhost (see src/auth.ts). Off
 * localhost the provider does not exist, so this call fails rather than granting
 * anything.
 */
export async function signInAsDev(as: "reader" | "admin") {
  await signIn("dev", {
    as,
    redirectTo: as === "admin" ? "/admin" : "/submissions",
  });
}
