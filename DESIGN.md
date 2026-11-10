# Central Asian Review — FINAL design spec: "The Contour"

Status: final, 2026-11-08. Single source of truth for the redesign on branch `redesign-v2` of `~/projects/car`. Supersedes proposals A, B and C, `DESIGN.md`, and the "Brand voice" section of `PRODUCT.md` (its product facts and anti-references still hold: no flags, no state emblems, no tourist kitsch, no SaaS template energy, abstracts carry the SEO, trust before delight, "an editor reads", never "peer-reviewed").

Engineers: read §0 once, then the section for your task in §12. Every value here is final; if something is missing, ask, do not invent.


## Implementation notes (built 2026-11-08)

The spec below was built as written, with these deliberate differences. Where
this list and the spec disagree, this list describes the code.

- **Drawings.** Construction lives in `scripts/illustrations.mjs`, which adds the hand wobble and writes `src/app/_components/illustrations/data/*.ts` (run `node scripts/illustrations.mjs --preview out.html` for a contact sheet). `scripts/illustration-prep.mjs` imports an editor-made SVG instead.
  - `horizon` (was `ridge`) is the home panorama; see "Owner's feedback" below. `tulip`, `pomegranate` and `cotton` carry the mock-up's refinements.
  - `leopard` has no tail (alone, it read as a stray squiggle) and is scaled up to fill the plate; the mouth is a cat's, not an arc.
  - `saiga` has a shorter neck and larger head; `silkworm` places the moth above the leaf (fill-none lines would cross); `apple` routes the branch above the fruit; `melon` is a torpedo on a diagonal.
- **Favicon** (`icon.svg`): two rings and the dot, heavier strokes; three rings crowd at 16px.
- **Footer**, Contribute column: "My submissions" in place of "Sign in" (right for signed-in readers too).
- **/papers search** placeholder says "titles, authors and abstracts", because the search reads abstracts.
- **Email status** `SKIPPED` reads "Skipped".
- **No `/design` gallery** (the spec deletes it at cleanup). The glyph probe (§12 (a) 10) was run in a headless browser instead: Source Serif 4, Inter and IBM Plex Mono all set Қ ҷ Ҷ қ from the webfont.
- **Admin** pages carry a visually hidden `h2` each (the layout owns the `h1`); the papers table shows Authors and keeps the "decided by" and note record under the title.

### Polish round (2026-11-08, after the owner's review)

- **Page transitions.** `app/template.tsx` cross-fades the page content on every top-level change; the header is its own transition layer pinned on top. Only the clicked element travels: rows, the home plate and the paper's issue chip carry "on click" (`motion/Carry.tsx`); destinations (the paper's `h1`, the /issues plates) carry "always". The nav pill slides between sections (`.pill-bg` is named `nav-pill`; labels are classed `nav-label` and paint above it).
- **No route skeletons.** `papers/loading.tsx` and `issues/loading.tsx` are gone: they raced Next's scroll-to-#hash (`/issues#no-1` landed at the top) and made the swap visible. Instead a hand-drawn loading line draws along the header's bottom edge while a page is on its way (`NavProgress.tsx`, shown after 150ms).
- **Theme.** The header has a sun/moon toggle (light ↔ dark); System · Light · Dark lives in the footer and the mobile menu (`ThemeSelect`). The switch spreads from the click as a circle (typed `theme` view transition).
- **⌘K** loads its index on hover, prefetches the highlighted result, marks the matched text, and on wide screens shows a preview pane (a paper's opening lines, an issue's papers). `/api/catalogue` now also returns each paper's `snippet` and `date`.
- **/papers** searches as you type (`PapersSearch`, debounced `router.replace`, still a GET form) and, at ≥ 1280px, a sticky preview pane follows the hovered or focused row (`PapersPreview`), replacing the reserved snippet column.
- **Paper page.** Citation styles Chicago · APA · MLA · BibTeX (`src/lib/cite.ts`, `ui/CiteBlock.tsx`) with Copy citation and Copy link, replacing the single citation and the BibTeX fold. On phones the running head sits at the bottom of the screen.
- **Home statement** fills in word by word with scroll (`motion/ScrollFill.tsx`, a CSS view timeline), replacing the view-mode word rise.
- **Drawn underlines.** Text links draw a hand-drawn wave under their words on hover or focus (`--wave` mask); prose links keep a quiet straight underline at rest.
- **Submissions** show a track per paper: Submitted → Under review → Decision (`ui/SubmissionTrack.tsx`).
- Smaller: "№" is set in the serif inside mono meta (`ui/Numero.tsx`); `--color-line-dot` is darker (`#c4b6a0` / `#6a6862`) so drawing dots are visible; About's 70vh steps tighten where scroll timelines are unsupported or motion is reduced; the shortcut hint reads Ctrl K off Apple devices; the Next.js dev badge is off (`devIndicators: false`).

### Owner's feedback (2026-11-10)

The owner liked the site and asked for the home illustration to show yurts and horses, and for a cover image that shows modernisation: yurts with wind turbines, trains and a modern skyline. The owner also asked to replace "Research on Central Asia" with "New Voices of Central Asia: Bringing the Soul of Central Asia to the World".

- **Headline.** The home `h1` is the title "New Voices of Central Asia" plus a deck, "Bringing the Soul of Central Asia to the World", set on its own line inside the same heading (`HeadlineStack deck`, `.stack-deck`: serif, 22–36px, `ink-3`). Its words carry on the title's word rise. Screen readers and crawlers read "title: deck". The owner's capitalisation is kept. The headline is longer than the 9-word copy budget, at the owner's request. The lede is unchanged and sets on two lines at desktop width.
- **`horizon` replaces `ridge`** (viewBox `1200 × 320`, 300px tall at desktop and 160px on phones, slice). Read left to right, it runs from tradition to modernity. The Tian Shan ridge and snow lines stay behind. On the steppe line at the left are three yurts (wall, domed roof, crown, belt, door; the big one has roof poles and smoke) and four horses, standing and grazing. On the right are three wind turbines (hub dots) and a new city of layered towers (slant, spire, round, sail, mast and a low dome). A high-speed trainset runs along a rail at the front, with its wheels as dots. Every motif appears in the middle 640 units, which is all a phone shows.
- **Occlusion.** Lines are fill-none, so `scripts/illustrations.mjs` cuts each farther line where it passes behind a nearer shape (`occlude()`: closed silhouettes, or open strokes with a 4–5 unit pad). The ridge runs behind the yurts, horses, turbines and towers, and back towers stand behind front ones. Ridge pieces shorter than 28 units are dropped. Strokes carry their own wobble: 2.2 on the long lines, 0.7 on the figures.
- **The subject rule (§5.1) changes for this one drawing:** yurts, horses, turbines, a train and buildings are allowed in `horizon` only. The issue plates keep the old rule. The PRODUCT.md limits still apply: no flags, no emblems, and no tower or dome a reader could attribute to one state.
- Draw-in: 55 strokes and 15 dots, 34ms stagger (≈ 3s), so the scene builds from the mountains to the train. The parallax is unchanged (`horizon-drift`).
- **Washes (colour under the line; second ask, same day: "slight colours, not too colourful").** `horizon` is the one drawing with fills: 33 flat shapes (`DrawingData.washes`, `[data-w]`) painted under the strokes, far to near. Each is opaque, so a nearer wash covers a farther one the way occlusion hides a farther line. Tints come from the plate palette (§3.3) mixed most of the way to the page, as `--wash-*` `light-dark()` pairs on `.ill[data-ill="horizon"]`. Snow-capped blue peaks fade to the page by the foothills. A pale sun has no outline. The steppe is a wheat strip between the ground line and the rail, fading out at both ends. Yurts have white felt walls, a warm roof and a terracotta door. The horses are chestnut, dun and grey. The city is glass in three blues (the far towers paler) and warm stone, with one turquoise dome. The train is white with a terracotta band and blue glass. Every wash is shifted 1.5 units down and right of its line, like a hand-tinted print. A wash fades in (900ms) as its motif's outline closes (`at` = that motif's last stroke; delay `at × stagger + 0.85 × dur-draw`). With reduced motion or no JS, washes are simply there. The accent rule (§3) is untouched: no wash uses `accent` or `accent-mark`.
- **Hero spacing.** The home hero's top padding is 32–56px (not `--page-top`'s 48–96px) and the horizon's top margin is 32px, so on a 1440 × 900 viewport the whole drawing, train and rail included, sits above the fold.

---

## 0. Decision record

### 0.1 Spine

