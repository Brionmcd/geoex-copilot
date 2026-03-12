"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/data/types";

interface UserSelectorProps {
  currentUser: AppUser;
  onUserChange: (user: AppUser) => void;
}

const demoUsers: AppUser[] = [
  { id: "staff-004", name: "Heather Walsh", role: "manager", email: "h.walsh@geoex.com" },
  { id: "staff-001", name: "Sarah Chen", role: "gsm", email: "s.chen@geoex.com" },
  { id: "staff-002", name: "Jessica Torres", role: "gsm", email: "j.torres@geoex.com" },
  { id: "staff-003", name: "Michael Brooks", role: "rm", email: "m.brooks@geoex.com" },
  { id: "staff-005", name: "Katia Novak", role: "marketing", email: "k.novak@geoex.com" },
];

const roleLabels: Record<string, string> = {
  gsm: "Guest Services",
  manager: "Manager",
  rm: "Relationship Mgr",
  marketing: "Marketing",
  comms: "Communications",
};

export function UserSelector({ currentUser, onUserChange }: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
          "hover:bg-stone-100 border border-transparent",
          open && "bg-stone-100 border-stone-200"
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-stone-600">
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium text-stone-800 leading-tight">
            {currentUser.name}
          </span>
          <span className="text-[11px] text-stone-400 leading-tight">
            {roleLabels[currentUser.role] || currentUser.role}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-stone-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-stone-200 bg-white py-1 shadow-lg z-50">
          <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-400">
            Switch user
          </div>
          {demoUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onUserChange(user);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50",
                currentUser.id === user.id && "bg-stone-50"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
                  currentUser.id === user.id
                    ? "bg-brand-amber text-white"
                    : "bg-stone-100 text-stone-500"
                )}
              >
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "font-medium leading-tight",
                    currentUser.id === user.id
                      ? "text-stone-900"
                      : "text-stone-700"
                  )}
                >
                  {user.name}
                </span>
                <span className="text-[11px] text-stone-400 leading-tight">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
