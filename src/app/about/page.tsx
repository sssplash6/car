import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { COPY } from "@/lib/content";
import { REGION_COUNTRIES } from "@/lib/site";
import { Drawing } from "@/app/_components/illustrations/Drawing";
import { Reveal } from "@/app/_components/motion/Reveal";
import { StickySequence } from "@/app/_components/motion/StickySequence";
import { Button } from "@/app/_components/ui/Button";
import { HeadlineStack } from "@/app/_components/ui/HeadlineStack";
import { Band, Card } from "@/app/_components/ui/Surfaces";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Central Asian Review: what it covers, how a paper reaches a reader, and guidance for contributors and readers.",
  alternates: { canonical: "/about" },
};

// About (DESIGN.md §9.5): one paragraph on what the review is, the one
// scroll-bound drawing on the site (a tulip growing through the three steps a
// paper takes), the region in a drawing and in its own languages, and the two
// doors: for contributors and for readers. Deliberately no masthead until real
// editor names exist.
export default function AboutPage() {
  const { main, processLabel, process, coverage, contributors, readers } = COPY.about;
  const section = { marginTop: "var(--section)" } as CSSProperties;

  return (
    <>
      <header className="wrap page-top">
        <HeadlineStack align="center" size="h1" rise="load" rule title={main.title} lede={main.lede} />
      </header>

      <div className="wrap-narrow about-body">
        <Reveal>
          <p className="t-read">{main.body}</p>
        </Reveal>
      </div>

      <section className="wrap" style={section} aria-labelledby="process-label">
        <h2 id="process-label" className="t-meta">
          {processLabel}
        </h2>
        <StickySequence steps={process} label={processLabel} />
      </section>

      <Band className="coverage mt-[var(--section)]" aria-labelledby="coverage-label">
        <div className="wrap">
          <h2 id="coverage-label" className="t-meta">
            {coverage.label}
          </h2>
          {/* Amu Darya and Syr Darya running to the Aral's 1960 shoreline. */}
          <Drawing name="rivers" size="hero" draw="view" stagger={120} />
          <Reveal as="ul" gesture="rows" className="coverage-names">
            {REGION_COUNTRIES.map((country, i) => (
              <li key={country.lang} style={{ "--i": i } as CSSProperties}>
                <span className="t-h4 block">{country.en}</span>
                <span lang={country.lang}>{country.native}</span>
              </li>
            ))}
          </Reveal>
          <p className="t-body mt-8 text-ink-3">{coverage.note}</p>
        </div>
      </Band>

      <div className="wrap page-end" style={section}>
        <Reveal className="doors-pair">
          <Card kind="bordered" as="section" id="contributors" aria-labelledby="contributors-title">
            <h2 id="contributors-title" className="t-h3">
              {contributors.title}
            </h2>
            <p className="t-body mt-3">{contributors.body}</p>
            <div className="actions">
              <Button variant="primary" size="md" href="/submit">
                {contributors.action}
              </Button>
            </div>
          </Card>
          <Card kind="bordered" as="section" id="readers" aria-labelledby="readers-title">
            <h2 id="readers-title" className="t-h3">
              {readers.title}
            </h2>
            <p className="t-body mt-3">{readers.body}</p>
            <div className="actions">
              <Button variant="link" href="/papers">
                {readers.action}
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    </>
  );
}
