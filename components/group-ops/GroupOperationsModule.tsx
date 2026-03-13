"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Plane,
  BarChart3,
  DollarSign,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import { departures } from "@/lib/data/seed-group-departures";
import type { GroupOpsTab } from "@/lib/data/group-departures-types";
import type { GroupDeparture } from "@/lib/data/group-departures-types";
import { DepartureOverview } from "./DepartureOverview";
import { DepartureDetail } from "./DepartureDetail";
import { YieldDashboard } from "./YieldDashboard";
import { PricingAlerts } from "./PricingAlerts";
import { AuditPanel } from "./AuditPanel";
import { CrisisHub } from "./CrisisHub";

const TABS: { id: GroupOpsTab; label: string; icon: React.ElementType }[] = [
  { id: "departures", label: "Departures", icon: Plane },
  { id: "yield", label: "Yield Mgmt", icon: BarChart3 },
  { id: "pricing", label: "Pricing & Avail", icon: DollarSign },
  { id: "audit", label: "Audit", icon: ClipboardCheck },
  { id: "crisis", label: "Crisis", icon: AlertTriangle },
];

export function GroupOperationsModule() {
  const [activeTab, setActiveTab] = useState<GroupOpsTab>("departures");
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);

  const selectedDeparture = useMemo(
    () => departures.find((d) => d.id === selectedDepartureId) || null,
    [selectedDepartureId]
  );

  const handleSelectDeparture = (dep: GroupDeparture) => {
    setSelectedDepartureId(dep.id);
  };

  const handleBack = () => {
    setSelectedDepartureId(null);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sub-tab navigation */}
      <div className="border-b border-stone-200 bg-white px-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedDepartureId(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                  isActive
                    ? "border-amber-600 text-amber-700"
                    : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto bg-stone-50/50">
        {activeTab === "departures" && !selectedDeparture && (
          <DepartureOverview
            departures={departures}
            onSelectDeparture={handleSelectDeparture}
          />
        )}
        {activeTab === "departures" && selectedDeparture && (
          <DepartureDetail departure={selectedDeparture} onBack={handleBack} />
        )}
        {activeTab === "yield" && <YieldDashboard departures={departures} />}
        {activeTab === "pricing" && <PricingAlerts departures={departures} />}
        {activeTab === "audit" && <AuditPanel departures={departures} />}
        {activeTab === "crisis" && <CrisisHub departures={departures} />}
      </div>
    </div>
  );
}
