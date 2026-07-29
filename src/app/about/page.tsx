import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getBlock } from "@/lib/content";
import { PUBLISHER_NAME, REGION_COUNTRIES } from "@/lib/site";
import { slotImage } from "@/lib/placeholderImage";
import { Reveal } from "@/app/_components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Central Asian Review: scope, masthead, and guidance for contributors.",
  alternates: { canonical: "/about" },
};

// Every section here is a content block with a placeholder fallback, so the real
// copy can be pasted in from the editor dashboard without a deploy.
//
// No eyebrows on this page: the homepage already spends the page-level budget, and
// each section here has a real heading doing the same job. The label-left,
// body-right split is its own layout family, distinct from anything on the
// homepage.
export default async function AboutPage() {
  const [main, masthead, submissions] = await Promise.all([
    getBlock("about.main"),
    getBlock("about.masthead"),
    getBlock("about.submissions"),
  ]);

  return (
    <>
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto w-full max-w-4xl px-6 pb-12 pt-14">
          <h1 className="display-flush max-w-2xl font-serif text-[2.5rem] leading-[1.08] tracking-tight text-ink sm:text-[3.25rem]">
            {main.title}
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <p className="prose-plain max-w-[60ch] text-[1.0625rem] leading-[1.75] text-ink-soft">
            {main.body}
          </p>
          <div className="relative aspect-4/5 w-full overflow-hidden">
            <Image
              src={slotImage("about-editorial", 600, 750)}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 34vw"
              className="object-cover"
            />
          </div>
        </div>

        <Reveal className="border-t border-rule py-12">
          <div className="grid gap-8 sm:grid-cols-[14rem_1fr] sm:gap-12">
            <h2 className="font-serif text-2xl leading-tight text-ink">
              {masthead.title}
            </h2>
            <p className="prose-plain max-w-[52ch] leading-[1.9] text-ink-soft">
              {masthead.body}
            </p>
          </div>
        </Reveal>

        <Reveal className="border-t border-rule py-12">
          <div className="grid gap-8 sm:grid-cols-[14rem_1fr] sm:gap-12">
            <h2 className="font-serif text-2xl leading-tight text-ink">
              {submissions.title}
            </h2>
            <div>
              <p className="prose-plain max-w-[52ch] leading-[1.75] text-ink-soft">
                {submissions.body}
              </p>
              <Link
                href="/submit"
                className="mt-6 inline-block rounded bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark active:translate-y-px"
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
                  with the editors before treating it as final. */}
              <ul className="grid gap-x-8 gap-y-2 text-ink-soft sm:grid-cols-2">
                {REGION_COUNTRIES.map((country) => (
                  <li key={country}>{country}</li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-muted-fg">
                Published by {PUBLISHER_NAME}.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
