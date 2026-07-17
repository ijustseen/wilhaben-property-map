"use client";

import { useEffect, useState } from "react";

/** Matches CSS breakpoint where burger replaces inline header actions. */
export const COMPACT_HEADER_MAX_WIDTH = 900;

export function useCompactHeader(
  maxWidth = COMPACT_HEADER_MAX_WIDTH,
): boolean {
  const query = `(max-width: ${maxWidth}px)`;
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return compact;
}
