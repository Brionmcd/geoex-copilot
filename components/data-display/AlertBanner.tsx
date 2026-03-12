"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  action?: {
    label: string;
    onClick?: () => void;
  };
}

const severityStyles: Record<
  string,
  { bg: string; border: string; icon: React.ElementType; iconColor: string; titleColor: string; textColor: string }
> = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    textColor: "text-red-700",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertCircle,
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    textColor: "text-amber-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Info,
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    textColor: "text-blue-700",
  },
};

export function AlertBanner({ title, message, severity, action, suggestedAction, ...rest }: AlertBannerProps & { suggestedAction?: string; [key: string]: any }) {
  const style = severityStyles[severity] || severityStyles.info;
  const Icon = style.icon;
  // Handle suggestedAction string from AI
  const resolvedAction = action || (suggestedAction ? { label: suggestedAction } : undefined);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        style.bg,
        style.border
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", style.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-semibold", style.titleColor)}>{title}</h4>
        <p className={cn("text-sm mt-0.5", style.textColor)}>{message}</p>
      </div>
      {resolvedAction && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={resolvedAction.onClick}
        >
          {resolvedAction.label}
        </Button>
      )}
    </div>
  );
}
