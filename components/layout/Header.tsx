"use client";

import React from "react";
import { Bell, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserSelector } from "@/components/layout/UserSelector";
import type { AppUser } from "@/lib/data/types";

interface HeaderProps {
  currentUser: AppUser;
  onUserChange: (user: AppUser) => void;
  notificationCount: number;
  onNotificationClick: () => void;
}

export function Header({
  currentUser,
  onUserChange,
  notificationCount,
  onNotificationClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-6">
      {/* Left: Branding */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-amber text-white">
          <Globe className="h-4.5 w-4.5" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-semibold tracking-tight text-stone-900">
            GeoEx
          </span>
          <span className="text-sm font-medium text-stone-400">
            AI Platform
          </span>
        </div>
      </div>

      {/* Right: User selector + notifications */}
      <div className="flex items-center gap-3">
        <UserSelector currentUser={currentUser} onUserChange={onUserChange} />

        <div className="h-5 w-px bg-stone-200" />

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onNotificationClick}
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5 text-stone-600" />
          {notificationCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white",
                notificationCount > 9
                  ? "h-4.5 w-4.5 min-w-[18px]"
                  : "h-4 w-4"
              )}
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
