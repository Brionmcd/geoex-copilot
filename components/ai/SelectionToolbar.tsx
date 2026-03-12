"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquarePlus,
  Bookmark,
  Search,
  Copy,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionToolbarProps {
  onDrillDown: (selectedText: string, context: string) => void;
  onSaveSnippet: (selectedText: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function SelectionToolbar({
  onDrillDown,
  onSaveSnippet,
  containerRef,
}: SelectionToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [contextText, setContextText] = useState("");
  const [copied, setCopied] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Small delay before hiding to allow button clicks
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          setVisible(false);
        }
      }, 200);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setVisible(false);
      return;
    }

    // Check if the selection is within our container
    const container = containerRef.current;
    if (!container) return;

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const ancestorEl =
      ancestor.nodeType === Node.ELEMENT_NODE
        ? (ancestor as Element)
        : ancestor.parentElement;

    if (!ancestorEl || !container.contains(ancestorEl)) {
      setVisible(false);
      return;
    }

    // Get context: the full text of the nearest message card
    let contextEl = ancestorEl;
    while (contextEl && !contextEl.classList?.contains("group")) {
      contextEl = contextEl.parentElement as Element;
    }
    const fullContext = contextEl?.textContent?.slice(0, 500) || "";

    // Position the toolbar above the selection
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setSelectedText(text);
    setContextText(fullContext);
    setPosition({
      top: rect.top - containerRect.top - 44,
      left: Math.max(
        0,
        Math.min(
          rect.left - containerRect.left + rect.width / 2 - 120,
          containerRect.width - 260
        )
      ),
    });
    setVisible(true);
    setCopied(false);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const handleDrillDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrillDown(selectedText, contextText);
    setVisible(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSaveSnippet(selectedText);
    setVisible(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "absolute z-50 flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-1 shadow-lg",
        "animate-in fade-in slide-in-from-bottom-1 duration-150"
      )}
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={handleDrillDown}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
          "text-amber-700 hover:bg-amber-50 transition-colors"
        )}
        title="Ask about this selection"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Ask about this
      </button>

      <div className="h-4 w-px bg-stone-200" />

      <button
        onClick={handleSave}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
          "text-stone-600 hover:bg-stone-50 transition-colors"
        )}
        title="Save this snippet"
      >
        <Bookmark className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={handleCopy}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
          "text-stone-600 hover:bg-stone-50 transition-colors"
        )}
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
