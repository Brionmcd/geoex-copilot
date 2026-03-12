"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/components/data-display/DataTable";
import { StatusCard } from "@/components/data-display/StatusCard";
import { Checklist } from "@/components/data-display/Checklist";
import { ChartWrapper } from "@/components/data-display/ChartWrapper";
import { AlertBanner } from "@/components/data-display/AlertBanner";
import { ActionCard } from "@/components/data-display/ActionCard";
import { TripDashboard } from "@/components/data-display/TripDashboard";
import { CustomerProfile } from "@/components/data-display/CustomerProfile";
import type { ComponentBlock } from "@/lib/data/types";

interface ResponseRendererProps {
  content: string;
  onEntityClick?: (type: string, id: string) => void;
}

// Map component names to actual components (case-insensitive, multiple aliases)
const componentMap: Record<string, React.ComponentType<any>> = {
  table: DataTable,
  datatable: DataTable,
  data_table: DataTable,
  status_card: StatusCard,
  statuscard: StatusCard,
  metric_card: StatusCard,
  metriccard: StatusCard,
  checklist: Checklist,
  chart: ChartWrapper,
  chartwrapper: ChartWrapper,
  alert: AlertBanner,
  alert_banner: AlertBanner,
  alertbanner: AlertBanner,
  alertcard: AlertBanner,
  alert_card: AlertBanner,
  action_card: ActionCard,
  actioncard: ActionCard,
  trip_dashboard: TripDashboard,
  tripdashboard: TripDashboard,
  customer_profile: CustomerProfile,
  customerprofile: CustomerProfile,
};

function resolveComponent(name: string): React.ComponentType<any> | undefined {
  return componentMap[name.toLowerCase().replace(/[-\s]/g, "_")] || componentMap[name.toLowerCase().replace(/[-_\s]/g, "")];
}

interface ParsedSegment {
  type: "text" | "component";
  content: string;
  data?: ComponentBlock;
}

function extractJsonObject(content: string, startIdx: number): { json: string; end: number } | null {
  // Find matching closing brace, handling nesting
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return { json: content.slice(startIdx, i + 1), end: i + 1 }; }
  }
  return null;
}

function parseContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const matches: { start: number; end: number; json: string }[] = [];

  // Pattern 1: ```json ... ``` code blocks (also handles ```json:component)
  const codeBlockPattern = /```json(?::component)?\s*\n?([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockPattern.exec(content)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, json: match[1].trim() });
  }

  // Pattern 2: :component{...} blocks (Claude's preferred format)
  const componentPrefixPattern = /:component\s*\{/g;
  while ((match = componentPrefixPattern.exec(content)) !== null) {
    const braceStart = content.indexOf('{', match.index);
    const extracted = extractJsonObject(content, braceStart);
    if (extracted) {
      const isInsideBlock = matches.some((m) => match!.index >= m.start && match!.index < m.end);
      if (!isInsideBlock) {
        matches.push({ start: match.index, end: extracted.end, json: extracted.json });
      }
    }
  }

  // Pattern 3: Standalone JSON objects with "component" field
  const jsonStartPattern = /(?<![:\w])\{\s*"component"/g;
  while ((match = jsonStartPattern.exec(content)) !== null) {
    const isInsideBlock = matches.some((m) => match!.index >= m.start && match!.index < m.end);
    if (isInsideBlock) continue;
    const extracted = extractJsonObject(content, match.index);
    if (extracted) {
      matches.push({ start: match.index, end: extracted.end, json: extracted.json });
    }
  }

  // Sort and deduplicate
  matches.sort((a, b) => a.start - b.start);
  const deduped: typeof matches = [];
  for (const m of matches) {
    if (deduped.length === 0 || m.start >= deduped[deduped.length - 1].end) {
      deduped.push(m);
    }
  }

  let lastIndex = 0;
  for (const m of deduped) {
    if (m.start > lastIndex) {
      const textContent = content.slice(lastIndex, m.start).trim();
      if (textContent) segments.push({ type: "text", content: textContent });
    }

    try {
      const parsed = JSON.parse(m.json);
      if (parsed.component && resolveComponent(parsed.component)) {
        segments.push({ type: "component", content: m.json, data: parsed });
      } else {
        segments.push({ type: "text", content: m.json });
      }
    } catch {
      segments.push({ type: "text", content: m.json });
    }

    lastIndex = m.end;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) segments.push({ type: "text", content: remaining });
  }

  if (segments.length === 0) segments.push({ type: "text", content });
  return segments;
}

// Known trip names for entity type guessing
const KNOWN_TRIPS = [
  "patagonia explorer", "tanzania safari", "japan cultural journey",
  "galapagos & antarctica", "costa rica family adventure",
  "galapagos & antarctica expedition",
];

// Known supplier names for entity type guessing
const KNOWN_SUPPLIERS = [
  "patagonia adventures", "serengeti expeditions", "japan travel bureau",
  "galapagos marine adventures", "costa rica eco tours",
];

function guessEntityType(name: string): string {
  const lower = name.toLowerCase();
  if (KNOWN_TRIPS.some((t) => lower.includes(t) || t.includes(lower))) return "trip";
  if (KNOWN_SUPPLIERS.some((s) => lower.includes(s) || s.includes(lower))) return "supplier";
  return "contact";
}

function renderTextContent(
  text: string,
  onEntityClick?: (type: string, id: string) => void
): React.ReactNode {
  // Split into lines and process
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className="my-2 space-y-1 pl-4 text-sm text-stone-700"
        >
          {currentList.map((item, i) => (
            <li key={i} className="list-disc leading-relaxed">
              {renderInlineFormatting(item, onEntityClick)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Bullet list items
    if (/^[-*]\s+/.test(trimmed)) {
      currentList.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    // Numbered list items
    if (/^\d+\.\s+/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+\.\s+/, ""));
      continue;
    }

    flushList();

    // Empty line
    if (!trimmed) continue;

    // Headings
    if (/^#{1,3}\s/.test(trimmed)) {
      const level = trimmed.match(/^(#+)/)?.[1].length || 1;
      const headingText = trimmed.replace(/^#+\s*/, "");
      const className = level === 1
        ? "text-lg font-bold text-stone-900 mt-4 mb-1"
        : level === 2
        ? "text-base font-semibold text-stone-800 mt-3 mb-1"
        : "text-sm font-semibold text-stone-700 mt-2 mb-0.5";
      elements.push(
        <div key={`h-${i}`} className={className}>
          {renderInlineFormatting(headingText, onEntityClick)}
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p
        key={`p-${i}`}
        className="text-sm leading-relaxed text-stone-700 [&:not(:first-child)]:mt-2"
      >
        {renderInlineFormatting(trimmed, onEntityClick)}
      </p>
    );
  }

  flushList();

  return <>{elements}</>;
}

function renderInlineFormatting(
  text: string,
  onEntityClick?: (type: string, id: string) => void
): React.ReactNode {
  // Split by **bold**, [[entity]], and [name](entity:type:id) patterns
  const pattern = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\]|\[[^\]]+\]\(entity:[^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    // Bold
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-stone-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // [[entity name]] double bracket syntax
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const entityName = part.slice(2, -2);
      const entityType = guessEntityType(entityName);
      return (
        <button
          key={i}
          className="inline font-medium text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
          onClick={() => onEntityClick?.(entityType, entityName)}
        >
          {entityName}
        </button>
      );
    }

    // [Name](entity:type:id) markdown link syntax
    const mdEntityMatch = part.match(/^\[([^\]]+)\]\(entity:([^:)]+):([^)]+)\)$/);
    if (mdEntityMatch) {
      const [, label, type, id] = mdEntityMatch;
      return (
        <button
          key={i}
          className="inline font-medium text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
          onClick={() => onEntityClick?.(type, id)}
        >
          {label}
        </button>
      );
    }

    return part;
  });
}

export function ResponseRenderer({
  content,
  onEntityClick,
}: ResponseRendererProps) {
  const segments = useMemo(() => parseContent(content), [content]);

  return (
    <div className="space-y-3">
      {segments.map((segment, i) => {
        if (segment.type === "text") {
          return (
            <div key={i}>{renderTextContent(segment.content, onEntityClick)}</div>
          );
        }

        if (segment.type === "component" && segment.data) {
          const Component = resolveComponent(segment.data.component as string);
          if (!Component) return null;

          const { component, ...props } = segment.data;
          return (
            <div key={i} className="my-3">
              <Component {...props} onEntityClick={onEntityClick} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
