"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  label: string;
  value: number;
  [key: string]: any;
}

interface ChartWrapperProps {
  type?: "bar" | "line" | "pie";
  chartType?: "bar" | "line" | "pie";
  title: string;
  data: ChartData[];
  xKey?: string;
  yKey?: string;
  [key: string]: any;
}

const BRAND_COLORS = [
  "#B45309", // amber
  "#166534", // green
  "#475569", // slate
  "#78716C", // warmGray
  "#D97706", // amber-500
  "#15803D", // green-700
  "#64748B", // slate-500
  "#A8A29E", // stone-400
];

export function ChartWrapper({
  type: typeProp,
  chartType,
  title,
  data,
  xKey = "label",
  yKey = "value",
  ...rest
}: ChartWrapperProps) {
  const type = typeProp || chartType || "bar";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 12, fill: "#78716C" }}
                  axisLine={{ stroke: "#D6D3D1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#78716C" }}
                  axisLine={{ stroke: "#D6D3D1" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E7E5E4",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey={yKey} fill="#B45309" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 12, fill: "#78716C" }}
                  axisLine={{ stroke: "#D6D3D1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#78716C" }}
                  axisLine={{ stroke: "#D6D3D1" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E7E5E4",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={yKey}
                  stroke="#B45309"
                  strokeWidth={2}
                  dot={{ fill: "#B45309", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  dataKey={yKey}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#A8A29E" }}
                >
                  {data.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={BRAND_COLORS[idx % BRAND_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E7E5E4",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", color: "#78716C" }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
