// Placeholder editorial photography.
//
// ALL of these are stand-ins. Seeds are descriptive so the intent of each slot is
// obvious when the real photography is commissioned, and stable so a given paper
// keeps the same image between renders instead of flickering on every reload.
//
// TODO(content): replace with real commissioned or licensed photography and
// remove the picsum remotePattern from next.config.ts.

const PLACEHOLDER_HOST = "https://picsum.photos/seed";

/** Deterministic image for a paper, derived from its slug so it never changes. */
export function paperImage(slug: string, w: number, h: number): string {
  return `${PLACEHOLDER_HOST}/car-paper-${slug}/${w}/${h}`;
}

/** Fixed image for a named page slot (hero, about, and so on). */
export function slotImage(slot: string, w: number, h: number): string {
  return `${PLACEHOLDER_HOST}/car-${slot}/${w}/${h}`;
}
