"use client";

import type { ComponentProps } from "react";
import { Sidebar } from "./Sidebar";
import { ConfigDrawer } from "./ConfigDrawer";

interface Props extends ComponentProps<typeof Sidebar> {
  /** Lets the page reserve space beside the drawer (push layout) when it opens. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state -- lets a button elsewhere on the page open the drawer. */
  open?: boolean;
}

/** Chat tab's configuration drawer -- Sidebar's content inside the shared ConfigDrawer shell. */
export function SidebarDrawer({ onOpenChange, open, ...sidebarProps }: Props) {
  return (
    <ConfigDrawer onOpenChange={onOpenChange} open={open}>
      <Sidebar {...sidebarProps} />
    </ConfigDrawer>
  );
}
