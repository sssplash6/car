/**
 * The opening of an abstract for previews (⌘K, the /papers preview pane):
 * whole sentences up to `max` characters (at least one), else a word-boundary
 * cut with an ellipsis.
 */
export function excerpt(text: string, max = 280): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const ends = [...flat.matchAll(/[.?!](?=\s)/g)].map((m) => m.index! + 1);
  const fit = ends.filter((end) => end <= max).pop();
  if (fit && fit >= 60) return flat.slice(0, fit);
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 0 ? space : max).replace(/[,;:]$/, "")}…`;
}
