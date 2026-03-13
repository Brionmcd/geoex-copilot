"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/icons";
import { SystemBadge } from "./SystemBadge";
import { ChevronRight, Zap, Clock, Eye } from "lucide-react";
import type { WorkflowDefinition, WorkflowCategory } from "@/lib/data/types";

interface WorkflowCardProps {
  workflow: WorkflowDefinition;
  category: WorkflowCategory;
  onClick: (workflow: WorkflowDefinition) => void;
}

const statusConfig = {
  automated: { label: "Automated", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Zap },
  planned: { label: "Planned", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  in_review: { label: "In Review", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye },
};

const priorityColors = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-400",
  low: "bg-stone-300",
};

export function WorkflowCard({ workflow, category, onClick }: WorkflowCardProps) {
  const CatIcon = getCategoryIcon(category.iconName);
  const status = statusConfig[workflow.status];
  const StatusIcon = status.icon;

  return (
    <button
      onClick={() => onClick(workflow)}
      className={cn(
        "group flex flex-col gap-2.5 rounded-xl border border-stone-200 bg-white p-4 text-left",
        "transition-all hover:border-stone-300 hover:shadow-md hover:-translate-y-0.5",
        "active:scale-[0.99] active:shadow-sm"
      )}
    >
      {/* Top row: category + status + priority */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border", category.color)}>
            <CatIcon className="h-2.5 w-2.5" />
            {category.label}
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", status.color)}>
            <StatusIcon className="h-2.5 w-2.5" />
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", priorityColors[workflow.priority])} title={`${workflow.priority} priority`} />
          <ChevronRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-stone-500 transition-colors" />
        </div>
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-stone-900 leading-tight">
        {workflow.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
        {workflow.description}
      </p>

      {/* Bottom: systems + steps */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-1">
          {workflow.systems.slice(0, 3).map((sys) => (
            <SystemBadge key={sys} systemId={sys} size="sm" />
          ))}
          {workflow.systems.length > 3 && (
            <span className="text-[10px] text-stone-400 font-medium self-center">
              +{workflow.systems.length - 3}
            </span>
          )}
        </div>
        <span className="text-[10px] text-stone-400 font-medium whitespace-nowrap">
          {workflow.steps.length} steps
        </span>
      </div>
    </button>
  );
}
