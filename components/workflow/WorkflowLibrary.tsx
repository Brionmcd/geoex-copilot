"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/icons";
import { WorkflowCard } from "./WorkflowCard";
import { WorkflowDetailPanel } from "./WorkflowDetailPanel";
import { workflows, workflowCategories, getWorkflowStats } from "@/lib/data/workflows";
import { Search, Zap, Clock, Eye } from "lucide-react";
import type { WorkflowDefinition, WorkflowStatus } from "@/lib/data/types";

interface WorkflowLibraryProps {
  onRunWorkflow: (workflow: WorkflowDefinition) => void;
}

export function WorkflowLibrary({ onRunWorkflow }: WorkflowLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const stats = useMemo(() => getWorkflowStats(), []);

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      if (activeCategory && w.categoryId !== activeCategory) return false;
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.chipLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, activeCategory, statusFilter]);

  // Group filtered workflows by category for the "All" view
  const groupedByCategory = useMemo(() => {
    if (activeCategory) return null;
    const groups: { category: (typeof workflowCategories)[0]; workflows: WorkflowDefinition[] }[] = [];
    for (const cat of workflowCategories) {
      const catWorkflows = filtered.filter((w) => w.categoryId === cat.id);
      if (catWorkflows.length > 0) {
        groups.push({ category: cat, workflows: catWorkflows });
      }
    }
    return groups;
  }, [filtered, activeCategory]);

  const handleCardClick = (workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow);
    setDetailOpen(true);
  };

  const handleRun = (workflow: WorkflowDefinition) => {
    setDetailOpen(false);
    onRunWorkflow(workflow);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="max-w-5xl mx-auto">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Workflow Library</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {stats.total} workflows across {workflowCategories.length} categories
              </p>
            </div>

            {/* Status summary pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter(statusFilter === "automated" ? "all" : "automated")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
                  statusFilter === "automated"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "text-stone-500 border-stone-200 hover:bg-stone-50"
                )}
              >
                <Zap className="h-3 w-3" />
                {stats.automated} Automated
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "planned" ? "all" : "planned")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
                  statusFilter === "planned"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "text-stone-500 border-stone-200 hover:bg-stone-50"
                )}
              >
                <Clock className="h-3 w-3" />
                {stats.planned} Planned
              </button>
              {stats.inReview > 0 && (
                <button
                  onClick={() => setStatusFilter(statusFilter === "in_review" ? "all" : "in_review")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
                    statusFilter === "in_review"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "text-stone-500 border-stone-200 hover:bg-stone-50"
                  )}
                >
                  <Eye className="h-3 w-3" />
                  {stats.inReview} In Review
                </button>
              )}
            </div>
          </div>

          {/* Search + category filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 focus:border-stone-300 focus:bg-white transition-colors"
              />
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-stone-200" />

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
                  !activeCategory
                    ? "bg-stone-900 text-white border-stone-900"
                    : "text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-700"
                )}
              >
                All
              </button>
              {workflowCategories.map((cat) => {
                const Icon = getCategoryIcon(cat.iconName);
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(isActive ? null : cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
                      isActive
                        ? cat.color + " border"
                        : "text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-700"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow list */}
      <div className="flex-1 overflow-y-auto bg-stone-50/50 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <Search className="h-8 w-8 mb-3" />
              <p className="text-sm font-medium">No workflows match your filters</p>
              <p className="text-xs mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : activeCategory ? (
            /* Flat list when a specific category is selected */
            <div className="space-y-2">
              {filtered.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          ) : groupedByCategory ? (
            /* Grouped by category when showing "All" */
            <div className="space-y-8">
              {groupedByCategory.map(({ category, workflows: catWorkflows }) => {
                const Icon = getCategoryIcon(category.iconName);
                return (
                  <section key={category.id}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Icon className="h-4 w-4 text-stone-400" />
                      <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        {category.label}
                      </h3>
                      <span className="text-[10px] text-stone-300 font-medium">
                        {catWorkflows.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {catWorkflows.map((workflow) => (
                        <WorkflowCard
                          key={workflow.id}
                          workflow={workflow}
                          onClick={handleCardClick}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Detail panel */}
      <WorkflowDetailPanel
        workflow={selectedWorkflow}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRun={handleRun}
      />
    </div>
  );
}
