"use client";

import React, { useState } from "react";
import { Pin, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/data/types";

interface PinnedItemsProps {
  messages: ChatMessage[];
  onSelect: (id: string) => void;
}

function truncateContent(content: string, maxLength: number = 100): string {
  // Strip JSON blocks, component markers, and entity brackets for the excerpt
  const cleaned = content
    .replace(/```json(?::component)?[\s\S]*?```/g, "")
    .replace(/:component\s*\{[\s\S]*?\}/g, "")
    .replace(/\{[\s\S]*?"component"[\s\S]*?\}/g, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\n{2,}/g, "\n")
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + "...";
}

function formatPinnedTime(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PinnedItems({ messages, onSelect }: PinnedItemsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pinnedMessages = messages.filter((m) => m.pinned && m.role === "assistant");

  if (pinnedMessages.length === 0) return null;

  return (
    <div
      className={cn(
        "shrink-0 border-r border-stone-200 bg-stone-50/50 transition-all duration-200",
        collapsed ? "w-10" : "w-64"
      )}
    >
      {/* Toggle button */}
      <div
        className={cn(
          "flex items-center border-b border-stone-200 px-3 py-2.5",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-stone-700">
              Pinned
            </span>
            <span className="text-[10px] text-stone-400">
              ({pinnedMessages.length})
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-stone-500" />
          )}
        </Button>
      </div>

      {/* Collapsed state: just icons */}
      {collapsed && (
        <div className="flex flex-col items-center gap-2 py-3">
          {pinnedMessages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => onSelect(msg.id)}
              className="flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
              title={truncateContent(msg.content, 40)}
            >
              <Pin className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Expanded state: card list */}
      {!collapsed && (
        <ScrollArea className="h-[calc(100%-41px)]">
          <div className="space-y-2 p-2">
            {pinnedMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => onSelect(msg.id)}
                className="w-full text-left"
              >
                <Card className="p-2.5 hover:bg-white hover:shadow-sm transition-all cursor-pointer border-stone-200/80">
                  <p className="text-xs text-stone-700 leading-relaxed line-clamp-3">
                    {truncateContent(msg.content, 120)}
                  </p>
                  <p className="mt-1.5 text-[10px] text-stone-400">
                    {formatPinnedTime(msg.timestamp)}
                  </p>
                </Card>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
