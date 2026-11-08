import { ViewTransition } from "react";

// Every page change is one quiet cross-fade of the content (the old page leaves
// in 140ms, the new one arrives over 260ms with an 8px rise), while the header
// and footer hold still: they sit outside this boundary, in the root snapshot.
//
// A template, not a layout: Next gives it a fresh instance whenever the
// top-level segment changes, which is exactly what makes the old page "exit"
// and the new one "enter" — and Next's own scroll-to-#hash keeps working. A
// search or filter on the same page, and moving between the editor's desk
// tabs, stay in place without a fade.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="page">{children}</div>
    </ViewTransition>
  );
}
