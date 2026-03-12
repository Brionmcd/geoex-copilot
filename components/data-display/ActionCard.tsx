"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Action {
  label: string;
  type: "primary" | "secondary";
  onClick?: () => void;
}

interface ActionCardProps {
  title: string;
  description: string;
  actions: Action[];
}

export function ActionCard({ title, description, actions }: ActionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-stone-600">{description}</p>
      </CardContent>
      <CardFooter className="gap-2">
        {actions.map((action, i) => (
          <Button
            key={i}
            variant={action.type === "primary" ? "default" : "outline"}
            size="sm"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
