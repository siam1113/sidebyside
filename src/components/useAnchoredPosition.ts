"use client";

import { useEffect, useState, type RefObject } from "react";

interface AnchoredPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * Tracks an anchor element's viewport rect while `open` is true, for portal-rendered dropdowns
 * that need to escape a scrolling/animated ancestor (see ModelMultiSelect/GatewayMultiSelect --
 * without this, a dropdown positioned relative to its own section can render behind a later
 * sibling section once that ancestor establishes its own stacking context).
 */
export function useAnchoredPosition(anchorRef: RefObject<HTMLElement | null>, open: boolean): AnchoredPosition | null {
  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  useEffect(() => {
    if (!open) return;
    function update() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    update();
    // `true` (capture) so scroll events from any nested scrollable ancestor (e.g. the
    // drawer's own overflow-y-auto panel) are caught too -- scroll doesn't bubble, but
    // capturing on window still sees it on the way down.
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  // Stale coordinates from the last time it was open are harmless -- every caller only
  // reads this while `open` is also true, and `update()` above refreshes it immediately
  // on reopen anyway.
  return open ? position : null;
}
