"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/icons";
import { SystemBadge } from "./SystemBadge";
import {
  X, Play, Zap, Clock, Eye, ChevronDown, ChevronUp,
  Table, CheckSquare, BarChart2, CreditCard, Layout,
  AlertTriangle, User, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { workflowCategories } from "@/lib/data/workflows";
import type { WorkflowDefinition, OutputType } from "@/lib/data/types";

interface WorkflowDetailPanelProps {
  workflow: WorkflowDefinition | null;
  open: boolean;
  onClose: () => void;
  onRun: (workflow: WorkflowDefinition) => void;
}

const statusConfig = {
  automated: { label: "Automated", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Zap },
  planned: { label: "Planned", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  in_review: { label: "In Review", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye },
};

const priorityConfig = {
  critical: { label: "Critical", color: "text-red-600 bg-red-50 border-red-200" },
  high: { label: "High", color: "text-amber-600 bg-amber-50 border-amber-200" },
  medium: { label: "Medium", color: "text-blue-600 bg-blue-50 border-blue-200" },
  low: { label: "Low", color: "text-stone-500 bg-stone-50 border-stone-200" },
};

const outputIcons: Record<OutputType, React.ElementType> = {
  table: Table,
  checklist: CheckSquare,
  chart: BarChart2,
  status_card: CreditCard,
  email_draft: FileText,
  dashboard: Layout,
  alert: AlertTriangle,
  customer_profile: User,
  narrative: FileText,
};

export function WorkflowDetailPanel({ workflow, open, onClose, onRun }: WorkflowDetailPanelProps) {
  const [showMeta, setShowMeta] = React.useState(false);

  if (!workflow) return null;

  const category = workflowCategories.find((c) => c.id === workflow.categoryId);
  const CatIcon = category ? getCategoryIcon(category.iconName) : null;
  const status = statusConfig[workflow.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[workflow.priority];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl border-l border-stone-200",
          "transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
            <div className="flex items-center gap-2">
              {category && CatIcon && (
                <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold border", category.color)}>
                  <CatIcon className="h-3.5 w-3.5" />
                  {category.label}
                </span>
              )}
              <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium", status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Title & description */}
            <div>
              <h2 className="text-lg font-bold text-stone-900 mb-1.5">{workflow.name}</h2>
              <p className="text-sm text-stone-500 leading-relaxed">{workflow.description}</p>
            </div>

            {/* Systems touched */}
            <div>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Systems Touched</h3>
              <div className="flex flex-wrap gap-1.5">
                {workflow.systems.map((sys) => (
                  <SystemBadge key={sys} systemId={sys} size="md" />
                ))}
              </div>
            </div>

            {/* Steps visualization */}
            <div>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Agent Steps ({workflow.steps.length})
              </h3>
              <div className="space-y-0">
                {workflow.steps.map((step, idx) => {
                  return (
                    <div key={step.id} className="flex gap-3">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 border border-stone-200 text-xs font-bold text-stone-500">
                          {idx + 1}
                        </div>
                        {idx < workflow.steps.length - 1 && (
                          <div className="w-px flex-1 bg-stone-200 my-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pb-4 pt-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-stone-800">{step.label}</p>
                          {step.systemId && (
                            <SystemBadge systemId={step.systemId} size="sm" />
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expected output */}
            <div>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Expected Output</h3>
              <div className="flex flex-wrap gap-1.5">
                {workflow.outputTypes.map((type) => {
                  const OutIcon = outputIcons[type] || FileText;
                  const label = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <span key={type} className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-600">
                      <OutIcon className="h-3 w-3" />
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Initiative metadata (collapsible) */}
            <div className="border-t border-stone-100 pt-4">
              <button
                onClick={() => setShowMeta(!showMeta)}
                className="flex items-center gap-2 text-xs font-semibold text-stone-400 uppercase tracking-wider hover:text-stone-600 transition-colors"
              >
                Initiative Details
                {showMeta ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showMeta && (
                <div className="mt-3 space-y-2.5 rounded-lg bg-stone-50 border border-stone-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">Priority</span>
                    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold", priority.color)}>
                      {priority.label}
                    </span>
                  </div>
                  {workflow.owner && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-500">Owner</span>
                      <span className="text-xs font-medium text-stone-700">{workflow.owner}</span>
                    </div>
                  )}
                  {workflow.lastReviewedDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-500">Last Reviewed</span>
                      <span className="text-xs font-medium text-stone-700">{workflow.lastReviewedDate}</span>
                    </div>
                  )}
                  {workflow.notes && (
                    <div className="pt-1 border-t border-stone-200">
                      <span className="text-xs text-stone-500">Notes</span>
                      <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{workflow.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer: Run button */}
          <div className="border-t border-stone-200 px-6 py-4">
            <Button
              onClick={() => onRun(workflow)}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white h-10 text-sm font-semibold"
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              Run Workflow
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
