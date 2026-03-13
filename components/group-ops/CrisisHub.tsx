"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, Users, Copy, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { GroupDeparture, SecurityStatus, CrisisGuestResponse } from "@/lib/data/group-departures-types";
import { crisisDestinations, crisisGuestTracking, getActivePax } from "@/lib/data/seed-group-departures";

interface CrisisHubProps {
  departures: GroupDeparture[];
}

const statusConfig: Record<SecurityStatus, { color: string; bg: string; border: string }> = {
  Normal: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  Advisory: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  Warning: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  "Do Not Travel": { color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const responseConfig: Record<CrisisGuestResponse, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  Go: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  "No Go": { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  "No Response": { icon: Clock, color: "text-stone-500", bg: "bg-stone-50" },
};

export function CrisisHub({ departures }: CrisisHubProps) {
  const [copied, setCopied] = React.useState(false);

  // Enriched crisis data
  const enrichedCrises = useMemo(() => {
    return crisisDestinations.map((crisis) => {
      const affectedDeps = departures.filter((d) =>
        crisis.affectedDepartures.includes(d.id)
      );
      const totalGuests = affectedDeps.reduce((s, d) => s + getActivePax(d), 0);
      const guestTracking = crisisGuestTracking.filter((g) =>
        crisis.affectedDepartures.includes(g.departureId)
      );
      return { ...crisis, affectedDeps, totalGuests, guestTracking };
    });
  }, [departures]);

  const activeCrises = enrichedCrises.filter((c) => c.securityStatus !== "Normal");

  const handleCopyAffected = (crisisId: string) => {
    const crisis = enrichedCrises.find((c) => c.id === crisisId);
    if (!crisis) return;
    const rows = crisis.guestTracking.map(
      (g) => `${g.guestName}\t${g.email}\t${g.departureName}\t${g.response}`
    );
    const header = "Name\tEmail\tDeparture\tResponse";
    navigator.clipboard.writeText([header, ...rows].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-lg font-bold text-stone-900 mb-1">Crisis Management</h1>
      <p className="text-sm text-stone-500 mb-6">
        {activeCrises.length} active advisor{activeCrises.length !== 1 ? "ies" : "y"} · Monitor destination security and guest response status
      </p>

      {/* Destination Cards */}
      <div className="space-y-4">
        {enrichedCrises.map((crisis) => {
          const cfg = statusConfig[crisis.securityStatus];
          const goCount = crisis.guestTracking.filter((g) => g.response === "Go").length;
          const noGoCount = crisis.guestTracking.filter((g) => g.response === "No Go").length;
          const noResponseCount = crisis.guestTracking.filter((g) => g.response === "No Response").length;

          return (
            <div key={crisis.id} className={cn("rounded-xl border p-5", cfg.border, "bg-white")}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex items-center justify-center h-10 w-10 rounded-lg", cfg.bg)}>
                    <Shield className={cn("h-5 w-5", cfg.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-stone-900">{crisis.destination}</h2>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold", cfg.bg, cfg.color)}>
                        {crisis.securityStatus}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Updated {new Date(crisis.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-medium text-stone-500">Departures</div>
                    <div className="text-lg font-bold text-stone-900">{crisis.affectedDeps.length}</div>
                  </div>
                  <div className="h-8 w-px bg-stone-200" />
                  <div className="text-right">
                    <div className="text-xs font-medium text-stone-500">Guests</div>
                    <div className="text-lg font-bold text-stone-900">{crisis.totalGuests}</div>
                  </div>
                </div>
              </div>

              {/* Advisory Detail */}
              <div className={cn("rounded-lg p-3 mb-4 text-xs", cfg.bg)}>
                <p className={cn("font-medium", cfg.color)}>{crisis.advisoryDetail}</p>
              </div>

              {/* Affected Departures */}
              {crisis.affectedDeps.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-stone-700 mb-2">Affected Departures (next 90 days)</h3>
                  <div className="space-y-1.5">
                    {crisis.affectedDeps.map((dep) => (
                      <div key={dep.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-xs">
                        <div>
                          <span className="font-semibold text-stone-800">{dep.tripName}</span>
                          <span className="text-stone-400 ml-2">
                            {new Date(dep.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-stone-400" />
                          <span className="text-stone-600 font-medium">{getActivePax(dep)} guests</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guest Response Tracking */}
              {crisis.guestTracking.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-stone-700">Guest Response Tracking</h3>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> {goCount} Go
                      </span>
                      <span className="flex items-center gap-1 text-red-600 font-medium">
                        <XCircle className="h-3 w-3" /> {noGoCount} No Go
                      </span>
                      <span className="flex items-center gap-1 text-stone-500 font-medium">
                        <Clock className="h-3 w-3" /> {noResponseCount} Pending
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-stone-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/50">
                          <th className="px-3 py-2 text-left font-semibold text-stone-500">Guest</th>
                          <th className="px-3 py-2 text-left font-semibold text-stone-500">Departure</th>
                          <th className="px-3 py-2 text-left font-semibold text-stone-500">Response</th>
                          <th className="px-3 py-2 text-left font-semibold text-stone-500">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crisis.guestTracking.map((g) => {
                          const rcfg = responseConfig[g.response];
                          const Icon = rcfg.icon;
                          return (
                            <tr key={g.guestId} className="border-b border-stone-50">
                              <td className="px-3 py-2">
                                <div className="font-medium text-stone-800">{g.guestName}</div>
                                <div className="text-[10px] text-stone-400">{g.email}</div>
                              </td>
                              <td className="px-3 py-2 text-stone-600">{g.departureName}</td>
                              <td className="px-3 py-2">
                                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", rcfg.bg, rcfg.color)}>
                                  <Icon className="h-3 w-3" />
                                  {g.response}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-stone-500">
                                {g.responseDate
                                  ? new Date(g.responseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => handleCopyAffected(crisis.id)}
                    className="flex items-center gap-1.5 mt-2 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? "Copied!" : "Copy affected guest list"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {enrichedCrises.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <Shield className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-medium text-stone-600">No active advisories</p>
          <p className="text-xs mt-1">All destinations are clear</p>
        </div>
      )}
    </div>
  );
}
