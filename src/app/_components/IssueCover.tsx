import {
  PatternField,
  Rosette,
  WovenTrim,
} from "@/app/_components/Ornament";

// An issue's cover: the brand object the archive shelves. The homepage opens
// the journal's cover at full bleed; this is the same material bound small —
// museum mount, woven headband, night-tile field, parchment numeral, the
// press's rosette at the foot. A sealed volume.
//
// The OPEN quarter inverts the metaphor on purpose: not yet bound, so it is
// a parchment plate in a dashed frame — pages still gathering — rather than
// a night cover. Everything is existing vocabulary (surface-night scoping,
// WovenTrim, PatternField, Rosette, oldstyle numerals), so both themes work
// by construction and the whole thing is server-rendered.
//
// The decorative thread cycles by issue number so a shelf of covers reads as
// a run of volumes, not one cover repeated.
const THREADS = ["text-tile", "text-gild", "text-ember"] as const;

export function IssueCover({
  number,
  label,
  paperCount,
  open = false,
  anchorId,
  className,
  headingLevel: Heading = "h2",
}: {
  number: number;
  label: string;
  paperCount: number;
  /** The quarter still gathering papers — unbound, parchment, dashed. */
  open?: boolean;
  /** id for the numeral heading, so sections can aria-labelledby it. */
  anchorId?: string;
  className?: string;
  /** The shelf lists volumes under its own heading, so its covers are h3s. */
  headingLevel?: "h2" | "h3" | "p";
}) {
  const thread = THREADS[number % THREADS.length];

  return (
    <div
      className={`shadow-plate w-full border border-rule-strong bg-surface p-1.5 ${className ?? "max-w-[13rem]"}`}
    >
      <div
        className={
          open
            ? "relative flex aspect-3/4 flex-col items-center overflow-hidden border border-dashed border-rule-strong bg-surface text-center"
            : "surface-night relative flex aspect-3/4 flex-col items-center overflow-hidden text-center"
        }
      >
        {!open && <WovenTrim />}
        <PatternField className={`${thread} ${open ? "opacity-[0.05]" : "opacity-[0.07]"}`} />

        <div className="relative flex h-full flex-col items-center justify-between px-4 pb-5 pt-6">
          <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-muted-fg">
            Central Asian Review
          </p>

          <div>
            <Heading
              id={anchorId}
              className="oldstyle-nums font-serif text-5xl leading-none tracking-tight text-ink"
            >
              <span className="mr-1 align-top text-[0.45em] leading-none">№</span>
              {number}
            </Heading>
            <p className="mt-2.5 font-serif text-lg leading-tight text-ink-soft">
              {label}
            </p>
            <p className="mt-1.5 text-xs text-muted-fg">
              {paperCount} paper{paperCount === 1 ? "" : "s"}
            </p>
          </div>

          <Rosette className={`size-7 ${open ? "text-rule-strong" : "text-gild"}`} />
        </div>
      </div>
    </div>
  );
}
