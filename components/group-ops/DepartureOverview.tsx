"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, ArrowUpDown, Users, Calendar, MapPin } from "lucide-react";
import type { GroupDeparture, DepartureStatus } from "@/lib/data/group-departures-types";
import { getActivePax, getFillPercentage, getRevenueBooked, getPaymentsCollected } from "@/lib/data/seed-group-departures";

interface DepartureOverviewProps {
  departures: GroupDeparture[];
  onSelectDeparture: (dep: GroupDeparture) => void;
}

type SortField = "tripName" | "departureDate" | "fill" | "revenue";

const statusColors: Record<DepartureStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  "Sold Out": "bg-purple-50 text-purple-700",
  Cancelled: "bg-red-50 text-red-700",
  Departed: "bg-blue-50 text-blue-700",
  Completed: "bg-stone-100 text-stone-600",
};

function fillColor(pct: number) {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function fillTextColor(pct: number) {
  if (pct >= 75) return "text-emerald-700";
  if (pct >= 50) return "text-amber-700";
  return "text-red-700";
}

export function DepartureOverview({ departures, onSelectDeparture }: DepartureOverviewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DepartureStatus | "All">("All");
  const [sortField, setSortField] = useState<SortField>("departureDate");
  const [sortAsc, setSortAsc] = useState(true);

  // Summary stats
  const stats = useMemo(() => {
    const active = departures.filter((d) => d.status === "Active" || d.status === "Sold Out");
    const totalPax = active.reduce((s, d) => s + getActivePax(d), 0);
    const totalCapacity = active.reduce((s, d) => s + d.maxCapacity, 0);
    const totalRevenue = active.reduce((s, d) => s + getRevenueBooked(d), 0);
    const totalCollected = active.reduce((s, d) => s + getPaymentsCollected(d), 0);
    return {
      activeDepartures: active.length,
      totalPax,
      avgFill: totalCapacity ? Math.round((totalPax / totalCapacity) * 100) : 0,
      totalRevenue,
      totalCollected,
      outstanding: totalRevenue - totalCollected,
    };
  }, [departures]);

  const filtered = useMemo(() => {
    let list = departures;
    if (statusFilter !== "All") {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.tripName.toLowerCase().includes(q) ||
          d.destination.toLowerCase().includes(q) ||
          d.tripLeadName.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "tripName":
          cmp = a.tripName.localeCompare(b.tripName);
          break;
        case "departureDate":
          cmp = a.departureDate.localeCompare(b.departureDate);
          break;
        case "fill":
          cmp = getFillPercentage(a) - getFillPercentage(b);
          break;
        case "revenue":
          cmp = getRevenueBooked(a) - getRevenueBooked(b);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [departures, search, statusFilter, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-stone-900">Group Departures</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {stats.activeDepartures} active departures · {stats.totalPax} booked guests
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Departures", value: stats.activeDepartures, sub: "across all destinations" },
          { label: "Total Pax", value: stats.totalPax, sub: `${stats.avgFill}% avg fill rate` },
          { label: "Revenue Booked", value: `$${(stats.totalRevenue / 1000).toFixed(0)}k`, sub: `$${(stats.totalCollected / 1000).toFixed(0)}k collected` },
          { label: "Outstanding", value: `$${(stats.outstanding / 1000).toFixed(0)}k`, sub: "payments pending" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-stone-200 bg-white px-4 py-3"
          >
            <p className="text-xs font-medium text-stone-500">{card.label}</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">{card.value}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search departures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 py-2 text-xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
          />
        </div>
        <div className="flex gap-1">
          {(["All", "Active", "Sold Out", "Departed", "Completed", "Cancelled"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                  statusFilter === status
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50">
              {[
                { field: "tripName" as SortField, label: "Trip" },
                { field: "departureDate" as SortField, label: "Departure" },
                { field: "fill" as SortField, label: "Pax / Capacity" },
                { field: "fill" as SortField, label: "Fill %" },
                { field: "revenue" as SortField, label: "Land Price" },
                { field: "tripName" as SortField, label: "Status" },
                { field: "departureDate" as SortField, label: "Room Release" },
                { field: "tripName" as SortField, label: "Lead" },
              ].map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left font-semibold text-stone-500 cursor-pointer hover:text-stone-700"
                  onClick={() => handleSort(col.field)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortField === col.field && (
                      <ArrowUpDown className="h-3 w-3 text-stone-400" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((dep) => {
              const pax = getActivePax(dep);
              const fill = getFillPercentage(dep);
              const tier = dep.pricingTiers[dep.currentTierIndex];
              const isNearCapacity = pax >= dep.maxCapacity - 2 && dep.status === "Active";
              return (
                <tr
                  key={dep.id}
                  onClick={() => onSelectDeparture(dep)}
                  className={cn(
                    "border-b border-stone-50 cursor-pointer transition-colors hover:bg-amber-50/40",
                    isNearCapacity && "bg-red-50/30"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-stone-800">{dep.tripName}</div>
                    <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {dep.destination}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-stone-400" />
                      {new Date(dep.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-stone-400" />
                      <span className={cn("font-semibold", fillTextColor(fill))}>
                        {pax}
                      </span>
                      <span className="text-stone-400">/ {dep.maxCapacity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", fillColor(fill))}
                          style={{ width: `${Math.min(fill, 100)}%` }}
                        />
                      </div>
                      <span className={cn("font-semibold tabular-nums", fillTextColor(fill))}>
                        {fill}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-700 tabular-nums">
                    ${tier?.landPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        statusColors[dep.status]
                      )}
                    >
                      {dep.status}
                    </span>
                    {isNearCapacity && (
                      <span className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700">
                        NEAR CAP
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {new Date(dep.roomReleaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{dep.tripLeadName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
