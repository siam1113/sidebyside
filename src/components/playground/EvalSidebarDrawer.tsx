"use client";

import type { ComponentProps } from "react";
import { EvalSidebar } from "./EvalSidebar";
import { ConfigDrawer } from "./ConfigDrawer";

interface Props extends ComponentProps<typeof EvalSidebar> {
  /** Lets the page reserve space beside the drawer (push layout) when it opens. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state -- lets a button elsewhere on the page open the drawer. */
  open?: boolean;
}

/** Evaluation tab's configuration drawer -- EvalSidebar's content inside the shared ConfigDrawer shell. */
export function EvalSidebarDrawer({ onOpenChange, open, ...sidebarProps }: Props) {
  return (
    <ConfigDrawer onOpenChange={onOpenChange} open={open}>
      <EvalSidebar {...sidebarProps} />
    </ConfigDrawer>
  );
}
