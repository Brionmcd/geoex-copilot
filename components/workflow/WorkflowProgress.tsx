"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2, Circle } from "lucide-react";
import { SystemBadge } from "./SystemBadge";
import type { WorkflowDefinition } from "@/lib/data/types";

export interface WorkflowProgressState {
  workflow: WorkflowDefinition;
  completedStepIds: string[];
  currentStepId: string | null;
  isComplete: boolean;
}

interface WorkflowProgressProps {
  progress: WorkflowProgressState;
}

export function WorkflowProgress({ progress }: WorkflowProgressProps) {
  const { workflow, completedStepIds, currentStepId, isComplete } = progress;

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
          Workflow
        </span>
        <span className="text-xs font-semibold text-stone-700">{workflow.name}</span>
        {isComplete && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            <Check className="h-2.5 w-2.5" />
            Complete
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {workflow.steps.map((step, idx) => {
          const isCompleted = completedStepIds.includes(step.id);
          const isCurrent = step.id === currentStepId;
          const isPending = !isCompleted && !isCurrent;

          return (
            <div key={step.id} className="flex gap-2.5">
              {/* Icon column */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full transition-all",
                    isCompleted && "bg-emerald-100 text-emerald-600",
                    isCurrent && "bg-amber-100 text-amber-600",
                    isPending && "bg-stone-100 text-stone-300"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Circle className="h-2.5 w-2.5" />
                  )}
                </div>
                {idx < workflow.steps.length - 1 && (
                  <div
                    className={cn(
                      "w-px flex-1 my-0.5",
                      isCompleted ? "bg-emerald-200" : "bg-stone-200"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-2 pt-0 min-w-0 flex-1", idx === workflow.steps.length - 1 && "pb-0")}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isCompleted && "text-emerald-700",
                      isCurrent && "text-amber-700",
                      isPending && "text-stone-400"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.systemId && (isCurrent || isCompleted) && (
                    <SystemBadge systemId={step.systemId} size="sm" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
