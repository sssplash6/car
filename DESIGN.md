# Central Asian Review — design system

The implementation lives in `src/app/globals.css` (tokens, utilities) and
`src/app/_components/Ornament.tsx` (the SVG ornament library). Components read
semantic tokens (`bg-canvas`, `text-ink`, `border-rule`), never raw hex, so
dark mode overrides tokens rather than components. Every value below was
validated for WCAG contrast — re-run the check before changing one
(see the "contrast" note at the bottom).

## Palette — "Timurid manuscript"

Warm paper field, lapis action color, three decorative threads (turquoise
tile, pomegranate ember, gilded ochre) that are RATIONED: they appear in
ornament and small marks, not in body UI.

| Token | Light | Dark | Role |
|---|---|---|---|
| `canvas` | `#f9f4e8` | `#171310` | page field, warm paper / lacquered night |
| `surface` | `#fefcf4` | `#211a14` | raised areas, inputs |
| `rule` | `#e8dcc2` | `#3a3024` | hairlines |
| `rule-strong` | `#cbbb96` | `#564936` | deliberate dividers |
| `ink` | `#262019` | `#f1e8d7` | primary text (sepia-black / parchment) |
| `ink-soft` | `#4d4536` | `#d2c6ae` | body copy at length |
| `muted-fg` | `#6e6450` | `#a29578` | metadata, captions |
| `accent` | `#1d4f9c` | `#8fb3ea` | THE action color: links, buttons. Lapis. |
| `accent-dark` | `#163d7a` | `#aec9f5` | hover (lighter in dark mode) |
| `accent-soft` | `#e3ebf6` | `#1d2b42` | tint fields behind accent elements |
| `tile` | `#0f7f76` | `#59c2b6` | decorative turquoise (ornament only) |
| `tile-ink` | `#0c665f` | `#59c2b6` | turquoise when it must be read as text |
| `tile-soft` | `#daefe9` | `#143430` | turquoise tint field |
| `ember` | `#a33a28` | `#e18f74` | decorative pomegranate; passes as text too |
| `ember-soft` | `#f4e0d6` | `#40241c` | pomegranate tint field |
| `gild` | `#a87a1e` | `#d7a54e` | gilded ochre, ornament only (≥3:1 graphic) |
| `state-good/warn/bad/mute` | `#256b48` `#855a0e` `#9c3222` `#6e6450` | `#66b98d` `#d6a44c` `#e2836f` `#a29578` | review status only, never actions |

Footer is its own scoped surface ("night tile", same in both modes):
`#132a52` field, parchment `#f1e8d7` text, `#b9c3d9` muted, gild hover links,
turquoise/gild ornament. Scoped by redefining the semantic tokens inside
`.surface-night` so child components need no special variants.

## Typography

- **EB Garamond** (`--font-serif`) — masthead, headings, display numbers, drop
  caps. The academic-press serif is the identity; do not add a third family.
- **Geist** (`--font-sans`) — everything else.
- Display sizes are fluid: hero `clamp(2.75rem, 1.2rem + 5.2vw, 4.5rem)`, page
  titles `clamp(2.25rem, 1.5rem + 3vw, 3.25rem)`. Body measure ≤ 68ch.
- `.dropcap` floats a 3-line Garamond initial in lapis — used at most ONCE per
  page, on the lead abstract only. An illuminated initial that appears on every
  block stops being illumination.

## Ornament system (`Ornament.tsx`)

Vocabulary drawn from the region's geometric tradition, all inline SVG in
`currentColor` so it recolors with the token system:

- **TileBand** — girih star-and-cross frieze. Marks the page's top edge
  (header trim), the footer threshold, and at most one major section boundary
  per page.
- **IkatDivider** — a row of stepped lozenges that fades at both ends.
  Replaces the plain hairline only where a section BEGINS a new thought.
- **Shanyrak** — the yurt roof-wheel mark: the site's device, in the masthead,
  the favicon, and empty states. Never decorates arbitrary boxes.
- **CornerFrame** — illumination corners for exactly one framed moment per
  page (the gated-download panel, the login panel).
- **ArchImage** — a pointed pishtaq-arch clip for the homepage hero image
  only. One arch per site; repeating it would turn architecture into wallpaper.
- **PatternField** — the star tessellation at 3–6% opacity behind a band.
  Allowed on: homepage hero, paper-page header, footer. Nowhere else.

**Rationing rule: ornament marks boundaries and beginnings.** Page top, a
section's first line, the site's close. Rows, cards, paragraphs and forms keep
plain hairlines. If two ornaments are visible in one viewport at reading
width, one of them is wrong.

## Photography

The photographic layer lives in `public/regional/` (all CC0/PDM, provenance in
its CREDITS.md — unknown-provenance imagery does not ship) and is wired through
`src/lib/regionalImages.ts` as static imports, so every image has dimensions
and a blur placeholder.

- **Named slots** (hero arch, homepage interlude, About suzani, Baburnama
  leaf) appear in exactly one place each and carry honest alt text and, where
  shown, a caption naming a real, verified place or source.
- **The paper pool** decorates papers by stable slug hash. Pool images are
  decoration BESIDE an article, never a claim about its subject — so they get
  empty alt text, and no pool image may ever be captioned with a place or
  attached to specific countries.
- Photographs sit in the same mounted-plate frame as everything else
  (hairline, mount, image); no bare full-bleed imagery outside the hero arch.

## Motion

Doctrine: entrances materialize (opacity + 14px rise + 6px blur), hovers are
150–200ms, nothing loops, nothing bounces. `--ease-out-strong:
cubic-bezier(0.16, 1, 0.3, 1)` everywhere; in-out only for on-screen movement.

- `Reveal` (whileInView, once) for scroll entrances; stagger siblings by
  0.05–0.08s. `mode="load"` variant for above-the-fold hero orchestration.
- The homepage hero is the ONE orchestrated moment: headline → deck → CTAs →
  arch image clip-reveal (`clip-path: inset`), ~0.9s total.
- High-frequency surfaces (admin, forms, nav) get hover/focus transitions
  only. Frequency rule: what an editor sees 50 times a day does not animate.
- Everything honors `prefers-reduced-motion` (Reveal collapses to static; CSS
  fallback zeroes durations globally).

## Contrast

Checked, not eyeballed: every pair above passes 4.5:1 for text (3:1 for
decorative graphics) in both modes, including footer parchment/gild-on-lapis
and button text on accent. When changing a value, re-validate the pairs listed
in ONBOARDING.md §4 style — a small script computing WCAG ratios is enough;
keep light and dark steps in step.
