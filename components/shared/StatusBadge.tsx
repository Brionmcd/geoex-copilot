import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusColorMap: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "bg-green-100", text: "text-green-800" },
  complete: { bg: "bg-green-100", text: "text-green-800" },
  completed: { bg: "bg-green-100", text: "text-green-800" },
  pass: { bg: "bg-green-100", text: "text-green-800" },
  active: { bg: "bg-green-100", text: "text-green-800" },
  good: { bg: "bg-green-100", text: "text-green-800" },
  healthy: { bg: "bg-green-100", text: "text-green-800" },
  pending: { bg: "bg-amber-100", text: "text-amber-800" },
  warning: { bg: "bg-amber-100", text: "text-amber-800" },
  in_progress: { bg: "bg-amber-100", text: "text-amber-800" },
  review: { bg: "bg-amber-100", text: "text-amber-800" },
  cancelled: { bg: "bg-red-100", text: "text-red-800" },
  critical: { bg: "bg-red-100", text: "text-red-800" },
  fail: { bg: "bg-red-100", text: "text-red-800" },
  failed: { bg: "bg-red-100", text: "text-red-800" },
  overdue: { bg: "bg-red-100", text: "text-red-800" },
  at_risk: { bg: "bg-red-100", text: "text-red-800" },
};

const defaultColors = { bg: "bg-stone-100", text: "text-stone-700" };

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colors = statusColorMap[status.toLowerCase()] || defaultColors;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        colors.bg,
        colors.text,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
