"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Copy } from "lucide-react";
import type { GroupDeparture, AuditIssue, AuditSeverity } from "@/lib/data/group-departures-types";
import { getActivePax, getFillPercentage, getExpectedAvailabilityLanguage, getCorrectTierIndex } from "@/lib/data/seed-group-departures";

interface AuditPanelProps {
  departures: GroupDeparture[];
}

const severityConfig: Record<AuditSeverity, { icon: typeof AlertCircle; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Critical" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Warning" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Info" },
};

export function AuditPanel({ departures }: AuditPanelProps) {
  const issues = useMemo(() => {
    const results: AuditIssue[] = [];
    const today = new Date();

    departures.forEach((d) => {
      const pax = getActivePax(d);

      // Departure date passed but still Active
      if (new Date(d.departureDate) < today && d.status === "Active") {
        results.push({
          id: `${d.id}-status`,
          severity: "warning",
          title: "Departure date passed — status still Active",
          description: `${d.tripName} departed ${new Date(d.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} but status is still "Active". Should be "Departed" or "Completed".`,
          departureId: d.id,
          departureName: d.tripName,
          action: 'Update departure status in Sugati to "Departed"',
        });
      }

      // Availability language mismatch
      const expected = getExpectedAvailabilityLanguage(d);
      if (d.availabilityLanguage !== expected && d.status === "Active") {
        results.push({
          id: `${d.id}-avail`,
          severity: "info",
          title: "Availability language out of sync",
          description: `${d.tripName} shows "${d.availabilityLanguage}" but fill rate (${getFillPercentage(d)}%) suggests "${expected}".`,
          departureId: d.id,
          departureName: d.tripName,
          action: `Update availability language to "${expected}" on website and sales materials`,
        });
      }

      // Pricing tier mismatch
      const correctTier = getCorrectTierIndex(d);
      if (correctTier !== d.currentTierIndex && d.status === "Active") {
        results.push({
          id: `${d.id}-tier`,
          severity: "warning",
          title: "Pricing tier doesn't match pax count",
          description: `${d.tripName} has ${pax} pax but is on Tier ${d.currentTierIndex + 1} ($${d.pricingTiers[d.currentTierIndex]?.landPrice}). Should be Tier ${correctTier + 1} ($${d.pricingTiers[correctTier]?.landPrice}).`,
          departureId: d.id,
          departureName: d.tripName,
          action: `Update pricing tier in Sugati to Tier ${correctTier + 1} and update Axus itinerary`,
        });
      }

      d.guests.forEach((g) => {
        if (g.status === "Cancelled" || g.status === "Transferred Out") return;

        // Overdue payments
        if (!g.payments.depositPaid) {
          const daysOverdue = Math.ceil((today.getTime() - new Date(g.bookingDate).getTime()) / (1000 * 60 * 60 * 24)) - 7;
          if (daysOverdue > 0) {
            results.push({
              id: `${g.id}-deposit`,
              severity: "critical",
              title: "Deposit overdue",
              description: `${g.name} on ${d.tripName} — deposit of $${g.payments.depositAmount.toLocaleString()} is ${daysOverdue} days overdue.`,
              departureId: d.id,
              departureName: d.tripName,
              guestId: g.id,
              guestName: g.name,
              action: "Send payment reminder and escalate if no response within 48 hours",
            });
          }
        }

        if (!g.payments.interimPaid && new Date(g.payments.interimDueDate) < today) {
          const daysOverdue = Math.ceil((today.getTime() - new Date(g.payments.interimDueDate).getTime()) / (1000 * 60 * 60 * 24));
          results.push({
            id: `${g.id}-interim`,
            severity: "critical",
            title: "Interim payment overdue",
            description: `${g.name} on ${d.tripName} — interim payment of $${g.payments.interimAmount.toLocaleString()} is ${daysOverdue} days overdue.`,
            departureId: d.id,
            departureName: d.tripName,
            guestId: g.id,
            guestName: g.name,
            action: "Send payment reminder email with updated payment link",
          });
        }

        if (!g.payments.finalBalancePaid && new Date(g.payments.finalBalanceDueDate) < today) {
          const daysOverdue = Math.ceil((today.getTime() - new Date(g.payments.finalBalanceDueDate).getTime()) / (1000 * 60 * 60 * 24));
          results.push({
            id: `${g.id}-final`,
            severity: "critical",
            title: "Final balance overdue",
            description: `${g.name} on ${d.tripName} — final balance of $${g.payments.finalBalanceAmount.toLocaleString()} is ${daysOverdue} days overdue.`,
            departureId: d.id,
            departureName: d.tripName,
            guestId: g.id,
            guestName: g.name,
            action: "Escalate to team lead — final balance is past due",
          });
        }

        // Expired or soon-to-expire passports
        if (g.documents.passportOnFile && g.documents.passportExpiry) {
          const expiry = new Date(g.documents.passportExpiry);
          const depDate = new Date(d.departureDate);
          const sixMonthsBefore = new Date(depDate);
          sixMonthsBefore.setMonth(sixMonthsBefore.getMonth() - 6);
          if (expiry < depDate) {
            results.push({
              id: `${g.id}-passport-expired`,
              severity: "critical",
              title: "Passport expires before departure",
              description: `${g.name} on ${d.tripName} — passport expires ${new Date(g.documents.passportExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, before departure on ${new Date(d.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
              departureId: d.id,
              departureName: d.tripName,
              guestId: g.id,
              guestName: g.name,
              action: "Contact guest immediately — passport renewal required",
            });
          } else if (expiry < sixMonthsBefore) {
            results.push({
              id: `${g.id}-passport-soon`,
              severity: "warning",
              title: "Passport expires within 6 months of departure",
              description: `${g.name} on ${d.tripName} — passport expires ${new Date(g.documents.passportExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Many countries require 6+ months validity.`,
              departureId: d.id,
              departureName: d.tripName,
              guestId: g.id,
              guestName: g.name,
              action: "Notify guest about passport validity requirements for destination",
            });
          }
        }

        // Pending guest past sales closure
        if (
          g.status === "Pending Payment" &&
          new Date(d.salesClosureDate) < today &&
          d.status === "Active"
        ) {
          results.push({
            id: `${g.id}-pending-closed`,
            severity: "warning",
            title: "Guest still pending after sales closure",
            description: `${g.name} on ${d.tripName} — status is "Pending Payment" but sales closed ${new Date(d.salesClosureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
            departureId: d.id,
            departureName: d.tripName,
            guestId: g.id,
            guestName: g.name,
            action: "Resolve booking status — confirm or cancel",
          });
        }
      });
    });

    // Sort by severity
    const order: Record<AuditSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return results.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [departures]);

  const byGroup = useMemo(() => {
    const groups: Record<AuditSeverity, AuditIssue[]> = { critical: [], warning: [], info: [] };
    issues.forEach((i) => groups[i.severity].push(i));
    return groups;
  }, [issues]);

  const affectedDepartures = new Set(issues.map((i) => i.departureId)).size;

  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    const text = issues.map((i) => `[${i.severity.toUpperCase()}] ${i.title}\n  ${i.description}\n  Action: ${i.action}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-stone-900">Weekly Audit</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {issues.length} issue{issues.length !== 1 ? "s" : ""} found across {affectedDepartures} departure{affectedDepartures !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Export Audit"}
        </button>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(["critical", "warning", "info"] as AuditSeverity[]).map((sev) => {
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;
          return (
            <div key={sev} className={cn("rounded-xl border px-4 py-3", cfg.border, cfg.bg)}>
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", cfg.color)} />
                <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold text-stone-900 mt-1">{byGroup[sev].length}</p>
            </div>
          );
        })}
      </div>

      {/* Issue cards by severity */}
      {(["critical", "warning", "info"] as AuditSeverity[]).map((sev) => {
        if (byGroup[sev].length === 0) return null;
        const cfg = severityConfig[sev];
        const Icon = cfg.icon;
        return (
          <section key={sev} className="mb-6">
            <h2 className={cn("text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5", cfg.color)}>
              <Icon className="h-3.5 w-3.5" />
              {cfg.label} ({byGroup[sev].length})
            </h2>
            <div className="space-y-2">
              {byGroup[sev].map((issue) => (
                <div
                  key={issue.id}
                  className={cn("rounded-xl border p-4", cfg.border, "bg-white")}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-stone-800">{issue.title}</span>
                        <span className="text-[10px] font-medium text-stone-400 bg-stone-50 rounded px-1.5 py-0.5">
                          {issue.departureName}
                        </span>
                        {issue.guestName && (
                          <span className="text-[10px] font-medium text-stone-400 bg-stone-50 rounded px-1.5 py-0.5">
                            {issue.guestName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mb-2">{issue.description}</p>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-stone-700">Action:</span>
                        <span className="text-stone-600">{issue.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {issues.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-medium text-stone-600">All clear</p>
          <p className="text-xs mt-1">No audit issues found across any departures</p>
        </div>
      )}
    </div>
  );
}
