// Rising clip reveal for the homepage hero image: the picture is unveiled from
// the ground up, like masonry going up, while a slight scale settles out. Used
// once per page at most, on load — this is ceremony, and ceremony repeated
// stops being ceremony.
//
// Pure CSS (globals.css: .clip-reveal / .clip-reveal-inner), so the ceremony
// plays with the first paint instead of waiting for hydration, and the SSR
// markup never ships a hidden hero. clip-path and transform only, so the
// reveal never causes layout. Composes with the ArchFrame clip on the child,
// since each clips its own element.
export function ClipReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Seconds. delay + 0.78s duration must stay inside the hero's 0.9s budget. */
  delay?: number;
  className?: string;
}) {
  const style = delay
    ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties)
    : undefined;

  return (
    <div className={`clip-reveal ${className ?? ""}`} style={style}>
      <div className="clip-reveal-inner h-full w-full">{children}</div>
    </div>
  );
}
