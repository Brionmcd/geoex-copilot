"use client";

import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/data/types";

interface NotificationPanelProps {
  notifications: Notification[];
  open: boolean;
  onClose: () => void;
  onAction?: (query: string) => void;
}

type FilterType = "all" | "critical" | "warning" | "info";

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
};

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildActionQuery(notification: Notification): string {
  const title = notification.title;
  const action = notification.suggestedAction || "";

  // Missing medical form for minor
  if (title.toLowerCase().includes("missing medical form") && title.toLowerCase().includes("costa rica")) {
    return "Draft a follow-up about the missing medical form for Tyler Thompson on Costa Rica Family Adventure";
  }
  // SLA breach
  if (title.toLowerCase().includes("sla breach") && title.toLowerCase().includes("patagonia")) {
    return "Show me Patagonia Adventures supplier details and recent incidents";
  }
  // Passport expiring
  if (title.toLowerCase().includes("passport") && title.toLowerCase().includes("expiring")) {
    return `Help me handle: ${title}`;
  }
  // TCI deadline
  if (title.toLowerCase().includes("tci deadline")) {
    return `Draft TCI reminder emails for the travelers mentioned: ${title}`;
  }
  // Payment overdue / deadline
  if (title.toLowerCase().includes("payment")) {
    return `Help me resolve: ${title}`;
  }
  // Document requests not responded
  if (title.toLowerCase().includes("haven't responded") || title.toLowerCase().includes("document request")) {
    return `Draft follow-up communications for: ${title}`;
  }
  // Waivers incomplete
  if (title.toLowerCase().includes("waiver")) {
    return `Help me get waivers completed: ${title}`;
  }
  // Churn risk
  if (title.toLowerCase().includes("churn risk") || title.toLowerCase().includes("inactive")) {
    return `Show me re-engagement options: ${title}`;
  }

  // Fallback: use suggestedAction if available, otherwise title
  if (action) {
    return action;
  }
  return `Help me with: ${title}`;
}

export function NotificationPanel({
  notifications,
  open,
  onClose,
  onAction,
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "critical", label: "Critical" },
    { key: "warning", label: "Warnings" },
    { key: "info", label: "Info" },
  ];

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filtered =
    filter === "all" ? sorted : sorted.filter((n) => n.severity === filter);

  const handleMarkRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  };

  const isRead = (n: Notification) => n.read || readIds.has(n.id);

  const criticalCount = notifications.filter(
    (n) => n.severity === "critical" && !isRead(n)
  ).length;
  const warningCount = notifications.filter(
    (n) => n.severity === "warning" && !isRead(n)
  ).length;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[420px] max-w-[90vw] bg-white shadow-2xl border-l border-stone-200 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-stone-900">
              Notifications
            </h2>
            {criticalCount > 0 && (
              <Badge variant="critical" className="text-[10px]">
                {criticalCount} critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning" className="text-[10px]">
                {warningCount} warning
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-stone-100 px-5 py-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-stone-900 text-white"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <ScrollArea className="h-[calc(100%-112px)]">
          <div className="divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-stone-400">
                <Info className="h-8 w-8 mb-2" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              filtered.map((notification) => {
                const config = severityConfig[notification.severity];
                const Icon = config.icon;
                const read = isRead(notification);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleMarkRead(notification.id)}
                    className={cn(
                      "px-5 py-3.5 cursor-pointer transition-colors hover:bg-stone-50",
                      !read && "bg-stone-50/50"
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          config.bg
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5", config.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              !read
                                ? "font-semibold text-stone-900"
                                : "font-medium text-stone-700"
                            )}
                          >
                            {notification.title}
                          </p>
                          {!read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-amber" />
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-stone-500 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-stone-400">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {notification.actionable &&
                            notification.suggestedAction && (
                              <button
                                className="flex items-center gap-1 text-[11px] font-medium text-brand-amber hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const query = buildActionQuery(notification);
                                  onAction?.(query);
                                  onClose();
                                }}
                              >
                                Take action
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
