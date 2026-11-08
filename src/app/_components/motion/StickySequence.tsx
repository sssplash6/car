import { Drawing } from "@/app/_components/illustrations/Drawing";

// About's one scroll-bound drawing (DESIGN.md §8.16). On wide screens the
// tulip holds still in a sticky column while three steps scroll past; each
// step's view timeline draws one stage of it (stem and leaves → the cup → the
// open flower). Every step is ordinary, visible, focusable content; only the
// drawing is sticky. Without scroll timelines, below lg, or with reduced
// motion, the tulip simply draws once in view.
export function StickySequence({
  steps,
  label,
}: {
  steps: readonly { title: string; body: string }[];
  /** Accessible name of the list. */
  label: string;
}) {
  return (
    <div className="sticky-seq">
      <div className="sticky-seq-art">
        <Drawing name="tulip" size="xl" draw="scroll" className="seq-tulip" />
      </div>
      <ol className="sticky-seq-steps" aria-label={label}>
        {steps.map((step, i) => (
          <li key={step.title} className="seq-step" data-step={i + 1}>
            <p className="t-meta">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="t-h3 mt-3">{step.title}</h3>
            <p className="t-body mt-3 max-w-[34ch]">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
