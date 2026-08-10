// The site's photographic layer: CC0 regional photography and museum scans,
// resident in public/regional/ with provenance recorded in CREDITS.md there.
// This replaces the picsum placeholders the site launched with — no image on
// the site depends on a third-party service any more.
//
// Static imports on purpose: Next then knows every image's dimensions (no
// layout shift), generates blur placeholders, and serves optimized variants.

import type { StaticImageData } from "next/image";

import heroRegistan from "../../public/regional/hero-registan.jpg";
import interludeSongKul from "../../public/regional/interlude-song-kul.jpg";
import aboutSuzani from "../../public/regional/about-suzani.jpg";
import asideBaburnama from "../../public/regional/aside-baburnama.jpg";

import poolRegistanPano from "../../public/regional/pool-registan-pano.jpg";
import poolMadrasahCeiling from "../../public/regional/pool-madrasah-ceiling.jpg";
import poolBukharaTilework from "../../public/regional/pool-bukhara-tilework.jpg";
import poolIkatPanel from "../../public/regional/pool-ikat-panel.jpg";
import poolIkatSilk from "../../public/regional/pool-ikat-silk.jpg";
import poolJetiOguzHorses from "../../public/regional/pool-jeti-oguz-horses.jpg";
import poolMongoliaYurt from "../../public/regional/pool-mongolia-yurt.jpg";
import poolTianShan from "../../public/regional/pool-tian-shan.jpg";
import poolOsh from "../../public/regional/pool-osh.jpg";
import poolKazakhYurt from "../../public/regional/pool-kazakh-yurt.jpg";
import poolIssykKol from "../../public/regional/pool-issyk-kol.jpg";
import poolCaravanHorse from "../../public/regional/pool-caravan-horse.jpg";

// Named page slots. Each appears in exactly one place; reusing a slot image
// elsewhere would make the site feel like it owns four photos, not fourteen.
export { heroRegistan, interludeSongKul, aboutSuzani, asideBaburnama };

// The paper pool. These are decoration BESIDE an article, never a claim about
// its subject (the site's standing rule on imagery), which is why assignment
// can be arbitrary — but it must be STABLE, so a paper keeps its image across
// renders, lists and shares instead of flickering per request.
const PAPER_POOL: StaticImageData[] = [
  poolRegistanPano,
  poolMadrasahCeiling,
  poolBukharaTilework,
  poolIkatPanel,
  poolIkatSilk,
  poolJetiOguzHorses,
  poolMongoliaYurt,
  poolTianShan,
  poolOsh,
  poolKazakhYurt,
  poolIssykKol,
  poolCaravanHorse,
];

/**
 * Deterministic pool image for a paper, keyed on its immutable slug.
 *
 * FNV-1a rather than the naive ×31 sum: short kebab-case slugs share so much
 * structure that the weak hash visibly clumped (three neighbouring papers drew
 * the same textile). Collisions can never be eliminated with a finite pool —
 * only made no-worse-than-random.
 */
export function paperImage(slug: string): StaticImageData {
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return PAPER_POOL[hash % PAPER_POOL.length];
}
