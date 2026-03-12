"use client";

import React from "react";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Gauge } from "lucide-react";

interface TripDashboardProps {
  trip: {
    name?: string;
    destination?: string;
    departure_date?: string;
    return_date?: string;
    group_size?: number;
    readiness_score?: number;
    status?: string;
    [key: string]: any;
  };
  sections: {
    title: string;
    content: React.ReactNode;
  }[];
}

function getReadinessVariant(score: number) {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "critical";
}

export function TripDashboard({ trip, sections }: TripDashboardProps) {
  const daysAway = trip.departure_date ? daysFromNow(trip.departure_date) : null;

  return (
    <div className="space-y-4">
      {/* Trip Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">
                {trip.name || trip.destination || "Trip Dashboard"}
              </CardTitle>
              {trip.destination && trip.name && (
                <p className="text-sm text-stone-500 mt-0.5">{trip.destination}</p>
              )}
            </div>
            {trip.status && (
              <Badge
                variant={
                  trip.status === "confirmed"
                    ? "success"
                    : trip.status === "cancelled"
                    ? "critical"
                    : "warning"
                }
              >
                {trip.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {trip.departure_date && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100">
                  <Calendar className="h-4 w-4 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Departure</p>
                  <p className="text-sm font-medium text-stone-800">
                    {formatDate(trip.departure_date)}
                  </p>
                  {daysAway !== null && daysAway > 0 && (
                    <p className="text-xs text-stone-400">{daysAway} days away</p>
                  )}
                </div>
              </div>
            )}

            {trip.group_size != null && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100">
                  <Users className="h-4 w-4 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Group Size</p>
                  <p className="text-sm font-medium text-stone-800">
                    {trip.group_size} {trip.group_size === 1 ? "traveler" : "travelers"}
                  </p>
                </div>
              </div>
            )}

            {trip.readiness_score != null && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100">
                  <Gauge className="h-4 w-4 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Readiness</p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      trip.readiness_score >= 80
                        ? "text-green-700"
                        : trip.readiness_score >= 60
                        ? "text-amber-700"
                        : "text-red-700"
                    )}
                  >
                    {trip.readiness_score}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={i} className="space-y-2">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-1">
            {section.title}
          </h4>
          {section.content}
        </div>
      ))}
    </div>
  );
}
