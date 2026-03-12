"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/data/types";

interface PromptBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
  userRole: UserRole;
}

const rolePlaceholders: Record<UserRole, string[]> = {
  gsm: [
    "What docs are missing for the Patagonia trip?",
    "Draft a follow-up email for travelers with overdue medical forms...",
    "Which travelers haven't responded in over 7 days?",
    "Show me trips departing in the next 30 days with low readiness...",
  ],
  manager: [
    "Run my weekly operations audit...",
    "Show document completion rates across all active trips...",
    "What's the team workload breakdown by GSM?",
    "Which trips have readiness scores below 70%?",
  ],
  rm: [
    "Pull up Robert Martinez's full profile...",
    "Show me customers at risk of churning...",
    "Who are good referral candidates right now?",
    "Prep me for the Margaret Chen call...",
  ],
  marketing: [
    "What are the lead source conversion rates?",
    "Show me trending destinations this quarter...",
    "What's the repeat booking rate by segment?",
    "How are our campaigns performing this quarter?",
  ],
  comms: [
    "Draft an update email for the Patagonia trip...",
    "What communications are scheduled for this week?",
    "Show me open support tickets by priority...",
    "Create a pre-departure checklist email...",
  ],
};

export function PromptBar({ onSend, disabled, userRole }: PromptBarProps) {
  const [value, setValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const placeholders = rolePlaceholders[userRole] || rolePlaceholders.gsm;

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 4 * 24; // ~4 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm transition-colors",
            "focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-300",
            disabled && "opacity-60"
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[placeholderIndex]}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-sm text-stone-800 placeholder:text-stone-400",
              "focus:outline-none disabled:cursor-not-allowed",
              "leading-6"
            )}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className={cn(
              "h-8 w-8 shrink-0 rounded-lg transition-all",
              value.trim()
                ? "bg-brand-amber hover:bg-amber-800 text-white"
                : "bg-stone-100 text-stone-400"
            )}
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-stone-400">
          GeoEx AI may produce inaccurate information. Always verify critical details.
        </p>
      </div>
    </div>
  );
}
