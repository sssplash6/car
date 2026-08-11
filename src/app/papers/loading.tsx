// Streaming skeleton for the papers index. Static ghosts, deliberately not
// pulsing: the motion doctrine says nothing loops, and on the usual fast
// response this frame is visible for a blink — structure is enough. The
// shapes mirror the year-grouped catalogue grid so real rows land without
// shift.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <p className="sr-only" role="status">
        Loading the papers…
      </p>
      <div aria-hidden="true">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-7">
          <div>
            <div className="h-11 w-48 rounded-sm bg-rule/70" />
            <div className="mt-5 h-4 w-80 max-w-full rounded-sm bg-rule/45" />
          </div>
          <div className="h-10 w-full rounded-sm bg-rule/35 sm:max-w-sm" />
        </div>
        <div className="mt-14 grid gap-x-12 gap-y-2 lg:grid-cols-[10rem_1fr]">
          <div className="h-10 w-24 rounded-sm bg-rule/60" />
          <div>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[6.5rem_1fr] gap-5 border-b border-rule py-7 sm:grid-cols-[9rem_1fr] sm:gap-7"
              >
                <div className="aspect-4/3 rounded-sm bg-rule/45" />
                <div className="min-w-0 max-w-[65ch]">
                  <div className="h-6 w-3/4 rounded-sm bg-rule/60" />
                  <div className="mt-3 h-4 w-44 rounded-sm bg-rule/40" />
                  <div className="mt-4 h-4 w-full rounded-sm bg-rule/35" />
                  <div className="mt-2 h-4 w-2/3 rounded-sm bg-rule/35" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
