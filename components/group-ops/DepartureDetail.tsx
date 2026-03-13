"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Shield,
  FileCheck,
  Search,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRightLeft,
} from "lucide-react";
import type { GroupDeparture, DepartureGuest, GuestStatus } from "@/lib/data/group-departures-types";
import { getActivePax, getFillPercentage, getRevenueBooked, getPaymentsCollected } from "@/lib/data/seed-group-departures";

interface DepartureDetailProps {
  departure: GroupDeparture;
  onBack: () => void;
}

const guestStatusStyles: Record<GuestStatus, { bg: string; text: string }> = {
  Confirmed: { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Pending Payment": { bg: "bg-amber-50", text: "text-amber-700" },
  Cancelled: { bg: "bg-red-50", text: "text-red-700" },
  "Transferred In": { bg: "bg-blue-50", text: "text-blue-700" },
  "Transferred Out": { bg: "bg-stone-100", text: "text-stone-500" },
  Waitlisted: { bg: "bg-purple-50", text: "text-purple-700" },
};

function paymentBadge(paid: boolean, dueDate: string) {
  if (paid) return { color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2, label: "Paid" };
  const due = new Date(dueDate);
  const today = new Date();
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)
    return { color: "text-red-600 bg-red-50", icon: AlertCircle, label: `${Math.abs(diff)}d overdue` };
  if (diff <= 7)
    return { color: "text-amber-600 bg-amber-50", icon: Clock, label: `Due in ${diff}d` };
  return { color: "text-stone-500 bg-stone-50", icon: Clock, label: `Due ${new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` };
}

function insuranceBadge(g: DepartureGuest) {
  if (g.insurance.purchased)
    return { color: "bg-emerald-50 text-emerald-700", label: g.insurance.type || "Purchased" };
  if (g.insurance.cfarEligible)
    return { color: "bg-amber-50 text-amber-700", label: "CFAR window open" };
  return { color: "bg-red-50 text-red-700", label: "No insurance" };
}

function docScore(g: DepartureGuest) {
  let total = 0;
  let complete = 0;
  total++;
  if (g.documents.passportOnFile) complete++;
  total++;
  if (g.documents.medicalFormComplete) complete++;
  total++;
  if (g.documents.waiverSigned) complete++;
  if (g.documents.visaRequired) {
    total++;
    if (g.documents.visaStatus === "Approved") complete++;
  }
  return { complete, total };
}

export function DepartureDetail({ departure, onBack }: DepartureDetailProps) {
  const [search, setSearch] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [copied, setCopied] = useState(false);

  const pax = getActivePax(departure);
  const fill = getFillPercentage(departure);
  const revenue = getRevenueBooked(departure);
  const collected = getPaymentsCollected(departure);

  const activeGuests = useMemo(() => {
    let list = departure.guests;
    if (!showCancelled)
      list = list.filter((g) => g.status !== "Cancelled" && g.status !== "Transferred Out");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) => g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [departure.guests, search, showCancelled]);

  const insurancePenetration = useMemo(() => {
    const active = departure.guests.filter(
      (g) => g.status !== "Cancelled" && g.status !== "Transferred Out"
    );
    const insured = active.filter((g) => g.insurance.purchased).length;
    return active.length ? Math.round((insured / active.length) * 100) : 0;
  }, [departure.guests]);

  const handleCopyRoster = () => {
    const rows = activeGuests.map(
      (g) =>
        `${g.name}\t${g.email}\t${g.status}\t$${g.payments.totalPaid}/$${g.payments.totalDue}\t${g.insurance.type || "None"}`
    );
    const header = "Name\tEmail\tStatus\tPaid/Due\tInsurance";
    navigator.clipboard.writeText([header, ...rows].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back + title */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Departures
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-stone-900">{departure.tripName}</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {departure.destination} · {new Date(departure.departureDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} – {new Date(departure.returnDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={handleCopyRoster}
          className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy Roster"}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {[
          { icon: Users, label: "Pax", value: `${pax} / ${departure.maxCapacity}`, sub: `${fill}% filled` },
          { icon: DollarSign, label: "Revenue", value: `$${(revenue / 1000).toFixed(1)}k`, sub: `$${(collected / 1000).toFixed(1)}k collected` },
          { icon: DollarSign, label: "Outstanding", value: `$${((revenue - collected) / 1000).toFixed(1)}k`, sub: "payments pending" },
          { icon: Shield, label: "Insurance", value: `${insurancePenetration}%`, sub: "penetration rate" },
          { icon: FileCheck, label: "Current Price", value: `$${departure.pricingTiers[departure.currentTierIndex]?.landPrice.toLocaleString()}`, sub: `Tier ${departure.currentTierIndex + 1} of ${departure.pricingTiers.length}` },
          { icon: Clock, label: "Room Release", value: new Date(departure.roomReleaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }), sub: departure.salesClosureDate ? `Close ${new Date(departure.salesClosureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3 w-3 text-stone-400" />
                <span className="text-[11px] font-medium text-stone-500">{card.label}</span>
              </div>
              <p className="text-base font-bold text-stone-900">{card.value}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 py-2 text-xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            className="rounded border-stone-300"
          />
          Show cancelled / transferred out
        </label>
      </div>

      {/* Guest table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50">
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Guest</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Status</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Price</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Deposit</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Interim</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Final</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Insurance</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Docs</th>
              <th className="px-4 py-2.5 text-left font-semibold text-stone-500">Extras</th>
            </tr>
          </thead>
          <tbody>
            {activeGuests.map((g) => {
              const deposit = paymentBadge(g.payments.depositPaid, g.bookingDate);
              const interim = paymentBadge(g.payments.interimPaid, g.payments.interimDueDate);
              const final_ = paymentBadge(g.payments.finalBalancePaid, g.payments.finalBalanceDueDate);
              const ins = insuranceBadge(g);
              const docs = docScore(g);
              const DepositIcon = deposit.icon;
              const InterimIcon = interim.icon;
              const FinalIcon = final_.icon;

              return (
                <tr
                  key={g.id}
                  className={cn(
                    "border-b border-stone-50 transition-colors hover:bg-stone-50/50",
                    g.status === "Cancelled" && "opacity-50"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-stone-800">{g.name}</div>
                    <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                      {g.transferredFrom && (
                        <span className="inline-flex items-center gap-0.5 text-blue-500">
                          <ArrowRightLeft className="h-3 w-3" />
                          from {g.transferredFrom.tripName}
                        </span>
                      )}
                      {!g.transferredFrom && (
                        <span>Booked {new Date(g.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", guestStatusStyles[g.status].bg, guestStatusStyles[g.status].text)}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-700 tabular-nums">
                    ${g.landPriceInvoiced.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", deposit.color)}>
                      <DepositIcon className="h-3 w-3" />
                      {deposit.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", interim.color)}>
                      <InterimIcon className="h-3 w-3" />
                      {interim.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", final_.color)}>
                      <FinalIcon className="h-3 w-3" />
                      {final_.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", ins.color)}>
                      {ins.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "flex items-center gap-0.5 text-[10px] font-semibold",
                        docs.complete === docs.total ? "text-emerald-600" : docs.complete > 0 ? "text-amber-600" : "text-red-600"
                      )}>
                        <FileCheck className="h-3 w-3" />
                        {docs.complete}/{docs.total}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {g.bookedOnExtension && (
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">Ext</span>
                      )}
                      {g.bookedOnArrivalDayTour && (
                        <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600">Tour</span>
                      )}
                      {g.specialRequests && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600" title={g.specialRequests}>
                          Note
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
