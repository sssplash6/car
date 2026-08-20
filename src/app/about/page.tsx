import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { COPY } from "@/lib/content";
import { PUBLISHER_NAME, REGION_COUNTRIES } from "@/lib/site";
import { aboutSuzani } from "@/lib/regionalImages";
import { Reveal } from "@/app/_components/Reveal";
import {
  Diamond,
  IkatDivider,
  RosetteGrand,
} from "@/app/_components/Ornament";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Central Asian Review: scope, masthead, and guidance for contributors.",
  alternates: { canonical: "/about" },
};

// Copy lives in src/lib/content.ts. There is deliberately no masthead section:
// a masthead signed by placeholder names reads as fabricated, which is worse
// than a young review having none — add it back only with real names.
//
// No eyebrows on this page: the homepage already spends the page-level budget, and
// each section here has a real heading doing the same job. The label-left,
// body-right split is its own layout family, distinct from anything on the
// homepage. Ornament budget: one ikat threshold and the gild lozenges on the
// coverage list — the header stays plain so the words carry it.
export default function AboutPage() {
  const { main, submissions } = COPY.about;

  return (
    <>
      {/* The device at dome scale: the shanyrak as you actually see it —
          overhead, architectural, cropped by the page edge so it reads as
          structure rather than a sticker. rule-strong keeps it
          sub-ornamental in both schemes. */}
      <header className="relative overflow-hidden border-b border-rule bg-surface">
        <RosetteGrand className="pointer-events-none absolute -right-24 -top-32 size-[30rem] text-rule-strong opacity-60 max-lg:hidden" />
        <div className="relative mx-auto w-full max-w-4xl px-6 pb-14 pt-16">
          <h1 className="display-flush max-w-2xl font-serif text-[clamp(2.75rem,1.6rem+4.2vw,4.75rem)] leading-[1.02] tracking-tight text-ink">
            {main.title}
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <p className="prose-plain max-w-[60ch] text-[1.0625rem] leading-[1.75] text-ink-soft">
            {main.body}
          </p>
          {/* Mounted like the plates elsewhere on the site, so the About page
              speaks the same museum language as the papers. Named slots carry
              their provenance visibly (public/regional/CREDITS.md). */}
          <figure className="self-start border border-rule-strong bg-surface p-1.5">
            <div className="relative aspect-4/5 w-full overflow-hidden">
              <Image
                src={aboutSuzani}
                alt="Silk suzani embroidery from Bukhara"
                fill
                placeholder="blur"
                sizes="(max-width: 1024px) 100vw, 34vw"
                className="object-cover"
              />
            </div>
            <figcaption className="px-1 pb-0.5 pt-2 text-xs leading-relaxed text-muted-fg">
              Suzani embroidery, Bukhara · Doris Duke Foundation for Islamic Art
            </figcaption>
          </figure>
        </div>

        <IkatDivider className="text-tile" />

        {/* id + scroll-mt: the homepage's "Guidance for contributors" link
            lands here, not at the top of the page. */}
        <Reveal className="py-12">
          <div
            id="contributors"
            className="grid scroll-mt-6 gap-8 sm:grid-cols-[14rem_1fr] sm:gap-12"
          >
            <h2 className="font-serif text-2xl leading-tight text-ink">
              {submissions.title}
            </h2>
            <div>
              <p className="prose-plain max-w-[52ch] leading-[1.75] text-ink-soft">
                {submissions.body}
              </p>
              <Link
                href="/submit"
                className="mt-6 inline-block rounded bg-accent px-5 py-2.5 text-sm font-medium text-surface press-ink hover:bg-accent-dark"
              >
                Submit a paper
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal className="border-t border-rule py-12">
          <div className="grid gap-8 sm:grid-cols-[14rem_1fr] sm:gap-12">
            <h2 className="font-serif text-2xl leading-tight text-ink">Coverage</h2>
            <div>
              {/* Placeholder region list from lib/site.ts. Confirm the framing
                  with the editors before treating it as final. Each country is
                  also named in its own language: lang= is markup, not
                  decoration — it tells assistive technology which voice to read
                  the name in. */}
              <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {REGION_COUNTRIES.map((country) => (
                  <li key={country.en} className="flex items-baseline gap-2.5">
                    <Diamond className="self-center text-gild" />
                    <span className="text-ink-soft">{country.en}</span>
                    <span
                      lang={country.lang}
                      className="font-serif text-[0.9375rem] text-muted-fg"
                    >
                      {country.native}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* The colophon: a manuscript ends with the scribe's tapering record
            of how the thing was made. Pure typography plus the system's
            smallest ornament; every claim is factual. */}
        <Reveal className="border-t border-rule py-16 text-center">
          <Diamond className="mx-auto size-2 text-gild" />
          <div className="mx-auto mt-6 space-y-1.5 text-xs uppercase tracking-[0.14em] text-muted-fg">
            <p className="mx-auto max-w-md">
              Set in EB Garamond and Geist on warm paper
            </p>
            <p className="mx-auto max-w-xs">
              Issues follow the Tashkent quarters
            </p>
            <p>Published by {PUBLISHER_NAME}</p>
          </div>
        </Reveal>
      </div>
    </>
  );
}
