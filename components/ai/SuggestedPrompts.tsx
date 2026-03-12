"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Bookmark,
  FileCheck,
  Users,
  Plane,
  DollarSign,
  Building2,
  MessageSquare,
  BarChart3,
  Heart,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/data/types";

interface WorkflowPrompt {
  label: string;
  prompt: string;
}

interface WorkflowCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  prompts: WorkflowPrompt[];
}

interface CustomWorkflow {
  id: string;
  label: string;
  prompt: string;
  createdAt: string;
}

interface SuggestedPromptsProps {
  userRole: UserRole;
  onPromptClick: (prompt: string) => void;
}

const CUSTOM_WORKFLOWS_KEY = "geoex-custom-workflows";

const workflowCategories: WorkflowCategory[] = [
  {
    id: "documents",
    label: "Document Audits",
    icon: FileCheck,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    prompts: [
      { label: "Missing docs audit", prompt: "Run a full document audit across all active trips and show me what's missing" },
      { label: "Passport expiry check", prompt: "Show all travelers with passports expiring within 6 months of their trip departure" },
      { label: "Waiver status", prompt: "Show waiver completion status across all active trips" },
      { label: "Medical forms overdue", prompt: "Which travelers have overdue medical forms? Group by trip and show days overdue" },
      { label: "Document completion rates", prompt: "Show document completion rates across all active trips with a chart" },
    ],
  },
  {
    id: "travelers",
    label: "Traveler Mgmt",
    icon: Users,
    color: "text-violet-600 bg-violet-50 border-violet-200",
    prompts: [
      { label: "Unresponsive travelers", prompt: "Travelers who haven't responded in 7+ days — group by trip and last follow-up date" },
      { label: "Draft follow-ups", prompt: "Draft follow-up emails for all travelers with incomplete documents" },
      { label: "Minor travelers", prompt: "Show all travelers under 18 and their guardian/emergency contact status" },
      { label: "Dietary & room prefs", prompt: "Compile dietary requirements and room preferences for all upcoming trips" },
      { label: "Welcome email status", prompt: "Which travelers haven't received their welcome email yet?" },
    ],
  },
  {
    id: "trips",
    label: "Trip Operations",
    icon: Plane,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    prompts: [
      { label: "Trips departing soon", prompt: "Show trips departing in the next 30 days with readiness scores and key risks" },
      { label: "Low readiness trips", prompt: "Which trips have readiness scores below 70%? Show details and blocking issues" },
      { label: "Weekly ops audit", prompt: "Run my weekly operations audit — trips, documents, payments, and flagged items" },
      { label: "Trip capacity check", prompt: "Show group size vs. capacity for all active trips" },
      { label: "Pre-departure checklist", prompt: "Generate pre-departure checklists for trips leaving in the next 2 weeks" },
    ],
  },
  {
    id: "customers",
    label: "Customer Relations",
    icon: Heart,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    prompts: [
      { label: "At-risk customers", prompt: "Show customers at risk of churning with their health signals and recommended actions" },
      { label: "VIP profiles", prompt: "Show profiles for all Champion and Power Couple tier customers" },
      { label: "Referral candidates", prompt: "Who are the best referral candidates right now based on satisfaction and engagement?" },
      { label: "Customer prep", prompt: "Prep me for upcoming customer calls this week with profiles and talking points" },
      { label: "Re-engagement targets", prompt: "Customers inactive for 6+ months who might be good re-engagement targets" },
    ],
  },
  {
    id: "financial",
    label: "Payments & Finance",
    icon: DollarSign,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    prompts: [
      { label: "Overdue payments", prompt: "Show all overdue final payments grouped by trip with amounts and days overdue" },
      { label: "Payment summary", prompt: "Payment collection summary across all active trips — deposits, finals, insurance" },
      { label: "TCI/insurance status", prompt: "Show TCI insurance enrollment status and deadlines for upcoming trips" },
      { label: "Revenue by segment", prompt: "Show revenue and LTV breakdown by customer loyalty tier" },
      { label: "Deposit tracker", prompt: "Which travelers haven't paid their deposit yet? Show amounts and deadlines" },
    ],
  },
  {
    id: "suppliers",
    label: "Supplier Mgmt",
    icon: Building2,
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    prompts: [
      { label: "Supplier health", prompt: "Show supplier performance dashboard — response times, ratings, incidents" },
      { label: "SLA violations", prompt: "Which suppliers are close to or violating SLA targets?" },
      { label: "Supplier incidents", prompt: "Show recent supplier incidents and their resolution status" },
      { label: "Probation suppliers", prompt: "List suppliers on probation tier with their performance metrics" },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    icon: MessageSquare,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    prompts: [
      { label: "Draft trip update", prompt: "Draft a trip update email for the nearest departing trip" },
      { label: "Scheduled comms", prompt: "What communications are scheduled for this week?" },
      { label: "Coordinator calls", prompt: "Which travelers still need their coordinator call scheduled?" },
      { label: "Batch follow-up", prompt: "Generate batch follow-up messages for all travelers with action items" },
    ],
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    color: "text-stone-600 bg-stone-50 border-stone-200",
    prompts: [
      { label: "Team workload", prompt: "Show team workload breakdown by GSM — active trips, travelers, and pending tasks" },
      { label: "Trending destinations", prompt: "What are the trending destinations this quarter with booking data?" },
      { label: "Booking funnel", prompt: "Show the booking funnel — enquiry to confirmed conversion rates" },
      { label: "Repeat booking rate", prompt: "What's the repeat booking rate by customer segment?" },
      { label: "Campaign performance", prompt: "Show marketing campaign performance metrics this quarter" },
    ],
  },
];

function loadCustomWorkflows(): CustomWorkflow[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_WORKFLOWS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomWorkflows(workflows: CustomWorkflow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_WORKFLOWS_KEY, JSON.stringify(workflows));
}

export function SuggestedPrompts({
  userRole,
  onPromptClick,
}: SuggestedPromptsProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customWorkflows, setCustomWorkflows] = useState<CustomWorkflow[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Load custom workflows from localStorage
  useEffect(() => {
    setCustomWorkflows(loadCustomWorkflows());
  }, []);

  const handleCreateWorkflow = () => {
    if (!newLabel.trim() || !newPrompt.trim()) return;
    const newWorkflow: CustomWorkflow = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      prompt: newPrompt.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...customWorkflows, newWorkflow];
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

  // Quick-access: surface a rotating set of popular prompts from all categories
  const quickPrompts = [
    workflowCategories[0].prompts[0], // Missing docs audit
    workflowCategories[2].prompts[2], // Weekly ops audit
    workflowCategories[3].prompts[0], // At-risk customers
    workflowCategories[4].prompts[0], // Overdue payments
  ];

  return (
    <div className="space-y-2">
      {/* Quick-access chips row */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-stone-400 mr-0.5" />

        {/* Custom workflows first */}
        {customWorkflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => onPromptClick(wf.prompt)}
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

        {/* Quick access prompts */}
        {quickPrompts.map((prompt) => (
          <button
            key={prompt.label}
            onClick={() => onPromptClick(prompt.prompt)}
            className={cn(
              "inline-flex items-center rounded-full border border-stone-200 bg-white px-3.5 py-1.5",
              "text-xs font-medium text-stone-600 shadow-sm",
              "transition-all hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800 hover:shadow",
              "active:scale-[0.98]"
            )}
          >
            {prompt.label}
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
          <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-100 px-3 py-2 scrollbar-thin">
            {workflowCategories.map((cat) => {
              const Icon = cat.icon;
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

            {/* Create custom workflow button */}
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setActiveCategory(null);
                setTimeout(() => labelInputRef.current?.focus(), 100);
              }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ml-auto",
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

          {/* Workflow prompts grid */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {activeCategory ? (
              // Show single category
              <div>
                {workflowCategories
                  .filter((c) => c.id === activeCategory)
                  .map((cat) => (
                    <div key={cat.id} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {cat.prompts.map((prompt) => (
                        <button
                          key={prompt.label}
                          onClick={() => {
                            onPromptClick(prompt.prompt);
                            setExpanded(false);
                          }}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border border-stone-150 bg-stone-50/50 p-2.5 text-left",
                            "transition-all hover:bg-white hover:border-stone-300 hover:shadow-sm",
                            "active:scale-[0.99]"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-stone-800 leading-tight">
                              {prompt.label}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-2 leading-tight">
                              {prompt.prompt}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            ) : !showCreateForm ? (
              // Show all categories in a compact grid
              <div className="space-y-3">
                {workflowCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className="h-3 w-3 text-stone-400" />
                        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.prompts.map((prompt) => (
                          <button
                            key={prompt.label}
                            onClick={() => {
                              onPromptClick(prompt.prompt);
                              setExpanded(false);
                            }}
                            className={cn(
                              "inline-flex items-center rounded-full border border-stone-150 bg-stone-50/50 px-2.5 py-1",
                              "text-[11px] font-medium text-stone-600",
                              "transition-all hover:bg-white hover:border-stone-300 hover:text-stone-800 hover:shadow-sm",
                              "active:scale-[0.98]"
                            )}
                          >
                            {prompt.label}
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
                            onClick={() => {
                              onPromptClick(wf.prompt);
                              setExpanded(false);
                            }}
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
