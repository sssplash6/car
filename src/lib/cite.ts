// Citation strings for a paper, in the styles readers ask for.
//
// Authors are one free-text line ("A. Karimova, J. Nazarov"), so names are
// read the simple way: split on commas; the last word is the family name, the
// rest are given names or initials. That matches how the field is written
// everywhere on the site; an unusual name still prints, just less formally.

export type CiteInput = {
  authorLine: string;
  title: string;
  year?: number;
  issue?: { number: number; label: string } | null;
  url: string;
  journal: string;
  slug: string;
};

export type CiteFormat = { id: "chicago" | "apa" | "mla" | "bibtex"; label: string; text: string };

type Name = { given: string[]; family: string };

function parseNames(line: string): Name[] {
  return line
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const parts = name.split(/\s+/);
      return parts.length === 1
        ? { given: [], family: parts[0] }
        : { given: parts.slice(0, -1), family: parts[parts.length - 1] };
    });
}

const initial = (word: string) =>
  word
    .split("-")
    .map((part) => `${part.replace(/\.$/, "").charAt(0)}.`)
    .join("-");

const givenFull = (n: Name) => n.given.join(" ");
const inverted = (n: Name) => (n.given.length ? `${n.family}, ${givenFull(n)}` : n.family);
const natural = (n: Name) => (n.given.length ? `${givenFull(n)} ${n.family}` : n.family);
const apaName = (n: Name) => (n.given.length ? `${n.family}, ${n.given.map(initial).join(" ")}` : n.family);

/** End a fragment with exactly one full stop (a "?" or "!" already ends it). */
const stop = (text: string) => (/[.?!]$/.test(text) ? text : `${text}.`);

function chicago(i: CiteInput, names: Name[]): string {
  let authors = "";
  if (names.length === 1) authors = inverted(names[0]);
  else if (names.length > 1)
    authors = `${[inverted(names[0]), ...names.slice(1, -1).map(natural)].join(", ")}, and ${natural(names[names.length - 1])}`;
  const issue = i.issue ? `, no. ${i.issue.number} (${i.issue.label})` : i.year ? ` (${i.year})` : "";
  return `${authors ? `${stop(authors)} ` : ""}“${stop(i.title)}” ${i.journal}${issue}. ${i.url}.`;
}

function apa(i: CiteInput, names: Name[]): string {
  const list = names.map(apaName);
  let authors = list[0] ?? "";
  if (list.length === 2) authors = `${list[0]}, & ${list[1]}`;
  else if (list.length > 2) authors = `${list.slice(0, -1).join(", ")}, & ${list[list.length - 1]}`;
  const year = i.year ? `(${i.year})` : "(n.d.)";
  const issue = i.issue ? `, (${i.issue.number})` : "";
  return `${authors ? `${stop(authors)} ` : ""}${year}. ${stop(i.title)} ${i.journal}${issue}. ${i.url}`;
}

function mla(i: CiteInput, names: Name[]): string {
  let authors = "";
  if (names.length === 1) authors = inverted(names[0]);
  else if (names.length === 2) authors = `${inverted(names[0])}, and ${natural(names[1])}`;
  else if (names.length > 2) authors = `${inverted(names[0])}, et al`;
  const parts = [i.journal, i.issue ? `no. ${i.issue.number}` : "", i.year ? String(i.year) : "", i.url.replace(/^https?:\/\//, "")]
    .filter(Boolean)
    .join(", ");
  return `${authors ? `${stop(authors)} ` : ""}“${stop(i.title)}” ${parts}.`;
}

function bibtex(i: CiteInput, names: Name[]): string {
  return [
    `@article{${i.slug}${i.year ? `-${i.year}` : ""},`,
    `  author  = {${names.map(natural).join(" and ")}},`,
    `  title   = {${i.title}},`,
    `  journal = {${i.journal}},`,
    ...(i.year ? [`  year    = {${i.year}},`] : []),
    ...(i.issue ? [`  number  = {${i.issue.number}},`] : []),
    `  url     = {${i.url}}`,
    `}`,
  ].join("\n");
}

export function citeFormats(input: CiteInput): CiteFormat[] {
  const names = parseNames(input.authorLine);
  return [
    { id: "chicago", label: "Chicago", text: chicago(input, names) },
    { id: "apa", label: "APA", text: apa(input, names) },
    { id: "mla", label: "MLA", text: mla(input, names) },
    { id: "bibtex", label: "BibTeX", text: bibtex(input, names) },
  ];
}
