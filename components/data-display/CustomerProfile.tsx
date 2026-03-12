"use client";

import React from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  MapPin,
  Mail,
  TrendingDown,
  Lightbulb,
} from "lucide-react";

interface HealthMetric {
  metric: string;
  value: string;
  status: string;
}

interface CustomerProfileProps {
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    loyalty_tier?: string;
    ltv?: number;
    total_trips?: number;
    email_open_rate?: number;
    churn_risk?: string;
    [key: string]: any;
  };
  trips: {
    name?: string;
    destination?: string;
    date?: string;
    status?: string;
    [key: string]: any;
  }[];
  health: HealthMetric[];
  actions: string[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const tierColors: Record<string, string> = {
  platinum: "bg-stone-800 text-white",
  gold: "bg-amber-100 text-amber-800",
  silver: "bg-stone-200 text-stone-700",
  bronze: "bg-orange-100 text-orange-800",
  champion: "bg-amber-600 text-white",
  power_couple: "bg-rose-100 text-rose-800",
  family: "bg-blue-100 text-blue-800",
  solo_adventurer: "bg-green-100 text-green-800",
  bucket_lister: "bg-purple-100 text-purple-800",
  at_risk: "bg-red-100 text-red-800",
};

const healthStatusColor: Record<string, string> = {
  good: "text-green-700",
  healthy: "text-green-700",
  warning: "text-amber-700",
  at_risk: "text-amber-700",
  critical: "text-red-700",
  high: "text-red-700",
  low: "text-green-700",
  medium: "text-amber-700",
};

const tripStatusVariant: Record<string, "success" | "warning" | "critical" | "secondary"> = {
  confirmed: "success",
  completed: "success",
  pending: "warning",
  in_progress: "warning",
  cancelled: "critical",
};

export function CustomerProfile({ contact: rawContact, trips: rawTrips, health, actions, ...rest }: CustomerProfileProps & { [key: string]: any }) {
  // Normalize contact props - handle both camelCase (from seed data) and snake_case formats
  const contact = {
    ...rawContact,
    name: rawContact.name || [rawContact.firstName, rawContact.lastName].filter(Boolean).join(" ") || rawContact.first_name && `${rawContact.first_name} ${rawContact.last_name || ""}`.trim(),
    loyalty_tier: rawContact.loyalty_tier || rawContact.loyaltyTier,
    ltv: rawContact.ltv ?? rawContact.totalLTV ?? rawContact.total_ltv,
    total_trips: rawContact.total_trips ?? rawContact.totalTrips,
    email_open_rate: rawContact.email_open_rate ?? rawContact.emailOpenRate,
    churn_risk: rawContact.churn_risk || rawContact.churnRiskScore != null ? String(rawContact.churnRiskScore || rawContact.churn_risk) : undefined,
  };
  // Normalize trips - accept string[] or object[]
  const trips = (rawTrips || []).map((t: any) => typeof t === "string" ? { name: t } : t);
  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-brand-amber/10 text-brand-amber text-lg font-semibold">
                {contact.name ? getInitials(contact.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-stone-900 truncate">
                  {contact.name || "Unknown Contact"}
                </h2>
                {contact.loyalty_tier && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      tierColors[contact.loyalty_tier.toLowerCase()] || "bg-stone-100 text-stone-600"
                    )}
                  >
                    {contact.loyalty_tier}
                  </span>
                )}
              </div>
              {contact.email && (
                <p className="text-sm text-stone-500 truncate">{contact.email}</p>
              )}
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-stone-100">
            {contact.ltv != null && (
              <div className="text-center">
                <p className="text-xs text-stone-500">LTV</p>
                <p className="text-sm font-semibold text-stone-800">
                  {formatCurrency(contact.ltv)}
                </p>
              </div>
            )}
            {contact.total_trips != null && (
              <div className="text-center">
                <p className="text-xs text-stone-500">Trips</p>
                <p className="text-sm font-semibold text-stone-800">
                  {contact.total_trips}
                </p>
              </div>
            )}
            {contact.email_open_rate != null && (
              <div className="text-center">
                <p className="text-xs text-stone-500">Email Open Rate</p>
                <p className="text-sm font-semibold text-stone-800">
                  {contact.email_open_rate}%
                </p>
              </div>
            )}
            {contact.churn_risk && (
              <div className="text-center">
                <p className="text-xs text-stone-500">Churn Risk</p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    contact.churn_risk.toLowerCase() === "high"
                      ? "text-red-700"
                      : contact.churn_risk.toLowerCase() === "medium"
                      ? "text-amber-700"
                      : "text-green-700"
                  )}
                >
                  {contact.churn_risk}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Signals */}
      {health.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Health Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-sm text-stone-600">{h.metric}</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      healthStatusColor[h.status.toLowerCase()] || "text-stone-800"
                    )}
                  >
                    {h.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip History */}
      {trips.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Trip History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trips.map((trip, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {trip.name || trip.destination}
                      </p>
                      {trip.date && (
                        <p className="text-xs text-stone-400">
                          {formatDate(trip.date)}
                        </p>
                      )}
                    </div>
                  </div>
                  {trip.status && (
                    <Badge
                      variant={
                        tripStatusVariant[trip.status.toLowerCase()] || "secondary"
                      }
                      className="shrink-0"
                    >
                      {trip.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Actions */}
      {actions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-brand-amber" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {actions.map((action, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-stone-700"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-amber mt-1.5 shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
