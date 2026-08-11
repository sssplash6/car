"use client";

import { useEffect } from "react";

// Strips the query string once a one-shot banner (e.g. ?submitted=1) has
// rendered, so a refresh, bookmark, or back-navigation does not replay a
// message about something that happened once.
export function CleanQuery() {
  useEffect(() => {
    if (location.search) {
      history.replaceState(null, "", location.pathname);
    }
  }, []);

  return null;
}
