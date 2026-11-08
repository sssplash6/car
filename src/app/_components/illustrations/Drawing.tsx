import { DRAWINGS } from "./index";
import { DrawingFrom, type DrawingProps } from "./render";

// <Drawing>: the one renderer for every line drawing on the site (DESIGN.md
// §5.2, §5.5). A server component, so drawing data never ships as client code.
//
// The SVG is complete in the server HTML: every stroke drawn, every dot shown.
// Motion only subtracts after hydration, and only for drawings still below the
// fold (DrawSvg → useReveal), so crawlers, no-JS readers and reduced motion all
// get the finished drawing.
//
//   draw="view"   draws on first scroll-in (default)
//   draw="load"   draws on first paint, pure CSS
//   draw="scroll" About's tulip: stages bound to the sticky steps' timelines
//   draw="none"   static

export function Drawing({ name, ...props }: DrawingProps) {
  return <DrawingFrom data={DRAWINGS[name]} name={name} {...props} />;
}

export { DrawingFrom };
