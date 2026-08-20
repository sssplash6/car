# Central Asian Review — design system

The implementation lives in `src/app/globals.css` (tokens, utilities) and
`src/app/_components/Ornament.tsx` (the SVG ornament library). Components read
semantic tokens (`bg-canvas`, `text-ink`, `border-rule`), never raw hex. Every
token is a `light-dark()` pair resolved by `color-scheme`: the OS preference by
default, or the reader's pinned choice via `[data-theme]` — set before first
paint by the inline script in `layout.tsx` and cycled by the header's
`ThemeToggle` (system → dark → light). Keeping both steps in one declaration is
what enforces "light and dark in step". Every value below was validated for
WCAG contrast — re-run the check before changing one (see the "contrast" note
at the bottom).

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
| `field` | `#9c8c6c` | `#7a6a52` | input borders only — a control's boundary is information, ≥3:1 on `surface` (WCAG 1.4.11) |
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
  Loaded with the **Cyrillic subset**: the review names Kazakhstan, Kyrgyzstan
  and Tajikistan in their own script (`src/lib/site.ts`), and a fallback face
  for those three words beside Garamond would read as a mistake.
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

Doctrine: **the gesture belongs to the thing moving.** One universal fade
applied to every block is the same as having no gesture at all — and a 6px
blur across a 1100px section was the site's most expensive paint for its least
specific idea. Nothing loops except the gilded thread (and only while the
reader is on it), nothing bounces, hovers are 150–200ms.
`--ease-out-strong: cubic-bezier(0.16, 1, 0.3, 1)` everywhere; the in-out curve
is reserved for things that MOVE while staying on screen.

`Reveal` carries only the TRIGGER: it decides when an element has arrived and
hands over to the CSS grammar. `flat` suppresses the wrapper's own gesture
where the child already has one.

| Class | Says | Used on |
|---|---|---|
| `.reveal-scroll` | a block ARRIVES | opacity + a 10px rise; the default |
| `.ink-set` | type is SET | word by word out of its own line — hero, editors' statement, About title, and nowhere else |
| `.rule-draw` | a rule is RULED | ikat thresholds, tile bands: drawn outward from the centre |
| `.folio-row` | contents UNROLL | a run of rows, staggered by `--i`, capped at 8 steps |
| `.reveal-plate` | a plate is LAID | photographs: scale settle, slower, no blur |
| `.clip-reveal` | masonry RISES | the hero arch only, once per page |

- `InkSet` is adapted from the vertical-cut-reveal family catalogued on
  21st.dev / motion-primitives, rebuilt as server-rendered spans plus CSS
  transitions: display type is the site's search presence and must never wait
  for JavaScript to become visible. Split words are real text with real spaces,
  so headings still copy, translate and read as one sentence. `--ink-step`
  tunes the per-word delay for long passages.
- `Reveal` fires on ANY intersection with the viewport's foot pulled up a
  tenth — never a percentage threshold. A Reveal now wraps whole lists, and a
  list taller than five viewports can never be 20% visible at once.
- Everything honors `prefers-reduced-motion` (Reveal skips hiding; the CSS
  fallback zeroes durations). Scroll-driven animations ignore
  `animation-duration`, so each one carries its own explicit guard.

### The three scroll-driven marks

Progressive enhancement, each inside `@supports (animation-timeline: …)`, each
absent-but-harmless where unsupported:

- **The cover closes.** Lattice, page and portal leave on three different
  rates across the same exit — which is what turns a flat band into a scene.
- **The running head fills.** A gild rule under the paper page's running head,
  growing with the reader's progress.
- **The wheel turns.** The compact shanyrak in the pinned strip makes a half
  revolution over the length of the page. Eight-fold symmetry means four clean
  clicks, so it reads as turned, never as tilted.

## Chrome

- **The running head.** A printed journal keeps telling you what you are
  reading in the top margin of every page. The header sticks at a NEGATIVE
  offset (`top: calc(-1 * var(--masthead-h))`): the masthead rides up out of
  view and the strip beneath it pins. Plain `position: sticky`, so it behaves
  the same everywhere. `--head-h` is the pinned strip's height; page-level
  running heads (the paper page's) stack under it, and `scroll-padding-top`
  keeps anchor jumps clear of it.
- **The card catalogue.** ⌘K or `/` anywhere pulls out a drawer holding every
  published paper, every issue and the site's destinations. Native `<dialog>`,
  not a combobox library — the browser owns the modal semantics, focus trap
  and Escape. `@starting-style` + `allow-discrete` animate it both ways with no
  JavaScript timing. Its index is fetched once from `/api/catalogue` on first
  open, so pages nobody searches from pay nothing.

## The craft layer

The brand's object is a hand-bound journal; these are the physical facts of it
CSS can honestly render. All ride the token system, so both schemes and the
night surface come free.

- **Foil** (`.foil-type`) — gold on a cover is stamped foil, and foil answers
  the light. Two background layers clipped to the glyphs: a moving highlight
  over a solid ink floor, tracked to the pointer by `CoverLight`. The
  registered `--mx`/`--my` are what make the light interpolate. NOTE: a word
  mid-entrance sits on its own compositor layer and is not part of an
  ancestor's `background-clip: text` mask, so the foil is declared on the WORDS
  as well as the element — put it only on the `<h1>` and every set word
  vanishes.
- **The bound cover** — a double gilded keyline inset from the boards, drawn
  open as the cover arrives, with the portal lit from behind (`.arch-lamp`).
- **The woven cloth** (`.ikat-cloth`) — resist-dyed warp built from gradients,
  so the site's largest decorative surface costs no image request. Its threads
  are their own tokens with alpha baked in: a warp that whispers on warm paper
  is a set of stripes on a near-black ground, and `light-dark()` takes colours,
  not percentages.
- **The shelf** (`.shelf` / `.volume`) — issues stood up in perspective, tipped
  back, spine showing, the one under the pointer pulled half out. The dimming
  lives on `.volume-face`, NEVER on `.volume`: filter (like opacity, mask and
  clip-path) forces `transform-style` back to flat and would collapse the
  spine into the cover.
- **The marginal mark** (`.mark-margin`) — a gild rule drawn down the margin
  beside the row under the pointer: the pencil line a reader leaves beside a
  paragraph. `:focus-within` too, so keyboard reading gets it.
- **The gilded thread** (`.gild-thread`) — a short arc of gold travelling the
  border of one framed panel. The site's only looping motion, and it runs only
  while the reader is over or inside the panel, which makes it a response
  rather than ambience.
- **The deckle** (`.deckle-top`) — one torn edge on the whole site (the About
  header). A hand-made edge everywhere would be a texture, not an edge.
- Plus the originals: `.shadow-plate`, `.fillet`, `.foil`, `.emboss`,
  `.press-ink`, `.title-link`, `.folio-label`, `.leader`, `.plate-drift`.

## Print

An abstract page is a thing scholars actually print. Chrome, decorative plate,
download panel and copy buttons remove themselves at the call sites; the print
block makes the paper white and the ink black. The load-bearing line is the
`color-scheme` reset — every colour is a `light-dark()` pair, so a reader who
pinned dark mode would otherwise send a near-black page to the printer, and
`[data-theme="dark"]` outranks a bare `:root`.

## Contrast

Checked, not eyeballed: every pair above passes 4.5:1 for text (3:1 for
decorative graphics) in both modes, including footer parchment/gild-on-lapis
and button text on accent. When changing a value, re-validate the pairs listed
in ONBOARDING.md §4 style — a small script computing WCAG ratios is enough;
keep light and dark steps in step.
