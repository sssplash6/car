// Standard reading measure for interior pages.
//
// The root layout deliberately does NOT constrain width, so the homepage can run
// full-bleed sections. Every other page wraps its content in this instead, which
// keeps one definition of the measure rather than repeating the classes.
export function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  /** Admin tables need more room than a column of prose. */
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full px-6 py-12 ${wide ? "max-w-5xl" : "max-w-3xl"}`}
    >
      {children}
    </div>
  );
}
