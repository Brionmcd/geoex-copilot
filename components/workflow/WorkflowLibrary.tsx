"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/icons";
import { WorkflowCard } from "./WorkflowCard";
import { WorkflowDetailPanel } from "./WorkflowDetailPanel";
import { workflows, workflowCategories, getWorkflowStats } from "@/lib/data/workflows";
import { Search, Zap, Clock, Eye, LayoutGrid, List } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      {/* Stats bar */}
      <div className="border-b border-stone-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-stone-900">Workflow Library</h2>
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">{stats.total} workflows</span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-emerald-500" />
                {stats.automated} automated
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                {stats.planned} planned
              </span>
              {stats.inReview > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-blue-500" />
                  {stats.inReview} in review
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid" ? "bg-stone-100 text-stone-700" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list" ? "bg-stone-100 text-stone-700" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-stone-100 bg-white px-6 py-2.5">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 focus:border-stone-300 focus:bg-white"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border",
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
                    "flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border",
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

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WorkflowStatus | "all")}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-medium text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-300"
          >
            <option value="all">All Status</option>
            <option value="automated">Automated</option>
            <option value="planned">Planned</option>
            <option value="in_review">In Review</option>
          </select>
        </div>
      </div>

      {/* Workflow grid */}
      <div className="flex-1 overflow-y-auto bg-stone-50 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          {/* Category description when filtered */}
          {activeCategory && (
            <div className="mb-4">
              {workflowCategories
                .filter((c) => c.id === activeCategory)
                .map((cat) => {
                  const Icon = getCategoryIcon(cat.iconName);
                  return (
                    <div key={cat.id} className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-stone-400" />
                      <h3 className="text-sm font-semibold text-stone-700">{cat.label}</h3>
                      {cat.description && (
                        <span className="text-xs text-stone-400 ml-1">— {cat.description}</span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <Search className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">No workflows match your filters</p>
              <p className="text-xs mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((workflow) => {
                const cat = workflowCategories.find((c) => c.id === workflow.categoryId)!;
                return (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    category={cat}
                    onClick={handleCardClick}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((workflow) => {
                const cat = workflowCategories.find((c) => c.id === workflow.categoryId)!;
                const CatIcon = getCategoryIcon(cat.iconName);
                const status = { automated: "emerald", planned: "amber", in_review: "blue" }[workflow.status];
                return (
                  <button
                    key={workflow.id}
                    onClick={() => handleCardClick(workflow)}
                    className="w-full flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-left hover:border-stone-300 hover:shadow-sm transition-all"
                  >
                    <CatIcon className={cn("h-4 w-4 shrink-0", cat.color.split(" ")[0])} />
                    <span className="text-sm font-medium text-stone-800 flex-1 min-w-0 truncate">{workflow.name}</span>
                    <span className="text-xs text-stone-400 hidden sm:block truncate max-w-[200px]">{workflow.description}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("h-1.5 w-1.5 rounded-full", `bg-${status}-500`)} />
                      <span className="text-[10px] text-stone-400">{workflow.steps.length} steps</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
