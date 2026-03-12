"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface EntityLinkProps {
  type: "trip" | "contact" | "supplier";
  id: string;
  label: string;
  onClick?: (type: string, id: string) => void;
}

export function EntityLink({ type, id, label, onClick }: EntityLinkProps) {
  return (
    <button
      className={cn(
        "text-brand-amber hover:text-amber-800 font-medium text-sm underline-offset-2 hover:underline transition-colors text-left"
      )}
      onClick={() => onClick?.(type, id)}
    >
      {label}
    </button>
  );
}
