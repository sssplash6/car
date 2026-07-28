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
