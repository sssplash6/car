// Streaming skeleton for the issues archive. Static ghosts (nothing loops per
// the motion doctrine), shaped like the issue spread — numeral column beside a
// ruled list — so the real content lands without shift.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="sr-only" role="status">
        Loading the issues…
      </p>
      <div aria-hidden="true">
        <div className="h-4 w-24 rounded-sm bg-rule/45" />
        <div className="mt-5 h-11 w-40 rounded-sm bg-rule/70" />
        <div className="mt-6 h-4 w-96 max-w-full rounded-sm bg-rule/45" />
        <div className="mt-12 grid gap-6 border-t border-rule py-12 lg:grid-cols-[15rem_1fr] lg:gap-12">
          <div>
            <div className="h-14 w-28 rounded-sm bg-rule/60" />
            <div className="mt-4 h-5 w-32 rounded-sm bg-rule/45" />
          </div>
          <div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-b border-rule py-5 first:pt-0">
                <div className="h-6 w-2/3 rounded-sm bg-rule/60" />
                <div className="mt-3 h-4 w-52 rounded-sm bg-rule/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
