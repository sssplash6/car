import { PageShell } from "@/app/_components/PageShell";

// Streaming skeleton for the papers index. Static ghosts, deliberately not
// pulsing: the motion doctrine says nothing loops, and on the usual fast
// response this frame is visible for a blink — structure is enough. The
// shapes mirror PaperRow's grid so the swap to real rows causes no shift.
export default function Loading() {
  return (
    <PageShell>
      <p className="sr-only" role="status">
        Loading the papers…
      </p>
      <div aria-hidden="true">
        <div className="h-11 w-48 rounded-sm bg-rule/70" />
        <div className="mt-5 h-4 w-80 max-w-full rounded-sm bg-rule/45" />
        <div className="mt-10 border-t border-rule">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid gap-5 border-b border-rule py-7 sm:grid-cols-[9rem_1fr] sm:gap-7"
            >
              <div className="aspect-3/2 rounded-sm bg-rule/45 sm:aspect-4/3" />
              <div className="min-w-0">
                <div className="h-6 w-3/4 rounded-sm bg-rule/60" />
                <div className="mt-3 h-4 w-44 rounded-sm bg-rule/40" />
                <div className="mt-4 h-4 w-full rounded-sm bg-rule/35" />
                <div className="mt-2 h-4 w-2/3 rounded-sm bg-rule/35" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
