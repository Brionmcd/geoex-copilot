"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getSystemIcon, getSystemLabel } from "@/lib/icons";
import type { SystemId } from "@/lib/data/types";

interface SystemBadgeProps {
  systemId: SystemId;
  size?: "sm" | "md";
}

export function SystemBadge({ systemId, size = "sm" }: SystemBadgeProps) {
  const Icon = getSystemIcon(systemId);
  const label = getSystemLabel(systemId);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 text-stone-600 font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      )}
    >
      <Icon className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {label}
    </span>
  );
}
