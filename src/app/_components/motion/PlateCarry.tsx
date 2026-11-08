import type { ReactNode } from "react";
import { Carry } from "./Carry";

// An issue's plate travels between pages: click the home plate and it becomes
// the /issues spread plate; click the paper page's issue chip and it grows
// into that plate. Sources (the home plate, the chip) carry on click;
// destinations (the /issues plates) carry always. Browsers without the View
// Transitions API get plain cuts.
export function PlateCarry({
  number,
  mode = "click",
  as = "div",
  children,
}: {
  number: number;
  mode?: "always" | "click";
  /** "span" for the inline chip. */
  as?: "div" | "span";
  children: ReactNode;
}) {
  return (
    <Carry name={`plate-${number}`} share="plate" mode={mode} as={as}>
      {children}
    </Carry>
  );
}
