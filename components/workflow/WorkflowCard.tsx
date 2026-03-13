"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Zap, Clock, Eye, ArrowRight } from "lucide-react";
import type { WorkflowDefinition } from "@/lib/data/types";

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  onClick: (workflow: WorkflowDefinition) => void;
}

const statusDot: Record<string, string> = {
  automated: "bg-emerald-400",
  planned: "bg-amber-400",
  in_review: "bg-blue-400",
};

const statusLabel: Record<string, string> = {
  automated: "Automated",
  planned: "Planned",
  in_review: "In Review",
};

export function WorkflowCard({ workflow, onClick }: WorkflowCardProps) {
  return (
    <button
      onClick={() => onClick(workflow)}
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 text-left w-full",
        "transition-all duration-150 hover:border-stone-300 hover:shadow-sm",
        "active:scale-[0.995]"
      )}
    >
      {/* Status dot */}
      <span
        className={cn("h-2 w-2 rounded-full shrink-0", statusDot[workflow.status])}
        title={statusLabel[workflow.status]}
      />

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-stone-800 leading-snug truncate">
          {workflow.name}
        </h3>
        <p className="text-xs text-stone-400 mt-0.5 line-clamp-1 leading-relaxed">
          {workflow.description}
        </p>
      </div>

      {/* Right side: step count + arrow */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[11px] text-stone-400 font-medium tabular-nums">
          {workflow.steps.length} steps
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
