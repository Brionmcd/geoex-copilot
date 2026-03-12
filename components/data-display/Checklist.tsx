import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface ChecklistItem {
  label: string;
  status: "pass" | "fail" | "warning";
  detail: string;
}

interface ChecklistProps {
  title: string;
  items: ChecklistItem[];
}

const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
  pass: { icon: CheckCircle2, color: "text-green-600" },
  fail: { icon: XCircle, color: "text-red-600" },
  warning: { icon: AlertTriangle, color: "text-amber-600" },
};

export function Checklist({ title, items }: ChecklistProps) {
  const passed = items.filter((item) => item.status === "pass").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              passed === items.length
                ? "bg-green-100 text-green-800"
                : "bg-stone-100 text-stone-600"
            )}
          >
            {passed} of {items.length} passed
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, i) => {
            const { icon: Icon, color } = iconMap[item.status];
            return (
              <div
                key={i}
                className="flex items-start gap-2.5 py-1.5"
              >
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">{item.label}</p>
                  <p className="text-xs text-stone-500">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
