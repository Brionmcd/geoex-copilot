"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Square,
  Users,
  AlertOctagon,
  Info,
} from "lucide-react";
import type { GroupDeparture } from "@/lib/data/group-departures-types";
import { getActivePax, getFillPercentage, getExpectedAvailabilityLanguage, getCorrectTierIndex } from "@/lib/data/seed-group-departures";

interface PricingAlertsProps {
  departures: GroupDeparture[];
}

interface ChecklistItem {
  id: string;
  label: string;
  system: string;
  completed: boolean;
}

interface TierAlert {
  departureId: string;
  departureName: string;
  pax: number;
  capacity: number;
  currentTier: number;
  correctTier: number;
  currentPrice: number;
  correctPrice: number;
  checklist: ChecklistItem[];
}

interface AvailabilityMismatch {
  departureId: string;
  departureName: string;
  currentLanguage: string;
  expectedLanguage: string;
  fill: number;
}

interface SeatAlert {
  departureId: string;
  departureName: string;
  pax: number;
  capacity: number;
  remaining: number;
  pendingBookings: number;
  level: "sold_out" | "near_capacity" | "warning";
}

export function PricingAlerts({ departures }: PricingAlertsProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Pricing tier alerts
  const tierAlerts = useMemo<TierAlert[]>(() => {
    const alerts: TierAlert[] = [];
    departures.forEach((d) => {
      if (d.status === "Cancelled" || d.status === "Completed") return;
      const correctIdx = getCorrectTierIndex(d);
      if (correctIdx !== d.currentTierIndex) {
        const pax = getActivePax(d);
        alerts.push({
          departureId: d.id,
          departureName: d.tripName,
          pax,
          capacity: d.maxCapacity,
          currentTier: d.currentTierIndex,
          correctTier: correctIdx,
          currentPrice: d.pricingTiers[d.currentTierIndex]?.landPrice || 0,
          correctPrice: d.pricingTiers[correctIdx]?.landPrice || 0,
          checklist: [
            { id: `${d.id}-sugati`, label: `Update land price in Sugati ($${d.pricingTiers[d.currentTierIndex]?.landPrice} → $${d.pricingTiers[correctIdx]?.landPrice})`, system: "Sugati", completed: false },
            { id: `${d.id}-axus`, label: "Update Axus sales itinerary with new pricing", system: "Axus", completed: false },
            { id: `${d.id}-marketing`, label: `Request Marketing website update (new availability: "${getExpectedAvailabilityLanguage(d)}")`, system: "Marketing", completed: false },
            { id: `${d.id}-dates`, label: "Verify all active departure dates on itinerary are future dates", system: "Axus", completed: false },
          ],
        });
      }
    });
    return alerts;
  }, [departures]);

  // Availability language mismatches
  const availMismatches = useMemo<AvailabilityMismatch[]>(() => {
    const mismatches: AvailabilityMismatch[] = [];
    departures.forEach((d) => {
      if (d.status === "Cancelled" || d.status === "Completed") return;
      const expected = getExpectedAvailabilityLanguage(d);
      // Normalize for comparison
      const current = d.availabilityLanguage;
      if (current !== expected && !expected.includes("Spots") || (expected.includes("Spots") && !current.includes("Spots"))) {
        mismatches.push({
          departureId: d.id,
          departureName: d.tripName,
          currentLanguage: current,
          expectedLanguage: expected,
          fill: getFillPercentage(d),
        });
      }
    });
    return mismatches;
  }, [departures]);

  // Seat conflict alerts
  const seatAlerts = useMemo<SeatAlert[]>(() => {
    const alerts: SeatAlert[] = [];
    departures.forEach((d) => {
      if (d.status === "Cancelled" || d.status === "Completed" || d.status === "Departed") return;
      const pax = getActivePax(d);
      const remaining = d.maxCapacity - pax;
      const pending = d.guests.filter((g) => g.status === "Pending Payment" || g.status === "Waitlisted").length;

      if (pax >= d.maxCapacity) {
        alerts.push({ departureId: d.id, departureName: d.tripName, pax, capacity: d.maxCapacity, remaining: 0, pendingBookings: pending, level: "sold_out" });
      } else if (remaining <= 2) {
        alerts.push({ departureId: d.id, departureName: d.tripName, pax, capacity: d.maxCapacity, remaining, pendingBookings: pending, level: "near_capacity" });
      } else if (remaining <= 4 && pending > 0) {
        alerts.push({ departureId: d.id, departureName: d.tripName, pax, capacity: d.maxCapacity, remaining, pendingBookings: pending, level: "warning" });
      }
    });
    return alerts;
  }, [departures]);

  const totalAlerts = tierAlerts.length + availMismatches.length + seatAlerts.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-lg font-bold text-stone-900 mb-1">Pricing & Availability</h1>
      <p className="text-sm text-stone-500 mb-6">
        {totalAlerts} alert{totalAlerts !== 1 ? "s" : ""} requiring attention
      </p>

      {/* Seat Conflict Alerts */}
      {seatAlerts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertOctagon className="h-4 w-4 text-red-600" />
            Seat Status Alerts
          </h2>
          <div className="space-y-3">
            {seatAlerts.map((a) => (
              <div
                key={a.departureId}
                className={cn(
                  "rounded-xl border p-4",
                  a.level === "sold_out"
                    ? "border-red-300 bg-red-50"
                    : a.level === "near_capacity"
                    ? "border-amber-300 bg-amber-50"
                    : "border-stone-200 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-lg font-bold text-lg",
                        a.level === "sold_out"
                          ? "bg-red-200 text-red-800"
                          : a.level === "near_capacity"
                          ? "bg-amber-200 text-amber-800"
                          : "bg-stone-200 text-stone-700"
                      )}
                    >
                      {a.pax}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-stone-800">{a.departureName}</div>
                      <div className="text-xs text-stone-500">
                        {a.pax} / {a.capacity} · {a.remaining === 0 ? "No spots remaining" : `${a.remaining} spot${a.remaining !== 1 ? "s" : ""} remaining`}
                        {a.pendingBookings > 0 && ` · ${a.pendingBookings} pending booking${a.pendingBookings !== 1 ? "s" : ""}`}
                      </div>
                    </div>
                  </div>
                  {a.level === "sold_out" && (
                    <span className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white">
                      SOLD OUT — DO NOT ACCEPT NEW BOOKINGS
                    </span>
                  )}
                  {a.level === "near_capacity" && (
                    <span className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white">
                      NEAR CAPACITY
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing Tier Change Alerts */}
      {tierAlerts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Pricing Tier Changes Required
          </h2>
          <div className="space-y-3">
            {tierAlerts.map((a) => (
              <div key={a.departureId} className="rounded-xl border border-amber-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-sm text-stone-800">{a.departureName}</div>
                    <div className="text-xs text-stone-500">
                      {a.pax} pax · Crossed tier threshold
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-semibold text-stone-600">
                      Tier {a.currentTier + 1} · ${a.currentPrice.toLocaleString()}
                    </span>
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                    <span className="rounded-lg bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                      Tier {a.correctTier + 1} · ${a.correctPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {a.checklist.map((item) => {
                    const isChecked = checkedItems.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className="flex items-center gap-2.5 w-full text-left text-xs py-1 group"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-stone-300 group-hover:text-stone-500 shrink-0" />
                        )}
                        <span className={cn(isChecked && "line-through text-stone-400", !isChecked && "text-stone-700")}>
                          {item.label}
                        </span>
                        <span className="ml-auto text-[10px] font-medium text-stone-400 bg-stone-50 rounded px-1.5 py-0.5">
                          {item.system}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Availability Language Mismatches */}
      {availMismatches.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-blue-600" />
            Availability Language Mismatches
          </h2>
          <div className="space-y-2">
            {availMismatches.map((m) => (
              <div key={m.departureId} className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-xs">
                <div className="flex-1">
                  <div className="font-semibold text-stone-800">{m.departureName}</div>
                  <div className="text-stone-500 mt-0.5">{m.fill}% filled</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-medium text-stone-600">
                    Current: "{m.currentLanguage}"
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                  <span className="rounded-lg bg-blue-100 px-2.5 py-1 font-semibold text-blue-700">
                    Should be: "{m.expectedLanguage}"
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {totalAlerts === 0 && (
        <div className="text-center py-16 text-stone-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">All pricing and availability is in sync</p>
          <p className="text-xs mt-1">No tier changes or language mismatches detected</p>
        </div>
      )}
    </div>
  );
}
