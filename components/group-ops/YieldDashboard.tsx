"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { AlertTriangle, Calendar } from "lucide-react";
import type { GroupDeparture } from "@/lib/data/group-departures-types";
import { getActivePax, getFillPercentage, getRevenueBooked, getPaymentsCollected } from "@/lib/data/seed-group-departures";

interface YieldDashboardProps {
  departures: GroupDeparture[];
}

function fillColor(pct: number) {
  if (pct >= 75) return "#10b981";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

export function YieldDashboard({ departures }: YieldDashboardProps) {
  const active = useMemo(
    () => departures.filter((d) => d.status !== "Cancelled" && d.status !== "Completed"),
    [departures]
  );

  const stats = useMemo(() => {
    const totalPax = active.reduce((s, d) => s + getActivePax(d), 0);
    const totalCap = active.reduce((s, d) => s + d.maxCapacity, 0);
    const totalRev = active.reduce((s, d) => s + getRevenueBooked(d), 0);
    const totalColl = active.reduce((s, d) => s + getPaymentsCollected(d), 0);
    const cancellations = departures.reduce(
      (s, d) => s + d.guests.filter((g) => g.status === "Cancelled").length,
      0
    );
    const totalGuests = departures.reduce((s, d) => s + d.guests.length, 0);
    return {
      count: active.length,
      totalPax,
      avgFill: totalCap ? Math.round((totalPax / totalCap) * 100) : 0,
      totalRev,
      totalColl,
      cancelRate: totalGuests ? Math.round((cancellations / totalGuests) * 100) : 0,
    };
  }, [active, departures]);

  // Fill % bar chart data
  const fillData = useMemo(
    () =>
      active
        .sort((a, b) => a.departureDate.localeCompare(b.departureDate))
        .map((d) => {
          const fill = getFillPercentage(d);
          return {
            name: d.tripName.length > 18 ? d.tripName.slice(0, 16) + "…" : d.tripName,
            fill,
            fillColor: fillColor(fill),
          };
        }),
    [active]
  );

  // Booking pace data (cumulative bookings by week)
  const paceData = useMemo(() => {
    const allBookings = departures.flatMap((d) =>
      d.guests
        .filter((g) => g.status !== "Cancelled" && g.status !== "Transferred Out")
        .map((g) => new Date(g.bookingDate))
    );
    allBookings.sort((a, b) => a.getTime() - b.getTime());
    if (allBookings.length === 0) return [];

    const startDate = new Date(allBookings[0]);
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weeks: { week: string; cumulative: number }[] = [];
    let cumulative = 0;
    let weekStart = new Date(startDate);

    for (let i = 0; i < 30; i++) {
      const weekEnd = new Date(weekStart.getTime() + weekMs);
      const count = allBookings.filter(
        (d) => d >= weekStart && d < weekEnd
      ).length;
      cumulative += count;
      weeks.push({
        week: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        cumulative,
      });
      weekStart = weekEnd;
      if (weekStart > new Date()) break;
    }
    return weeks;
  }, [departures]);

  // Alerts
  const alerts = useMemo(() => {
    const today = new Date();
    const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const items: { type: "warning" | "danger"; message: string; dep: string }[] = [];

    active.forEach((d) => {
      const rr = new Date(d.roomReleaseDate);
      if (rr <= thirtyDaysOut && rr > today) {
        items.push({
          type: "warning",
          message: `Room release in ${Math.ceil((rr.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days`,
          dep: d.tripName,
        });
      }
      if (getFillPercentage(d) < 50 && d.status === "Active") {
        items.push({
          type: "danger",
          message: `Below 50% fill (${getFillPercentage(d)}%)`,
          dep: d.tripName,
        });
      }
    });
    return items;
  }, [active]);

  // Yield table data
  const yieldRows = useMemo(
    () =>
      active
        .sort((a, b) => a.departureDate.localeCompare(b.departureDate))
        .map((d) => ({
          id: d.id,
          name: d.tripName,
          destination: d.destination,
          date: d.departureDate,
          pax: getActivePax(d),
          capacity: d.maxCapacity,
          fill: getFillPercentage(d),
          revenue: getRevenueBooked(d),
          collected: getPaymentsCollected(d),
          landPrice: d.pricingTiers[d.currentTierIndex]?.landPrice || 0,
          tier: `${d.currentTierIndex + 1}/${d.pricingTiers.length}`,
        })),
    [active]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-lg font-bold text-stone-900 mb-1">Yield Management</h1>
      <p className="text-sm text-stone-500 mb-6">Portfolio performance across all active departures</p>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "Departures", value: stats.count },
          { label: "Total Pax", value: stats.totalPax },
          { label: "Avg Fill Rate", value: `${stats.avgFill}%` },
          { label: "Revenue Booked", value: `$${(stats.totalRev / 1000).toFixed(0)}k` },
          { label: "Cancellation Rate", value: `${stats.cancelRate}%` },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-stone-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-stone-500">{c.label}</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Fill % bar chart */}
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="text-xs font-semibold text-stone-700 mb-3">Fill Rate by Departure</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fillData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 11, border: "1px solid #e7e5e4", borderRadius: 8 }}
                formatter={(value: number) => [`${value}%`, "Fill"]}
              />
              <Bar
                dataKey="fill"
                radius={[4, 4, 0, 0]}
                fill="#f59e0b"
                // Dynamic color per bar
                shape={(props: any) => {
                  const { x, y, width, height, fill: _, ...rest } = props;
                  const pct = props.payload?.fill || 0;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx={4}
                      fill={fillColor(pct)}
                      {...rest}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking pace line chart */}
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="text-xs font-semibold text-stone-700 mb-3">Cumulative Booking Pace</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={paceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e7e5e4", borderRadius: 8 }} />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#b45309"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Alerts ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-xs",
                  a.type === "danger"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-semibold">{a.dep}</span>
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yield table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50">
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Departure</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Date</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Pax</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Fill %</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Tier</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Land Price</th>
              <th className="px-4 py-2.5 text-right font-semibold text-stone-500">Revenue</th>
              <th className="px-4 py-2.5 text-right font-semibold text-stone-500">Collected</th>
              <th className="px-4 py-2.5 text-right font-semibold text-stone-500">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {yieldRows.map((r) => (
              <tr key={r.id} className="border-b border-stone-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-stone-800">{r.name}</div>
                  <div className="text-[11px] text-stone-400">{r.destination}</div>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td className="px-4 py-3 tabular-nums">{r.pax}/{r.capacity}</td>
                <td className="px-4 py-3">
                  <span className={cn("font-semibold tabular-nums", r.fill >= 75 ? "text-emerald-600" : r.fill >= 50 ? "text-amber-600" : "text-red-600")}>
                    {r.fill}%
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600 tabular-nums">{r.tier}</td>
                <td className="px-4 py-3 text-stone-700 tabular-nums font-medium">${r.landPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-stone-700 tabular-nums font-medium">${r.revenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-stone-700 tabular-nums font-medium">${r.collected.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  <span className={cn(r.revenue - r.collected > 0 ? "text-amber-600" : "text-emerald-600")}>
                    ${(r.revenue - r.collected).toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
