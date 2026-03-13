"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Bookmark,
  Star,
  Trash2,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { workflows, workflowCategories, getFeaturedWorkflows, findWorkflowByPrompt } from "@/lib/data/workflows";
import type { UserRole, WorkflowDefinition } from "@/lib/data/types";

interface CustomWorkflow {
  id: string;
  label: string;
  prompt: string;
  createdAt: string;
}

interface SuggestedPromptsProps {
  userRole: UserRole;
  onPromptClick: (prompt: string) => void;
  onOpenLibrary?: () => void;
  onRunWorkflow?: (workflow: WorkflowDefinition) => void;
}

const CUSTOM_WORKFLOWS_KEY = "geoex-custom-workflows";

function loadCustomWorkflows(): CustomWorkflow[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_WORKFLOWS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomWorkflows(wfs: CustomWorkflow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_WORKFLOWS_KEY, JSON.stringify(wfs));
}

export function SuggestedPrompts({
  userRole,
  onPromptClick,
  onOpenLibrary,
  onRunWorkflow,
}: SuggestedPromptsProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customWorkflows, setCustomWorkflows] = useState<CustomWorkflow[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomWorkflows(loadCustomWorkflows());
  }, []);

  const handleCreateWorkflow = () => {
    if (!newLabel.trim() || !newPrompt.trim()) return;
    const newWf: CustomWorkflow = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      prompt: newPrompt.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...customWorkflows, newWf];
    setCustomWorkflows(updated);
    saveCustomWorkflows(updated);
    setNewLabel("");
    setNewPrompt("");
    setShowCreateForm(false);
  };

  const handleDeleteWorkflow = (id: string) => {
    const updated = customWorkflows.filter((w) => w.id !== id);
    setCustomWorkflows(updated);
    saveCustomWorkflows(updated);
  };

  const handlePromptClick = (prompt: string) => {
    // Check if this matches a workflow for progress tracking
    if (onRunWorkflow) {
      const workflow = findWorkflowByPrompt(prompt);
      if (workflow) {
        onRunWorkflow(workflow);
        setExpanded(false);
        return;
      }
    }
    onPromptClick(prompt);
    setExpanded(false);
  };

  // Featured workflows for quick-access chips
  const featured = getFeaturedWorkflows();

  return (
    <div className="space-y-2">
      {/* Quick-access chips row */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-stone-400 mr-0.5" />

        {/* Custom workflows first */}
        {customWorkflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => handlePromptClick(wf.prompt)}
            className={cn(
              "group/chip inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5",
              "text-xs font-medium text-amber-700 shadow-sm",
              "transition-all hover:border-amber-300 hover:bg-amber-100 hover:shadow",
              "active:scale-[0.98]"
            )}
          >
            <Bookmark className="h-3 w-3" />
            {wf.label}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteWorkflow(wf.id);
              }}
              className="hidden group-hover/chip:inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-amber-200 ml-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </button>
        ))}

        {/* Featured quick-access prompts */}
        {featured.map((wf) => (
          <button
            key={wf.id}
            onClick={() => handlePromptClick(wf.prompt)}
            className={cn(
              "inline-flex items-center rounded-full border border-stone-200 bg-white px-3.5 py-1.5",
              "text-xs font-medium text-stone-600 shadow-sm",
              "transition-all hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800 hover:shadow",
              "active:scale-[0.98]"
            )}
          >
            {wf.chipLabel}
          </button>
        ))}

        {/* Expand / Collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5",
            "text-xs font-medium text-stone-500 shadow-sm",
            "transition-all hover:border-stone-300 hover:bg-stone-50 hover:text-stone-700 hover:shadow",
            expanded && "bg-stone-100 border-stone-300 text-stone-700"
          )}
        >
          {expanded ? (
            <>
              Less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              All Workflows <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      </div>

      {/* Expanded workflow browser */}
      {expanded && (
        <div className="mx-auto max-w-4xl rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          {/* Category tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-100 px-3 py-2 pb-2.5 scrollbar-thin">
            {workflowCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.iconName);
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setActiveCategory(isActive ? null : cat.id)
                  }
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? cat.color + " border"
                      : "text-stone-500 hover:bg-stone-50 hover:text-stone-700 border border-transparent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}

            {/* View full library link */}
            {onOpenLibrary && (
              <button
                onClick={onOpenLibrary}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all text-stone-400 hover:bg-stone-50 hover:text-stone-600 border border-transparent ml-auto mr-1"
              >
                <Library className="h-3.5 w-3.5" />
                Full Library
              </button>
            )}

            {/* Create custom workflow button */}
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setActiveCategory(null);
                setTimeout(() => labelInputRef.current?.focus(), 100);
              }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                showCreateForm
                  ? "text-amber-700 bg-amber-50 border border-amber-200"
                  : "text-amber-600 hover:bg-amber-50 hover:text-amber-700 border border-transparent"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Workflow
            </button>
          </div>

          {/* Create custom workflow form */}
          {showCreateForm && (
            <div className="border-b border-stone-100 bg-amber-50/30 p-3">
              <div className="flex flex-col gap-2 max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-stone-700">
                    Save a custom workflow
                  </span>
                </div>
                <input
                  ref={labelInputRef}
                  type="text"
                  placeholder="Workflow name (e.g., Monday standup)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300"
                />
                <textarea
                  placeholder="Prompt (e.g., Run my Monday morning standup: show trips departing this week, overdue items, and team workload)"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={2}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewLabel("");
                      setNewPrompt("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-brand-amber hover:bg-amber-800 text-white"
                    disabled={!newLabel.trim() || !newPrompt.trim()}
                    onClick={handleCreateWorkflow}
                  >
                    <Bookmark className="h-3 w-3 mr-1" />
                    Save Workflow
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Workflow prompts grid — uses central data */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {activeCategory ? (
              <div>
                {(() => {
                  const catWorkflows = workflows.filter((w) => w.categoryId === activeCategory);
                  return (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {catWorkflows.map((wf) => (
                        <button
                          key={wf.id}
                          onClick={() => handlePromptClick(wf.prompt)}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border border-stone-150 bg-stone-50/50 p-2.5 text-left",
                            "transition-all hover:bg-white hover:border-stone-300 hover:shadow-sm",
                            "active:scale-[0.99]"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-stone-800 leading-tight">
                              {wf.chipLabel}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-2 leading-tight">
                              {wf.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : !showCreateForm ? (
              <div className="space-y-3">
                {workflowCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.iconName);
                  const catWorkflows = workflows.filter((w) => w.categoryId === cat.id);
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className="h-3 w-3 text-stone-400" />
                        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {catWorkflows.map((wf) => (
                          <button
                            key={wf.id}
                            onClick={() => handlePromptClick(wf.prompt)}
                            className={cn(
                              "inline-flex items-center rounded-full border border-stone-150 bg-stone-50/50 px-2.5 py-1",
                              "text-[11px] font-medium text-stone-600",
                              "transition-all hover:bg-white hover:border-stone-300 hover:text-stone-800 hover:shadow-sm",
                              "active:scale-[0.98]"
                            )}
                          >
                            {wf.chipLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Custom workflows section */}
                {customWorkflows.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                        My Workflows
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {customWorkflows.map((wf) => (
                        <div
                          key={wf.id}
                          className="group/cw inline-flex items-center gap-1"
                        >
                          <button
                            onClick={() => handlePromptClick(wf.prompt)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1",
                              "text-[11px] font-medium text-amber-700",
                              "transition-all hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm",
                              "active:scale-[0.98]"
                            )}
                          >
                            <Bookmark className="h-2.5 w-2.5" />
                            {wf.label}
                          </button>
                          <button
                            onClick={() => handleDeleteWorkflow(wf.id)}
                            className="hidden group-hover/cw:inline-flex h-4 w-4 items-center justify-center rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
