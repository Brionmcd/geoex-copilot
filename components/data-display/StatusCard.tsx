import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface Field {
  label: string;
  value: string | number;
  status?: "good" | "warning" | "critical";
}

interface Alert {
  message: string;
  severity: "critical" | "warning" | "info";
}

interface StatusCardProps {
  title: string;
  fields: Field[];
  alerts?: Alert[];
}

const statusColors: Record<string, string> = {
  good: "text-green-700",
  warning: "text-amber-700",
  critical: "text-red-700",
};

const alertStyles: Record<string, { bg: string; icon: React.ElementType; text: string }> = {
  critical: { bg: "bg-red-50 border-red-200", icon: AlertTriangle, text: "text-red-800" },
  warning: { bg: "bg-amber-50 border-amber-200", icon: AlertCircle, text: "text-amber-800" },
  info: { bg: "bg-blue-50 border-blue-200", icon: Info, text: "text-blue-800" },
};

export function StatusCard({ title, fields, alerts, label, value, detail, trend, ...rest }: StatusCardProps & { label?: string; value?: string | number; detail?: string; trend?: string; [key: string]: any }) {
  // Handle MetricCard format from AI: { label, value, detail, trend }
  if (!fields && label) {
    const trendStatus = trend === "down" ? "critical" : trend === "up" ? "good" : "warning";
    fields = [
      { label: label, value: value ?? "", status: trendStatus as any },
      ...(detail ? [{ label: "Detail", value: detail }] : []),
    ];
    title = title || label;
  }
  if (!fields) fields = [];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => (
            <div key={field.label} className="space-y-0.5">
              <p className="text-xs text-stone-500">{field.label}</p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  field.status ? statusColors[field.status] : "text-stone-900"
                )}
              >
                {field.value}
              </p>
            </div>
          ))}
        </div>

        {alerts && alerts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-stone-100">
            {alerts.map((alert, i) => {
              const style = alertStyles[alert.severity];
              const Icon = style.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-md border px-3 py-2",
                    style.bg
                  )}
                >
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", style.text)} />
                  <p className={cn("text-xs", style.text)}>{alert.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