**Direction B ("Claude-led", The Contour) is the spine.** Weighted score with owner-taste counted twice: B 35.5 (8×2 + 7 + 7.5 + 5), A 35 (7×2 + 8 + 6 + 7), C 34.5 (6.5×2 + 7 + 7 + 7.5). B also won the owner-taste and product verdicts outright. B is the closest to the room the owner described (Claude's cream layers, serif statements, pill nav, drawn lines that animate, `#141413` as the only dark), has the strictest copy budget and the cleanest reading page. Its defects (false font claim, invisible plate drawings, hashed row glyphs, seasonal colour collisions, tall hero, low input contrast, duplicate view-transition names, missing `timeline-scope`) are all fixed below.

### 0.2 Grafts taken

| From | What | Where in this spec |
|---|---|---|
| A §2.1 | Font stack Source Serif 4 + Inter + IBM Plex Mono (re-verified today, §2.1) | §2 |
| A §5.1/§8.10 | Plate drawings in full-contrast plate ink (ink on light plates, cream on dark), dots ≥ 60% | §3.3, §5 |
| A §5.2 | Hover **re-ink** (dashoffset .15 → 0, 600 ms) on plates | §5.5, §6 |
| A §5.2 | `pathLength="1"` + `data-s` / `data-d` + `--i` CSS contract; `scripts/illustration-prep.mjs` | §5.2, §5.5 |
| A §6.4 | Explicit reduced-motion rule: scroll-timeline animations removed with `animation: none` inside `@supports` | §6.5 |
| A §8.9 | First sentence of the abstract revealed on row hover in a **reserved** right column, opacity only, no layout growth | §8.9 |
| A §8.11 | Gate copy "Papers are free to registered readers. A Google sign-in creates an account." + "Why an account?" → `/about#readers` | §8.11, §9.4 |
| A §8.12 | BibTeX accordion with a `<pre>` under the citation | §8.12 |
| A §9.10 | Admin overview as one quiet line of counts, not metric tiles | §9.10 |
| A §9.14 | Loading skeletons appear only after 300 ms | §8.20 |
| C §3.3 | Year-parity plate variants (8 tones) + designed dark plate tones (hue kept, lightness 25–35%) | §3.3 |
| C §4 | Pill geometry 46 lg / 40 md / 32 sm, 12 px pair gap, 44 px `::after` hit area | §4.4 |
| C §5.3 | Illustration data-module format `{ viewBox, strokes, dots }` + one shared `<Drawing>` renderer | §5.2 |
| C §5.4 | Snow leopard, silkworm moth, compass (404 settle-to-north), construction coordinates | §5.4 |
| C §5.4 / A §5.3 | `rivers` drawing for About coverage | §5.4 |
| C §6.2 #15 | `PlateCarry` (React `<ViewTransition>`) home → /issues → paper chip | §6.4 |
| C §9.4 | One meta line under the authors: "Published {date} · PDF, {size} · Free with an account"; paper title capped | §9.4 |
| C §12 | Full TS prop contracts; `content.ts` cuts made once in Foundation and frozen | §12 |
| B (kept) | Mark (three contour rings), drawn 80 px rule, About tulip that grows through three stages on scroll, "dark is a door", five-gesture motion vocabulary, `/design` dev route | §1, §5, §6, §8 |

### 0.3 Grafts rejected (and why)

- **Hashed per-row glyphs** (B §5.3, re-proposed by the eng judge): owner-taste and product both rejected them: a saiga beside a gas-pricing paper implies a topic category that does not exist. Rows carry no glyph; where an issue identity helps (`/papers`, ⌘K) they carry the issue's colour chip.
- **Asterisk weight-clash contents list** (A §2.3): reads as a type specimen, flattens hierarchy, same paper wears different weights on different pages.
- **Issue colour as headline colour / wash bands** (A §3.2): loud, seasonal brand change; the cream room stays constant and colour lives only on plates.
- **300vh pinned sequences on home and /issues, pointer tilt, white borderless cards, grid-rows hover unfold** (C): marketing theatre, off-reference, layout shift.
- **Header that hides on scroll** (A): a reading site keeps its orientation; the header is sticky and never hides.
- **Plates persisting through the theme flip via static `view-transition-name`** (A §10): plate names are React-managed (`<ViewTransition>`) and only exist during React transitions; a static name would collide with them. The theme flip is a root cross-fade; plates keep their hue identity through designed dark tones instead.
- **Right-gutter progress contour** (B §8.18): folded into the running head's bottom edge (one fewer floating element).
- **Mid-page dark call-for-papers band** (B §9.1): dark stays at the bottom; the call for submissions becomes the footer's first row.

### 0.4 Must-fix ledger (every judge item, and where it is resolved)

| # | Must-fix | Resolution |
|---|---|---|
| 1 | B fonts false (Literata no ҷ, JetBrains Mono no Қ/ҷ) | §2.1: Source Serif 4 + Inter + IBM Plex Mono; native names only in Source Serif 4; glyph probe in §12 and §13.T3 |
| 2 | Plate line colour 42% white invisible | §3.3: `--plate-ink` at 100% (ink / cream), dots 60% |
| 3 | Hashed row glyphs | Removed (§0.3, §8.9) |
| 4 | Same-season issues share a colour | §3.3 year-parity variants |
| 5 | Hero too tall | §9.1: ridge capped at 1200×280; band starts ≈ 1.0 viewport at 1440×900; mobile plate is a 3:2 tile ≤ 240 px tall |
| 6 | At most one dark surface before the footer | §7.4: call band moved into the footer; the only mid-page dark is the paper page's door panel |
| 7 | Hover gated on `(hover: hover) and (pointer: fine)`; scroll timelines inside `@supports` + `no-preference`, `animation: none` in reduce | §6.5, Appendix B |
| 8 | No white cards without hairline; never grow a row on hover | §4.3, §8.9 |
| 9 | Input border ≥ 3:1 | §3.1: `#87867f` light (3.47 page / 3.65 field), `#73726c` dark (3.82 / 3.45) |
| 10 | Paper page: date, PDF size, access in one ≥ 13 px line under authors | §9.4 (14 px) |
| 11 | Mobile home plate cap; drop dashed "next quarter" slot | §9.1, §9.3 |
| 12 | /login: "Continuing with Google creates your account; there is no separate registration." + error alert + dev-login block | §9.6 |
| 13 | Abstract contiguous (never lede + body split) | §9.4 |
| 14 | Status labels ≥ 13 px | §8.7 (14 px) |
| 15 | No `?issue=` feature, no "Recent activity" feed, no relative times, title stays `h1`, editor's note in full, no extra "Get the PDF" pill above the abstract, no "OUT NOW" | §9 throughout |
| 16 | Duplicate `view-transition-name` per page | §6.4 rule: one `plate-N` element per page; chips in lists never carry |
| 17 | Size-aware stroke widths (≥ 1 px at small sizes) | §5.3 stroke table |
| 18 | `timeline-scope` on the sticky sequence | §8.16, Appendix B |
| 19 | `/design` route instead of temporary `/`; PaperRow deletion in cleanup; Foundation first; `content.ts` frozen at Foundation merge | §12 |
| 20 | Carry via React `<ViewTransition>`, not raw CSS names | §6.4 |
| 21 | No DB read in the root layout for colour | §3.3: plate colour is derived from `issues.ts` data the page already has |
| 22 | Build/visual glyph check on loaded faces | §12 (a) item 10, §13.T3 |
| 23 | Keep `.gated-download`, `id="the-full-paper"`, JSON-LD, Highwire tags, `#contributors`, `#readers`, `#no-N` | §9.4, §9.5, §9.3, §13.R |
| 24 | Sticky beats `inert` (C) | N/A: the only sticky sequence keeps every step in normal flow, visible and focusable; only the drawing is sticky |

---

## 1. Concept

1. The site is a quiet cream room in which the research is the only thing printed in ink: `#faf9f5` paper, four cream layers two per cent apart, `#141413` ink, and a single terracotta accent used so sparingly it reads as a signature.
2. Every screen carries one serif statement, one line of sans, and at most two actions; everything else is air (64 → 128 px between ideas) or a hand-drawn line.
3. Each quarterly issue is an object: a soft plate in its season's pastel, its number in a large light serif, and one line drawing of the region's nature or science (a Tian Shan tulip, a halved pomegranate, a saiga) that draws itself as you arrive.
4. Motion is five gestures only (words rise, lines draw, blocks rise, rows unroll, plates settle) plus one scroll-bound drawing on About, a title/plate carry between pages and a cross-faded theme flip; nothing loops, nothing bounces, everything is visible without JavaScript and still with reduced motion.
5. Dark means "a door": on a light page `#141413` appears only on primary buttons, the paper page's download panel and the footer, so a reader learns that dark is where something is done.

**The signature idea — The Contour.** One hand-drawn, round-capped ink line is the site's only ornament, and it is always drawn, never pasted: it is the logo (the **Mark**, three nested contour rings of a summit seen from above, with a terracotta summit dot); the home horizon (a ridge-and-river contour map that draws itself under the headline); every issue cover's drawing; the 80 px rule under centred headlines (drawn outward from the centre); and the reading-progress line along the bottom of the paper page's running head. A topographic contour belongs to a region defined by mountains, steppe and shrinking seas, it carries no flag, emblem or yurt, and no other publication uses a living contour line as logo, cover, divider and progress bar at once. The issue plates are its canvas.

---

## 2. Typography

### 2.1 Families (verified)

Verification done today, two ways: (1) `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json` lists the subsets below; (2) the Google-served font files were downloaded with `text=ҚқҶҷК ʻü№` and their `cmap` tables parsed: every glyph present in the three chosen faces. Literata lacks Ҷ/ҷ; JetBrains Mono lacks Қ/қ/Ҷ/ҷ; Geist ships no `cyrillic-ext`; Newsreader and Fraunces ship no Cyrillic at all. All rejected.

| Role | Family / import | Subsets in font-data.json | Glyphs Қ қ Ҷ ҷ ʻ ü № | Loaded | Weights used |
|---|---|---|---|---|---|
| Serif: statements, titles, reading, **native country names** | **Source Serif 4** · `Source_Serif_4` | cyrillic, cyrillic-ext, greek, latin, latin-ext, vietnamese | all present | variable `wght 200–900`, axes `["opsz"]` (8–60), normal style only | 300 (numerals), 400 (display → reading), 500 (h3, h4, wordmark) |
| Sans: UI, bylines, buttons, forms, admin | **Inter** · `Inter` | cyrillic, cyrillic-ext, greek, greek-ext, latin, latin-ext, vietnamese | all present | variable `wght 100–900`, axes `["opsz"]` (14–32) | 400, 500, 600 (chip numerals only) |
| Mono: metadata, eyebrows, dates in lists, table heads, kbd | **IBM Plex Mono** · `IBM_Plex_Mono` | cyrillic, cyrillic-ext, latin, latin-ext, vietnamese | all present | static 400, 500 | 400, 500 |

```ts
// src/app/layout.tsx
import { Source_Serif_4, Inter, IBM_Plex_Mono } from "next/font/google";

const serif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],          // = which subsets get <link rel=preload>; see note
  axes: ["opsz"],
  display: "swap",
});
const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
// <html className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}>
```

Note on `subsets` (verified in `node_modules/next/dist/compiled/@next/font/dist/google/find-font-files-in-css.js`): next/font self-hosts **every** subset's `@font-face` (each with its `unicode-range`); `subsets` only decides which files are preloaded. So the Cyrillic, Cyrillic-ext and Latin-ext files exist and load on demand when a native name renders, without a preload cost on every page. Do not add `cyrillic-ext` to `subsets`.

**Native names**: `Қазақстан`, `Кыргызстан`, `Тоҷикистон`, `Türkmenistan`, `Oʻzbekiston` are set **only in Source Serif 4** (footer and /about coverage), each in `<span lang={country.lang}>` from `REGION_COUNTRIES` in `src/lib/site.ts`. Never in mono, never in Inter. Acceptance §13.T3 proves it with a glyph probe.

`@theme` font tokens (do not self-reference the next/font variables):

```css
--font-serif: var(--font-source-serif), "Iowan Old Style", Georgia, serif;
--font-sans:  var(--font-inter), ui-sans-serif, system-ui, sans-serif;
--font-mono:  var(--font-plex-mono), ui-monospace, "SFMono-Regular", monospace;
```

Global rendering: `body { font-family: var(--font-sans); font-optical-sizing: auto; font-feature-settings: "kern", "liga", "lnum", "pnum"; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }`. Tables, counts, admin and dates in lists use `font-variant-numeric: tabular-nums lining-nums`. No old-style figures anywhere. `h1–h4 { text-wrap: balance }`, `p { text-wrap: pretty }`. Optical size is automatic (Source Serif 4 reaches its `opsz 60` display cut at ≥ 60 px; Inter its `opsz 32` cut at ≥ 32 px); no manual `font-variation-settings`.

### 2.2 Type scale (fluid 390 → 1440 px, 16 px root)

Implemented as Tailwind v4 `--text-*` theme tokens with `--line-height` / `--letter-spacing` modifiers (so `text-display` sets all three), plus `font-*` and colour classes at the call site.

| Token (`text-…`) | Size | px 390 → 1440 | Line-height | Tracking | Face / weight | Role |
|---|---|---|---|---|---|---|
| `display` | `clamp(2.75rem, 1.9143rem + 3.4286vw, 5rem)` | 44 → 80 | 1.02 | −0.022em | Serif 400 | Home hero headline only. Max 22ch, ≤ 3 lines at 390, 2 at 1440 |
| `h1` | `clamp(2.5rem, 1.9429rem + 2.2857vw, 4rem)` | 40 → 64 | 1.05 | −0.018em | Serif 400 | Page titles (Papers, Issues, About, Submit …) |
| `title` | `clamp(2.25rem, 1.7857rem + 1.9048vw, 3.5rem)` | 36 → 56 | 1.08 | −0.015em | Serif 400 | Paper title (`h1` element). If title > 80 characters, use `h2` size. Max 3 balanced lines, `max-inline-size: 24ch` |
| `h2` | `clamp(2rem, 1.6286rem + 1.5238vw, 3rem)` | 32 → 48 | 1.1 | −0.012em | Serif 400 | Section heads, issue spread heading, year heads (weight 300 there), admin page title |
| `statement` | `clamp(1.625rem, 1.3929rem + 0.9524vw, 2.25rem)` | 26 → 36 | 1.3 | −0.008em | Serif 400 | Editors' statement (one per site) |
| `h3` | `clamp(1.375rem, 1.2357rem + 0.5714vw, 1.75rem)` | 22 → 28 | 1.2 | −0.005em | Serif 500 | Row titles, card and door titles, step titles |
| `h4` | `clamp(1.125rem, 1.0786rem + 0.1905vw, 1.25rem)` | 18 → 20 | 1.3 | 0 | Serif 500 | Dialog / panel / sub heads, compact row titles (/papers, admin) |
| `lede` | `clamp(1.1875rem, 1.0946rem + 0.381vw, 1.4375rem)` | 19 → 23 | 1.4 | 0 | Serif 400, `ink-2` | The one line under a display/h1 |
| `read` | `clamp(1.125rem, 1.1018rem + 0.0952vw, 1.1875rem)` | 18 → 19 | 1.65 | 0 | Serif 400, `ink` | Abstract, About prose, privacy |
| `body` | `1rem` | 16 | 1.6 | 0 | Inter 400, `ink-2` | Descriptions, help text, notices, input text |
| `ui` | `0.9375rem` | 15 | 1.4 | −0.005em | Inter 500 (nav, md buttons) / 400 (row authors) | Nav, authors in rows, table cells |
| `ui-sm` | `0.875rem` | 14 | 1.4 | 0 | Inter 400/500 | Small buttons, status labels, meta line on paper page, dialog rows |
| `button-lg` | `1.0625rem` | 17 | 1 | −0.01em | Inter 500 | lg pills |
| `meta` | `0.75rem` | 12 | 1.5 | +0.06em, `uppercase` | Plex Mono 500, `ink-3` | Eyebrows, list dates, table heads, plate labels |
| `micro` | `0.6875rem` | 11 | 1.5 | +0.02em | Plex Mono 400, `ink-3` | Copyright, kbd, legal |
| `numeral` | `clamp(3.5rem, 2.5714rem + 3.8095vw, 6rem)` | 56 → 96 | 0.9 | −0.03em | Serif 300 | Issue number on plates; "404" |

Ratios: display : lede : ui = 80 : 23 : 15 (1 : 0.29 : 0.19); headline-to-body never below 3.4 : 1 on a screen. Minimums: no text under 14 px except `meta` (12, uppercase, tracked, 6.26 : 1) and `micro` (11). Input text is 16 px (prevents iOS zoom).

### 2.3 How little text a screen may carry (hard rule, checked in review)

| Surface | Allowed |
|---|---|
| Hero / page header | eyebrow ≤ 5 words · headline ≤ 9 words · lede ≤ 20 words · ≤ 2 actions |
| List row | title · author line · one meta (date, or date + issue chip). No abstract text visible at rest. |
| Plate | ≤ 3 text elements (season label, count, numeral) |
| Section | heading ≤ 6 words + at most one paragraph ≤ 45 words |
| Door / card | title ≤ 6 words · one line ≤ 16 words · one primary action + one micro line or ghost link |
| Reading page | the abstract in full (it is the product); everything around it follows the rows above |
| Working pages (submit, submissions, notifications, admin) | product register: copy as needed; help ≤ 2 lines per field |

Above-the-fold word caps: `/` ≤ 30 (target 25), `/papers` ≤ 40, `/issues` ≤ 30, `/p/[slug]` ≤ 90 (title + authors + meta + first lines of abstract). One serif statement per viewport; nothing else on that viewport larger than 28 px.

---

## 3. Colour

All tokens are `light-dark()` pairs in `@theme`, resolved by `color-scheme` exactly as today (`:root { color-scheme: light dark }`, `:root[data-theme="light|dark"]` pins set pre-paint in `layout.tsx`). Components use semantic tokens only; no raw hex outside `globals.css` and `src/lib/plates.ts`.

### 3.1 Semantic tokens

| Token (`--color-…`) | Light | Dark | Use |
|---|---|---|---|
| `page` | `#faf9f5` | `#141413` | body background |
| `surface-1` | `#f5f4ed` | `#1f1e1d` | inset band, filled cards, row hover, cite card |
| `surface-2` | `#f0eee6` | `#262624` | secondary button fill, segmented track, nav pill active, chips, `<pre>` |
| `surface-3` | `#e8e6dc` | `#30302e` | kbd, skeleton blocks, pressed states |
| `overlay` | `#ffffff` | `#262624` | floating: ⌘K panel, menus, login card |
| `field` | `#ffffff` | `#1f1e1d` | input / textarea / search fill |
| `ink` | `#141413` | `#faf9f5` | headlines, reading text |
| `ink-2` | `#30302e` | `#e8e6dc` | body sans, ledes |
| `ink-3` | `#5e5d59` | `#b0aea5` | meta, authors in rows, eyebrows, placeholders |
| `ink-4` | `#87867f` | `#87867f` | disabled text, decorative only |
| `rule` | `#e8e6dc` | `#2e2e2c` | hairlines inside components |
| `rule-2` | `#dedcd1` | `#3d3d3a` | row dividers, card borders, header hairline |
| `border` | `#d1cfc5` | `#4d4c48` | secondary-button ring, hovered card border |
| `border-input` | `#87867f` | `#73726c` | inputs, textarea, dropzone dash (WCAG 1.4.11) |
| `primary` | `#141413` | `#faf9f5` | primary button fill |
| `on-primary` | `#faf9f5` | `#141413` | text on primary |
| `accent` | `#a8441f` | `#e08b66` | the only accent as **text**: link hover, "New/This quarter" text when needed, focus on door |
| `accent-mark` | `#d97757` | `#d97757` | **non-text only**: Mark summit dot, hovered drawing dots, unread dot, current-issue dot |
| `accent-soft` | `#f6e4da` | `#3a251c` | `::selection`, rare accent tint |
| `door` | `#141413` | `#262624` (+ 1px `#3d3d3a` ring) | gated-download panel |
| `door-ink` / `door-ink-2` / `door-ink-3` | `#faf9f5` / `#e8e6dc` / `#b0aea5` | same | text on door and footer |
| `door-rule` | `#3d3d3a` | `#3d3d3a` | hairlines on door and footer |
| `footer` | `#141413` | `#0f0f0e` | footer band |
| `focus` | `#141413` | `#faf9f5` | 2px outline, offset 2px (on door/footer: `#faf9f5`) |
| `good` | `#2f6b4b` | `#7fc29a` | Published, Sent |
| `warn` | `#8a5a12` | `#d9a94c` | Under review, Skipped |
| `bad` | `#b2433a` | `#e58a7c` | Needs revision, Failed, errors |
| `mute` | `#5e5d59` | `#b0aea5` | Draft |
| `line` | `#141413` | `#e8e6dc` | drawing strokes on page/surfaces |
| `line-dot` | `#e3dacc` | `#4d4c48` | drawing dots on page/surfaces (Claude's oat) |
| `line-on-door` | `rgb(250 249 245 / .7)` | same | drawing strokes on door/footer |
| `scrim` | `rgb(20 20 19 / .40)` | `rgb(0 0 0 / .55)` | dialog backdrop |

Accent discipline (Claude's rule, ≈ 20 px of saturated pixels per screen): `accent-mark` appears on the Mark's summit dot, the unread dot, the current-issue dot and hovered drawing dots, nothing else. `accent` is never a fill behind text and never a button colour. Buttons are ink.

### 3.2 Contrast (computed, WCAG 2.x)

| Pair | Ratio |
|---|---|
| ink on page / surface-1 / surface-2 / surface-3 / overlay (light) | 17.50 / 16.72 / 15.87 / 14.73 / 18.43 |
| ink-2 on page / surface-3 | 12.55 / 10.57 |
| ink-3 on page / surface-1 / surface-2 / surface-3 | 6.26 / 5.98 / 5.67 / 5.27 |
| ink-4 on page | 3.47 (decorative / disabled only) |
| accent `#a8441f` on page / s1 / s2 / s3 / white / accent-soft | 5.68 / 5.42 / 5.15 / 4.78 / 5.98 / 4.85 |
| on-primary on primary (light and dark) | 17.50 |
| good / warn / bad on page (light) | 5.99 / 5.61 / 5.31 |
| border-input `#87867f` vs page / surface-1 / field white | 3.47 / 3.31 / 3.65 (≥ 3 : 1, 1.4.11) |
| door-ink / door-ink-2 / door-ink-3 on door `#141413` | 17.50 / 14.73 / 8.29 |
| line-on-door (cream 70% → `#b5b4b1`) on door | 8.89 |
| **Dark** ink on page / s1 / s2 / s3 | 17.50 / 15.80 / 14.39 / 12.55 |
| ink-2 / ink-3 / ink-4 on page (dark) | 14.73 / 8.29 / 5.04 |
| ink-3 on s1 / s2 / s3 (dark) | 7.48 / 6.82 / 5.95 |
| accent `#e08b66` on page / s1 / s2 / s3 / accent-soft (dark) | 7.07 / 6.38 / 5.81 / 5.07 / 5.51 |
| good / warn / bad on page (dark) | 8.85 / 8.54 / 7.25 |
| border-input `#73726c` vs page / s1 / s2 (dark) | 3.82 / 3.45 / 3.14 |
| door-ink on door `#262624` (dark) / door-ink-3 | 14.39 / 6.82 |
| ink on footer `#0f0f0e` (dark) | 18.20 |
| selection: ink on accent-soft | 14.95 |

### 3.3 Issue plates (the per-issue colour system)

**Rule: the season gives the hue, the year's parity gives the variant, the issue number gives the drawing.** Nothing is stored; everything derives from `src/lib/issues.ts` (`year`, `quarter`, `number`). Even years use variant A, odd years variant B, so two Summers never match and adjacent issues always differ. Text and lines on plates are always `--plate-ink` (ink on light plates, cream on dark plates) at 100%; dots are `--plate-ink` at 60%.

| Quarter / season | Variant A (even year) light → dark | Variant B (odd year) light → dark |
|---|---|---|
| Q1 Winter | heather `#cbcadb` → `#4a4870` | sky `#c9dcf0` → `#2f4a66` |
| Q2 Spring | cactus `#bcd1ca` → `#3f5e55` | sage `#c7d4be` → `#4a5a40` |
| Q3 Summer | peach `#ebc9b7` → `#7a4a36` | apricot `#f0c8a8` → `#7e4f31` |
| Q4 Autumn | wheat `#e9d3a8` → `#6b5a2a` | coral `#ebcece` → `#6e3e3e` |

Contrast on plates (text, labels and strokes all use `--plate-ink`):

| Tone | ink on light plate | cream on dark plate | dot (60%) on light / dark |
|---|---|---|---|
| heather | 11.42 | 8.13 | 4.05 / 4.11 |
| sky | 13.15 | 8.70 | 4.29 / 4.30 |
| cactus | 11.51 | 6.77 | 4.06 / 3.60 |
| sage | 11.93 | 7.05 | 4.11 / 3.71 |
| peach | 11.91 | 6.97 | 4.14 / 3.65 |
| apricot | 11.88 | 6.54 | 4.12 / 3.48 |
| wheat | 12.59 | 6.39 | 4.24 / 3.44 |
| coral | 12.51 | 8.23 | 4.22 / 4.11 |

Drawing by issue number: `SUBJECTS[(number − 1) % 8]` = `tulip, pomegranate, saiga, melon, leopard, apple, silkworm, cotton`.

With today's data: **Issue 1 = Spring 2026 = cactus + tulip; Issue 2 = Summer 2026 = peach + pomegranate.**

CSS: one class per tone sets three custom properties, e.g.

```css
.plate-peach { --plate: light-dark(#ebc9b7, #7a4a36); --plate-ink: light-dark(#141413, #faf9f5); }
/* all 8 tones the same shape; --plate-dot is derived once: */
[class*="plate-"] { --plate-dot: color-mix(in srgb, var(--plate-ink) 60%, transparent); }
```

`src/lib/plates.ts` (Foundation):

```ts
export type PlateTone = "heather" | "sky" | "cactus" | "sage" | "peach" | "apricot" | "wheat" | "coral";
export type Subject = "tulip" | "pomegranate" | "saiga" | "melon" | "leopard" | "apple" | "silkworm" | "cotton";
export const SUBJECTS: readonly Subject[] = ["tulip","pomegranate","saiga","melon","leopard","apple","silkworm","cotton"];
const TONES: Record<1|2|3|4, readonly [PlateTone, PlateTone]> = {
  1: ["heather", "sky"], 2: ["cactus", "sage"], 3: ["peach", "apricot"], 4: ["wheat", "coral"],
};
export function plateTone(year: number, quarter: 1|2|3|4): PlateTone { return TONES[quarter][year % 2 === 0 ? 0 : 1]; }
export function plateSubject(issueNumber: number): Subject { return SUBJECTS[(issueNumber - 1) % 8]; }
export function plateFor(i: { number: number; year: number; quarter: 1|2|3|4 }): { tone: PlateTone; subject: Subject; className: `plate-${PlateTone}` };
/** For callers that only have issueFor()'s { number, label } ("Summer 2026"), e.g. ⌘K and /papers rows. */
export function plateFromLabel(number: number, label: string): { tone: PlateTone; subject: Subject; className: `plate-${PlateTone}` };
export function isCurrentQuarter(year: number, quarter: 1|2|3|4, now?: Date): boolean; // uses tashkentQuarter()
```

---

## 4. Shape and surface

### 4.1 Radii (one soft family + pill)

| Token | Value (≥ 768 / < 768) | Used by |
|---|---|---|
| `--radius-xs` | 6px | kbd, plate chip |
| `--radius-sm` | 12px | inputs, textarea, notices, row hover background, `<pre>` |
| `--radius-md` | 20px / 16px | cards (cite, review, form, contributor cards), door panel, menus, dropzone |
| `--radius-lg` | 28px / 24px | plates (hero, spread), inset band, login card, ⌘K panel |
| `rounded-full` | 999px | buttons, nav pills, search pill, chips, segmented track and thumb, icon buttons |

Rules: one radius per component; nested surfaces use `outer − padding` (e.g. a 12px row hover inside a 28px band); full-bleed bands (footer) are radius 0.

### 4.2 Borders

`1px` everywhere except the login card and ⌘K panel (`0.5px rule-2`, Claude's login card). Roles: `rule` inside components, `rule-2` between rows and on cards, `border` on secondary buttons and hovered cards, `border-input` on fields.

### 4.3 Cards (three species, no more)

| Species | Fill | Border | Radius | Padding | Hover (if link; hover-capable only) |
|---|---|---|---|---|---|
| **Filled** | `surface-1` | none | md | 24 (32 ≥ md) | fill → `surface-2`, 200 ms |
| **Bordered** | `page` or `overlay` | 1px `rule-2` | md | 24 (32 ≥ md) | border → `border`, 200 ms |
| **Plate** | `--plate` | none | lg | 24 | `scale(1.016)` 300 ms `ease-apple` + re-ink + dots → `accent-mark` |

Never a white card on cream without the hairline (it would be 1.05 : 1). Never a card inside a card. Never a shadow on anything in the page flow.

### 4.4 Shadows

```css
--shadow-float: 0 4px 24px rgb(20 20 19 / .08), 0 1px 2px rgb(20 20 19 / .04);   /* menus, ⌘K */
--shadow-card:  0 4px 24px #00000004, 0 4px 32px #00000004, 0 2px 64px #00000003, 0 16px 32px #00000003; /* login card */
/* dark mode: both become */ 0 0 0 1px #3d3d3a, 0 12px 40px rgb(0 0 0 / .5);
```

### 4.5 Buttons, pills, inputs

| Variant | Height / padding / text | Light | Dark | Hover (hover-capable) / active |
|---|---|---|---|---|
| `primary` lg | 46px · 0 22px · 17px Inter 500 | fill `primary`, text `on-primary` | fill `#faf9f5`, text `#141413` | ring `0 0 0 2px color-mix(in srgb, var(--color-primary) 18%, transparent)` 200 ms; active `scale(.97)` 160 ms |
| `primary` md | 40px · 0 18px · 15px | same | same | same |
| `primary` sm | 32px · 0 14px · 14px, `::after` 44px hit area | same | same | same |
| `secondary` | same sizes | fill `surface-2`, ring `0 0 0 1px var(--color-border)`, text `ink` | same tokens | ring → `ink-3`, 200 ms |
| `ghost` | same sizes, padding 0 12px | transparent, text `ink-2` | same | fill `surface-1`, text `ink` |
| `on-door` | primary geometry | fill `#faf9f5`, text `#141413` | same | ring cream 30% |
| `link` | inline, 15px Inter 500 + 16px arrow | text `ink`, arrow `ink-3` | same | arrow `translateX(2px)`, text underline 1px offset .2em |
| Icon button | 32px circle (header), 36px elsewhere; 18px Phosphor icon | transparent, `ink-2` | same | fill `surface-1`, `ink` |

Pairs sit 12px apart, primary first. md and sm get a 44px `::after` hit area on touch. Disabled: `opacity .5`, `cursor: not-allowed`. Pending (`PendingButton`): label swaps to the pending label, `aria-busy="true"`, width held (`min-inline-size` set to the idle width), no spinner.

| Control | Spec |
|---|---|
| Nav pill | 32px · 0 14px · 14px Inter 500 · transparent at rest, `ink-2`; hover `surface-1`; active (`aria-current="page"`) `surface-2` + `ink` |
| Chip | 24px · 0 10px · `meta` type · `surface-2` · `ink-2`; "This quarter" chip = 6px `accent-mark` dot + `ink` text |
| Plate chip | 20 × 26px, radius xs, `--plate` fill, issue number 11px Inter 600 `--plate-ink`, centred |
| Input | 48px · 0 16px · 16px Inter · fill `field` · 1px `border-input` · radius sm; placeholder `ink-3`; focus: border `ink` + 2px `focus` outline offset 2px; invalid: border `bad` + message 14px `bad` |
| Textarea | same, min-height 176px, padding 12px 16px, `resize: vertical`, counter 12px mono right-aligned below |
| Search field | 48px pill, `field` fill, 1px `border-input`, magnifier 18px at left 16px, `kbd ⌘K` at right (desktop) |
| Dropzone | 1.5px dashed `border-input`, radius md, `surface-1`, min-height 160px, `cotton` drawing `xs` centred above the text; dragover: border `ink` solid, fill `surface-2` |
| kbd | 20px · 0 6px · `micro` · `surface-3` · radius xs |
| Focus (everything) | `outline: 2px solid var(--color-focus); outline-offset: 2px;` only on `:focus-visible` |
| Prose links | underline 1px, `text-decoration-color: var(--color-border-input)`, `text-underline-offset: .2em`; hover decoration → `ink` 200 ms |
| Row / card links | whole surface is the link (`a::after { content:""; position:absolute; inset:0 }`); no underline |

---

## 5. Illustration system ("The Contour")

### 5.1 Language

- **Subjects**: the region's land, water, crops, animals and sky-science. Never flags, emblems, yurts, buildings, people, maps with borders, or anything captioned as belonging to one country. A drawing names a species or a landform, never a state. *(Exception, owner's direction 2026-11-10: the home `horizon` alone draws yurts, horses, wind turbines, a train and a generic skyline. See Implementation notes.)*
- **Line**: one weight, `stroke-linecap: round; stroke-linejoin: round; fill: none`. Every "straight" stroke is a cubic with 2–3 interior nodes offset ≤ 1.5 units (hand wobble); terminals stay slightly open; no hatching, no outlines of outlines. A naturalist's field sketch, not an icon.
- **Dots**: 3–9 small filled circles per drawing (seeds, stamens, eyes, settlements), `fill: var(--dot)`, no stroke. They appear after the lines.
- **Colour** (`tone` prop sets `color` and `--dot` on the `<svg>`):

| tone | strokes | dots | where |
|---|---|---|---|
| `ink` | `--color-line` | `--color-line-dot` | page, surfaces |
| `plate` | `--plate-ink` (100%) | `--plate-dot` (60%) | on plates |
| `door` | `--color-line-on-door` | `rgb(250 249 245 / .35)` | door panel, footer |
| `muted` | `--color-ink-4` | `--color-line-dot` | 404 / error only |

Hover (plates and the Mark, hover-capable only): dots → `--color-accent-mark`, 200 ms, colour only.

### 5.2 Production (how an engineer makes one)

1. Draw on the viewBox given in §5.4 in any vector editor: strokes only, round caps, pencil smoothing ≈ 40%, each visual stroke a separate path, dots as circles, no transforms, nothing within 24 units of the edge. ≤ 14 strokes, ≤ 30 nodes each, ≤ 9 dots.
2. Export SVG (flatten transforms), run `node scripts/illustration-prep.mjs in.svg tulip > src/app/_components/illustrations/data/tulip.ts`. The script (Foundation, no dependencies, regex over a flat SVG) emits:

```ts
// src/app/_components/illustrations/data/tulip.ts
import type { DrawingData } from "../types";
export const tulip: DrawingData = {
  viewBox: [400, 500],
  strokes: [{ d: "M200 464 C …" }, { d: "…", stage: 2 }],   // document order = draw order
  dots: [[190, 186, 5], [200, 180, 6], [210, 186, 5]],      // [cx, cy, r]; stage optional as 4th item
};
```

3. Register it in `illustrations/index.ts` (`DRAWINGS: Record<IllName, DrawingData>`).
4. `<Drawing>` renders it: `<svg viewBox="0 0 w h" fill="none" stroke="currentColor" aria-hidden | role="img">`, each stroke `<path d pathLength="1" data-s style="--i:n" data-stage?>`, each dot `<circle data-d style="--i:n" r=…>`. Stroke width and dot scale come from the size table below. Budget: ≤ 4 KB per drawing module, ≤ 30 KB inline SVG per page.

### 5.3 Sizes and stroke widths (size-aware; never `vector-effect`)

Strokes are in viewBox units, chosen so the rendered line is 1.5–2 px at every size. Values below are for a 400-unit-wide box; `<Drawing>` multiplies by `viewBoxWidth / 400` (e.g. ridge ×3, Mark ×0.12). Fluid sizes switch value at 768px via CSS custom properties (`--sw`, `--sw-sm`).

| `size` | Rendered drawing width | Stroke (u, 400 box) | Rendered px | Dot scale |
|---|---|---|---|---|
| `xs` | 64px | 9.4 | 1.5 | 1.8 |
| `sm` | 96px | 6.25 | 1.5 | 1.4 |
| `md` | 160px | 4.4 | 1.75 | 1.15 |
| `lg` | 240px | 3.3 | 2.0 | 1.0 |
| `xl` | 360px | 2.2 | 2.0 | 1.0 |
| `plate` | ≈ 290px (≥ 768) / ≈ 160px (< 768) | 2.75 / 4.4 | 2.0 / 1.75 | 1.0 / 1.3 |
| `hero` (ridge, 1200 box) | 1200px (≥ 768) / slice to 150px tall (< 768) | 1.75u / 2.8u (in 1200 box) | ≈ 1.6 / 1.5 | 1.0 / 1.6 |
| `mark-24` / `mark-32` / `mark-96` (48 box) | 24 / 32 / 96px | 3u / 2.25u / 1u (in 48 box) | 1.5 / 1.5 / 2.0 | 1 |

### 5.4 The library (13 drawings)

Coordinates are construction paths an author starts from; final paths carry the hand wobble from §5.1. "Order" is the draw order (= array order).

**1. `tulip`** — *Tulipa greigii*, the Tian Shan tulip. viewBox `400 × 500`. 9 strokes + 3 dots. Stages (used by About): stage 1 = strokes 1–4, stage 2 = strokes 5–7, stage 3 = strokes 8–9 + dots.
1. stem `M200 464 C 197 400 204 330 200 262`
2. left leaf `M198 430 C 150 418 118 376 112 318`
3. left leaf vein `M190 426 C 156 410 134 372 128 328`
4. right leaf `M204 400 C 252 388 282 350 288 296`
5. cup base `M166 236 C 178 262 222 262 234 236`
6. centre petal `M172 150 C 184 120 196 100 200 86 C 204 100 216 120 228 150`
7. centre petal lower edge `M172 150 C 182 166 218 166 228 150`
8. left petal `M200 262 C 150 250 128 190 136 118 C 160 150 184 170 200 176`
9. right petal `M200 262 C 250 250 272 190 264 118 C 240 150 216 170 200 176`
Dots (stamens): `(190,186,5) (200,180,6) (210,186,5)`.
Where: Issue plate n ≡ 1 (mod 8) — **Issue 1**; About sticky sequence (three stages); ⌘K empty state (`xs`).
Motion: draw-on 1.1 s, 80 ms stagger; dots fade at end; hover re-ink on plates.

**2. `pomegranate`** — halved pomegranate. viewBox `400 × 500`. 7 strokes + 7 dots.
1. whole fruit `M110 300 C 110 240 150 206 196 210 C 240 214 262 254 258 302 C 254 352 214 380 180 376 C 140 372 110 350 110 300`
2. calyx crown `M188 210 C 184 196 180 188 180 182 C 188 180 194 178 196 176 C 200 184 202 190 204 196 C 208 188 212 180 214 174 C 218 186 220 196 222 206`
3. half outer rim `M232 330 C 232 270 282 232 334 240 C 372 250 386 296 372 340 C 356 384 300 402 264 384 C 244 372 232 352 232 330`
4. half inner rim (12 units inside 3)
5–7. three septa from `(304,318)` to the inner rim at roughly 10, 2 and 6 o'clock
Dots (arils, r 6): `(286,300) (318,296) (296,334) (330,330) (276,352) (312,362) (344,350)`.
Where: **Issue 2** plate (n ≡ 2); home band while Issue 2 is current; /issues; paper page chip colour.

**3. `saiga`** — saiga antelope head in profile, facing left. viewBox `400 × 500`. 9 strokes + 2 dots.
1. forehead `M150 180 C 180 150 240 146 280 170`
2. inflated nose `M150 180 C 118 200 104 250 118 290 C 128 316 150 326 170 318`
3. jaw `M170 318 C 220 320 262 300 284 268`
4. ear `M276 172 C 290 136 316 128 322 146 C 326 170 300 190 286 196`
5. lyre horn `M292 160 C 330 120 352 80 340 40`
6. horn rings (one path of 6 short ticks across the horn, each ≈ 12u)
7. neck front `M284 268 C 300 300 320 340 330 380`
8. neck back `M300 176 C 336 230 360 300 372 380`
9. muzzle fold `M250 196 C 240 230 232 270 236 300`
Dots: eye `(246,212,6)`, nostril `(126,278,5)`.
Where: Issue plate n ≡ 3; `/papers` "no results" empty state (`sm`).

**4. `melon`** — torpedo melon on the vine. viewBox `400 × 500`. 8 strokes + 4 dots.
1. melon `M96 300 C 96 240 150 196 220 200 C 290 204 318 258 312 318 C 306 378 246 404 190 398 C 130 392 96 356 96 300`
2–3. two net lines along the long axis (shallow arcs inside 1)
4. stem `M276 232 C 300 212 318 196 340 190`
5. tendril `M340 190 C 362 180 372 196 356 206 C 344 212 344 198 352 200`
6. leaf `M300 190 C 320 150 360 140 372 160 C 376 184 340 198 318 196`
7. leaf vein `M306 188 C 324 172 344 164 362 164`
8. a third net line crossing 2–3
Dots: net intersections, r 5, four.
Where: Issue plate n ≡ 4.

**5. `leopard`** — snow leopard head, three-quarter, with the tail resting the composition. viewBox `400 × 500`. 12 strokes + 6 dots.
1. skull `M120 200 C 150 120 260 112 300 196`
2. left ear `M128 196 C 108 160 124 128 152 138`
3. right ear `M296 194 C 316 160 300 128 272 138`
4. left cheek ruff `M120 200 C 96 260 110 330 170 356`
5. right cheek ruff `M300 196 C 324 260 310 330 250 356`
6. muzzle `M176 300 C 190 330 230 330 244 300`
7. nose bridge `M210 230 C 204 260 206 290 210 300`
8. chin `M186 350 C 200 368 220 368 234 350`
9–10. eyes as two almond strokes (not dots, so hover never recolours the eyes)
11. whiskers (one path, 2 short strokes per side)
12. tail `M372 470 C 330 430 350 380 380 350`
Dots: rosettes, six r 6 on forehead and cheeks.
Where: Issue plate n ≡ 5.

**6. `apple`** — wild apple of Almaty (*Malus sieversii*) on its branch. viewBox `400 × 500`. 7 strokes + 3 dots.
1. branch `M60 420 C 140 380 220 300 330 160`
2. side twig `M180 330 C 196 300 214 290 236 286`
3. apple `M232 300 C 200 300 186 334 192 362 C 198 392 226 410 248 404 C 276 398 292 368 286 338 C 280 310 262 298 232 300`
4. dimple `M232 300 C 236 292 244 290 250 298`
5. apple stem `M240 296 C 240 284 236 278 236 286`
6. leaf `M300 196 C 310 160 346 150 356 172 C 360 196 326 206 302 198`
7. leaf vein `M304 194 C 320 182 338 174 352 172`
Dots: lenticels r 5, three on the apple.
Where: Issue plate n ≡ 6; `/submissions` empty state (`sm`).

**7. `silkworm`** — silkworm moth on a mulberry leaf. viewBox `400 × 500`. 9 strokes + 4 dots.
1. leaf `M110 400 C 90 320 120 220 190 170 C 230 150 290 160 310 200 C 340 260 320 360 260 400 C 220 426 150 426 110 400`
2. midrib `M120 396 C 170 330 230 260 300 206`
3. lateral veins (one path, three short curves off 2)
4. moth body `M200 240 C 196 262 196 290 200 312`
5. left forewing `M200 250 C 150 230 130 270 160 300 C 180 316 196 300 200 290`
6. right forewing (mirror of 5 about x = 200)
7. hindwings (one path, two small arcs)
8–9. feathered antennae (each one stroke with 5 ticks)
Dots: wing spots r 5, four.
Where: Issue plate n ≡ 7; `/notifications` empty state (`sm`).

**8. `cotton`** — open cotton boll. viewBox `400 × 500`. 8 strokes + 5 dots.
1. stem `M200 470 C 204 420 198 380 202 340`
2–4. three jagged bracts meeting at `(200,340)`
5–6. boll: four lobes as cloud arcs around `(200,250)`, radius ≈ 90 (two paths)
7. interior creases (one path)
8. palmate leaf, lower right
Dots: seeds r 6, five, at lobe centres.
Where: Issue plate n ≡ 8; footer call row (`md`, door tone); /submit dropzone (`xs`).

**9. `mark`** — the logo: three nested contour rings of a summit seen from above, offset up-right. viewBox `48 × 48`. 3 strokes + 1 dot.
1. outer `M6 30 C 6 16 18 7 30 8 C 40 9 44 18 42 28 C 40 38 30 43 20 42 C 11 41 6 37 6 30 Z`
2. middle `M14 28 C 14 19 22 13 30 14 C 37 15 39 22 37 28 C 35 34 28 37 22 36 C 17 35 14 32 14 28 Z`
3. inner `M22 25 C 22 21 26 18 30 19 C 33 20 34 23 33 26 C 32 29 28 30 25 29 C 23 28 22 27 22 25 Z`
Dot: summit `(29,23,1.8)`, fill `--color-accent-mark` always (not `--dot`).
Where: header logo (`mark-24`), footer (`mark-32`, door tone), login card, editors' statement on home (`mark-96`), favicon, apple-icon, OG image.
Motion: draws on first load only (header, 0.9 s, outer → middle → inner, dot pops at end); hover on the wordmark: summit dot scales 1 → 1.35, 200 ms.

**10. `ridge`** — the home horizon: two summits' contours, a shared saddle contour, foothills, and a river leaving the valley and splitting twice. viewBox `1200 × 280`. 9 strokes + 5 dots.
1. left summit ring `M330 108 C 338 92 376 88 392 100 C 404 112 384 126 360 126 C 340 126 324 120 330 108 Z`
2. left ring 2 `M292 112 C 300 74 372 62 420 84 C 452 100 440 140 396 150 C 346 160 286 146 292 112 Z`
3. right summit ring `M800 84 C 812 68 852 66 862 82 C 870 96 848 106 828 104 C 808 102 794 96 800 84 Z`
4. right ring 2 `M752 92 C 764 52 856 40 900 70 C 930 92 912 128 862 134 C 806 140 744 124 752 92 Z`
5. saddle contour `M220 128 C 236 60 372 30 480 70 C 560 98 620 92 690 62 C 780 24 960 34 980 92 C 994 140 900 176 800 172 C 700 168 640 150 560 160 C 460 174 380 196 300 184 C 236 174 212 156 220 128 Z`
6. foothills (open, edge to edge) `M40 214 C 140 190 220 222 320 214 C 440 204 520 186 620 196 C 720 206 800 190 900 182 C 1000 174 1080 196 1160 188`
7. river `M600 162 C 606 190 580 206 596 226 C 612 246 676 240 720 252`
8. branch south `M720 252 C 780 266 860 258 940 270`
9. branch east `M720 252 C 760 238 820 236 880 226 C 940 216 1000 222 1060 214`
Dots (settlements, r 4): `(596,226) (720,252) (880,226) (940,270) (1060,214)`.
Order: 1 → 3 → 2 → 4 → 5 → 6 → 7 → 8 → 9 (summits first), then dots.
Where: home hero only. `preserveAspectRatio="xMidYMid slice"`; height 280px ≥ 1024, 220px 768–1023, 150px < 768.
Motion: load draw 1.6 s total (per-stroke 1.1 s, 60 ms stagger, starts 200 ms after first paint); scroll parallax `translateY(0 → −40px)` over the first 100vh.

**11. `sextant`** — Ulugh Beg's meridian arc. viewBox `400 × 500`. 7 strokes + 1 dot.
1. great arc (cubic approximation of `M60 420 A 300 300 0 0 1 340 160`)
2. inner arc, parallel at −18u
3. graduations: one path of 11 ticks between 1 and 2
4–5. two rails `M60 420 C 60 440 60 460 62 480` and mirror at the arc's top end
6. sight line `M340 160 C 300 240 240 320 180 380`
7. star: 6 short rays at `(352,120)`
Dot: observer `(180,380,6)`.
Where: `error.tsx` (`lg`, muted); About step 2 on mobile (`sm`).

**12. `rivers`** — Amu Darya and Syr Darya running to the Aral shoreline. viewBox `1200 × 400`. 7 strokes + 0 dots.
1. low peaks at the origin `M40 360 C 70 330 90 300 110 330 C 130 300 160 270 190 320 C 210 300 230 290 250 330`
2. Amu Darya `M80 380 C 300 340 420 300 560 260 C 700 220 760 180 780 120`
3. Syr Darya `M240 390 C 500 360 700 300 860 240 C 960 200 1000 160 1000 110`
4. tributary into 2 `M300 396 C 340 360 380 340 430 320`
5. 1960 shoreline `M700 110 C 760 90 900 80 1060 96 C 1100 100 1130 120 1150 140`
6. North lagoon `M790 120 C 820 104 860 108 870 124 C 860 140 820 142 800 134`
7. South lagoon `M900 150 C 940 130 1000 136 1010 160 C 1000 186 940 190 914 176`
Where: /about coverage band, full container width (`hero`-like sizing: stroke 1.75u in the 1200 box, 2.8u < 768).
Motion: view draw, left → right, 1.6 s total.

**13. `compass`** — compass rose after the astrolabe. viewBox `400 × 400`. 6 strokes + 1 dot.
1. outer circle r 160 at `(200,200)` (jittered, open by 6°)
2. inner circle r 120
3. N–S needle as a thin diamond
4. E–W needle as a thin diamond
5. four intercardinal ticks (one path)
6. a hand-drawn "N" above the north tip
Dot: pivot `(200,200,7)`.
Group strokes 3–6 + dot in `<g data-needle>` with `transform-box: view-box; transform-origin: 200px 200px`.
Where: 404 pages (`lg`).
Motion: draw-on 1.1 s, then the needle group rotates `−24deg → 0` over 900 ms `ease-out-quart` (the only rotation on the site).

**Usage map**

| Drawing | Plate | Elsewhere |
|---|---|---|
| tulip | n ≡ 1 (Issue 1) | About sticky sequence; ⌘K empty |
| pomegranate | n ≡ 2 (Issue 2) | — |
| saiga | n ≡ 3 | /papers no results |
| melon | n ≡ 4 | — |
| leopard | n ≡ 5 | — |
| apple | n ≡ 6 | /submissions empty |
| silkworm | n ≡ 7 | /notifications empty |
| cotton | n ≡ 8 | footer call row; /submit dropzone |
| mark | — | logo, favicon, OG, login card, home statement |
| ridge | — | home hero |
| sextant | — | error page |
| rivers | — | /about coverage |
| compass | — | 404 pages |

The door panel on the paper page carries the paper's own issue drawing (`md`, door tone). Never more than one drawing larger than `sm` per viewport.

### 5.5 How drawings animate (contract)

Three states on the `<svg>` wrapper, applied only by `<Drawing>` / the shared `useReveal` hook:

| `data-draw` | Strokes | Dots | Set when |
|---|---|---|---|
| absent (SSR default) | drawn (`stroke-dashoffset: 0`) | visible | always on the server; always under reduced motion; always if above the fold at hydration |
| `pending` | hidden (`stroke-dashoffset: 1`), **no transition** | `opacity: 0` | after hydration, only if the element is entirely below the viewport |
| `in` | transition to 0: `var(--dur-draw)` `var(--ease-draw)`, delay `calc(var(--draw-delay) + var(--i) * var(--stagger-path))` | opacity 1 after the last stroke, 300 ms | on first intersection (`rootMargin: 0px 0px -10% 0px`, threshold 0) |

- **Load mode** (`draw="load"`: Mark in header, home ridge, home band plate if above the fold): pure CSS `@keyframes draw { from { stroke-dashoffset: 1 } }` with `animation-fill-mode: both`, no hydration dependency.
- **View mode** (`draw="view"`, default): the table above.
- **Scroll mode** (`draw="scroll"`, About tulip only): strokes with `data-stage="N"` are bound to `--step-N` view timelines (§8.16). Fallback without `animation-timeline`: behaves as view mode (all stages draw together once).
- **Hover re-ink** (plates; `(hover: hover) and (pointer: fine)` and `no-preference` only): on `:hover` / `:focus-visible` of the plate link, strokes run `@keyframes reink { from { stroke-dashoffset: .15 } to { stroke-dashoffset: 0 } }` 600 ms `ease-out-quart`, staggered 40 ms; dots → `accent-mark`.
- **Parallax** (ridge only): `animation: ridge-drift linear both; animation-timeline: scroll(root); animation-range: 0 100vh;` `translateY(0 → -40px)` on the `<svg>`.
- Every path carries `pathLength="1"`, so no JS measures anything.
- `Reveal` uses the same three-state contract on `data-reveal` (absent → `pending` without transition → `in` with the gesture's transition); `WordRise mode="view"` renders inside a `Reveal gesture="none"` and its word spans respond to that wrapper's state.
- Drawings never redraw on theme change.

---

## 6. Motion system

### 6.1 Tokens

```css
--dur-1: 100ms;   /* colour, text-decoration */
--dur-2: 200ms;   /* hover fills, rings, arrows, dots */
--dur-3: 300ms;   /* state: segmented thumb, plate scale, theme icon, dialog */
--dur-4: 500ms;   /* block opacity */
--dur-5: 800ms;   /* rise (transform), word rise */
--dur-draw: 1100ms; /* one stroke; a whole drawing ≤ 2.2s */

--ease-out-quart:  cubic-bezier(.165,.84,.44,1);   /* default out (Claude) */
--ease-out-cubic:  cubic-bezier(.215,.61,.355,1);  /* cards, panels, settle */
--ease-out-power2: cubic-bezier(.25,1,.5,1);       /* block rise, nav slide */
--ease-rise:       cubic-bezier(.16,1,.3,1);       /* word rise (Anthropic) */
--ease-draw:       cubic-bezier(.22,1,.36,1);      /* line draw */
--ease-in-out:     cubic-bezier(.645,.045,.355,1); /* sheet clip, rule draw, things moving on screen */
--ease-apple:      cubic-bezier(.4,0,.25,1);       /* plate/row hover (Apple) */
--ease-material:   cubic-bezier(.4,0,.2,1);        /* segmented thumb */

--stagger-word: 34ms;  --stagger-path: 80ms;  --stagger-row: 52ms (cap 8 rows);  --stagger-plate: 120ms;
--rise: 16px;  --rise-word: .42em;  --rise-plate: 30px;  --rise-row: 9px;
```

Caps: nothing loops, nothing bounces (no overshoot curves), no single transition over 1.2 s, no whole sequence over 2.2 s except the scroll-bound About tulip (which is scroll-linked, not timed).

### 6.2 The five gestures (the only entrance motions allowed)

| Gesture | Component / class | Properties | Spec |
|---|---|---|---|
| **Words rise** | `<WordRise>` | per word `translateY(.42em → 0)`, `opacity 0 → 1`, `filter: blur(4px → 0)` (blur only on the home display headline) | 800 ms `ease-rise`, 34 ms stagger; load mode on the home headline, view mode on the editors' statement. Not on paper titles (they carry). |
| **Lines draw** | `<Drawing>`, `.rule-draw` | `stroke-dashoffset` | §5.5. The 80 px rule: two half-paths from the centre outward, 850 ms `ease-in-out`, 300 ms after its title |
| **Blocks rise** | `<Reveal gesture="rise">` | `opacity` 500 ms + `translateY(16px → 0)` 800 ms `ease-out-power2` | one Reveal per section, never per paragraph |
| **Rows unroll** | `<Reveal gesture="rows">` on a list; rows carry `--i` | `opacity` 450 ms + `translateY(9px → 0)` 600 ms `ease-out-power2` | delay `min(i, 8) × 52ms` |
| **Plates settle** | `<Reveal gesture="settle">` or plate `draw` | `opacity`, `translateY(30px → 0)`, `scale(.985 → 1)` | 700 ms `ease-out-cubic`, 120 ms stagger; the drawing starts drawing 200 ms after the plate settles |

Plus: **one scroll-bound drawing** (About), **carries** (title, plate), **theme flip**, and chrome micro-motion (§6.3). Nothing else may move.

### 6.3 Inventory per page

Legend — L: first paint (CSS only), V: on scroll-in (below-fold only, post-hydration), S: scroll-linked (CSS timeline, guarded), H: hover (hover-capable, fine pointer), R: route/state.

| Page | Element | Trigger | Property | Duration / easing / delay |
|---|---|---|---|---|
| all | header logo Mark | L, first page of a browser session only: the existing pre-paint script in `layout.tsx` also sets `html[data-first-visit]` when `sessionStorage.carVisited` is absent, then sets the flag; CSS `html[data-first-visit] .mark-draw [data-s]` runs the draw (inside `no-preference`), so there is no post-hydration flash | stroke draw | 900 ms `ease-draw`, 120 ms stagger |
| all | header background + hairline | S `scroll(root)` range 0–48px | `background-color` page → page 86%, `border-bottom-color` transparent → `rule-2` (the `backdrop-filter: saturate(180%) blur(16px)` is constant, never animated) | scroll-linked; fallback and reduced motion: solid page bg, hairline always on |
| all | nav pill | H | `background-color` | 150 ms `ease-out-quart` |
| all | buttons | H / `:active` | ring `box-shadow`; `scale(.97)` | 200 ms / 160 ms |
| all | mobile sheet | R open / close | `clip-path: inset(0 0 100% 0) → inset(0)`; items `translateY(20px) → 0` + opacity | 600 ms in / 400 ms out `ease-in-out`; items 400 ms `ease-out-power2`, delay 200 + i·60 ms |
| all | theme toggle icon | R click | `rotate(90deg)` + cross-fade | 300 ms `ease-out-cubic` |
| all | theme flip | R click | View Transition typed `theme`: old root fades out 200 ms, new fades in 340 ms | `ease-out-quart`; reduced motion: instant |
| all | ⌘K dialog | R open / close | panel `translateY(8px) scale(.98) → none` + opacity (`@starting-style`, `allow-discrete`); scrim opacity | 250 ms `ease-out-cubic` / close 180 ms |
| all | ⌘K rows | typing | highlight `background-color` | 100 ms |
| all | footer call drawing (`cotton`) | V | draw | 1.1 s |
| / | eyebrow, headline words, lede, buttons | L | words rise; lede and buttons rise 16 px | headline 0 ms; lede 300 ms; buttons 380 ms |
| / | ridge | L + S | draw (200 ms delay, 1.6 s) + parallax −40 px over 100vh | §5.4 #10 |
| / | issue band: plate | V (or L if above fold) | settle, then draw | 700 ms, drawing +200 ms |
| / | issue band: rows | V | rows unroll | 52 ms stagger |
| / | row | H | `background-color` → surface-1 (radius 12, bleeds 16px each side); arrow `opacity 0 → 1` + `translateX(-4px → 0)` | 200 ms `ease-apple` |
| / | plate | H | `scale(1.016)` + re-ink + dots → accent-mark | 300 ms / 600 ms / 200 ms |
| / | Mark above statement | V | draw | 900 ms |
| / | editors' statement | V | words rise (no blur) | 800 ms, 20 ms stagger |
| / → /p | row title | R navigation | `TitleCarry` morph | 320 ms `ease-in-out` |
| / → /issues | band plate | R navigation | `PlateCarry` morph | 420 ms `ease-in-out` |
| /papers | h1, search, segmented | L | h1 words rise (no blur); controls rise 16 px at 200 ms | 800 ms |
| /papers | year groups | V | year numeral rises; rows unroll | as gestures |
| /papers | row | H (xl only for snippet) | bg + arrow as home; reserved snippet column `opacity 0 → 1` | 200 ms; snippet 200 ms, 60 ms delay |
| /papers | segmented thumb | R `?year=` change | `transform: translateX`, `width` on one thumb element | 300 ms `ease-material` |
| /issues | h1 | L | rise | 800 ms |
| /issues | each spread: plate | V | settle + draw | 700 ms + 1.1 s |
| /issues | each spread: rows | V | unroll | 52 ms |
| /issues | plate | H | scale + re-ink | as home |
| /issues | plate (lg) | scroll | `position: sticky; top: calc(var(--header-h) + 32px)` within its spread | native |
| /p/[slug] | eyebrow, title | R carry (from a row) / L fade 300 ms on cold load | carry; no word rise | 320 ms |
| /p/[slug] | authors, meta line | L | rise 16 px | 300 / 360 ms |
| /p/[slug] | drawn rule | L | draw from centre | 850 ms, 300 ms delay |
| /p/[slug] | running head | IO sentinel after the header block | `translateY(-100%) → 0` + opacity | 230 ms `ease-out-cubic` |
| /p/[slug] | running head progress contour | S `scroll(root)` | wavy path `stroke-dashoffset 1 → 0` | scroll-linked; fallback hidden |
| /p/[slug] | abstract | V | rise as one block | 500/800 ms |
| /p/[slug] | door panel | V | rise; its drawing draws | + 200 ms |
| /p/[slug] | cite block, "Also in", prev/next | V | rise; rows unroll | — |
| /p/[slug] | copy buttons | click | label swap `opacity` + `translateY(2px → 0)` | 180 ms; "Copied" held 1.6 s |
| /p/[slug] | BibTeX `<details>` | click | `grid-template-rows 0fr → 1fr` on its own fixed-space container | 400 ms `ease-out-quart` |
| /about | h1, lede, rule | L | rise / draw | as paper header |
| /about | sticky sequence | S `view()` per step | tulip stage N strokes `stroke-dashoffset 1 → 0`, `animation-range: entry 0% cover 40%` | scroll-linked; fallback: view draw |
| /about | steps | V | rise | 800 ms |
| /about | rivers | V | draw left → right | 1.6 s |
| /about | coverage names | V | rows unroll | 52 ms |
| /login | card | L | settle | 700 ms |
| /login | Mark in card | L | draw | 900 ms, 200 ms delay |
| /submit | h1, form card | L / V | rise | — |
| /submit | dropzone | dragover | `border-color`, `background-color` | 150 ms |
| /submit, admin | pending buttons | submit | label swap only | instant |
| /submissions, /notifications | rows | V | unroll | — |
| /notifications | mark-all-read / open | R | server re-render; unread dot disappears | none |
| /admin/** | — | — | **no entrance motion, no drawings, no Reveal** (product register); only hover fills and the segmented thumb | — |
| 404 | compass | L | draw 1.1 s, then needle settles | +900 ms |
| error | sextant | L | draw | 1.1 s |

### 6.4 Page transitions (View Transitions via React)

- `next.config.ts` keeps `experimental.viewTransition: true` (docs: `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`).
- `TitleCarry` (existing, unchanged API): `<ViewTransition name={`paper-${slug}`} share="paper-title" default="none">` around **block** title elements in rows and the paper `h1`.
- `PlateCarry` (new): `<ViewTransition name={`plate-${number}`} share="plate" default="none">` around exactly **one** plate element per page: the home band plate, each `/issues` spread plate (different numbers), and the paper page's eyebrow chip. Plate chips in `/papers` rows and ⌘K never carry.
- CSS: `::view-transition-group(.paper-title) { animation-duration: 320ms; animation-timing-function: var(--ease-in-out) }`, `::view-transition-group(.plate) { animation-duration: 420ms; … }`; root route transitions are cuts (`::view-transition-old(root), ::view-transition-new(root) { animation: none }` when not typed `theme`).
- Theme: `ThemeToggle` keeps today's typed `document.startViewTransition({ update, types: ["theme"] })` with fallback; CSS `:root:active-view-transition-type(theme)::view-transition-old(root) { animation: 200ms var(--ease-out-quart) both fade-out }` / `new(root) 340ms fade-in`.

### 6.5 Reduced motion (explicit, in `globals.css`)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important;
                           transition-duration: .01ms !important; scroll-behavior: auto !important; }
  [data-draw] [data-s], [data-draw-mode] [data-s], .mark-draw [data-s] { stroke-dashoffset: 0 !important; animation: none !important; }
  [data-draw] [data-d] { opacity: 1 !important; }
  [data-reveal], .word-rise > span { opacity: 1 !important; transform: none !important; filter: none !important; }
  .ridge, .site-header, .sticky-seq [data-s] { animation: none !important; } /* scroll timelines: duration-zeroing does not neutralise them */
  .progress-contour { display: none !important; }
  [data-needle] { transform: none !important; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
```

Plus: every scroll-timeline rule is written **inside** `@supports (animation-timeline: scroll()) { @media (prefers-reduced-motion: no-preference) { … } }`; every hover transform inside `@media (hover: hover) and (pointer: fine) { @media (prefers-reduced-motion: no-preference) { … } }`. `Reveal`, `Drawing`, `RunningHead`, `ThemeToggle` early-return on `matchMedia("(prefers-reduced-motion: reduce)")` so no `pending` state is ever set. Mobile sheet opens with opacity only. The site is identical in content with motion off.

### 6.6 Performance budget

- Animated properties: `transform`, `opacity`, `stroke-dashoffset`, `clip-path`, `background-color`, `border-color`, `box-shadow` (button ring only), `filter: blur` (home headline words only, ≤ 9 words), `grid-template-rows` (BibTeX accordion only, inside a container whose outer box does not move other content when closed). No `height`, `width`, `top`, `margin` animation; the segmented thumb animates `width` on one absolutely positioned element.
- **CLS 0**: plates have `aspect-ratio`; drawings have viewBox + explicit `aspect-ratio`; fonts via next/font with size-adjusted fallbacks; entrances start from the final layout box; hover never changes layout (row hover background is a pseudo-element; snippet column is reserved).
- **SSR-visible**: every text and every drawing is complete in the HTML; motion only subtracts after hydration and only below the fold (today's `Reveal` contract).
- No motion libraries; no scroll listeners (IntersectionObserver + CSS timelines only). Client JS added for motion ≤ 6 KB gzipped (`useReveal`, `Reveal`, `Drawing` view hook, `RunningHead`, `MobileSheet`, `Segmented` thumb, Mark session flag).
- `will-change` only on the mobile sheet while open.
- No image requests on `/` (LCP = the hero headline text). Inline SVG ≤ 30 KB per page. Fonts: 3 preloads (latin of each family).
- `content-visibility: auto; contain-intrinsic-size: auto 600px` on below-fold year groups (`/papers`), issue spreads beyond the first (`/issues`) and admin tables.
- Targets: Lighthouse mobile Performance ≥ 95 on `/` and `/p/[slug]`; Accessibility 100 on all public routes.

---

## 7. Layout

### 7.1 Tokens

| Token | Value |
|---|---|
| `--container` | `75rem` (1200px) content max |
| `--list` | `56rem` (896px) list column (/papers, /submissions, /notifications) |
| `--narrow` | `42rem` (672px) reading measure: 19px Source Serif 4 ≈ 70 characters |
| `--form` | `35rem` (560px) forms, login card max `30rem` (480px) |
| `--gutter` | `clamp(1rem, -0.1143rem + 4.5714vw, 4rem)` → 16px at 390, 64px at 1440 |
| `--section` | `clamp(4rem, 2.5143rem + 6.0952vw, 8rem)` → 64 → 128 between ideas |
| `--page-top` | `clamp(3rem, 1.8857rem + 4.5714vw, 6rem)` → 48 → 96 under the header |
| `--header-h` | 72px (≥ 1024) / 64px |
| Heading → component | 48px (64px ≥ 1024) |
| Inside cards | 24 / 32px |
| Spacing scale | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160 (Tailwind spacing 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 40) |
| Grid | 12 columns, gap 24px (32px ≥ 1024); mobile 4 columns, gap 16px |
| Breakpoints | Tailwind defaults `sm 640 · md 768 · lg 1024 · xl 1280`; layout switches at `lg`; stroke/radius switches at `md` |

### 7.2 Bands

- **Page**: cream, the default.
- **Inset band** (Anthropic): `surface-1`, `margin-inline: clamp(.75rem, 1.6vw, 1.5rem)`, radius lg, inner padding `--section` block / container inline. At most one per page.
- **Footer**: full-bleed `footer`, radius 0, top padding 96px (64 mobile), bottom 48px.

### 7.3 Section rhythm per page

| Page | Bands |
|---|---|
| `/` | page (hero) → inset band (current issue) → page (statement) → footer |
| `/papers`, `/issues`, `/privacy`, working pages | page only → footer |
| `/p/[slug]` | page; one door panel (card, not band) → footer |
| `/about` | page (header, sticky sequence) → inset band (coverage) → page (contributors / readers) → footer |
| `/login` | page only (card) → footer without call row |

Never two adjacent bands. No dark band mid-page anywhere.

### 7.4 Dark is a door

On light pages `#141413` appears only on: primary buttons, the door panel (`/p/[slug]`), the footer. The call for submissions lives in the footer's first row, so the only dark surface before the footer on any page is the paper page's door panel.

### 7.5 Mobile (390) rules

One column; 16px gutters; no horizontal page scroll (the segmented control scrolls inside its own track with `scroll-snap`); tap targets ≥ 44px; plates become 3:2 tiles ≤ 240px tall; headings use the clamp minimums; buttons side by side at md size when two fit, stacked full width otherwise; tables become stacked rows.

---

## 8. Components

(TS prop contracts are in §12 (a). This section is anatomy.)

### 8.1 Header — `SiteHeader` (server) + `NavLinks`, `CatalogueTrigger`, `ThemeToggle`, `NotificationBell`, `ProfileMenu`, `MobileSheet` (clients)

Desktop (≥ lg), 72px, `position: sticky; top: 0; z-index: 40`, background `page`, hairline `rule-2` driven by the scroll timeline (§6.3):

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ◎ Central Asian Review        Papers  Issues  About  Submit        (⌕ Search ⌘K) ◐ 🔔 (S) │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- Left: `Mark` 24px + "Central Asian Review" Source Serif 4 500 20px/1, `ink`, gap 10px; link to `/`. Hover: summit dot grows (§5.4 #9).
- Centre: nav pills (§4.5), gap 4px, absolutely centred in the bar on ≥ lg. Active rule unchanged from today's `NavLinks` (Papers also owns `/p/*`).
- Right, gap 8px: search pill 32px (magnifier 16 + "Search" 14px `ink-3` + `kbd ⌘K`; icon-only 32px circle < xl); theme icon button; bell icon button (7px `accent-mark` dot at top-right when unread > 0, count in `aria-label`, e.g. "Notifications, 2 unread"); profile 32px circle `surface-2` with the initial in Inter 500 14px → menu (overlay card, radius md, `shadow-float`, 240px, rows 40px 15px: name + email ui-sm ink-3 header, My submissions, Notifications, Editor's desk (ADMIN only), hairline, Sign out). Signed out: "Sign in" secondary sm pill instead of bell + profile.

Mobile (< lg), 64px: `◎ Central Asian Review` (wordmark 18px; < 360px hide the wordmark text, keep the Mark) · search icon (opens ⌘K) · menu icon (two 1.5px lines → ×, 240 ms).
Sheet: full-screen `page`, `clip-path` reveal; links Source Serif 4 400 32px, 56px rows (Papers, Issues, About, Submit); hairline; a row of icon buttons (theme, bell, profile / Sign in); close button top-right 44px; body scroll locked; `Esc` closes; focus trapped; returns focus to the menu button.

### 8.2 Footer — `SiteFooter` (server) + `FooterCall` (client, route-gated)

Full-bleed `footer` band, text `door-ink`.

```
████████████████████████████████████████████████████████████████████████████████████████
█  Call for submissions                                                ≈ cotton (md)   █   ← FooterCall, h2 cream
█  Finished papers, read year-round. No fee at any stage.                              █   ← body door-ink-2
█  [ Submit a paper ]   For contributors →                                             █   ← on-door lg · link
█  ─────────────────────────────────────────────────────────────────────────────────  █   ← door-rule
█  ◎ Central Asian Review               READ            CONTRIBUTE        REVIEW        █   ← meta labels door-ink-3
█  An independent review of             Papers          Submit a paper    About         █   ← 15px door-ink-2, 32px rows
█  scholarship on Central Asia,         Issues          For contributors  Privacy       █
█  published by Freshman Academy.       Atom feed       Sign in                         █
█  ─────────────────────────────────────────────────────────────────────────────────  █
█  © 2026 Freshman Academy      Қазақстан · Кыргызстан · Тоҷикистон · Türkmenistan · Oʻzbekiston █  ← micro · Serif 15 door-ink-3, lang each
████████████████████████████████████████████████████████████████████████████████████████
```

- `FooterCall` renders on `/`, `/papers`, `/issues`, `/about`, `/p/*`, `/privacy`, 404; returns `null` on `/submit`, `/submissions`, `/notifications`, `/login`, `/admin*` (`usePathname`).
- Links hover: `door-ink`, underline. Focus outline cream.
- Mobile: call row stacks (drawing hidden < md); columns become two (Read + Contribute), Review below; native names wrap under the ©.

### 8.3 Buttons, links, chips, kbd

§4.5. `Button` renders `<a>` (via `next/link`) when `href` is set.

### 8.4 Cards

§4.3. `Card kind="filled" | "bordered"`.

### 8.5 Inputs

`Field` = label (Inter 500 14px `ink-2`, 8px above) + control + hint (14px `ink-3`, 6px below) + error (14px `bad`, `role="alert"` inline). `aria-describedby` wired by `Field`. `Input`, `Textarea` (`counter` prop shows `312 / 2,000` mono 12 right), `FileDrop` (client: shows chosen file name + size as a chip; keeps the native `<input type="file" name accept required>` inside for the server action), `SearchField` (GET form, `role="search"`).

### 8.6 Segmented control — `Segmented`

Track `surface-2`, `rounded-full`, padding 4px, height 40px; items are `<Link>`s 32px tall, 14px Inter 500, `ink-3`, active `ink`; one absolutely positioned thumb (`overlay` fill, `rounded-full`, `0 1px 2px rgb(20 20 19 / .08)`) measured to the active item and transitioned (300 ms `ease-material`). No-JS: the active link itself has the `overlay` fill. Counts render as 12px `ink-3` after the label (admin). < sm: the track scrolls horizontally (`overflow-x: auto; scroll-snap-type: x mandatory`) inside its own box.

### 8.7 Status mark — `StatusMark`

8px filled dot + label 14px Inter 500, both in the status colour; no pill, no border. Labels from `STATUS_LABEL` (`Draft`, `Under review`, `Published`, `Needs revision`) plus email statuses (`Sent`, `Skipped`, `Failed`). In dense admin tables on mobile the label stays (never dot-only).

### 8.8 Tabs

Admin tabs = `Segmented` with hrefs and counts (`Overview · Review queue 2 · All papers · Readers · Email log`, labels and order unchanged).

### 8.9 Paper row — `PaperRow`

```
 Water Allocation on the Syr Darya After 2020                │ (xl, on hover) Upstream storage   │  25 JUN 2026  →
 D. Abdullaev, M. Sultanova                                   │ decisions and downstream demand…  │  [2]
──────────────────────────────────────────────────────────────────────────────────────────────────────────
```

- Grid: `minmax(0,1fr) auto` (< xl) / `minmax(0,1fr) 18rem auto` (xl, when `snippet`), column gap 32px.
- Title: `h3` element in `text-h4` (/papers, ⌘K-like dense lists) or `text-h3` (home band, /issues), Source Serif 4 500, `ink`, wrapped in `TitleCarry`; it holds the row link with `::after { inset: 0 }`.
- Second line: authors Inter 15/400 `ink-3`, 4px below.
- Meta (right, top-aligned): date `meta` (`25 JUN 2026`, from `formatDate` → upper-cased short form via a `formatShortDate` helper with `timeZone: "Asia/Tashkent"`), optional plate chip below it (`/papers` only). < sm: meta moves under the authors as `25 JUN 2026 · [2]`.
- Snippet (`/papers`, xl only): `firstSentence(abstract, 140)` in Serif 400 15px/1.5 `ink-2`, 2-line clamp, **always in the DOM**, `opacity: 0` at rest, `1` on row `:hover` / `:focus-within` (hover-capable devices only; on others it stays hidden and `aria-hidden` is not used — it is real text for crawlers).
- Rows: padding 24px 0 (20px mobile); 1px `rule-2` between rows (not after the last).
- Hover: a `::before` pseudo-element behind the row (`inset: 0 -16px`, radius sm, `surface-1`) fades in, 16px arrow fades in at the far right. No layout change, ever.
- No glyph, no thumbnail, no numbering.

### 8.10 Issue plate — `IssuePlate`

```
┌────────────────────────────┐   hero / spread: aspect 4/5, radius lg, padding 24, bg --plate
│ SUMMER 2026        4 PAPERS│   meta, --plate-ink (current quarter: "● SUMMER 2026", accent-mark dot)
│                            │
│          ≈≈≈≈≈≈            │   Drawing size "plate", tone "plate", 72% of plate width, centred,
│        ≈ pomegranate ≈     │   occupying the middle ~62% of the height
│          ≈≈≈≈≈≈            │
│                            │
│ 2                          │   numeral, Source Serif 4 300, --plate-ink, line-height .9
└────────────────────────────┘
```

- Variants: `hero` (home band; 4:5, max-width 400px ≥ lg; **3:2 tile ≤ 240px tall < md** with the drawing height-fitted at the right and the numeral at the left), `spread` (/issues; 4:5, max 440px; same 3:2 tile < md), `chip` (20 × 26, numeral only, §4.5).
- The plate is an `<a>` when `href` is set (home → `/issues#no-N`; /issues → none, it is the heading's companion), `aria-label="Issue N, Summer 2026, 4 papers"`; inner text `aria-hidden`.
- Numeral text is the issue number without "№" (the eyebrow and label carry "№").
- `carry` wraps it in `PlateCarry`. Hover §4.3.

### 8.11 Gated-download door — `DoorPanel`

```
┌─────────────────────────────────────────────────────────────────────┐  door, radius md, padding 32 (40 ≥ md)
│ Read the full paper                                     ≈ issue     │  h3 Serif 500 door-ink
│ Papers are free to registered readers.                  drawing     │  body door-ink-2 (≤ 16 words)
│ A Google sign-in creates an account.                    (md, door)  │
│ [ Sign in to download ]   Why an account? →                         │  on-door lg · link (door-ink-2)
└─────────────────────────────────────────────────────────────────────┘
```

Signed in: title "The full paper", line "PDF · 1.2 MB", action "Download the PDF" (`/api/papers/{id}/file`, Phosphor `DownloadSimple` 18px). Signed out: as drawn; button → `/login?next=/p/{slug}`; link → `/about#readers`. The element keeps `id="the-full-paper"`, `className` includes `gated-download` (JSON-LD `cssSelector`), `scroll-margin-top: calc(var(--header-h) + 64px)`. Drawing hidden < md. Dark mode: `#262624` + 1px `#3d3d3a` ring (§10).

### 8.12 Citation block — `CiteBlock`

Filled card (`surface-1`, radius md, padding 24/32): `meta` label "CITE" · citation in Serif 400 17px/1.55 `ink-2` (the existing citation string) · row of two secondary sm pills "Copy citation", "Copy BibTeX" (`CopyButton`; label → "Copied" for 1.6 s, `aria-live="polite"`) · `<details>` "BibTeX" (summary 14px Inter 500 + chevron rotating 90°) containing `<pre>` mono 13px/1.6 on `surface-2`, radius sm, padding 16, `overflow-x: auto`.

### 8.13 Notices — `Notice`

Filled card radius sm, padding 12px 16px, `surface-1`; 8px dot in the tone colour + 15px text `ink-2`; optional ghost action at right. No coloured backgrounds. `role="status"` (info/good) or `role="alert"` (bad).

### 8.14 Empty states — `EmptyState`

Centred, max 26rem: drawing `sm` (view draw) → 24px → `h3` (≤ 6 words) → 8px → one line `body` `ink-3` (≤ 16 words) → 24px → one secondary md button. Max 25 words total.

### 8.15 ⌘K dialog — `CatalogueTrigger` (restyled; data flow, `/api/catalogue`, ⌘K / Ctrl-K / "/" shortcuts and arrow/enter behaviour unchanged)

Native `<dialog>`, panel `min(640px, 100vw − 32px)`, `overlay`, radius lg, `0.5px rule-2` border, `shadow-float`, `margin-top: 12vh` (8vh mobile). Input row 56px: magnifier 18 + borderless input Serif 400 20px placeholder "Search papers, authors, issues" + `kbd esc`. Results grouped under `meta` headers (`PAPERS · 4`, `ISSUES · 2`, `PAGES`); rows 48px, radius sm, padding 0 12px: leading 26px slot (issue rows: plate chip; paper rows: plate chip of the paper's issue via `plateFromLabel`; places: 16px Phosphor icon), title Inter 500 15px `ink`, meta 14px `ink-3` right; selected row `surface-1` + 16px arrow. Footer 36px `micro`: "↑↓ move · ↵ open · esc close". Empty query result: `tulip` `xs` + "Nothing matches" 14px. Scrim `scrim`.

### 8.16 Sticky sequence — `StickySequence` (About only)

Desktop ≥ lg: grid `5fr 7fr`, container `timeline-scope: --step-1, --step-2, --step-3`. Left column: `position: sticky; top: calc(var(--header-h) + 10vh)`; holds `tulip` at `xl` (360px wide, 450px tall), `draw="scroll"`. Right column: three steps, each `min-height: 70vh`, `display: grid; align-content: center`, carrying `view-timeline-name: --step-N` (`view-timeline-axis: block`): `meta` "01" · `h3` title · `body` line (≤ 16 words). Tulip strokes with `data-stage="N"`: `animation: draw linear both; animation-timeline: --step-N; animation-range: entry 0% cover 40%;`. Every step is ordinary visible, focusable content (no hidden beats). Fallback (no `animation-timeline`): tulip draws once in view mode. < lg: no sticky; the tulip (`md`) sits above step 01 and draws once in view; steps stack 48px apart.

### 8.17 Running head — `RunningHead` (paper page)

48px bar, `position: sticky; top: var(--header-h)`, background `page` 88% + `backdrop-filter: saturate(180%) blur(16px)`, `z-index: 30`. Hidden until the IO sentinel placed after the paper header leaves the viewport (`data-shown`). Contents (container width): plate chip (no carry) · title Serif 500 15px truncated · `meta` "№ 2 · SUMMER 2026" (≥ sm) · right: primary sm pill "Download" (signed in → file URL) or "Get the PDF" (→ `#the-full-paper`). Bottom edge: the **progress contour**: an SVG `viewBox="0 0 1200 6"`, `width: 100%; height: 6px; preserveAspectRatio="none"` (y-scale stays 1, so the 1.5px stroke keeps its thickness), one path with a gentle hand wobble `M0 3 C 100 1.5 200 4.5 300 3 C 400 1.5 500 4.5 600 3 C 700 1.5 800 4.5 900 3 C 1000 1.5 1100 4.5 1200 3`, stroke `ink` at 40%, `pathLength="1"`, `stroke-dashoffset 1 → 0` driven by `scroll(root)`. Base style `display: none`; shown only inside `@supports (animation-timeline: scroll())` + `no-preference` (so it is absent in unsupported browsers and under reduced motion). Print: hidden.

### 8.18 Headline stack — `HeadlineStack`

The Apple stack: eyebrow `meta` `ink-3` → 12px → title → 16px → lede (`text-lede`, `ink-2`, max 36ch centred / 42ch start) → 24px → actions (gap 12, wrap). `rule` adds the 80 × 6 drawn rule 24px under the title (centred stacks only). Centred stacks cap at 46rem; start-aligned at 42rem.

### 8.19 Mark — `Mark`

The `mark` drawing with fixed summit-dot colour; sizes 24 / 32 / 96; `draw: "load" | "session" | "view" | "none"` (`session` = adds class `mark-draw`, which only animates under `html[data-first-visit]`, i.e. the first page of a browser session; header use).

### 8.20 Skeletons — `Skeleton`

Static blocks in `surface-3`, radius xs, no shimmer; wrapper `opacity: 0; animation: 1ms 300ms forwards appear` so they never flash on fast loads (reduced motion: appear immediately at 300 ms).

### 8.21 Profile menu, notification bell, theme toggle

As §8.1. `ThemeToggle` keeps today's logic (system → dark → light cycle, localStorage, typed view transition) and icons (Phosphor `Desktop` / `Moon` / `Sun`, 18px regular).

---

## 9. Page by page

Legend: `─` hairline, `( )` pill/link, `[ ]` primary button, `≈` drawing, `▢` plate, `░` inset band, `█` dark. Desktop wireframes at 1440; numbers are px.

### 9.1 `/` Home

Order: header → hero (page) → current issue (inset band) → editors' statement (page) → footer (call row + footer).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ◎ Central Asian Review        Papers  Issues  About  Submit      (⌕ Search ⌘K) ◐ (Sign in) │ 72
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │ 96
│                              № 2 · SUMMER 2026                                         │ meta
│                   Research on Central Asia,                                            │ display 80, centred,
│                        read with care                                                  │ words rise (blur)
│        An independent, edited review of the region's politics,                        │ lede 23 ink-2
│                     economies and societies.                                           │
│                [ Read the issue ]   ( Submit a paper )                                 │ lg pills, gap 12
│                                                                                        │ 48
│  ≈≈≈≈≈ ridge contour map, 1200×280, draws on load, parallax −40px ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈  │ ≈ 551–831
│                                                                                        │ 64
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ inset band starts ≈ 895
│ ░   ┌───────────────────────┐        № 2 · 4 PAPERS                                   ░ │ meta
│ ░   │ ● SUMMER 2026 4 PAPERS│        Summer 2026                                      ░ │ h2 48
│ ░   │                       │                                                         ░ │ 48
│ ░   │     ≈ pomegranate ≈   │        Higher Education Reform and Graduate     24 JUL →░ │ h3 28 + meta
│ ░   │                       │        A. Karimova, J. Nazarov                          ░ │ ui ink-3
│ ░   │                       │        ─────────────────────────────────────────────    ░ │
│ ░   │ 2                     │        Urban Heat and Building Stock in Tashkent 16 JUL  ░ │
│ ░   └───────────────────────┘        S. Yusupova                                      ░ │
│ ░   plate hero 4:5, 400 wide          … (max 6 rows)                                  ░ │
│ ░   (link → /issues#no-2, carry)      ( All issues → )   ( All papers → )              ░ │ link buttons
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                                        │ 128
│                                         ◎                                              │ Mark 96, draws
│              An editor reads every submission in full. Accepted papers                │ statement 36, centred,
│               publish as they clear review and gather into quarterly issues.           │ 30ch, words rise
│                         FROM THE EDITORS ·  ( About the review → )                     │ meta + link
│                                                                                        │ 128
│ ████ footer: call for submissions row + footer (§8.2) ████████████████████████████████ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- Hero: `HeadlineStack align="center" size="display" rise="load"`; eyebrow is the current issue (`№ {n} · {LABEL}` upper-cased) linking to `/issues#no-n`. Primary "Read the issue" → `/issues#no-n`; secondary "Submit a paper" → `/submit`. Above-fold words: 25.
- Ridge: `Drawing name="ridge" size="hero" draw="load"`, decorative (`aria-hidden`), full container width, 280px tall.
- Band grid (lg): `5fr 7fr`, gap 64px, items start; plate `hero` variant, `carry`, `draw="view"` (or `load` if above the fold at hydration: handled by `Drawing`). Contents: `meta` "№ 2 · 4 PAPERS", `h2` label ("Summer 2026"), `Reveal gesture="rows"` list of `PaperRow` (h3 size, meta date, no chip, no snippet), max 6 newest; then two `link` buttons.
- Empty archive (no published paper): band shows `EmptyState(tulip, "The first issue is being edited", "Papers appear here as an editor accepts them.", Submit a paper)` instead of plate + rows.
- Statement: `Mark` 96 (`draw="view"`), `WordRise as="p"` in `text-statement`, `meta` attribution + link to `/about`.

Mobile (390 × 844): header 64 → page-top 48 → eyebrow → display 44px (3 lines) → lede 19px (3 lines) → buttons **md, side by side** ("Read the issue", "Submit a paper") → ridge 390 × 150 (slice) → 48px → inset band (margin 12, radius 24, padding 20): plate as a **3:2 tile, 326 × 217** → 24px → meta + h2 32 → rows (h3 22, date under authors), max 4 + "All papers →" → statement 26px. First plate visible at ≈ 0.9 viewport, first paper title ≈ 1.25 viewports.

Cut from today: the hero's second sentence ("Abstracts are open…" → the paper page door), the paper/issue tally, "Published quarterly", the lead-paper feature, "Recently published" heading, the Baburnama aside, the Song-Kul interlude, the Registan night surface and arch, `CoverLight`, `ClipReveal`, the editorial paragraph (→ one 19-word statement), the call-for-papers aside (→ footer call row), the coverage strip (→ footer native names and /about).

### 9.2 `/papers`

```
│   PAPERS · 6 PUBLISHED                                                                 │ meta
│   Papers                                                                               │ h1 64, start, words rise
│                                                                                        │ 32
│   [⌕  Search titles and authors                                      ⌘K ]              │ SearchField 48, max 560
│   ( All )( 2026 )( 2025 )                       ← only when the archive spans > 1 year │ Segmented
│                                                                                        │ 64
│   2026                                                        6 PAPERS                 │ h2 Serif 300 48 + meta
│   ──────────────────────────────────────────────────────────────────────────────────   │
│   Higher Education Reform and Graduate Outcomes   │ A decade of university  │ 24 JUL 2026 →│ PaperRow h4 size,
│   A. Karimova, J. Nazarov                          │ expansion has … (hover) │ [2]         │ snippet column xl
│   ──────────────────────────────────────────────────────────────────────────────────   │
│   Urban Heat and Building Stock in Tashkent                                 16 JUL 2026 │
│   S. Yusupova                                                                [2]        │
│   …                                                                                    │
```

- Container `--container`; list column max `--list` (snippet column extends to `--container` at xl).
- Search keeps the GET form, `?q=`; a search inside a year keeps `?year=` (hidden input, as today). Year control keeps `?year=` links and today's "only when > 1 year" rule. Result line for a search or year: `role="status"` 14px `ink-3` "3 papers match “water” · Clear" (Clear → `/papers`), replacing the year heads (flat list).
- Rows: `PaperRow` with `meta="date-issue"` (chip via `plateFromLabel(issue.number, issue.label)`), `snippet` true; `abstract` must be selected in the query; `firstSentence` server-side.
- Empty archive: `EmptyState(tulip, "Nothing published yet", "The first papers are with an editor.", Submit a paper)`. No search results: `EmptyState(saiga, "Nothing matches", "Try a shorter word, or an author's surname.", Clear search)`.
- Mobile: h1 40; search full width; segmented scrolls in its track; meta under authors; no snippet.
- Cut: page intro paragraph, thumbnails / pool images and their collision logic, `FilterChip`s, illuminated year frontispieces, "Browse by year" label.
- Motion: h1 words rise (L, no blur), controls rise, year groups V (numeral rise + rows unroll), row hover, thumb slide.

### 9.3 `/issues`

```
│   THE ARCHIVE · 2 ISSUES                                                               │ meta
│   Issues                                                                               │ h1 64
│   One issue per quarter, gathered from the papers that cleared review.                 │ lede (11 words)
│                                                                                        │ 96
│   ┌───────────────────────┐      № 2 · 4 PAPERS   ● THIS QUARTER                        │ section#no-2
│   │ ● SUMMER 2026 4 PAPERS│      Summer 2026                                            │ h2 48 (id no-2-title)
│   │                       │                                                             │ 48
│   │    ≈ pomegranate ≈    │      Higher Education Reform and Graduate Outcomes  24 JUL →│ PaperRow h3 size
│   │                       │      A. Karimova, J. Nazarov                                │
│   │ 2                     │      ───────────────────────────────────────────────        │
│   └───────────────────────┘      Urban Heat and Building Stock in Tashkent      16 JUL →│
│   plate spread 4:5, sticky       …all papers of the issue                               │
│                                                                                        │ --section (128)
│   ┌───────────────────────┐      № 1 · 2 PAPERS                                         │ section#no-1
│   │ SPRING 2026  2 PAPERS │      Spring 2026                                            │
│   │      ≈ tulip ≈        │      Water Allocation on the Syr Darya After 2020   25 JUN →│
│   │ 1                     │      Border Trade in the Ferghana Valley            14 JUN →│
│   └───────────────────────┘                                                             │
```

- One `<section id="no-N" aria-labelledby="no-N-title" style="scroll-margin-top: calc(var(--header-h) + 32px)">` per issue, newest first; grid lg `5fr 7fr`, gap 64. Plate `spread` variant, `carry` (each number once on the page), `draw="view"`, sticky on lg within its section. "THIS QUARTER" chip when `isCurrentQuarter`.
- Rows: all papers of the issue, `PaperRow` h3 size, date only.
- Empty archive: `EmptyState(tulip, "The first issue is being edited", "Issues gather each quarter's accepted papers.", Browse papers)`.
- Mobile: plate as 3:2 tile above meta + h2 (32) + rows; sections 64 apart; no sticky.
- Cut: the shelf, 3D volumes, spines, "N volumes" tally, the issue blurb, the dashed "next quarter" slot, the separate plate grid (no duplicated plates).
- Motion: h1 rise; per spread plate settle + draw, rows unroll; plate hover; plate carries to/from home and paper chip.

### 9.4 `/p/[slug]` Paper

```
│                       [2] № 2 · SUMMER 2026                                            │ chip (carry) + meta link → /issues#no-2
│              Water Allocation on the Syr Darya After 2020                              │ h1, text-title 56, centred, 24ch, TitleCarry
│                    D. Abdullaev · M. Sultanova                                         │ Inter 17/500 ink-2, AuthorLine links
│                              ──────                                                    │ 80px drawn rule
│        Published 25 June 2026 · PDF, 1.2 MB · Free with an account                     │ ui-sm 14 ink-3; last part links #the-full-paper
│                                                                                        │ 64
├── running head (after the header block leaves): [2] Water Allocation… № 2 · SUMMER 2026   (Download) ──┤
│   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ progress contour (scroll) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~  │
│                                                                                        │
│               ABSTRACT                                                                 │ meta, --narrow column
│               Upstream storage decisions and downstream irrigation demand              │ read 19/1.65 ink,
│               have diverged sharply since 2020. This paper reconstructs …              │ full abstract, one block
│               (complete abstract, contiguous)                                          │
│                                                                                        │ 48
│               ┌──────────────────────────────────────────────────────────┐             │ DoorPanel #the-full-paper
│               │ Read the full paper                            ≈ drawing  │             │ .gated-download
│               │ Papers are free to registered readers. A Google sign-in   │             │
│               │ creates an account.                                       │             │
│               │ [ Sign in to download ]  Why an account? →                │             │
│               └──────────────────────────────────────────────────────────┘             │
│                                                                                        │ 48
│               ┌ CITE ─────────────────────────────────────────────────────┐            │ CiteBlock
│               │ D. Abdullaev, M. Sultanova. “Water …” Central Asian Review, │           │
│               │ Issue № 2, Summer 2026. https://…                          │           │
│               │ ( Copy citation ) ( Copy BibTeX )   ▸ BibTeX               │           │
│               └────────────────────────────────────────────────────────────┘           │
│                                                                                        │ 64
│               ALSO IN № 2                                      ( The full issue → )    │ meta + link
│               Higher Education Reform and Graduate Outcomes                     →      │ PaperRow h4, max 3
│               ─────────────────────────────────────────────────────────────            │
│               …                                                                        │
│                                                                                        │ 64
│               NEWER PAPER ←                                        → OLDER PAPER       │ meta
│               Rail Freight Corridors…                    Border Trade in the Ferghana… │ h4 + authors 14
│ ████ footer ███████████████████████████████████████████████████████████████████████████ │
```

- Single centred column `--narrow`; no sidebar, no rail.
- Eyebrow: plate chip in `PlateCarry` (the page's one `plate-N`) + `meta` "№ 2 · SUMMER 2026" link. Title: `h1` element always; `text-title`, or `text-h2` when `title.length > 80`; no word rise (it carries). Authors: `AuthorLine` (names link to `/papers?q=Surname`, as today), Inter 17/500 `ink-2`. Rule: `rule` of `HeadlineStack`. Meta line (≥ 13px: 14px): `Published {formatDate} · PDF, {formatFileSize} · Free with an account` (signed in: `· Download` linking the file).
- Abstract: `meta` label "ABSTRACT" + `<p class="text-read">` with the whole abstract. Never split. No dropcap.
- Door panel per §8.11 with the paper's issue drawing (`plateSubject(issue.number)`).
- Cite block per §8.12 (citation + BibTeX strings computed exactly as today).
- Also in this issue: up to 3 (today 4 → 3), `PaperRow` h4 size, date hidden.
- Prev/next: today's newer/older logic and labels ("Newer paper" / "Older paper"; ends link to `/papers` "The archive / Every paper, newest first").
- Untouched: `generateMetadata` (Highwire `citation_*` tags, canonical, description), the ScholarlyArticle JSON-LD (`cssSelector: ".gated-download"`), `findPublished`, `notFound()`. Only change in metadata: `openGraph.images` removed (the route's `opengraph-image.tsx` supplies it) and the `paperImage` import deleted.
- Print: white page, header/footer/running head/door/cite buttons/also-in/prev-next hidden, title + authors + meta + abstract + citation printed (as today).
- Mobile: title 36 (h2 32 when long), authors wrap, meta wraps to two 14px lines, column full width minus 32, door stacks (drawing hidden), cite pills wrap, running head keeps chip + title + sm pill "PDF".
- Cut: the back link, the headpiece, the tile band, the pool photograph, the dropcap and end diamond, the colophon rail (its six facts collapse into eyebrow + meta line + BibTeX), `Corners`, `Rosette` emboss, gild thread, leaders.
- `p/[slug]/not-found.tsx`: centred `compass` `lg`, eyebrow `meta` "404", h1 (`text-h2`) "No paper at this address", one line "It may have been renamed or withdrawn.", primary md "All papers", hint `kbd ⌘K` "to search".

### 9.5 `/about`

```
│                              About the Review                                          │ h1 64 centred, rule
│        Research on the politics, economies and societies of Central Asia.              │ lede
│                     Independent, edited, free to read.                                 │
│                                                                                        │ 64
│            Central Asian Review covers Kazakhstan, Kyrgyzstan, Tajikistan,             │ read 19, --narrow,
│            Turkmenistan and Uzbekistan, and the wider region where it bears            │ one paragraph (44 words)
│            on them. It is independent and published by Freshman Academy. …           │
│                                                                                        │ 128
│            HOW A PAPER REACHES A READER                                                │ meta
│   ┌──────────────────────┐    01                                                       │ StickySequence
│   │                      │    You send a paper                                         │ h3
│   │     ≈ tulip ≈        │    One PDF, up to 10 MB, with an abstract that stands alone. │ body, step 70vh
│   │  stage 1 → 2 → 3     │    02                                                       │
│   │  (sticky, scroll-    │    An editor reads it                                       │
│   │   bound drawing)     │    In full, before anything appears. You hear back by email │
│   └──────────────────────┘    either way.                                              │
│                               03                                                       │
│                               It publishes, then binds                                 │
│                               Live once accepted, then gathered into that quarter's    │
│                               issue.                                                   │
│                                                                                        │ 128
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ inset band
│ ░  COVERAGE                                                                          ░ │ meta
│ ░  ≈≈≈≈≈≈ rivers: Amu Darya and Syr Darya to the Aral shoreline, draws L→R ≈≈≈≈≈≈≈≈≈≈ ░ │ container width, 1200×400
│ ░  Kazakhstan     Kyrgyzstan     Tajikistan     Turkmenistan     Uzbekistan           ░ │ h4 Serif 500 20
│ ░  Қазақстан      Кыргызстан     Тоҷикистон     Türkmenistan     Oʻzbekiston           ░ │ Serif 400 17 ink-3, lang
│ ░  And the wider region, where it bears on these five.                                ░ │ body ink-3
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                                        │ 128
│   ┌ For contributors  #contributors ───────┐   ┌ For readers  #readers ────────────────┐ │ two bordered cards
│   │ An abstract that states the question,  │   │ Abstracts are open to everyone.       │ │ h3 + body ≤ 2 lines
│   │ method and finding by itself: it is    │   │ Papers are free to registered readers;│ │
│   │ the part search engines read. Free at  │   │ a Google sign-in creates the account. │ │
│   │ every stage.                           │   │ ( Browse papers → )                   │ │
│   │ [ Submit a paper ]                     │   └───────────────────────────────────────┘ │
│   └────────────────────────────────────────┘                                            │
```

- Anchors: `id="contributors"` and `id="readers"` (new, required by the door panel link) on the two cards, `scroll-margin-top: calc(var(--header-h) + 32px)`.
- No masthead (unchanged rule: no editor names until real ones exist).
- Mobile: lede 19; sequence becomes a static stack with the tulip `md` above step 01; coverage names 2 columns (fifth alone); rivers at full width (≈ 358 × 120); cards stack.
- Cut: the 100-word body → one 44-word paragraph; process bodies 35–45 → ≤ 13 words; contributors 90 → 22 words; the suzani photograph, shanyrak, typographic colophon.
- Motion: L header; scroll-bound tulip; steps rise; rivers draw; names unroll; cards rise.

### 9.6 `/login`

```
│                                                                                        │ 96
│                       ┌──────────────────────────────────────┐                         │ card: overlay, radius lg,
│                       │ ◎                                    │                         │ 0.5px rule-2, shadow-card,
│                       │ Sign in                              │                         │ max 480, padding 40 (28 mobile)
│                       │ Sign in to download papers or submit │                         │ h2 32→40 · body ink-2
│                       │ your own. Continuing with Google     │                         │
│                       │ creates your account; there is no    │                         │
│                       │ separate registration.               │                         │
│                       │ (! error notice, when ?error=)       │                         │ Notice bad
│                       │ [ G  Continue with Google          ] │                         │ primary lg full width
│                       │ ─────────── LOCAL ONLY ────────────  │                         │ only when devLoginEnabled
│                       │ ( Sign in as reader ) ( as editor )  │                         │ secondary md pair
│                       │ By continuing you accept the         │                         │ micro ink-3, link /privacy
│                       │ privacy notice.                      │                         │
│                       └──────────────────────────────────────┘                         │
```

Server actions (`signInWithGoogle(next)`, `signInAsDev`), `safePath(next|callbackUrl)`, the configuration-problem branch and its message, and the error alert all stay. Footer renders without the call row. Mobile: card full width minus 32, no vertical centring. Motion: card settles (L), Mark draws.

### 9.7 `/submit` (requires a user, as today)

```
│   Submit a paper                                                    ≈ cotton (sm)     │ h1 64 start
│   An editor reads every submission in full; you are emailed when a decision is made.  │ lede (15 words)
│                                                                                        │ 48
│   ┌ form card (bordered, overlay, radius md, max 42rem, padding 32) ┐  WHAT HAPPENS NEXT │ aside ≥ lg, meta
│   │ Title             [                                           ] │  01 An editor reads│ mono numerals,
│   │ Authors           [                                           ] │     it in full     │ ui-sm ink-2
│   │                   As they should be cited: S. Ito, K. Mamatov   │  02 You hear back  │
│   │ Abstract          [ textarea                                  ] │     by email       │
│   │                   States the question, the method, the finding. │  03 Accepted papers│
│   │                                                    312 / 2,000  │     publish        │
│   │ Paper (PDF)       ┌ ≈ cotton  Drop a PDF here, or choose a file ┐│                    │ FileDrop
│   │                   └ up to 10 MB ───────────────────────────────┘│                    │
│   │                                         [ Send for review ]     │                    │ PendingButton lg "Sending…"
│   └──────────────────────────────────────────────────────────────────┘                    │
```

Field names, `required`, `maxLength`, `accept`, `MAX_ABSTRACT` and the server action stay exactly as in `SubmitForm.tsx`; labels stack above inputs < md. Errors render as `Notice tone="bad"` at the top of the card plus per-field messages if the action returns them today. Success keeps today's redirect to `/submissions` and its `role="status"` notice. Mobile: aside becomes one `meta` line under the lede ("READ IN FULL → EMAILED → PUBLISHED"). Cut: intro 30 → 15 words.

### 9.8 `/submissions`

```
│   My submissions                                               ( Submit a paper )      │ h1 64 + secondary md
│   (✓ Received. An editor will read it in full.)  ← existing role=status notice          │ Notice good
│   ──────────────────────────────────────────────────────────────────────────────────   │
│   Gas Pricing Reform and Household Burden              ● Under review      27 JUL 2026 │ h4 Serif 500 · StatusMark · meta
│   Submitted 27 July 2026 · ( PDF )                                                     │ ui-sm ink-3 · ghost sm
│   ──────────────────────────────────────────────────────────────────────────────────   │
│   Digital Payments Adoption Among Bazaar Traders       ● Needs revision    18 JUL 2026 │
│   ┌ EDITOR'S NOTE ─────────────────────────────────────────────────────────────┐       │ filled card radius sm,
│   │ Promising data, but the abstract reads as a teaser… (full note, never clamped) │    │ read 17/1.6
│   │ ( Submit a revision → )                                                     │       │ link → /submit
│   └─────────────────────────────────────────────────────────────────────────────┘       │
│   ──────────────────────────────────────────────────────────────────────────────────   │
│   Higher Education Reform and Graduate Outcomes          ● Published       24 JUL 2026 │ title links /p/slug
```

Data, the PUBLISHED link, the DRAFT "Started" wording, the note fallback text, the own-PDF link and `CleanQuery` stay. Empty: `EmptyState(apple, "No submissions yet", "Your papers and their review status will appear here.", Submit a paper)`. Mobile: status mark + date on a line under the title.

### 9.9 `/notifications`

```
│   Notifications                                             ( Mark all as read )       │ h1 + secondary md (form markNotificationsRead)
│   ──────────────────────────────────────────────────────────────────────────────────   │
│   ● Published: Higher Education Reform and Graduate Outcomes            24 JUL 2026 →  │ unread: accent-mark dot, h4 ink
│     Your paper is now live on the public index.                                        │ body ink-3
│   ──────────────────────────────────────────────────────────────────────────────────   │
│     Returned for revision: Digital Payments Adoption Among Bazaar…      18 JUL 2026 →  │ read: no dot, h4 ink-2
```

Each row stays the existing `openNotification` `<form>` with a full-row submit button (`PendingButton` keeps working). Dates absolute via `formatDate` (no relative times). Empty: `EmptyState(silkworm, "Nothing new", "Decisions on your papers will appear here.", My submissions)`.

### 9.10 `/admin` (+ `/queue`, `/papers`, `/users`, `/emails`) — product register

`admin/layout.tsx` (keeps `requireAdmin`, pending count):

```
│   EDITOR DESK                                                                          │ meta
│   Editor's desk                                                                        │ h1 in text-h2 (32→48)
│   ( Overview )( Review queue 2 )( All papers )( Readers )( Email log )                 │ Segmented with counts
│                                                                                        │ 48
```

**Overview** (`/admin`):
```
│   2 AWAITING REVIEW · 6 PUBLISHED · 1 RETURNED · 4 READERS                              │ one meta line; each count links as today
│   (! 1 email failed this week · Email log →)                                            │ Notice bad, only when failures > 0
│                                                                                        │ 48
│   RECENT SUBMISSIONS                                                                    │ meta
│   Gas Pricing Reform and Household Burden        M. Iskakov, L. Orozova  ● Under review 27 JUL │ table rows
│   …                                                                                    │
```

**Queue** (`/admin/queue`): `ReviewCard` per pending paper, 24px apart, bordered card radius md, padding 32:
```
│   ┌──────────────────────────────────────────────────────────────────────────────┐    │
│   │ Pastoral Land Tenure and Winter Pasture Access                ● Under review │    │ h3 + StatusMark
│   │ G. Beksultanova · submitted 3 Sep 2026 · PDF 2.1 MB      ( Open PDF ↗ )       │    │ ui-sm ink-3 · ghost sm (inline)
│   │ The full abstract in Inter 16/1.6 ink-2 …                                     │    │ body
│   │ [ Publish ]                                                                   │    │ PendingButton md "Publishing…"
│   │ Note to the author  [ textarea                                             ]  │    │ Field
│   │ ( Return for revision )                                                       │    │ secondary md "Returning…"
│   └──────────────────────────────────────────────────────────────────────────────┘    │
```
(The two separate `<form>`s, field name `reviewNote`, and `?disposition=inline` stay.) Empty queue: `EmptyState(apple, "Nothing waiting", "New submissions appear here.")` (empty states are the only drawings in admin).

**All papers / Readers / Email log**: hairline tables inside the container: header row `meta` `ink-3` with `rule-2` under it; rows 52px, 14px Inter, `tabular-nums`, 1px `rule` between, hover `surface-1`. Columns: papers — Title (links when published) · Authors · Status (`StatusMark`) · Date · Actions (`withdrawPaper` form with `PendingButton` ghost sm); readers — the existing search form (`role="search"`, GET), status line, Name · Email · Role (chip "Editor"/"Reader") · Papers · Joined; emails — Recipient · Subject · Status (`Sent`/`Skipped`/`Failed`) · Time (`formatDateTime`) · Error (`<details>`, 14px `bad`). Mobile: tables become stacked rows: title line + a `meta`-labelled key/value grid; actions at the row end.

No drawings (except empty states), no Reveal, no draw-on, no bands.

### 9.11 `/privacy`

h1 (start, 64) + lede (one sentence) → `--narrow` column: four sections (Reading, Accounts, Submissions, Removal), each with a 1px `rule` above, 48px apart, `h3` Serif 24 + `text-read` paragraphs. Every fact stays; each section opens with its existing first sentence. No drawing. Mobile: single column. Motion: h1 rise only.

### 9.12 404 — `src/app/not-found.tsx`

```
│                                   ≈ compass (lg 240) ≈                                 │ draws, then needle settles north
│                                         404                                            │ meta
│                              Nothing at this address                                   │ h1 in text-h2
│                 The page may have moved. The papers are all still here.                │ body ink-3
│                        [ All papers ]   ( Home )      or press ⌘K to search             │ primary md · secondary md · micro + kbd
```
Centred, `min-height: calc(100svh − var(--header-h) − 96px)`, padding-top 96. Footer with call row.

### 9.13 Error — `src/app/error.tsx` (client; keeps `unstable_retry` and `console.error`)

Same frame with `sextant` (`lg`, muted tone), h1 "Something went wrong", body "The fault is on our side. Trying again usually works.", primary md "Try again" (`unstable_retry()`), secondary md "Home", digest in `micro` if present.

### 9.14 Loading — `papers/loading.tsx`, `issues/loading.tsx`

`Skeleton` after 300 ms: papers — eyebrow bar 12 × 140, h1 bar 64 × 260, search pill 48 × 560, four rows (title bar 22 × 60%, authors 14 × 30%, hairlines). Issues — h1 bar, then one spread: 4:5 block (radius lg, `surface-2`) + four rows.

### 9.15 `/design` (Foundation, dev only, deleted in cleanup)

`src/app/design/page.tsx`: `if (process.env.NODE_ENV === "production") notFound();`. Renders every component in every variant, all 13 drawings at every size with `draw="none"` and a "replay" button, all 8 plate tones in both themes, the type scale, the token swatches with their ratios, and the **GlyphProbe** (§12 (a) 10).

---

## 10. Dark mode (designed, not inverted)

- **Material**: Claude's dark ramp. Page `#141413`; surfaces step **up** in lightness: `#1f1e1d` (band, filled cards, inputs), `#262624` (overlay, door, segmented track), `#30302e` (kbd, skeleton). Text is cream, never white: `#faf9f5` headings and reading, `#e8e6dc` body, `#b0aea5` meta. Hairlines `#2e2e2c` / `#3d3d3a`.
- **Doors**: the door panel becomes `#262624` with a 1px `#3d3d3a` ring, so it is still a distinct object; its button stays cream with ink text.
- **Footer**: `#0f0f0e`, one step below the page, with a 1px `#2e2e2c` top hairline, so it still reads as the floor.
- **Plates**: each tone switches to its designed dark partner (§3.3: hue kept, lightness 25–35%, "glazed terracotta" rather than pastel); numerals, labels and drawings become cream; dots cream 60%. Two issues remain distinguishable in dark exactly as in light.
- **Drawings on page**: `#e8e6dc` strokes (a step below the cream text so drawings sit behind type); dots `#4d4c48`; Mark summit dot stays `#d97757`.
- **Buttons**: primary inverts (cream fill, ink text); secondary `#262624` fill with `#4d4c48` ring; ghost hover `#1f1e1d`.
- **Accent**: `#e08b66` text; `accent-soft` `#3a251c`; selection uses it.
- **Inputs**: `#1f1e1d` fill, `#73726c` border (3.82 : 1 on page), cream focus outline.
- **Shadows**: replaced by a 1px `#3d3d3a` ring + `0 12px 40px rgb(0 0 0 / .5)` on floating panels; nothing in the flow has a shadow in either mode.
- **Header glass**: `#141413` at 86% + blur; hairline `#3d3d3a`.
- **Status**: `#7fc29a` / `#d9a94c` / `#e58a7c`.
- **Native controls**: `color-scheme` drives scrollbars, date/file pickers. `theme-color` meta `#faf9f5` / `#141413`.
- **Flip**: typed View Transition cross-fade (200 / 340 ms); drawings do not redraw; reduced motion → instant.

---

## 11. What to delete

### 11.1 Files (in the Cleanup task, after all page tasks merge)

- `src/app/_components/Ornament.tsx`, `CoverLight.tsx`, `ClipReveal.tsx`, `IssueCover.tsx`, `InkSet.tsx`, `PageShell.tsx`, `StatusPill.tsx`, `PaperRow.tsx` (old), `Reveal.tsx` (old; replaced by `motion/Reveal.tsx`).
- `src/lib/regionalImages.ts`; `public/regional/` (all 17 JPGs and `CREDITS.md`: nothing references them after the page tasks).
- `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`.
- `src/app/favicon.ico` (Foundation replaces `icon.svg`; the `.ico` is redundant).
- `src/app/design/` (the dev gallery).
- `DESIGN.md`: replace its contents with a one-paragraph pointer to this spec's final copy (commit this SPEC as `DESIGN.md`). `PRODUCT.md`: replace the "Brand voice" section with: "Three words: **quiet, drawn, scholarly.** A cream room where the research is the only thing in ink; one hand-drawn contour line is the only ornament. See DESIGN.md." and replace "Strategic principles" item 3's ornament sentence with "Ornament is one hand-drawn line of the region's nature and science, never its flags, buildings or costume."

Foundation itself deletes only `src/app/apple-icon.png` (it adds `apple-icon.tsx`; both cannot coexist).

### 11.2 CSS

`globals.css` is replaced wholesale by Foundation. Nothing of today's 1,244 lines survives except: the `@import "tailwindcss"`, the `color-scheme` selection block (`:root`, `[data-theme]` pins), the `:focus-visible` rule (recoloured), `.prose-plain`, the print block (recoloured), the reduced-motion and view-transition mechanics (rewritten per §6). Gone, by name: `.surface-night`, both noise `background-image` data URIs, `.eyebrow`, `.display-flush`, `.dropcap`, `.oldstyle-nums`, `.link-underline`, `.shadow-plate`, `.fillet`, `.foil`, `.emboss`, `.press-ink`, `.copy-swap`, `.title-link`, `.folio-label`, `.leader`, `.reveal-plate`, `.reading-thread`, `.cover-lift-*`, `.arch-keyline`, `.mark-margin`, `.gild-thread`, `.gild-thread-host`, `@property --thread-angle`, `.plate-drift`, `--masthead-h`, `--head-h`, `.head-strip`, `.head-mark`, `wheel-turn`, `.catalogue`, `.foil-type`, `@property --mx/--my`, `.cover-keyline`, `.arch-lamp`, `.ikat-cloth`, `.shelf`, `.volume*`, `.shelf-board`, `.deckle-top`, `.running-head`, `.progress-rule`, `.reveal-scroll`, `.reveal-load`, `.reveal-flat`, `.ink-set`, `.rule-draw` (re-specified), `.folio-row`, `.clip-reveal*`, and every `@theme` colour token (`canvas`, `surface`, `rule-strong`, `field`, `ink-soft`, `muted-fg`, `accent*`, `tile*`, `ember*`, `gild`, `cloth-*`, `state-*`), `--font-display`, `--font-geist-sans`.

### 11.3 Code paths

`layout.tsx`: `EB_Garamond`, `Geist`, `heroRegistan` import and the `openGraph.images` entry (the route `opengraph-image.tsx` replaces it). `p/[slug]/page.tsx`: `paperImage`, the pool `<figure>`, the colophon `<aside>`, ornaments. `papers/page.tsx`: thumbnails and their collision logic, `FilterChip`. `issues/page.tsx`: shelf / volume markup. Header: the `--masthead-h` negative-sticky trick, `TileBand`/`Headpiece`. Footer: the colophon "set in" sentence.

Dependencies: none removed, none added (`@phosphor-icons/react` stays for UI icons: MagnifyingGlass, Sun, Moon, Desktop, Bell, ArrowRight, ArrowUpRight, DownloadSimple, Copy, X, List, CaretRight, GoogleLogo). Icons render at 16–18px, weight `regular`.

---

## 12. Implementation plan

Branch `redesign-v2`. UI layer only: no schema, server action, auth, API route, query-param or URL change. Every route, anchor (`#contributors`, `#readers` (new), `#no-N`, `#the-full-paper`), JSON-LD block, Highwire tag, `aria` contract and print behaviour survives. Engineers read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` and `…/02-guides/view-transitions.md` before coding (AGENTS.md).

Order: **(a) Foundation** merges first, alone. Then **(b) P1–P8** in parallel (disjoint files). Then **(c) Cleanup**. Between Foundation and a page task's merge, that page may look unstyled (old classes no longer exist); it must still build.

### (a) FOUNDATION

**Owns:** `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/content.ts`, `src/lib/plates.ts` (new), `src/lib/snippet.ts` (new), `src/lib/format.ts` (new: `formatShortDate`, `formatFileSize` moved from the paper page as an export; the paper page keeps its local copy until P4 switches), `src/app/_components/ui/**` (new), `src/app/_components/illustrations/**` (new), `src/app/_components/motion/**` (new), and rewrites in place of `src/app/_components/{SiteHeader,SiteFooter,NavLinks,NotificationBell,ProfileMenu,ThemeToggle,CatalogueTrigger,CopyButton,PendingButton,TitleCarry}.tsx` + new `MobileSheet.tsx`, `FooterCall.tsx`, `MarkSession.tsx`; `src/app/icon.svg`, `src/app/apple-icon.tsx` (new; delete `apple-icon.png`), `src/app/opengraph-image.tsx` (new), `src/app/design/page.tsx` (new, dev only), `scripts/illustration-prep.mjs` (new).

**Deliverables:**

1. **Fonts** exactly as §2.1; `<html className={…variables} h-full antialiased>`; body `bg-page text-ink font-sans`; `viewport.themeColor` light `#faf9f5` / dark `#141413`; site JSON-LD unchanged; the pre-paint script keeps the theme pin and adds the first-visit flag: `try{if(!sessionStorage.getItem("carVisited")){document.documentElement.setAttribute("data-first-visit","");sessionStorage.setItem("carVisited","1")}}catch(e){}`; skip link restyled as a primary sm pill.
2. **`globals.css`**: `@import "tailwindcss"`; `@theme` with every §3.1 token as `light-dark()` (`--color-*`), `--font-*` (§2.1), `--text-*` with line-height/letter-spacing modifiers (§2.2), `--radius-*` (§4.1), `--shadow-*` (§4.4), `--ease-*` (§6.1); `:root` custom props `--dur-*`, `--stagger-*`, `--rise*`, `--container`, `--list`, `--narrow`, `--form`, `--gutter`, `--section`, `--page-top`, `--header-h`; md overrides for radii; the 8 plate tone classes (§3.3); the `[data-draw]` / `[data-s]` / `[data-d]` rules, `@keyframes draw | reink | ridge-drift | appear | fade-in | fade-out`; `.word-rise`, `[data-reveal]` gesture rules (`rise`, `rows`, `settle`); `.rule-draw`; header glass timeline; running-head progress timeline; sticky-sequence timelines with `timeline-scope`; view-transition rules (§6.4); reduced-motion block (§6.5, verbatim); hover blocks gated (§6.5); print block; `::selection`; `:focus-visible`. Target ≤ 600 lines. Skeleton in Appendix B.
3. **`src/lib/content.ts`**: final copy (Appendix A), key names frozen at merge. Page tasks only read it.
4. **`src/lib/plates.ts`** (§3.3), **`src/lib/snippet.ts`** (`firstSentence(text: string, max = 140): string`: cut at the first `. ` / `? ` / `! ` after ≥ 40 chars, else at a word boundary ≤ max with "…"), **`src/lib/format.ts`** (`formatShortDate(d): "25 JUN 2026"` in Asia/Tashkent; `formatFileSize(bytes): "1.2 MB"`).
5. **Illustrations** (`src/app/_components/illustrations/`): `types.ts`, `data/*.ts` (13 modules, §5.4), `index.ts` (`DRAWINGS`, `IllName`), `strokes.ts` (§5.3 table), `Drawing.tsx` (server), `DrawObserver.tsx` (client).
6. **Motion** (`src/app/_components/motion/`): `useReveal.ts`, `Reveal.tsx`, `WordRise.tsx`, `PlateCarry.tsx`, `StickySequence.tsx`; `TitleCarry.tsx` stays at `_components/TitleCarry.tsx` (unchanged API).
7. **UI** (`src/app/_components/ui/`): `Button.tsx`, `IconButton.tsx`, `Chip.tsx`, `Kbd.tsx`, `Card.tsx`, `Band.tsx`, `Container.tsx`, `HeadlineStack.tsx`, `Field.tsx` (Field, Input, Textarea), `FileDrop.tsx`, `SearchField.tsx`, `Segmented.tsx`, `StatusMark.tsx`, `Notice.tsx`, `EmptyState.tsx`, `IssuePlate.tsx`, `PaperRow.tsx`, `DoorPanel.tsx`, `CiteBlock.tsx`, `RunningHead.tsx`, `Skeleton.tsx`, `Mark.tsx`.
8. **Chrome**: header, sheet, footer, call row, ⌘K, theme, bell, profile per §8.1–8.2, §8.15, §8.21.
9. **Icons and OG**: `icon.svg` (the Mark on transparent, `<style>@media (prefers-color-scheme: dark){…}</style>` cream strokes), `apple-icon.tsx` (`ImageResponse` 180 × 180, `#faf9f5` bg, Mark at 120px, ink strokes 4px, `#d97757` dot), `opengraph-image.tsx` (1200 × 630, `#faf9f5`, Mark 96 + "Central Asian Review" in the default `ImageResponse` font at 64px + the line "Research on the politics, economies and societies of Central Asia" at 28px `#5e5d59`; no custom font fetch).
10. **`/design`** route (§9.15) including **GlyphProbe**: for each of the three families' resolved `font-family` names (read from `getComputedStyle` of elements using `font-serif`, `font-sans`, `font-mono`), after `document.fonts.ready`, measure `"ҚҷҶқ"` with a 2D canvas twice, once as `48px <family>, serif` and once as `48px <family>, monospace`; equal widths ⇒ the glyphs come from the webfont (pass); unequal ⇒ fallback (fail). Display PASS/FAIL per family and also run `document.fonts.check('16px <family>', 'Қҷ')`. Expected: serif PASS, sans PASS, mono PASS.

**Prop contracts (final):**

```ts
// illustrations/types.ts
export type DrawingData = { viewBox: [number, number]; strokes: { d: string; stage?: 1 | 2 | 3 }[]; dots: [number, number, number, (1 | 2 | 3)?][] };
export type IllName = "tulip" | "pomegranate" | "saiga" | "melon" | "leopard" | "apple" | "silkworm" | "cotton"
                    | "mark" | "ridge" | "sextant" | "rivers" | "compass";
export type DrawSize = "xs" | "sm" | "md" | "lg" | "xl" | "plate" | "hero" | "mark-24" | "mark-32" | "mark-96";

// illustrations/Drawing.tsx: SERVER component (drawing data never ships to the client).
// It renders <DrawObserver mode delay> (client, < 1 KB) around the static <svg>; DrawObserver runs useReveal on its
// wrapper and sets data-draw / data-draw-mode there, so the CSS selectors [data-draw] [data-s] apply.
export function Drawing(p: {
  name: IllName; size: DrawSize;
  tone?: "ink" | "plate" | "door" | "muted";          // default "ink"
  draw?: "view" | "load" | "scroll" | "none";         // default "view"
  delay?: number;                                      // ms before the first stroke
  stagger?: number;                                    // ms per stroke, default 80
  label?: string;                                      // role="img" + aria-label; omitted → aria-hidden
  className?: string;
}): JSX.Element;

// motion
export function useReveal(ref: React.RefObject<HTMLElement | SVGElement | null>, opts?: { attr?: "data-reveal" | "data-draw"; rootMargin?: string }): void;
export function Reveal(p: { children: React.ReactNode; gesture?: "rise" | "rows" | "settle" | "none"; delay?: number /* ms */; load?: boolean; as?: "div" | "section" | "ol" | "ul" | "li"; className?: string }): JSX.Element;
export function WordRise(p: { text: string; as?: "h1" | "h2" | "p"; className?: string; mode?: "load" | "view"; blur?: boolean; step?: number /* ms, default 34 */ }): JSX.Element; // renders sr-only full text + aria-hidden word spans
export function PlateCarry(p: { number: number; children: React.ReactNode }): JSX.Element; // <ViewTransition name={`plate-${number}`} share="plate" default="none">
export function StickySequence(p: { steps: { title: string; body: string }[]; label: string /* aria-label of the <ol> */ }): JSX.Element; // tulip only
export function TitleCarry(p: { slug: string; children: React.ReactNode }): JSX.Element; // unchanged

// ui
export function Button(p: { variant?: "primary" | "secondary" | "ghost" | "on-door" | "link"; size?: "sm" | "md" | "lg"; href?: string; icon?: React.ReactNode; iconEnd?: React.ReactNode; className?: string; children: React.ReactNode } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">): JSX.Element;
export function PendingButton(p: { children: React.ReactNode; pendingLabel: string; variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" | "lg"; className?: string }): JSX.Element; // existing file, extended, back-compatible
export function IconButton(p: { label: string; href?: string; onClick?: () => void; dot?: boolean; size?: 32 | 36; children: React.ReactNode }): JSX.Element;
export function Chip(p: { children: React.ReactNode; tone?: "neutral" | "current" }): JSX.Element;
export function Kbd(p: { children: React.ReactNode }): JSX.Element;
export function Card(p: { kind: "filled" | "bordered"; as?: "div" | "section" | "article" | "li"; href?: string; id?: string; className?: string; children: React.ReactNode }): JSX.Element;
export function Band(p: { tone: "page" | "inset"; id?: string; as?: "section" | "div"; className?: string; children: React.ReactNode }): JSX.Element;
export function Container(p: { width?: "container" | "list" | "narrow" | "form"; className?: string; children: React.ReactNode }): JSX.Element;
export function HeadlineStack(p: { eyebrow?: React.ReactNode; title: string; titleAs?: "h1" | "h2" | "p"; size: "display" | "h1" | "title" | "h2"; lede?: string; actions?: React.ReactNode; align?: "center" | "start"; rule?: boolean; rise?: "load" | "view" | "none"; carrySlug?: string /* wraps title in TitleCarry */ }): JSX.Element;
export function Field(p: { id: string; label: string; hint?: string; error?: string; children: React.ReactElement }): JSX.Element;
export function Input(p: React.InputHTMLAttributes<HTMLInputElement>): JSX.Element;
export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { counter?: boolean }): JSX.Element;
export function FileDrop(p: { name: string; accept: string; maxBytes: number; hint: string; required?: boolean }): JSX.Element; // client
export function SearchField(p: { action: string; name?: string /* "q" */; defaultValue?: string; placeholder: string; hidden?: Record<string, string>; shortcutHint?: boolean }): JSX.Element;
export function Segmented(p: { label: string; items: { href: string; label: string; count?: number; active: boolean }[] }): JSX.Element; // client thumb
export function StatusMark(p: { status: string }): JSX.Element; // paper statuses + "SENT" | "SKIPPED" | "FAILED"
export function Notice(p: { tone: "info" | "good" | "warn" | "bad"; children: React.ReactNode; action?: React.ReactNode }): JSX.Element;
export function EmptyState(p: { drawing: IllName; title: string; body?: string; action?: { href: string; label: string } }): JSX.Element;
export function IssuePlate(p: { issue: { number: number; year: number; quarter: 1 | 2 | 3 | 4; label: string; paperCount?: number }; variant: "hero" | "spread" | "chip"; href?: string; current?: boolean; carry?: boolean; draw?: "view" | "load" | "none"; className?: string }): JSX.Element;
export function PlateChip(p: { number: number; label: string /* "Summer 2026" */; carry?: boolean }): JSX.Element; // chip variant from label
export function PaperRow(p: { paper: { slug: string; title: string; authorLine: string; publishedAt: Date | null; abstract?: string; issue?: { number: number; label: string } }; index: number; titleSize?: "h3" | "h4"; meta?: "date" | "date-issue" | "none"; snippet?: boolean; carry?: boolean /* default true */ }): JSX.Element; // renders <li>
export function DoorPanel(p: { id?: string; className?: string; title: string; line: string; action: React.ReactNode; aside?: React.ReactNode; drawing?: IllName }): JSX.Element;
export function CiteBlock(p: { citation: string; bibtex: string }): JSX.Element;
export function RunningHead(p: { title: string; issue?: { number: number; label: string }; action: { href: string; label: string }; sentinelId: string }): JSX.Element; // client
export function Skeleton(p: { className?: string; lines?: number }): JSX.Element;
export function Mark(p: { size: 24 | 32 | 96; draw?: "load" | "session" | "view" | "none"; tone?: "ink" | "door"; className?: string }): JSX.Element;
// chrome (unchanged public APIs)
export function SiteHeader(): Promise<JSX.Element>;  export function SiteFooter(): JSX.Element;  export function CatalogueTrigger(p: { compact?: boolean }): JSX.Element;
```

**Foundation acceptance:** `next build` passes; `/design` renders every component in both themes at 390 and 1440; GlyphProbe shows three PASS; header/footer are final on every route.

### (b) PAGE TASKS (disjoint files; start only after Foundation merges)

| Task | Files owned (nothing else) | Spec | Notes |
|---|---|---|---|
| **P1 Home** | `src/app/page.tsx`, `src/app/_home/*` (new: `Hero.tsx`, `IssueBand.tsx`, `Statement.tsx`) | §9.1 | Current issue = `groupIntoIssues(published)[0]`; keep data fetching shape; no `?issue=` links |
| **P2 Papers** | `src/app/papers/page.tsx`, `src/app/papers/loading.tsx` | §9.2, §9.14 | Keep `?q`, `?year`, "> 1 year" rule; select `abstract`; issue per row via `issueFor` |
| **P3 Issues** | `src/app/issues/page.tsx`, `src/app/issues/loading.tsx` | §9.3, §9.14 | One `PlateCarry` per issue number; `#no-N` sections |
| **P4 Paper** | `src/app/p/[slug]/page.tsx`, `src/app/p/[slug]/not-found.tsx`, `src/app/p/[slug]/opengraph-image.tsx` (new: 1200 × 630, plate tone bg, issue drawing paths inlined as `<svg>`, title 56px default font in plate ink, "Central Asian Review · № 2 · Summer 2026" 24px), `src/app/_components/AuthorLine.tsx` | §9.4 | Metadata, Highwire, JSON-LD, citation/BibTeX strings untouched; remove `openGraph.images` + `paperImage` |
| **P5 About + Privacy** | `src/app/about/page.tsx`, `src/app/privacy/page.tsx` | §9.5, §9.11 | Add `id="readers"` |
| **P6 Account flows** | `src/app/login/page.tsx`, `src/app/submit/page.tsx`, `src/app/submit/_components/SubmitForm.tsx`, `src/app/submissions/page.tsx`, `src/app/notifications/page.tsx` | §9.6–9.9 | Actions untouched; `CleanQuery` usage kept |
| **P7 Admin** | `src/app/admin/layout.tsx`, `admin/page.tsx`, `admin/queue/page.tsx`, `admin/papers/page.tsx`, `admin/users/page.tsx`, `admin/emails/page.tsx`, `admin/_components/AdminTabs.tsx` (→ thin wrapper over `Segmented`), `admin/_components/ReviewCard.tsx` | §9.10 | `requireAdmin`, `admin/actions.ts` untouched |
| **P8 Errors** | `src/app/not-found.tsx`, `src/app/error.tsx` | §9.12–9.13 | Keep `unstable_retry` |

Each page task: import only from `ui/`, `illustrations/`, `motion/`, `TitleCarry`, chrome, `lib/*`; never from the old `Ornament`, `PageShell`, `StatusPill`, `IssueCover`, `InkSet`, `CoverLight`, `ClipReveal`, old `PaperRow`, old `Reveal`, `regionalImages`. Copy comes from `COPY` (Appendix A); a page needing a string that is not there asks Foundation's owner rather than inlining it.

### (c) CLEANUP

1. Delete everything in §11.1; replace `DESIGN.md` and edit `PRODUCT.md` per §11.1.
2. `grep -rnE "Ornament|regionalImages|PageShell|StatusPill|IssueCover|InkSet|CoverLight|ClipReveal|surface-night|eyebrow|folio|gild|ikat|shelf|volume|foil|press-ink|title-link|reveal-scroll|ink-set|oldstyle|font-display|text-muted-fg|bg-canvas|ink-soft|accent-dark|public/regional" src` → zero hits.
3. `next build`; Lighthouse mobile on `/`, `/papers`, `/issues`, `/p/[slug]` (Performance ≥ 95 on `/` and `/p`, Accessibility 100, CLS 0); axe on every route in both themes; run §13.

---

## 13. Acceptance checklist (visually checkable)

**Palette and surfaces**
- [ ] P1. Light body samples `#faf9f5`, dark `#141413`. No texture, gradient, noise or photograph anywhere (zoom a flat area to 800%).
- [ ] P2. On `/` above the fold the only saturated pixels are the Mark's summit dot (`#d97757`); plates are the only pastel on any page.
- [ ] P3. `#141413` on light pages appears only on primary buttons, the paper page door panel and the footer; never as a mid-page band.
- [ ] P4. Cards are either `surface-1` with no border or page/white with a 1px `#dedcd1` border; no shadow in the page flow; login card and ⌘K are the only shadowed objects.

**Typography**
- [ ] T1. Home headline is Source Serif 4 at 80px at 1440 and 44px at 390; paper title 56 / 36 (long titles 48 / 32), `h1` element, ≤ 3 balanced lines; reading text 19 / 18px at 1.65 in a column ≤ 672px.
- [ ] T2. UI is Inter, eyebrows/meta are IBM Plex Mono 12px uppercase; no text under 14px except mono meta (12) and micro (11); numerals are lining everywhere.
- [ ] T3. `/design` GlyphProbe shows PASS for serif, sans and mono; in DevTools "Rendered Fonts" the footer and /about native names (Қазақстан, Кыргызстан, Тоҷикистон, Türkmenistan, Oʻzbekiston) list **Source Serif 4 only**, in light and dark; each name carries its `lang`.
- [ ] T4. `/` above the fold ≤ 30 words at 1440 × 900; no list row shows abstract text at rest; no section has more than one paragraph; one serif statement per viewport.

**Plates and illustration**
- [ ] I1. Issue 1 (Spring 2026) plate is cactus `#bcd1ca` with a tulip; Issue 2 (Summer 2026) is peach `#ebc9b7` with a pomegranate; in dark they are `#3f5e55` / `#7a4a36` with cream lines.
- [ ] I2. Plate drawings are full-strength ink (light) / cream (dark), clearly visible at arm's length; dots 60%.
- [ ] I3. All 13 drawings exist and render in `/design`; at every size the rendered stroke measures 1.5–2px (DevTools, zoom 100%) with round caps.
- [ ] I4. With JS disabled every drawing is complete on first paint; with JS, below-fold drawings draw on (≤ 2.2s, dots last) the first time they enter.
- [ ] I5. Hovering a plate (mouse) scales it 1.016, re-inks its strokes and turns its dots terracotta; on touch nothing hover-only happens.
- [ ] I6. No flag, emblem, yurt, building, person, map border, girih, ikat, arch, gold, shelf, spine or photograph exists in `src/` or the rendered site. (Except the home `horizon`'s yurts, turbines, train and skyline, by the owner's direction of 2026-11-10.)
- [ ] I7. Rows carry no glyph/thumbnail; `/papers` rows show a 20 × 26 issue chip.

**Motion**
- [ ] M1. Home headline words rise with a visible 34ms stagger and a 4px unblur; the ridge draws in ≈ 1.6s and moves ≤ 40px over the first viewport of scroll.
- [ ] M2. Sections rise 16px; rows unroll (≤ 8 staggered); plates settle 30px then draw.
- [ ] M3. On /about (Chromium, Safari 26+), the tulip grows stem → cup → open flower as steps 01 → 02 → 03 pass; in a browser without scroll timelines it simply draws once.
- [ ] M4. Clicking a row title morphs it into the paper `h1` (≈ 320ms); clicking the home plate morphs it into the `/issues` plate; Firefox shows clean cuts and no console errors.
- [ ] M5. Theme toggle cross-fades (200 / 340ms) with no flash on reload; drawings do not redraw.
- [ ] M6. Header never hides; its hairline and glass fade in over the first 48px of scroll.
- [ ] M7. Paper page running head slides in once the title leaves, with a contour line along its bottom that fills to 100% at the page end.
- [ ] M8. `prefers-reduced-motion: reduce`: nothing moves, nothing is hidden, all lines drawn, no parallax, no scroll-bound drawing, theme flip instant, view transitions cut.
- [ ] M9. Lighthouse CLS 0 on `/`, `/papers`, `/issues`, `/p/[slug]` (mobile and desktop); hovering a row never moves any other row.

**Layout and responsive**
- [ ] L1. At 1440 × 900 the home issue band starts at ≤ 1.2 viewports (target ≈ 1.0).
- [ ] L2. At 390 × 844: 16px gutters, no horizontal scroll on any route, the home plate is a 3:2 tile ≤ 240px tall and visible within ≈ 1 viewport, the first paper title within 1.5 viewports; tap targets ≥ 44px; header 64px with Mark, search and menu on one line.
- [ ] L3. Content max 1200px; reading column 672px; ≥ 96px between sections at ≥ 1024px.

**Components**
- [ ] C1. Primary pills are 46 / 40 / 32px, radius 999, ink fill (cream in dark), 2px ring on hover; secondary `surface-2` + 1px ring; focus shows a 2px outline offset 2px on every interactive element.
- [ ] C2. Inputs are 48px, 16px text, white fill, `#87867f` border (≥ 3:1), radius 12; dropzone dashed, ink on dragover.
- [ ] C3. Status marks show dot + 14px label in four distinct colours.
- [ ] C4. ⌘K, Ctrl-K and "/" open a 640px radius-28 dialog; arrows move the highlight; Esc closes (180ms); focus returns to the trigger.
- [ ] C5. Door panel: signed out shows the 13-word explanation, "Sign in to download" and "Why an account?" → `/about#readers`; signed in shows "PDF · {size}" and "Download the PDF"; dark mode `#262624` with a ring.
- [ ] C6. Cite block copies both formats ("Copied" ≈ 1.6s) and its BibTeX accordion shows a mono `<pre>`.
- [ ] C7. Empty states on `/papers?q=zzzz`, `/submissions`, `/notifications` show a drawing, ≤ 6-word title, one line, one button.
- [ ] C8. Footer: call row on public pages only (absent on /submit, /submissions, /notifications, /login, /admin); five native names bottom-right.

**Routes, features, SEO (R)**
- [ ] R1. All routes render: `/ /papers /issues /about /p/[slug] /login /submit /submissions /notifications /admin /admin/queue /admin/papers /admin/users /admin/emails /privacy`, 404, paper 404, error; `/feed.xml`, `/sitemap.xml`, `/robots.txt`, `/api/catalogue`, PDF download, auth, dev login all work as before.
- [ ] R2. Paper `<head>` still has `citation_*` tags and the ScholarlyArticle JSON-LD with `cssSelector: ".gated-download"`; the element with class `gated-download` and `id="the-full-paper"` exists; anchors `#contributors`, `#readers`, `#no-1`, `#no-2` scroll correctly under the sticky header.
- [ ] R3. Search, year filter, download gating, submit (incl. 10 MB file), publish / return with note, withdraw, mark-read, role display, email log all behave exactly as before.
- [ ] R4. Print preview of a paper page: white, no chrome, title + authors + meta + abstract + citation.
- [ ] R5. Copy says "an editor reads", never "peer-reviewed"; "free" at every stage; /login states that Google sign-in creates the account with no separate registration.
- [ ] R6. Lighthouse mobile Performance ≥ 95 on `/` and `/p/[slug]`, Accessibility 100 on public routes, axe clean in both themes; no third-party scripts; no image request on `/`.

---

## Appendix A — Final copy (`src/lib/content.ts`, Foundation)

Load-bearing claims preserved: an **editor** reads (never "peer-reviewed"), free at every stage, abstracts open, a Google sign-in creates the account, no masthead until real names exist.

```ts
export const COPY = {
  home: {
    hero: {
      title: "Research on Central Asia, read with care",                                   // 7 words
      body: "An independent, edited review of the region's politics, economies and societies.", // 11
      primary: "Read the issue",
      secondary: "Submit a paper",
    },
    issue: { allIssues: "All issues", allPapers: "All papers",
             emptyTitle: "The first issue is being edited", emptyBody: "Papers appear here as an editor accepts them." },
    editorial: {
      statement: "An editor reads every submission in full. Accepted papers publish as they clear review and gather into quarterly issues.", // 19
      attribution: "From the editors",
      link: "About the review",
    },
  },
  callForPapers: {
    title: "Call for submissions",
    body: "Finished papers, read year-round. No fee at any stage.",
    action: "Submit a paper",
    link: "For contributors",
  },
  papers: { title: "Papers", emptyTitle: "Nothing published yet", emptyBody: "The first papers are with an editor.",
            noMatchTitle: "Nothing matches", noMatchBody: "Try a shorter word, or an author's surname.", clear: "Clear search",
            searchPlaceholder: "Search titles and authors" },
  issues: { title: "Issues", lede: "One issue per quarter, gathered from the papers that cleared review.",
            current: "This quarter", emptyTitle: "The first issue is being edited", emptyBody: "Issues gather each quarter's accepted papers." },
  paper: {
    abstractLabel: "Abstract", freeWithAccount: "Free with an account",
    gate: {
      signedOutTitle: "Read the full paper",
      signedOutBody: "Papers are free to registered readers. A Google sign-in creates an account.",
      signedOutAction: "Sign in to download", why: "Why an account?",
      signedInTitle: "The full paper", signedInAction: "Download the PDF",
    },
    citeLabel: "Cite", alsoIn: "Also in", fullIssue: "The full issue",
  },
  about: {
    main: {
      title: "About the Review",
      lede: "Research on the politics, economies and societies of Central Asia. Independent, edited, free to read.",
      body: "Central Asian Review covers Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan and Uzbekistan, and the wider region where it bears on them. It is independent and published by Freshman Academy. Abstracts are public so the work can be found; the papers are free to registered readers.",
    },
    processLabel: "How a paper reaches a reader",
    process: [
      { title: "You send a paper", body: "One PDF, up to 10 MB, with an abstract that stands alone." },
      { title: "An editor reads it", body: "In full, before anything appears. You hear back by email either way." },
      { title: "It publishes, then binds", body: "Live once accepted, then gathered into that quarter's issue." },
    ],
    coverage: { label: "Coverage", note: "And the wider region, where it bears on these five." },
    contributors: { title: "For contributors", body: "An abstract that states the question, method and finding by itself: it is the part search engines read. Free at every stage.", action: "Submit a paper" },
    readers: { title: "For readers", body: "Abstracts are open to everyone. Papers are free to registered readers; a Google sign-in creates the account.", action: "Browse papers" },
  },
  login: {
    title: "Sign in",
    body: "Sign in to download papers or submit your own. Continuing with Google creates your account; there is no separate registration.",
    google: "Continue with Google", devLabel: "Local only",
    legal: "By continuing you accept the privacy notice.",
  },
  submit: {
    intro: { title: "Submit a paper", body: "An editor reads every submission in full; you are emailed when a decision is made." },
    next: ["An editor reads it in full", "You hear back by email", "Accepted papers publish"],
    authorsHint: "As they should be cited: S. Ito, K. Mamatov",
    abstractHint: "States the question, the method and the finding.",
    fileHint: "Drop a PDF here, or choose a file. Up to 10 MB.",
    action: "Send for review", pending: "Sending…",
  },
  submissions: { title: "My submissions", emptyTitle: "No submissions yet", emptyBody: "Your papers and their review status will appear here.",
                 noteLabel: "Editor's note", revise: "Submit a revision" },
  notifications: { title: "Notifications", markAll: "Mark all as read", emptyTitle: "Nothing new", emptyBody: "Decisions on your papers will appear here." },
  notFound: { title: "Nothing at this address", body: "The page may have moved. The papers are all still here.",
              paperTitle: "No paper at this address", paperBody: "It may have been renamed or withdrawn." },
  error: { title: "Something went wrong", body: "The fault is on our side. Trying again usually works." },
  footer: { credit: "An independent review of scholarship on Central Asia, published by Freshman Academy." },
} as const;
```

(Existing strings not listed here that pages still need, e.g. privacy section text, the admin users intro, the submissions note fallback, stay where they are today.)

## Appendix B — `globals.css` skeleton (Foundation; key mechanics, verbatim intent)

```css
@import "tailwindcss";

@theme {
  /* §3.1 colours, all light-dark(): */
  --color-page: light-dark(#faf9f5, #141413);
  --color-surface-1: light-dark(#f5f4ed, #1f1e1d);
  /* … every token in §3.1 … */
  --font-serif: var(--font-source-serif), "Iowan Old Style", Georgia, serif;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, monospace;
  --text-display: clamp(2.75rem, 1.9143rem + 3.4286vw, 5rem);
  --text-display--line-height: 1.02;  --text-display--letter-spacing: -0.022em;
  /* … every token in §2.2 … */
  --radius-xs: 6px; --radius-sm: 12px; --radius-md: 20px; --radius-lg: 28px;
  --ease-out-quart: cubic-bezier(.165,.84,.44,1); /* … §6.1 … */
}
@media (max-width: 767px) { :root { --radius-md: 16px; --radius-lg: 24px; } }

:root { color-scheme: light dark; --dur-draw: 1100ms; --stagger-path: 80ms; --header-h: 64px; /* … */ }
@media (min-width: 1024px) { :root { --header-h: 72px; } }
:root[data-theme="light"] { color-scheme: light; }  :root[data-theme="dark"] { color-scheme: dark; }

/* Plate tones (§3.3) */
.plate-heather { --plate: light-dark(#cbcadb, #4a4870); --plate-ink: light-dark(#141413, #faf9f5); }
/* … sky, cactus, sage, peach, apricot, wheat, coral … */
[class*="plate-"] { --plate-dot: color-mix(in srgb, var(--plate-ink) 60%, transparent); }

/* Drawings (§5.5) */
[data-ill] [data-s] { stroke-dasharray: 1; stroke-dashoffset: 0; stroke-width: var(--sw); }
@media (max-width: 767px) { [data-ill] [data-s] { stroke-width: var(--sw-sm, var(--sw)); } }
[data-ill] [data-d] { fill: var(--dot); }
[data-draw="pending"] [data-s] { stroke-dashoffset: 1; }
[data-draw="pending"] [data-d] { opacity: 0; }
[data-draw="in"] [data-s] { transition: stroke-dashoffset var(--dur-draw) var(--ease-draw) calc(var(--draw-delay, 0ms) + var(--i) * var(--stagger-path)); }
[data-draw="in"] [data-d] { transition: opacity 300ms var(--ease-out-quart) calc(var(--draw-delay, 0ms) + var(--draw-total, 1400ms)); }
@keyframes draw { from { stroke-dashoffset: 1; } }
@keyframes reink { from { stroke-dashoffset: .15; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: no-preference) {
  [data-draw-mode="load"] [data-s],
  html[data-first-visit] .mark-draw [data-s] { animation: draw var(--dur-draw) var(--ease-draw) both;
    animation-delay: calc(var(--draw-delay, 0ms) + var(--i) * var(--stagger-path)); }
}

@media (hover: hover) and (pointer: fine) {
  @media (prefers-reduced-motion: no-preference) {
    .plate-link { transition: transform 300ms var(--ease-apple); }
    .plate-link:hover { transform: scale(1.016); }
    .plate-link:is(:hover, :focus-visible) [data-s] { animation: reink 600ms var(--ease-out-quart) calc(var(--i) * 40ms) both; }
  }
  .plate-link:is(:hover, :focus-visible) [data-d] { fill: var(--color-accent-mark); transition: fill 200ms; }
  .row:hover::before { opacity: 1; }
  .row:is(:hover, :focus-within) .row-snippet { opacity: 1; }
}

@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .ridge { animation: ridge-drift linear both; animation-timeline: scroll(root); animation-range: 0 100vh; }
    .site-header { border-bottom-color: transparent; animation: head-glass linear both; animation-timeline: scroll(root); animation-range: 0 48px; }
    .progress-contour { display: block; }
    .progress-contour path { animation: draw linear both; animation-timeline: scroll(root); }
    .sticky-seq { timeline-scope: --step-1, --step-2, --step-3; }
    .sticky-seq [data-step="1"] { view-timeline: --step-1 block; } /* 2, 3 likewise */
    .sticky-seq [data-stage="1"] { animation: draw linear both; animation-timeline: --step-1; animation-range: entry 0% cover 40%; }
    /* stage 2, 3 likewise */
  }
}
@keyframes ridge-drift { to { transform: translateY(-40px); } }
/* base: .site-header { background: var(--color-page); border-bottom: 1px solid var(--color-rule-2); backdrop-filter: saturate(180%) blur(16px); } */
.progress-contour { display: none; }
@keyframes head-glass { to { background-color: color-mix(in srgb, var(--color-page) 86%, transparent); border-bottom-color: var(--color-rule-2); } }

/* View transitions (§6.4) */
::view-transition-old(root), ::view-transition-new(root) { animation: none; }
:root:active-view-transition-type(theme)::view-transition-old(root) { animation: 200ms var(--ease-out-quart) both vt-fade-out; }
:root:active-view-transition-type(theme)::view-transition-new(root) { animation: 340ms var(--ease-out-quart) both vt-fade-in; }
::view-transition-group(.paper-title) { animation-duration: 320ms; animation-timing-function: var(--ease-in-out); }
::view-transition-group(.plate) { animation-duration: 420ms; animation-timing-function: var(--ease-in-out); }

/* Reduced motion: §6.5 block, verbatim. Print: today's block, recoloured to white/ink. */
```
